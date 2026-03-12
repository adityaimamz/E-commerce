import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { CartService } from "@/services/cart.service";
import { removeFromCartSchema } from "@/lib/validators/cart.validator";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const data = removeFromCartSchema.parse(body);

    await CartService.removeFromCart(session.user.id, data);
    return NextResponse.json({ success: true, message: "Item removed from cart" });
  } catch (error: any) {
    if (error.message === "Item not found in cart") {
      return NextResponse.json({ success: false, message: error.message }, { status: 404 });
    }
    if (error.name === "ZodError") {
      return NextResponse.json({ success: false, message: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
