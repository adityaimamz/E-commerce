"use client";

import { notifyCartUpdated } from "@/lib/cart-events";
import { DbProduct } from "@/types";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

const DbProductInteraction = ({ product }: { product: DbProduct }) => {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  const handleQuantityChange = (type: "increment" | "decrement") => {
    if (type === "increment") {
      if (quantity < product.stock) {
        setQuantity((prev) => prev + 1);
      }
    } else if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  const handleAddToCart = async () => {
    setAdding(true);
    try {
      const res = await fetch("/api/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, quantity }),
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

  const handleBuyNow = async () => {
    await handleAddToCart();
    router.push("/cart");
  };

  return (
    <div className="flex flex-col gap-4 mt-4">
      {/* STOCK INFO */}
      <div className="text-sm text-gray-500">
        Tersedia: {product.stock} barang
      </div>

      {/* QUANTITY */}
      <div className="flex flex-col gap-2 text-sm">
        <span className="text-gray-500">Quantity</span>
        <div className="flex items-center gap-2">
          <button
            className="cursor-pointer border border-gray-300 p-1 disabled:opacity-50"
            onClick={() => handleQuantityChange("decrement")}
            disabled={quantity <= 1 || product.stock === 0}
          >
            <Minus className="w-4 h-4" />
          </button>
          <span>{quantity}</span>
          <button
            className="cursor-pointer border border-gray-300 p-1 disabled:opacity-50"
            onClick={() => handleQuantityChange("increment")}
            disabled={quantity >= product.stock || product.stock === 0}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* BUTTONS */}
      <button
        onClick={handleAddToCart}
        disabled={adding || product.stock === 0}
        className="bg-gray-800 text-white px-4 py-2 rounded-md shadow-lg flex items-center justify-center gap-2 cursor-pointer text-sm font-medium disabled:opacity-50"
      >
        <Plus className="w-4 h-4" />
        {adding ? "Menambahkan..." : "Add to Cart"}
      </button>
      <button 
        onClick={handleBuyNow}
        disabled={adding || product.stock === 0}
        className="ring-1 ring-gray-400 shadow-lg text-gray-800 px-4 py-2 rounded-md flex items-center justify-center cursor-pointer gap-2 text-sm font-medium disabled:opacity-50"
      >
        <ShoppingCart className="w-4 h-4" />
        Buy this Item
      </button>
    </div>
  );
};

export default DbProductInteraction;
