"use client";

import { CART_UPDATED_EVENT } from "@/lib/cart-events";
import useCartStore from "@/stores/cartStore";
import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const ShoppingCartIcon = () => {
  const { cart, hasHydrated } = useCartStore();
  const [serverCartCount, setServerCartCount] = useState<number | null>(null);
  const [serverChecked, setServerChecked] = useState(false);

  const localCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const fetchServerCartCount = useCallback(async () => {
    try {
      const res = await fetch("/api/cart", { cache: "no-store" });

      if (!res.ok) {
        setServerCartCount(null);
        return;
      }

      const data = await res.json();
      if (!data.success || !data.data) {
        setServerCartCount(0);
        return;
      }

      const count = data.data.items.reduce(
        (total: number, item: { quantity: number }) => total + item.quantity,
        0
      );
      setServerCartCount(count);
    } catch {
      setServerCartCount(null);
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

  const cartCount = serverCartCount ?? localCartCount;

  if (!hasHydrated && !serverChecked) return null;
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
