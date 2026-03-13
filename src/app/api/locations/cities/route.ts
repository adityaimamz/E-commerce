import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const provinceId = searchParams.get("provinceId");

  if (!provinceId) {
    return NextResponse.json({ success: false, message: "provinceId is required" }, { status: 400 });
  }

  try {
    const res = await fetch(`https://emsifa.github.io/api-wilayah-indonesia/api/regencies/${provinceId}.json`, {
      next: { revalidate: 86400 },
    });
    const data = await res.json();
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
