import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateAddressSchema = z.object({
  recipientName: z.string().min(1, "recipientName is required"),
  phone: z.string().min(6, "phone is required"),
  addressLine: z.string().min(1, "addressLine is required"),
  city: z.string().min(1, "city is required"),
  province: z.string().min(1, "province is required"),
  district: z.string().optional(),
  village: z.string().optional(),
  postalCode: z.string().min(1, "postalCode is required"),
  country: z.string().min(2, "country is required"),
  isDefault: z.boolean().optional(),
});

const resolveUserId = async () => {
  const session = await auth();
  let userId = session?.user?.id;

  if (!userId && session?.user?.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    userId = user?.id;
  }

  return userId;
};

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await resolveUserId();
    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const data = updateAddressSchema.parse(body);

    const existingAddress = await prisma.address.findFirst({
      where: { id, userId },
      select: { id: true },
    });

    if (!existingAddress) {
      return NextResponse.json({ success: false, message: "Alamat tidak ditemukan" }, { status: 404 });
    }

    const address = await prisma.$transaction(async (tx) => {
      if (data.isDefault) {
        await tx.address.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        });
      }

      return tx.address.update({
        where: { id },
        data: {
          recipientName: data.recipientName,
          phone: data.phone,
          addressLine: data.addressLine,
          city: data.city,
          province: data.province,
          district: data.district,
          village: data.village,
          postalCode: data.postalCode,
          country: data.country,
          isDefault: data.isDefault ?? false,
        },
      });
    });

    if (!address) {
      return NextResponse.json({ success: false, message: "Alamat tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: address });
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return NextResponse.json(
        { success: false, message: error.errors?.[0]?.message || "Invalid payload" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await resolveUserId();
    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existingAddress = await prisma.address.findFirst({
      where: { id, userId },
      select: { id: true, isDefault: true },
    });

    if (!existingAddress) {
      return NextResponse.json({ success: false, message: "Alamat tidak ditemukan" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.address.delete({ where: { id } });

      if (existingAddress.isDefault) {
        const fallbackAddress = await tx.address.findFirst({
          where: { userId },
          orderBy: { createdAt: "desc" },
          select: { id: true },
        });

        if (fallbackAddress) {
          await tx.address.update({
            where: { id: fallbackAddress.id },
            data: { isDefault: true },
          });
        }
      }
    });

    return NextResponse.json({ success: true, message: "Alamat berhasil dihapus" });
  } catch (error: any) {
    if (error?.code === "P2003") {
      return NextResponse.json(
        {
          success: false,
          message: "Alamat sedang dipakai dalam transaksi dan tidak bisa dihapus.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
