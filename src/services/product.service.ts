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

    try {
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
    } catch (error: any) {
      const message = String(error?.message || "");
      const isConnectivityError =
        error?.code === "P1001" ||
        message.includes("Can't reach database server") ||
        message.includes("Can\u2019t reach database server");

      if (!isConnectivityError) {
        throw error;
      }

      console.error("[ProductService.getProducts] Database connection failed:", message);
      return { products: [], total: 0, page, limit, totalPages: 0 };
    }
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
