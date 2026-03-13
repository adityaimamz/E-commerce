import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDeliveryAwbHistory } from "@/lib/shipping/rajaongkir-delivery";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const transactionId = searchParams.get("transactionId");

    if (!transactionId) {
      return NextResponse.json(
        { success: false, message: "Transaction ID is required" },
        { status: 400 }
      );
    }

    const shipment = await prisma.shipment.findUnique({
      where: { transactionId },
    });

    if (!shipment?.trackingNumber) {
      return NextResponse.json(
        { success: false, message: "Tracking number not found for this transaction" },
        { status: 404 }
      );
    }

    const shippingCode = shipment.courier.split(" ")[0].toLowerCase();
    const trackingData = await getDeliveryAwbHistory(
      shippingCode,
      shipment.trackingNumber
    );

    const manifest =
      trackingData?.data?.manifest ||
      trackingData?.data?.history ||
      trackingData?.manifest ||
      [];

    return NextResponse.json({
      success: true,
      data: {
        raw: trackingData,
        data: {
          manifest,
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
