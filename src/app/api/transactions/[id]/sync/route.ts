import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { snap } from "@/lib/midtrans";
import { TransactionService } from "@/services/transaction.service";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const transaction = await prisma.transaction.findUnique({
      where: { id },
      select: { id: true, userId: true, status: true },
    });

    if (!transaction || transaction.userId !== session.user.id) {
      return NextResponse.json({ success: false, message: "Transaction not found" }, { status: 404 });
    }

    if (transaction.status !== "PENDING_PAYMENT") {
      return NextResponse.json({ success: true, data: { status: transaction.status, synced: false } });
    }

    const midtransStatus = await snap.transaction.status(id);
    const status = await TransactionService.updateTransactionStatus(
      id,
      midtransStatus.transaction_status || "pending",
      midtransStatus.fraud_status || ""
    );

    return NextResponse.json({ success: true, data: { status, synced: true } });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || "Failed to sync status" }, { status: 500 });
  }
}
