import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.RAJAONGKIR_API_KEY;
  const baseUrl = process.env.RAJAONGKIR_KOMERCE_API_URL || "https://rajaongkir.komerce.id/api/v1";

  try {
    const res = await fetch(`${baseUrl}/destination/province`, {
      headers: {
        "key": apiKey || "",
      },
      next: { revalidate: 86400 }, // Cache for 24 hours
    });
    const json = await res.json();
    return NextResponse.json({ success: true, data: json.data });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
