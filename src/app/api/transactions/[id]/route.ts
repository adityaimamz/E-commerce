import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateTransactionStatusSchema = z.object({
  status: z.enum([
    "PENDING",
    "PAID",
    "PACKING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
    "EXPIRED"
  ]),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { status } = updateTransactionStatusSchema.parse(body);

    const transaction = await prisma.transaction.update({
      where: {
        id: id,
      },
      data: {
        status,
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
