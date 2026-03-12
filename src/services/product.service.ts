import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { createProductSchema, updateProductSchema } from "@/lib/validators/product.validator";

export class ProductService {
  static async getProducts(page = 1, limit = 20, search?: string, categoryId?: string) {
    const skip = (page - 1) * limit;
    
    const where: any = {};
    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }
    if (categoryId) {
      where.categoryId = categoryId;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: { category: true, images: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.product.count({ where }),
    ]);

    return { products, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async getProductById(id: string) {
    return prisma.product.findUnique({
      where: { id },
      include: { category: true, images: true },
    });
  }

  static async createProduct(data: z.infer<typeof createProductSchema>) {
    const { images, ...productData } = data;
    return prisma.product.create({
      data: {
        ...productData,
        images: images ? {
          create: images.map((url: string) => ({ url })),
        } : undefined,
      },
      include: { category: true, images: true },
    });
  }

  static async updateProduct(id: string, data: z.infer<typeof updateProductSchema>) {
    const { images, ...productData } = data;
    return prisma.product.update({
      where: { id },
      data: {
        ...productData,
        images: images ? {
          deleteMany: {},
          create: images.map((url: string) => ({ url })),
        } : undefined,
      },
      include: { category: true, images: true },
    });
  }

  static async deleteProduct(id: string) {
    return prisma.product.delete({
      where: { id },
    });
  }
}
