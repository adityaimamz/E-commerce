import ProductList from "@/components/client/ProductList";

const ProductsPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ category: string }>;
}) => {
  const category = (await searchParams).category;
  return (
    <div className="">
      <ProductList category={category} params="products"/>
    </div>
  );
};

export default ProductsPage;
