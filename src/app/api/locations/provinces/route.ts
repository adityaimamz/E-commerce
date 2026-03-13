import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch("https://emsifa.github.io/api-wilayah-indonesia/api/provinces.json", {
      next: { revalidate: 86400 }, // Cache for 24 hours
    });
    const data = await res.json();
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
