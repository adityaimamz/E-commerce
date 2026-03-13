import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createShipment } from "@/lib/shipping/rajaongkir-delivery";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { transactionId, ...rest } = body;

    if (!transactionId) {
       return NextResponse.json({ success: false, message: "transactionId is required" }, { status: 400 });
    }

    // Example payload for RajaOngkir/Komerce Delivery API
    const data = await createShipment({
      ...rest,
    });

    // Update shipment in database
    if (data.success && data.data?.waybill) {
      await prisma.shipment.update({
        where: { transactionId },
        data: {
          trackingNumber: data.data.waybill,
          shipmentStatus: "SHIPPED",
          shippedAt: new Date(),
        },
      });
      
      await prisma.transaction.update({
        where: { id: transactionId },
        data: { orderStatus: "SHIPPED" },
      });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
