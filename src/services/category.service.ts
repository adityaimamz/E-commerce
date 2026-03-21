import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { createCategorySchema } from "@/lib/validators/category.validator";

export class CategoryService {
  static async getCategories() {
    return prisma.category.findMany({
      orderBy: { name: "asc" },
    });
  }

  static async getCategoryBySlug(slug: string) {
    return prisma.category.findUnique({
      where: { slug },
    });
  }

  static async createCategory(data: z.infer<typeof createCategorySchema>) {
    return prisma.category.create({
      data,
    });
  }
}
