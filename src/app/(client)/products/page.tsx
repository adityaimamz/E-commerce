import ProductList from "@/components/client/ProductList";

const ProductsPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ category: string; search: string }>;
}) => {
  const { category, search } = await searchParams;
  return (
    <div className="">
      <ProductList category={category} search={search} params="products"/>
    </div>
  );
};

export default ProductsPage;
