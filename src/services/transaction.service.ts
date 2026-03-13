import { prisma } from "@/lib/prisma";
import { snap } from "@/lib/midtrans";
import { CartService } from "./cart.service";
import { TransactionStatus } from "@prisma/client";

export class TransactionService {
  static async checkout(userId: string, addressId: string) {
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
    let totalAmount = 0;
    for (const item of cart.items) {
      if (item.product.stock < item.quantity) {
        throw new Error(`Insufficient stock for product ${item.product.name}`);
      }
      totalAmount += item.product.price * item.quantity;
    }

    // 5. Create transaction + items atomically and clear cart.
    const transaction = await prisma.$transaction(async (tx) => {
      const order = await tx.transaction.create({
        data: {
          userId,
          addressId,
          status: "PENDING_PAYMENT",
          totalAmount,
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              priceSnapshot: item.product.price,
            })),
          },
        },
      });

      // Clear cart immediately after creating order snapshots.
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
      item_details: cart.items.map((item) => ({
        id: item.productId,
        price: item.product.price,
        quantity: item.quantity,
        name: item.product.name.substring(0, 50),
      })),
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
    const mappedStatus = this.mapMidtransStatus(transactionStatus, fraudStatus);

    return prisma.$transaction(async (tx) => {
      const existing = await tx.transaction.findUnique({
        where: { id: orderId },
        include: { items: true },
      });

      if (!existing) {
        throw new Error("Transaction not found");
      }

      // Idempotency and monotonic transition guard for payment webhook updates.
      if (existing.status !== "PENDING_PAYMENT") {
        return existing.status;
      }

      if (mappedStatus === "PENDING_PAYMENT") {
        return existing.status;
      }

      if (mappedStatus === "PAID") {
        for (const item of existing.items) {
          const result = await tx.product.updateMany({
            where: {
              id: item.productId,
              stock: { gte: item.quantity },
            },
            data: {
              stock: { decrement: item.quantity },
            },
          });

          if (result.count === 0) {
            throw new Error(`Insufficient stock for product ${item.productId}`);
          }
        }
      }

      await tx.transaction.update({
        where: { id: orderId },
        data: { status: mappedStatus },
      });

      return mappedStatus;
    });
  }

  private static mapMidtransStatus(transactionStatus: string, fraudStatus: string): TransactionStatus {
    if (transactionStatus === "capture") {
      if (fraudStatus === "challenge") {
        return "PENDING_PAYMENT";
      }
      if (fraudStatus === "accept") {
        return "PAID";
      }
    }

    if (transactionStatus === "settlement") {
      return "PAID";
    }

    if (transactionStatus === "pending") {
      return "PENDING_PAYMENT";
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

