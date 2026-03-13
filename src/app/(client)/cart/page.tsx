"use client";

import { notifyCartUpdated } from "@/lib/cart-events";
import { ArrowRight, Loader2, ShoppingCart, Trash2, Truck } from "lucide-react";
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
  district?: string;
  village?: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
};

type ShippingCostOption = {
  service: string;
  description: string;
  cost: Array<{ value: number; etd: string; note: string }>;
};

const COURIERS = [
  { id: "jne", name: "JNE" },
  { id: "tiki", name: "TIKI" },
  { id: "pos", name: "POS Indonesia" },
];

const CartPage = () => {
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  // Shipping States
  const [selectedCourier, setSelectedCourier] = useState<string>("");
  const [shippingOptions, setShippingOptions] = useState<ShippingCostOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [selectedOption, setSelectedOption] = useState<{ service: string; cost: number; etd: string } | null>(null);

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
        if (!res.ok) return;
        const data = await res.json();
        if (!data.success) return;

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

  // Fetch Shipping Cost when Address or Courier changes
  useEffect(() => {
    if (!selectedAddressId || !selectedCourier || !cart) {
      setShippingOptions([]);
      setSelectedOption(null);
      return;
    }

    const fetchShippingCost = async () => {
      setLoadingOptions(true);
      try {
        const selectedAddress = addresses.find(a => a.id === selectedAddressId);
        if (!selectedAddress) return;

        // Dummy weight for now: 1kg per item
        const totalWeight = cart.items.reduce((sum, item) => sum + item.quantity * 1000, 0);

        const res = await fetch("/api/shipping/cost", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            origin: "501", // Default origin city ID (e.g. Jakarta Barat)
            destination: selectedAddress.city, // Should be city ID, but for now we pass name. Needs mapping in production.
            weight: totalWeight,
            courier: selectedCourier,
          }),
        });

        const json = await res.json();
        if (json.success && json.data.rajaongkir?.results?.[0]?.costs) {
          setShippingOptions(json.data.rajaongkir.results[0].costs);
        } else {
          setShippingOptions([]);
          toast.error("Gagal mendapatkan biaya kirim");
        }
      } catch (error) {
        toast.error("Terjadi kesalahan saat mengecek ongkir");
      } finally {
        setLoadingOptions(false);
      }
    };

    fetchShippingCost();
  }, [selectedAddressId, selectedCourier]);

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
      notifyCartUpdated();
      toast.success("Item dihapus dari keranjang");
      fetchCart();
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setRemovingId(null);
    }
  };

  const handleCheckout = async () => {
    if (!selectedAddressId) {
      toast.error("Pilih alamat pengiriman terlebih dahulu");
      return;
    }
    if (!selectedOption) {
      toast.error("Pilih layanan pengiriman terlebih dahulu");
      return;
    }

    setCheckoutLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          addressId: selectedAddressId,
          shippingCost: selectedOption.cost,
          courier: `${selectedCourier.toUpperCase()} - ${selectedOption.service}`,
        }),
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
          await fetch(`/api/transactions/${transactionId}/sync`, { method: "POST" });
          router.push("/purchases");
          router.refresh();
        } catch {
          router.push("/purchases");
        }
      };

      if (globalThis.window && (globalThis as any).window.snap) {
        (globalThis as any).window.snap.pay(snapToken, {
          onSuccess: () => {
            toast.success("Pembayaran berhasil!");
            notifyCartUpdated();
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
        toast.error("Midtrans Snap tidak tersedia.");
      }
    } catch {
      toast.error("Checkout gagal, coba lagi");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const subtotal = cart?.items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  ) ?? 0;

  const totalAmount = subtotal + (selectedOption?.cost || 0);

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
    <div className="flex flex-col gap-8 mt-12 pb-20">
      <h1 className="text-2xl font-semibold">Keranjang Belanja</h1>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* LEFT: CART ITEMS & SHIPPING */}
        <div className="w-full lg:w-7/12 flex flex-col gap-6">
          <div className="shadow-sm border border-gray-100 p-8 rounded-xl bg-white flex flex-col gap-6">
            <h2 className="font-medium text-lg border-b pb-4">Item Belanja</h2>
            {cart.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between border-b border-gray-50 pb-6 last:border-0 last:pb-0">
                <div className="flex gap-4">
                  <div className="relative w-24 h-24 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100">
                    {item.product.images?.[0]?.url ? (
                      <Image src={item.product.images[0].url} alt={item.product.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <ShoppingCart className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col justify-between py-1">
                    <div>
                      <p className="font-semibold text-gray-800">{item.product.name}</p>
                      <p className="text-sm text-gray-500 mt-1">{formatRupiah(item.product.price)} / unit</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">Qty: {item.quantity}</span>
                        <span className="text-sm font-bold text-gray-900">{formatRupiah(item.product.price * item.quantity)}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(item.productId)}
                  disabled={removingId === item.productId}
                  className="w-10 h-10 rounded-full bg-red-50 hover:bg-red-100 transition-all text-red-400 flex items-center justify-center cursor-pointer disabled:opacity-50"
                  title="Hapus item"
                >
                  {removingId === item.productId ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            ))}
          </div>

          {/* SHIPPING SECTION */}
          <div className="shadow-sm border border-gray-100 p-8 rounded-xl bg-white flex flex-col gap-6">
            <div className="flex items-center gap-2 border-b pb-4">
              <Truck className="w-5 h-5 text-gray-600" />
              <h2 className="font-medium text-lg">Pilihan Pengiriman</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
               <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Alamat Tujuan</label>
                  {addresses.length > 0 ? (
                    <select
                      value={selectedAddressId}
                      onChange={(e) => setSelectedAddressId(e.target.value)}
                      className="border border-gray-200 rounded-lg p-3 text-sm bg-gray-50 outline-none focus:ring-1 focus:ring-black"
                    >
                      {addresses.map((address) => (
                        <option key={address.id} value={address.id}>
                          {address.recipientName} - {address.city}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Link href="/settings/address" className="text-sm text-red-500 underline">Tambah alamat dulu</Link>
                  )}
               </div>

               <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Kurir</label>
                  <select
                    value={selectedCourier}
                    onChange={(e) => setSelectedCourier(e.target.value)}
                    className="border border-gray-200 rounded-lg p-3 text-sm bg-gray-50 outline-none focus:ring-1 focus:ring-black"
                  >
                    <option value="">Pilih Kurir</option>
                    {COURIERS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
               </div>
            </div>

            {loadingOptions && (
              <div className="flex items-center justify-center py-4 gap-2 text-gray-400 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" /> Sedang mengecek ongkir...
              </div>
            )}

            {shippingOptions.length > 0 && (
              <div className="flex flex-col gap-3">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Layanan Tersedia</label>
                <div className="grid gap-2">
                  {shippingOptions.map((opt) => (
                    <button
                      key={opt.service}
                      onClick={() => setSelectedOption({ 
                        service: opt.service, 
                        cost: opt.cost[0].value, 
                        etd: opt.cost[0].etd 
                      })}
                      className={`flex items-center justify-between p-4 border rounded-xl text-left transition-all ${
                        selectedOption?.service === opt.service 
                        ? "border-black bg-gray-50 ring-1 ring-black" 
                        : "border-gray-200 hover:border-gray-400"
                      }`}
                    >
                      <div>
                        <p className="font-bold text-sm">{opt.service}</p>
                        <p className="text-xs text-gray-500">{opt.description}</p>
                        <p className="text-[10px] text-gray-400 mt-1">Estimasi: {opt.cost[0].etd} hari</p>
                      </div>
                      <p className="font-bold text-sm">{formatRupiah(opt.cost[0].value)}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: ORDER SUMMARY */}
        <div className="w-full lg:w-5/12">
          <div className="shadow-lg border border-gray-100 p-8 rounded-2xl bg-white flex flex-col gap-6 sticky top-8">
            <h2 className="font-bold text-xl">Ringkasan Pesanan</h2>
            
            <div className="flex flex-col gap-4">
              <div className="flex justify-between text-sm text-gray-600">
                <p>Subtotal Produk</p>
                <p className="font-medium text-gray-900">{formatRupiah(subtotal)}</p>
              </div>
              
              <div className="flex justify-between text-sm text-gray-600">
                <p>Biaya Pengiriman</p>
                <p className="font-medium text-gray-900">
                  {selectedOption ? formatRupiah(selectedOption.cost) : "—"}
                </p>
              </div>

              {selectedOption && (
                <div className="bg-green-50 p-3 rounded-lg flex items-center gap-3 border border-green-100">
                  <Truck className="w-4 h-4 text-green-600" />
                  <div className="text-xs text-green-700">
                    <p className="font-bold">{selectedCourier.toUpperCase()} - {selectedOption.service}</p>
                    <p>Estimasi sampai dalam {selectedOption.etd} hari</p>
                  </div>
                </div>
              )}

              <hr className="border-gray-100" />
              
              <div className="flex justify-between items-end">
                <p className="text-sm font-medium text-gray-500 mb-1">Total Pembayaran</p>
                <p className="text-2xl font-bold text-gray-900">{formatRupiah(totalAmount)}</p>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={checkoutLoading || !selectedOption}
              className="w-full bg-black hover:bg-gray-800 transition-all text-white p-4 rounded-xl cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 shadow-xl shadow-black/10 mt-2 font-semibold"
            >
              {checkoutLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Lanjut ke Pembayaran
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
            
            <p className="text-[10px] text-gray-400 text-center uppercase tracking-widest">
              Secure Checkout with Midtrans
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
