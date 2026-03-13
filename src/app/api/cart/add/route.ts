import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { CartService } from "@/services/cart.service";
import { addToCartSchema } from "@/lib/validators/cart.validator";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await auth();
    let userId = session?.user?.id;

    if (!userId && session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true },
      });
      userId = user?.id;
    }

    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const data = addToCartSchema.parse(body);

    const cartItem = await CartService.addToCart(userId, data);
    return NextResponse.json({ success: true, data: cartItem });
  } catch (error: any) {
    if (error.message === "User not found") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    if (error.name === "ZodError") {
      return NextResponse.json({ success: false, message: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
