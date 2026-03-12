import { ProductService } from "@/services/product.service";
import ProductsTable from "@/components/admin/ProductsTable";

const ProductsPage = async () => {
  const { products } = await ProductService.getProducts(1, 100);

  // Map to format that form and table understands
  const data = products.map((p: any) => ({
    id: p.id,
    name: p.name,
    description: p.description || "",
    shortDescription: p.shortDescription || "",
    price: p.price,
    stock: p.stock,
    categoryId: p.categoryId,
    category: p.category?.name ?? "T-shirts",
    images: p.images || [],
    sizes: (p.sizes || []).map((s: any) => s.size),
    colors: (p.colors || []).map((c: any) => c.name),
  }));

  return (
    <div className="">
      <ProductsTable initialData={data} />
    </div>
  );
};

export default ProductsPage;
