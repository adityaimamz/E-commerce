import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { CartService } from "@/services/cart.service";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
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

    const cart = await CartService.getCart(userId);
    return NextResponse.json({ success: true, data: cart });
  } catch (error: any) {
    if (error.message === "User not found") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    console.error("GET /api/cart failed", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
