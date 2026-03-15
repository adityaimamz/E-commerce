import { prisma } from "@/lib/prisma";
import { snap } from "@/lib/midtrans";
import { CartService } from "./cart.service";
import { PaymentStatus, OrderStatus } from "@prisma/client";

export class TransactionService {
  static async checkout(userId: string, addressId: string, shippingCost: number = 0, courier: string = "") {
    // 1. Get user's cart
    const cart = await CartService.getCart(userId);

    if (!cart.items.length) {
      throw new Error("Cart is empty");
    }

    // 2. Validate selected shipping address belongs to current user.
    const address = await prisma.address.findFirst({
      where: {
        id: addressId,
        userId,
      },
    });

    if (!address) {
      throw new Error("Address not found");
    }

    // 3. Validate stock & 4. Calculate total price
    let subtotal = 0;
    for (const item of cart.items) {
      const availableStock = item.product.stock - item.product.reservedStock;
      if (availableStock < item.quantity) {
        throw new Error(`Insufficient stock for product ${item.product.name}`);
      }
      subtotal += item.product.price * item.quantity;
    }

    const totalAmount = subtotal + shippingCost;

    // 5. Create transaction + items + shipment atomically and reserve stock.
    const transaction = await prisma.$transaction(async (tx) => {
      // Create Transaction
      const order = await tx.transaction.create({
        data: {
          userId,
          addressId,
          paymentStatus: "PENDING",
          orderStatus: "PENDING",
          totalAmount,
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              priceSnapshot: item.product.price,
            })),
          },
          shipment: {
            create: {
              courier,
              shippingCost,
              shipmentStatus: "PENDING",
            },
          },
        },
      });

      // Reserve stock
      for (const item of cart.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            reservedStock: { increment: item.quantity },
          },
        });
      }

      // Clear cart immediately
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      return order;
    });

    const user = await prisma.user.findUnique({ where: { id: userId } });

    // 6. Request Midtrans Snap token
    const parameter = {
      transaction_details: {
        order_id: transaction.id,
        gross_amount: totalAmount,
      },
      customer_details: {
        first_name: user?.name || "Customer",
        email: user?.email,
        phone: address.phone,
      },
      shipping_address: {
        first_name: address.recipientName,
        phone: address.phone,
        address: address.addressLine,
        city: address.city,
        postal_code: address.postalCode,
        country_code: address.country,
      },
      item_details: [
        ...cart.items.map((item) => ({
          id: item.productId,
          price: item.product.price,
          quantity: item.quantity,
          name: item.product.name.substring(0, 50),
        })),
        {
          id: "SHIPPING_FEE",
          price: shippingCost,
          quantity: 1,
          name: courier || "Shipping Fee",
        },
      ],
    };

    const snapResponse = await snap.createTransaction(parameter);
    const snapToken = snapResponse.token;
    const paymentUrl = snapResponse.redirect_url;

    // 7. Save snapToken
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { snapToken, paymentUrl },
    });

    // 8. Return snapToken
    return { transactionId: transaction.id, snapToken, paymentUrl };
  }

  static async updateTransactionStatus(orderId: string, transactionStatus: string, fraudStatus: string) {
    const paymentStatus = this.mapMidtransStatus(transactionStatus, fraudStatus);

    return prisma.$transaction(async (tx) => {
      const existing = await tx.transaction.findUnique({
        where: { id: orderId },
        include: { items: true },
      });

      if (!existing) {
        throw new Error("Transaction not found");
      }

      // Idempotency check: if payment is already processed, skip.
      if (existing.paymentStatus !== "PENDING") {
        return { paymentStatus: existing.paymentStatus, orderStatus: existing.orderStatus };
      }

      // If status hasn't changed from PENDING, just return current.
      if (paymentStatus === "PENDING") {
        return { paymentStatus: "PENDING", orderStatus: "PENDING" };
      }

      let orderStatus: OrderStatus = existing.orderStatus;

      // Logic: If payment becomes PAID, automatically move order to PROCESSING, deduct stock and clear reserved.
      if (paymentStatus === "PAID") {
        orderStatus = "PROCESSING";
        
        for (const item of existing.items) {
          // Physical deduction of stock and reservedStock
          const result = await tx.product.updateMany({
            where: {
              id: item.productId,
              stock: { gte: item.quantity },
              reservedStock: { gte: item.quantity },
            },
            data: {
              stock: { decrement: item.quantity },
              reservedStock: { decrement: item.quantity },
            },
          });

          if (result.count === 0) {
            // If physical stock deduction fails here, it's a critical error as it was reserved before.
            throw new Error(`Critically low stock for product ${item.productId} during payment completion`);
          }
        }
      } else if (["CANCELLED", "EXPIRED", "FAILED"].includes(paymentStatus)) {
        // If payment fails/cancels, release reservedStock and move order to CANCELLED.
        orderStatus = "CANCELLED";

        for (const item of existing.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              reservedStock: { decrement: item.quantity },
            },
          });
        }
      }

      await tx.transaction.update({
        where: { id: orderId },
        data: { 
          paymentStatus,
          orderStatus
        },
      });

      // Create notification
      await tx.notification.create({
        data: {
          userId: existing.userId,
          title: "Status Pembayaran Diperbarui",
          message: `Pembayaran untuk pesanan Anda (${existing.id}) telah menjadi ${paymentStatus}.`,
          link: "/purchases",
        }
      });

      return { paymentStatus, orderStatus };
    });
  }

  private static mapMidtransStatus(transactionStatus: string, fraudStatus: string): PaymentStatus {
    if (transactionStatus === "capture") {
      if (fraudStatus === "challenge") {
        return "PENDING";
      }
      if (fraudStatus === "accept") {
        return "PAID";
      }
    }

    if (transactionStatus === "settlement") {
      return "PAID";
    }

    if (transactionStatus === "pending") {
      return "PENDING";
    }

    if (transactionStatus === "cancel") {
      return "CANCELLED";
    }

    if (transactionStatus === "deny") {
      return "FAILED";
    }

    if (transactionStatus === "expire") {
      return "EXPIRED";
    }

    return "FAILED";
  }

  static async getUserTransactions(userId: string) {
    return prisma.transaction.findMany({
      where: { userId },
      include: {
        address: true,
        shipment: true,
        items: {
          include: {
            product: {
              include: {
                images: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }
}

