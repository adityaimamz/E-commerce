import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { TransactionService } from "@/services/transaction.service";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const checkoutResult = await TransactionService.checkout(session.user.id);
    return NextResponse.json({ success: true, data: checkoutResult }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || "Internal server error" }, { status: 500 });
  }
}
