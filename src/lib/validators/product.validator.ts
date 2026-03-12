import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional(),
  price: z.number().min(0, "Price must be positive"),
  stock: z.number().min(0, "Stock must be positive"),
  categoryId: z.string().min(1, "Category is required"),
  images: z.array(z.string()).optional(),
});

export const updateProductSchema = createProductSchema.partial();
