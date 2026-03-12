import { NextResponse } from "next/server";
import { TransactionService } from "@/services/transaction.service";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
    } = body;

    const serverKey = process.env.MIDTRANS_SERVER_KEY || "";
    
    const hash = crypto.createHash("sha512");
    hash.update(`${order_id}${status_code}${gross_amount}${serverKey}`);
    const calculatedSignature = hash.digest("hex");

    if (calculatedSignature !== signature_key) {
      return NextResponse.json({ success: false, message: "Invalid signature" }, { status: 403 });
    }

    await TransactionService.updateTransactionStatus(order_id, transaction_status, fraud_status || "");

    return NextResponse.json({ success: true, message: "Webhook processed" });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
