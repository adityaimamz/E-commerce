import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateTransactionStatusSchema = z.object({
  orderStatus: z.enum([
    "PENDING",
    "PROCESSING",
    "PACKING",
    "SHIPPED",
    "DELIVERED",
    "COMPLETED",
    "CANCELLED",
    "RETURNED",
  ]).optional(),
  paymentStatus: z.enum([
    "PENDING",
    "PAID",
    "FAILED",
    "CANCELLED",
    "EXPIRED",
    "REFUNDED",
  ]).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { orderStatus, paymentStatus } = updateTransactionStatusSchema.parse(body);

    const current = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!current) {
      return NextResponse.json({ success: false, message: "Transaction not found" }, { status: 404 });
    }

    const transaction = await prisma.transaction.update({
      where: { id },
      data: { 
        ...(orderStatus && { orderStatus }),
        ...(paymentStatus && { paymentStatus }),
      },
      include: {
        shipment: true,
        address: true,
      },
    });

    // Create notification for the user
    let title = "Status Pesanan Diperbarui";
    let message = `Pesanan Anda (${id}) telah diperbarui.`;
    
    if (orderStatus && orderStatus !== current.orderStatus) {
      title = "Status Pengiriman Diperbarui";
      message = `Status pesanan Anda (${id}) telah menjadi ${orderStatus}.`;
    } else if (paymentStatus && paymentStatus !== current.paymentStatus) {
      title = "Status Pembayaran Diperbarui";
      message = `Status pembayaran pesanan Anda (${id}) telah menjadi ${paymentStatus}.`;
    }

    if ((orderStatus && orderStatus !== current.orderStatus) || (paymentStatus && paymentStatus !== current.paymentStatus)) {
      await prisma.notification.create({
        data: {
          userId: current.userId,
          title,
          message,
          link: "/purchases"
        }
      });
    }

    return NextResponse.json({ success: true, data: transaction });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, message: "Invalid request data" }, { status: 400 });
    }

    return NextResponse.json({ success: false, message: error.message || "Internal server error" }, { status: 500 });
  }
}
