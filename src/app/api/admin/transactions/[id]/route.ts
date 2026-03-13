import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateTransactionStatusSchema = z.object({
  status: z.enum([
    "PENDING_PAYMENT",
    "PAID",
    "PROCESSING",
    "PACKING",
    "SHIPPED",
    "DELIVERED",
    "FAILED",
    "CANCELLED",
    "EXPIRED",
    "REFUNDED",
  ]),
});

const allowedTransitions: Record<string, string[]> = {
  PENDING_PAYMENT: ["PAID", "CANCELLED", "EXPIRED", "FAILED"],
  PAID: ["PROCESSING", "REFUNDED"],
  PROCESSING: ["PACKING"],
  PACKING: ["SHIPPED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  FAILED: [],
  CANCELLED: [],
  EXPIRED: [],
  REFUNDED: [],
};

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { status } = updateTransactionStatusSchema.parse(body);

    const current = await prisma.transaction.findUnique({
      where: { id },
      select: { status: true },
    });

    if (!current) {
      return NextResponse.json({ success: false, message: "Transaction not found" }, { status: 404 });
    }

    if (current.status !== status && !allowedTransitions[current.status]?.includes(status)) {
      return NextResponse.json({ success: false, message: "Invalid status transition" }, { status: 400 });
    }

    const transaction = await prisma.transaction.update({
      where: { id },
      data: { status },
      include: {
        shipment: true,
        address: true,
      },
    });

    return NextResponse.json({ success: true, data: transaction });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, message: "Invalid request data" }, { status: 400 });
    }

    return NextResponse.json({ success: false, message: error.message || "Internal server error" }, { status: 500 });
  }
}
