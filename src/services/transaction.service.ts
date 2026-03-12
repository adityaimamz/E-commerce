import { prisma } from "@/lib/prisma";
import { snap } from "@/lib/midtrans";
import { CartService } from "./cart.service";

export class TransactionService {
  static async checkout(userId: string) {
    // 1. Get user's cart
    const cart = await CartService.getCart(userId);
    
    if (!cart.items.length) {
      throw new Error("Cart is empty");
    }

    // 2. Validate stock & 3. Calculate total price
    let totalAmount = 0;
    for (const item of cart.items) {
      if (item.product.stock < item.quantity) {
        throw new Error(`Insufficient stock for product ${item.product.name}`);
      }
      totalAmount += item.product.price * item.quantity;
    }

    // 4 & 5. Create transaction & items using prisma transaction
    const transaction = await prisma.$transaction(async (tx) => {
      const order = await tx.transaction.create({
        data: {
          userId,
          totalAmount,
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.product.price,
            })),
          },
        },
      });

      // Deduct stock
      for (const item of cart.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      // Clear cart
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
    let status: any = "PENDING";

    if (transactionStatus === "capture") {
      if (fraudStatus === "challenge") {
        status = "PENDING";
      } else if (fraudStatus === "accept") {
        status = "PAID";
      }
    } else if (transactionStatus === "settlement") {
      status = "PAID";
    } else if (transactionStatus === "cancel" || transactionStatus === "deny" || transactionStatus === "expire") {
      status = transactionStatus === "expire" ? "EXPIRED" : "CANCELLED";
    }

    await prisma.transaction.update({
      where: { id: orderId },
      data: { status },
    });

    if (status === "CANCELLED" || status === "EXPIRED") {
      const tx = await prisma.transaction.findUnique({
        where: { id: orderId },
        include: { items: true }
      });
      if (tx) {
        await prisma.$transaction(
          tx.items.map(item => 
            prisma.product.update({
              where: { id: item.productId },
              data: { stock: { increment: item.quantity } }
            })
          )
        );
      }
    }

    return status;
  }

  static async getUserTransactions(userId: string) {
    return prisma.transaction.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}

