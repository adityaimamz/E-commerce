import Categories from "./Categories";
import DbProductCard from "./DbProductCard";
import Link from "next/link";
import Filter from "./Filter";
import { ProductService } from "@/services/product.service";
import { CategoryService } from "@/services/category.service";

interface ProductListProps {
  category?: string;
  params: "homepage" | "products";
  search?: string;
  page?: number;
}

const ProductList = async ({ category, params, search, page = 1 }: ProductListProps) => {
  // Look up categoryId from slug if category provided
  let categoryId: string | undefined;
  if (category && category !== "all") {
    const categoryData = await CategoryService.getCategoryBySlug(category);
    if (categoryData) {
      categoryId = categoryData.id;
    } else {
      categoryId = "not-found";
    }
  }

  const limit = params === "homepage" ? 8 : 20;
  const result = await ProductService.getProducts(page, limit, search, categoryId);
  const { products } = result;

  return (
    <div className="w-full">
      <Categories />
      {params === "products" && <Filter />}
      {products.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg">Tidak ada produk yang ditemukan.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-12">
          {products.map((product) => (
            <DbProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
      {params === "homepage" && (
        <Link
          href="/products"
          className="flex justify-end mt-4 underline text-sm text-gray-500"
        >
          View all products
        </Link>
      )}
    </div>
  );
};

export default ProductList;

