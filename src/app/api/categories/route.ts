import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { CategoryService } from "@/services/category.service";
import { createCategorySchema } from "@/lib/validators/category.validator";

export async function GET(req: Request) {
  try {
    const categories = await CategoryService.getCategories();
    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const data = createCategorySchema.parse(body);

    const category = await CategoryService.createCategory(data);
    return NextResponse.json({ success: true, data: category }, { status: 201 });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ success: false, message: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
