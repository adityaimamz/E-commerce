import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createAddressSchema = z.object({
  recipientName: z.string().min(1, "recipientName is required"),
  phone: z.string().min(6, "phone is required"),
  addressLine: z.string().min(1, "addressLine is required"),
  city: z.string().min(1, "city is required"),
  province: z.string().min(1, "province is required"),
  district: z.string().optional(),
  village: z.string().optional(),
  provinceId: z.string().optional().nullable(),
  cityId: z.string().optional().nullable(),
  districtId: z.string().optional().nullable(),
  subDistrictId: z.string().optional().nullable(),
  postalCode: z.string().min(1, "postalCode is required"),
  country: z.string().min(2, "country is required"),
  isDefault: z.boolean().optional(),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const addresses = await prisma.address.findMany({
      where: { userId: session.user.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ success: true, data: addresses });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const data = createAddressSchema.parse(body);

    const existingCount = await prisma.address.count({
      where: { userId: session.user.id },
    });

    const shouldSetDefault = data.isDefault || existingCount === 0;

    const address = await prisma.$transaction(async (tx) => {
      if (shouldSetDefault) {
        await tx.address.updateMany({
          where: { userId: session.user.id, isDefault: true },
          data: { isDefault: false },
        });
      }

      return tx.address.create({
        data: {
          userId: session.user.id,
          recipientName: data.recipientName,
          phone: data.phone,
          addressLine: data.addressLine,
          city: data.city,
          province: data.province,
          district: data.district,
          village: data.village,
          provinceId: data.provinceId,
          cityId: data.cityId,
          districtId: data.districtId,
          subDistrictId: data.subDistrictId,
          postalCode: data.postalCode,
          country: data.country,
          isDefault: shouldSetDefault,
        },
      });
    });

    return NextResponse.json({ success: true, data: address }, { status: 201 });
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return NextResponse.json({ success: false, message: error.errors?.[0]?.message || "Invalid payload" }, { status: 400 });
    }

    return NextResponse.json({ success: false, message: error.message || "Internal server error" }, { status: 500 });
  }
}
