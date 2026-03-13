import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { addToCartSchema, removeFromCartSchema } from "@/lib/validators/cart.validator";

export class CartService {
  static async getCart(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new Error("User not found");
    }

    let cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    cart ??= await prisma.cart.create({
      data: { userId },
      include: { items: { include: { product: true } } },
    });

    return cart;
  }

  static async addToCart(userId: string, data: z.infer<typeof addToCartSchema>) {
    const cart = await this.getCart(userId);

    const existingItem = cart.items.find((item) => item.productId === data.productId);

    if (existingItem) {
      return prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + data.quantity },
      });
    }

    return prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: data.productId,
        quantity: data.quantity,
      },
    });
  }

  static async removeFromCart(userId: string, data: z.infer<typeof removeFromCartSchema>) {
    const cart = await this.getCart(userId);

    const existingItem = cart.items.find((item) => item.productId === data.productId);

    if (!existingItem) {
      throw new Error("Item not found in cart");
    }

    return prisma.cartItem.delete({
      where: { id: existingItem.id },
    });
  }
}
