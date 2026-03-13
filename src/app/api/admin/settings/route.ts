import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { searchDestination } from "@/lib/shipping/rajaongkir-delivery";

export async function GET() {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const settings = await prisma.storeSettings.upsert({
      where: { id: "default" },
      update: {},
      create: { id: "default" },
    });

    return NextResponse.json({ success: true, data: settings });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    
    // Use districtId as direct origin candidate. If unavailable, resolve by name as fallback.
    let originId = body.originId || body.districtId;
    if ((!originId || originId === "501") && body.district && body.city) {
      try {
        const keyword = `${body.district}, ${body.city}`;
        const searchResult = await searchDestination(keyword);
        const firstItem = searchResult?.data?.[0] || searchResult?.data?.results?.[0] || searchResult?.results?.[0];
        
        const solvedId = firstItem?.destination_id || firstItem?.id || firstItem?.subdistrict_id || firstItem?.district_id;
        if (solvedId) {
          originId = String(solvedId);
        }
      } catch (err) {
        console.error("Failed to auto-resolve originId:", err);
      }
    }

    const updated = await prisma.storeSettings.update({
      where: { id: "default" },
      data: {
        ...body,
        originId: originId || "501"
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
