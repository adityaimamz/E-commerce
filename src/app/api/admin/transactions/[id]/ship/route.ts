import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const shipOrderSchema = z.object({
  courier: z.string().min(1, "courier is required"),
  trackingNumber: z.string().min(1, "trackingNumber is required"),
  shippingCost: z.number().nonnegative(),
  estimatedDelivery: z.iso.datetime().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const data = shipOrderSchema.parse(body);

    const updated = await prisma.$transaction(async (tx) => {
      const order = await tx.transaction.findUnique({
        where: { id },
        select: { id: true, status: true },
      });

      if (!order) {
        throw new Error("Transaction not found");
      }

      if (!["PACKING", "SHIPPED"].includes(order.status)) {
        throw new Error("Only PACKING orders can be shipped");
      }

      const shipment = await tx.shipment.upsert({
        where: { transactionId: id },
        update: {
          courier: data.courier,
          trackingNumber: data.trackingNumber,
          shippingCost: data.shippingCost,
          shippedAt: new Date(),
          estimatedDelivery: data.estimatedDelivery ? new Date(data.estimatedDelivery) : null,
        },
        create: {
          transactionId: id,
          courier: data.courier,
          trackingNumber: data.trackingNumber,
          shippingCost: data.shippingCost,
          shippedAt: new Date(),
          estimatedDelivery: data.estimatedDelivery ? new Date(data.estimatedDelivery) : null,
        },
      });

      const transaction = await tx.transaction.update({
        where: { id },
        data: { status: "SHIPPED" },
      });

      return { shipment, transaction };
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return NextResponse.json({ success: false, message: error.errors?.[0]?.message || "Invalid payload" }, { status: 400 });
    }

    if (error?.message === "Transaction not found") {
      return NextResponse.json({ success: false, message: error.message }, { status: 404 });
    }

    if (error?.message === "Only PACKING orders can be shipped") {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: false, message: error.message || "Internal server error" }, { status: 500 });
  }
}
