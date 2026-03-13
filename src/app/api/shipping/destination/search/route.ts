import { NextResponse } from "next/server";
import { searchDestination } from "@/lib/shipping/rajaongkir-delivery";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const keyword = searchParams.get("keyword") || "";

    if (!keyword.trim()) {
      return NextResponse.json(
        { success: false, message: "keyword is required" },
        { status: 400 }
      );
    }

    const data = await searchDestination(keyword.trim());
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
