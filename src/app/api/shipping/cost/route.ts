import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { searchDestination } from "@/lib/shipping/rajaongkir-delivery";
import { getShippingCost } from "@/lib/shipping/rajaongkir-cost";

const isNumericId = (value: string | number) => {
  if (typeof value === "number") return true;
  return /^\d+$/.test(String(value).trim());
};

const getDestinationIdFromResult = (item: any) => {
  return (
    item?.destination_id ||
    item?.id ||
    item?.subdistrict_id ||
    item?.district_id ||
    item?.city_id ||
    null
  );
};

const resolveDestinationParam = async (value: string) => {
  const normalized = value.trim();
  if (isNumericId(normalized)) {
    return normalized;
  }

  // Helper to find ID from result
  const findId = async (keyword: string) => {
    try {
      const searchResult = await searchDestination(keyword);
      const items =
        searchResult?.data ||
        searchResult?.data?.results ||
        searchResult?.results ||
        [];
      
      const firstItem = items[0] || null;
      return getDestinationIdFromResult(firstItem);
    } catch (err) {
      console.error(`Search failed for ${keyword}:`, err);
      return null;
    }
  };

  // Try original value
  let destinationId = await findId(normalized);

  // If failed and contains a comma, try the first part (e.g. "District" from "District, City")
  if (!destinationId && normalized.includes(",")) {
    const parts = normalized.split(",");
    const firstPart = parts[0].trim();
    if (firstPart) {
      destinationId = await findId(firstPart);
    }
  }

  if (!destinationId) {
    throw new Error(`Destination tidak ditemukan untuk '${normalized}'`);
  }

  return String(destinationId);
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { origin, destination, weight, courier } = body;

    if (!destination || !weight || !courier) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
    }

    // Get store origin from settings (ensure default row exists).
    const settings = await prisma.storeSettings.upsert({
      where: { id: "default" },
      update: {},
      create: { id: "default" },
    });
    
    // Prioritize districtId from database (new Komerce ID)
    // Fallback to originId (legacy or manually set)
    // Finally fallback to a known default if everything else fails
    const dbDistrictId = (settings as any).districtId;
    const dbOriginId = settings.originId;
    
    // Determine the most accurate origin ID for Komerce
    let finalOrigin = origin; // 1. Use from request body if provided
    if (!finalOrigin) {
      if (dbDistrictId && dbDistrictId !== "") {
        finalOrigin = dbDistrictId; // 2. Use districtId if available (best for Komerce)
      } else if (dbOriginId && dbOriginId !== "501") {
        finalOrigin = dbOriginId; // 3. Use originId if it's been updated from default
      } else {
        finalOrigin = dbDistrictId || dbOriginId || "501"; // 4. Last resort
      }
    }

    const resolvedOrigin = isNumericId(finalOrigin) 
      ? String(finalOrigin).trim() 
      : await resolveDestinationParam(String(finalOrigin));
      
    const resolvedDestination = await resolveDestinationParam(destination.toString());

    // Ensure courier is joined by colon if it's an array, or kept as string
    const finalCourier = Array.isArray(courier) ? courier.join(":") : courier;

    const data = await getShippingCost({
      origin: resolvedOrigin,
      destination: resolvedDestination,
      weight: Number.parseInt(weight, 10),
      courier: finalCourier,
      price: body.price || "lowest",
    });

    // The Komerce API returns costs in data array
    const costs = data?.data || [];

    return NextResponse.json({
      success: true,
      data: {
        raw: data,
        origin: resolvedOrigin,
        destination: resolvedDestination,
        costs,
        rajaongkir: {
          results: [{ costs }],
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}
