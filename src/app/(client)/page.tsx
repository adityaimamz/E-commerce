import ProductList from "@/components/client/ProductList";
import Image from "next/image";

const Homepage = async ({
  searchParams,
}: {
  searchParams: Promise<{ category: string; search: string }>;
}) => {
  const { category, search } = await searchParams;
  return (
    <div className="">
      <div className="relative aspect-[3/1] mb-12">
        <Image src="/featured.png" alt="Featured Product" fill />
      </div>
      <ProductList category={category} search={search} params="homepage"/>
    </div>
  );
};

export default Homepage;
