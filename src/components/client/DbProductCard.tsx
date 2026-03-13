"use client";

import { notifyCartUpdated } from "@/lib/cart-events";
import { DbProduct } from "@/types";
import { ShoppingCart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { toast } from "react-toastify";

const DbProductCard = ({ product }: { product: DbProduct }) => {
  const [adding, setAdding] = useState(false);

  const imageUrl = product.images?.[0]?.url || "/placeholder.png";
  let cartButtonLabel = "Add to Cart";
  if (product.stock === 0) {
    cartButtonLabel = "Habis";
  } else if (adding) {
    cartButtonLabel = "...";
  }

  const handleAddToCart = async () => {
    setAdding(true);
    try {
      const res = await fetch("/api/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, quantity: 1 }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        if (res.status === 401) {
          toast.error("Silakan masuk terlebih dahulu");
        } else {
          toast.error(data.message || "Gagal menambahkan ke keranjang");
        }
        return;
      }
      notifyCartUpdated();
      toast.success("Produk ditambahkan ke keranjang");
    } catch (error) {
      console.error("Failed to add item to cart", error);
      toast.error("Terjadi kesalahan, coba lagi");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="shadow-lg rounded-lg overflow-hidden">
      {/* IMAGE */}
      <Link href={`/products/${product.id}`}>
        <div className="relative aspect-[2/3] bg-gray-100">
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover hover:scale-105 transition-all duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      </Link>
      {/* PRODUCT DETAIL */}
      <div className="flex flex-col gap-4 p-4">
        <Link href={`/products/${product.id}`}>
          <h2 className="font-medium hover:underline">{product.name}</h2>
        </Link>
        {product.category && (
          <span className="text-xs text-gray-400 uppercase tracking-wide">
            {product.category.name}
          </span>
        )}
        <p className="text-sm text-gray-500 line-clamp-2">
          {product.description || ""}
        </p>
        {/* PRICE AND ADD TO CART BUTTON */}
        <div className="flex items-center justify-between">
          <p className="font-medium">
            {new Intl.NumberFormat("id-ID", {
              style: "currency",
              currency: "IDR",
              maximumFractionDigits: 0,
            }).format(product.price)}
          </p>
          <button
            onClick={handleAddToCart}
            disabled={adding || product.stock === 0}
            className="ring-1 ring-gray-200 shadow-lg rounded-md px-2 py-1 text-sm cursor-pointer hover:text-white hover:bg-black transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShoppingCart className="w-4 h-4" />
            {cartButtonLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DbProductCard;
