"use client";

import { CART_UPDATED_EVENT } from "@/lib/cart-events";
import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const ShoppingCartIcon = () => {
  const [cartCount, setCartCount] = useState<number>(0);
  const [serverChecked, setServerChecked] = useState(false);

  const fetchServerCartCount = useCallback(async () => {
    try {
      const res = await fetch("/api/cart", { cache: "no-store" });

      if (!res.ok) {
        setCartCount(0);
        return;
      }

      const data = await res.json();
      if (!data.success || !data.data) {
        setCartCount(0);
        return;
      }

      const count = data.data.items.reduce(
        (total: number, item: { quantity: number }) => total + item.quantity,
        0
      );
      setCartCount(count);
    } catch {
      setCartCount(0);
    } finally {
      setServerChecked(true);
    }
  }, []);

  useEffect(() => {
    void fetchServerCartCount();

    const handleCartUpdated = () => {
      void fetchServerCartCount();
    };

    globalThis.addEventListener(CART_UPDATED_EVENT, handleCartUpdated);
    globalThis.addEventListener("focus", handleCartUpdated);

    return () => {
      globalThis.removeEventListener(CART_UPDATED_EVENT, handleCartUpdated);
      globalThis.removeEventListener("focus", handleCartUpdated);
    };
  }, [fetchServerCartCount]);

  if (!serverChecked) return null;
  
  return (
    <Link href="/cart" className="relative">
      <ShoppingCart className="w-4 h-4 text-gray-600" />
      <span className="absolute -top-3 -right-3 bg-amber-400 text-gray-600 rounded-full w-4 h-4 flex items-center justify-center text-xs font-medium">
        {cartCount}
      </span>
    </Link>
  );
};

export default ShoppingCartIcon;
