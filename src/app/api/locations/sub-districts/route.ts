import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const districtId = searchParams.get("districtId");

  if (!districtId) {
    return NextResponse.json({ success: false, message: "districtId is required" }, { status: 400 });
  }

  const apiKey = process.env.RAJAONGKIR_API_KEY;
  const baseUrl = process.env.RAJAONGKIR_KOMERCE_API_URL || "https://rajaongkir.komerce.id/api/v1";

  try {
    const res = await fetch(`${baseUrl}/destination/sub-district/${districtId}`, {
      headers: {
        "key": apiKey || "",
      },
      next: { revalidate: 86400 },
    });
    const json = await res.json();
    return NextResponse.json({ success: true, data: json.data });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
