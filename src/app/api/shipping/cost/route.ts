import { NextResponse } from "next/server";
import { getShippingCost } from "@/lib/shipping/rajaongkir-cost";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { origin, destination, weight, courier } = body;

    if (!origin || !destination || !weight || !courier) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
    }

    const data = await getShippingCost({
      origin: origin.toString(),
      destination: destination.toString(),
      weight: parseInt(weight),
      courier,
    });

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
