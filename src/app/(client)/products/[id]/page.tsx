import DbProductInteraction from "@/components/client/DbProductInteraction";
import Image from "next/image";
import { ProductService } from "@/services/product.service";
import { notFound } from "next/navigation";

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;
  const product = await ProductService.getProductById(id);

  if (!product) {
    return { title: "Product Not Found" };
  }

  return {
    title: product.name,
    description: product.description || "Product details",
  };
};

const ProductPage = async ({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) => {
  const { id } = await params;
  const product = await ProductService.getProductById(id);

  if (!product) {
    notFound();
  }

  const imageUrl = product.images?.[0]?.url || "/placeholder.png";

  return (
    <div className="flex flex-col gap-4 lg:flex-row md:gap-12 mt-12 mb-24">
      {/* IMAGE */}
      <div className="w-full lg:w-5/12 relative aspect-[2/3] bg-gray-50 rounded-md overflow-hidden flex items-center justify-center">
        {product.images && product.images.length > 0 ? (
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover rounded-md"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
        ) : (
          <span className="text-gray-400">No Image</span>
        )}
      </div>
      {/* DETAILS */}
      <div className="w-full lg:w-7/12 flex flex-col gap-4">
        <h1 className="text-2xl font-medium">{product.name}</h1>
        {product.category && (
          <p className="text-xs uppercase text-gray-400 tracking-wider">
            {product.category.name}
          </p>
        )}
        <p className="text-gray-500 whitespace-pre-wrap">{product.description}</p>
        <h2 className="text-2xl font-semibold">
          {new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0,
          }).format(product.price)}
        </h2>
        
        <DbProductInteraction product={product} />
        
        {/* CARD INFO */}
        <div className="flex items-center gap-2 mt-4">
          <Image
            src="/klarna.png"
            alt="klarna"
            width={50}
            height={25}
            className="rounded-md"
          />
          <Image
            src="/cards.png"
            alt="cards"
            width={50}
            height={25}
            className="rounded-md"
          />
          <Image
            src="/stripe.png"
            alt="stripe"
            width={50}
            height={25}
            className="rounded-md"
          />
        </div>
        <p className="text-gray-500 text-xs mt-2">
          By clicking Pay Now, you agree to our{" "}
          <span className="underline hover:text-black cursor-pointer">Terms & Conditions</span>{" "}
          and <span className="underline hover:text-black cursor-pointer">Privacy Policy</span>
          . You authorize us to charge your selected payment method for the
          total amount shown. All sales are subject to our return and{" "}
          <span className="underline hover:text-black cursor-pointer">Refund Policies</span>.
        </p>
      </div>
    </div>
  );
};

export default ProductPage;
