"use client";

import { ArrowRight, Loader2, ShoppingCart, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

type CartProduct = {
  id: string;
  name: string;
  price: number;
  stock: number;
  images: { id: string; url: string; productId: string }[];
};

type CartItem = {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  product: CartProduct;
};

type Cart = {
  id: string;
  items: CartItem[];
};

type Address = {
  id: string;
  recipientName: string;
  phone: string;
  addressLine: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
};

const CartPage = () => {
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const fetchCart = async () => {
    try {
      const res = await fetch("/api/cart");
      if (res.status === 401) {
        setCart(null);
        return;
      }
      const data = await res.json();
      if (data.success) setCart(data.data);
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat keranjang");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const res = await fetch("/api/addresses");
        if (!res.ok) {
          return;
        }

        const data = await res.json();
        if (!data.success) {
          return;
        }

        const loadedAddresses: Address[] = data.data;
        setAddresses(loadedAddresses);

        const defaultAddress = loadedAddresses.find((address) => address.isDefault);
        setSelectedAddressId(defaultAddress?.id || loadedAddresses[0]?.id || "");
      } catch {
        // Keep checkout state unchanged when address API fails.
      }
    };

    fetchAddresses();
  }, []);

  const handleRemove = async (productId: string) => {
    setRemovingId(productId);
    try {
      const res = await fetch("/api/cart/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.message || "Gagal menghapus item");
        return;
      }
      toast.success("Item dihapus dari keranjang");
      fetchCart();
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setRemovingId(null);
    }
  };

  const handleCheckout = async () => {
    setCheckoutLoading(true);
    try {
      if (!selectedAddressId) {
        toast.error("Pilih alamat pengiriman terlebih dahulu");
        return;
      }

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addressId: selectedAddressId }),
      });
      const data = await res.json();

      if (res.status === 401) {
        toast.error("Silakan masuk terlebih dahulu");
        return;
      }

      if (!res.ok || !data.success) {
        toast.error(data.message || "Checkout gagal");
        return;
      }

      const { snapToken, transactionId } = data.data;

      const syncTransactionStatus = async () => {
        try {
          await fetch(`/api/transactions/${transactionId}/sync`, {
            method: "POST",
          });
          router.push("/purchases");
          router.refresh();
        } catch {
          // Keep UX flowing even if sync request fails.
          router.push("/purchases");
        }
      };

      // Load Midtrans Snap dan tampilkan popup pembayaran
      if (globalThis.window && (globalThis as any).window.snap) {
        (globalThis as any).window.snap.pay(snapToken, {
          onSuccess: () => {
            toast.success("Pembayaran berhasil!");
            fetchCart();
            syncTransactionStatus();
          },
          onPending: () => toast.info("Menunggu pembayaran..."),
          onError: () => toast.error("Pembayaran gagal"),
          onClose: () => {
            toast.info("Popup pembayaran ditutup");
            syncTransactionStatus();
          },
        });
      } else {
        toast.error("Midtrans Snap tidak tersedia. Pastikan MIDTRANS_CLIENT_KEY sudah dikonfigurasi.");
      }
    } catch {
      toast.error("Checkout gagal, coba lagi");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const totalAmount = cart?.items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  ) ?? 0;

  const formatRupiah = (amount: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin w-8 h-8 text-gray-400" />
      </div>
    );
  }

  if (!cart) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-gray-400">
        <ShoppingCart className="w-16 h-16" />
        <p className="text-lg font-medium">Silakan masuk untuk melihat keranjang Anda</p>
        <Link href="/auth/login" className="text-sm text-primary hover:underline">
          Masuk sekarang →
        </Link>
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-gray-400">
        <ShoppingCart className="w-16 h-16" />
        <p className="text-lg font-medium">Keranjang Anda kosong</p>
        <Link href="/products" className="text-sm text-primary hover:underline">
          Mulai belanja →
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 mt-12">
      <h1 className="text-2xl font-medium">Keranjang Belanja</h1>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* CART ITEMS */}
        <div className="w-full lg:w-7/12 shadow-lg border border-gray-100 p-8 rounded-lg flex flex-col gap-6">
          {cart.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between border-b pb-4 last:border-0">
              <div className="flex gap-4">
                <div className="relative w-20 h-20 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0">
                  {item.product.images?.[0]?.url ? (
                    <Image
                      src={item.product.images[0].url}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <ShoppingCart className="w-6 h-6" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col justify-between">
                  <p className="font-medium text-sm">{item.product.name}</p>
                  <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                  <p className="font-medium text-sm">{formatRupiah(item.product.price)}</p>
                </div>
              </div>
              <button
                onClick={() => handleRemove(item.productId)}
                disabled={removingId === item.productId}
                className="w-8 h-8 rounded-full bg-red-100 hover:bg-red-200 transition-all text-red-400 flex items-center justify-center cursor-pointer disabled:opacity-50"
              >
                {removingId === item.productId ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Trash2 className="w-3 h-3" />
                )}
              </button>
            </div>
          ))}
        </div>

        {/* ORDER SUMMARY */}
        <div className="w-full lg:w-5/12 shadow-lg border border-gray-100 p-8 rounded-lg flex flex-col gap-6 h-max">
          <h2 className="font-semibold">Ringkasan Pesanan</h2>
          <div className="flex flex-col gap-2">
            <label htmlFor="shipping-address" className="text-xs font-medium text-gray-600">Alamat Pengiriman</label>
            {addresses.length > 0 ? (
              <select
                id="shipping-address"
                value={selectedAddressId}
                onChange={(event) => setSelectedAddressId(event.target.value)}
                className="border border-gray-200 rounded-md p-2 text-sm"
              >
                {addresses.map((address) => (
                  <option key={address.id} value={address.id}>
                    {`${address.recipientName} - ${address.addressLine}, ${address.city}`}
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex flex-col gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
                <p className="text-xs text-amber-700 font-medium">
                  Belum ada alamat pengiriman.
                </p>
                <p className="text-xs text-amber-600">
                  Tambahkan alamat pengiriman terlebih dahulu sebelum checkout.
                </p>
                <Link
                  href="/settings/address"
                  className="text-xs text-amber-700 font-semibold underline hover:text-amber-900 transition-colors"
                >
                  + Tambah Alamat Sekarang →
                </Link>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-3">
            {cart.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <p className="text-gray-500">{item.product.name} x{item.quantity}</p>
                <p className="font-medium">{formatRupiah(item.product.price * item.quantity)}</p>
              </div>
            ))}
            <hr className="border-gray-200 my-2" />
            <div className="flex justify-between font-semibold">
              <p>Total</p>
              <p>{formatRupiah(totalAmount)}</p>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            disabled={checkoutLoading || addresses.length === 0}
            className="w-full bg-gray-800 hover:bg-gray-900 transition-all text-white p-3 rounded-lg cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {checkoutLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Bayar Sekarang
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
