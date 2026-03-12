import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateUserRoleSchema = z.object({
  role: z.enum(["USER", "ADMIN"]),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Prevent changing your own role to avoid accidental lockout
    if (session.user.id === id) {
       return NextResponse.json(
        { message: "You cannot change your own role." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { role } = updateUserRoleSchema.parse(body);

    const user = await prisma.user.update({
      where: {
        id: id,
      },
      data: {
        role,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("[USER_ROLE_PATCH]", error);
    if (error instanceof z.ZodError) {
      return new NextResponse("Invalid request data", { status: 400 });
    }
    return new NextResponse("Internal server error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Prevent self-deletion
    if (session.user.id === id) {
        return NextResponse.json(
         { message: "You cannot delete your own account here." },
         { status: 400 }
       );
     }

    const user = await prisma.user.delete({
      where: {
        id: id,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("[USER_DELETE]", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
