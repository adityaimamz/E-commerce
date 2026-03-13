import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { TransactionService } from "@/services/transaction.service";
import { z } from "zod";

const checkoutSchema = z.object({
  addressId: z.string().min(1, "addressId is required"),
  shippingCost: z.number().nonnegative(),
  courier: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { addressId, shippingCost, courier } = checkoutSchema.parse(body);
    const checkoutResult = await TransactionService.checkout(session.user.id, addressId, shippingCost, courier);
    return NextResponse.json({ success: true, data: checkoutResult }, { status: 201 });
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return NextResponse.json({ success: false, message: error.errors?.[0]?.message || "Invalid payload" }, { status: 400 });
    }

    return NextResponse.json({ success: false, message: error.message || "Internal server error" }, { status: 500 });
  }
}
