import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateDeliveryLabel } from "@/lib/shipping/rajaongkir-delivery";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const data = await generateDeliveryLabel(body || {});

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
