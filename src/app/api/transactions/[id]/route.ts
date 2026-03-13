import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateOrderStatusSchema = z.object({
  status: z.enum([
    "PROCESSING",
    "PACKING",
    "SHIPPED",
    "DELIVERED",
    "COMPLETED",
    "CANCELLED",
    "RETURNED",
  ]),
});

const allowedTransitions: Record<string, string[]> = {
  PENDING: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["PACKING", "CANCELLED"],
  PACKING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
  RETURNED: [],
};

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { status } = updateOrderStatusSchema.parse(body);

    const current = await prisma.transaction.findUnique({
      where: { id },
      select: { orderStatus: true },
    });

    if (!current) {
      return new NextResponse("Transaction not found", { status: 404 });
    }

    if (current.orderStatus !== status && !allowedTransitions[current.orderStatus]?.includes(status)) {
      return new NextResponse("Invalid status transition", { status: 400 });
    }

    const transaction = await prisma.transaction.update({
      where: {
        id: id,
      },
      data: {
        orderStatus: status,
      },
    });

    return NextResponse.json(transaction);
  } catch (error) {
    console.error("[TRANSACTION_PATCH]", error);
    if (error instanceof z.ZodError) {
      return new NextResponse("Invalid request data", { status: 400 });
    }
    return new NextResponse("Internal server error", { status: 500 });
  }
}
