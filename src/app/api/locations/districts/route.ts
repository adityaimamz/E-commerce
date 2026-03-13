import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const cityId = searchParams.get("cityId");

  if (!cityId) {
    return NextResponse.json({ success: false, message: "cityId is required" }, { status: 400 });
  }

  try {
    const res = await fetch(`https://emsifa.github.io/api-wilayah-indonesia/api/districts/${cityId}.json`, {
      next: { revalidate: 86400 },
    });
    const data = await res.json();
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
