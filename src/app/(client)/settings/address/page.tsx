"use client";

import { FormEvent, useEffect, useState } from "react";
import { toast } from "react-toastify";

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

type AddressForm = {
  recipientName: string;
  phone: string;
  addressLine: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
};

const initialForm: AddressForm = {
  recipientName: "",
  phone: "",
  addressLine: "",
  city: "",
  province: "",
  postalCode: "",
  country: "IDN",
};

export default function AddressPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<AddressForm>(initialForm);

  const loadAddresses = async () => {
    try {
      const res = await fetch("/api/addresses");
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal memuat alamat");
      }

      setAddresses(json.data);
    } catch (error: any) {
      toast.error(error.message || "Gagal memuat alamat");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);

    try {
      const res = await fetch("/api/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, isDefault: addresses.length === 0 }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal menyimpan alamat");
      }

      toast.success("Alamat tersimpan");
      setForm(initialForm);
      loadAddresses();
    } catch (error: any) {
      toast.error(error.message || "Gagal menyimpan alamat");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold mb-1">Alamat Pengiriman</h1>
        <p className="text-sm text-gray-500">Alamat default akan dipakai saat checkout.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="border border-gray-200 rounded-lg p-5">
          <h2 className="font-medium mb-4">Daftar Alamat</h2>
          {loading ? (
            <p className="text-sm text-gray-500">Memuat...</p>
          ) : addresses.length === 0 ? (
            <p className="text-sm text-gray-500">Belum ada alamat.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {addresses.map((address) => (
                <div key={address.id} className="border border-gray-200 rounded-md p-3 text-sm">
                  <div className="font-medium flex items-center gap-2">
                    {address.recipientName}
                    {address.isDefault && <span className="text-xs bg-black text-white px-2 py-0.5 rounded">Default</span>}
                  </div>
                  <p className="text-gray-600 mt-1">{address.phone}</p>
                  <p className="text-gray-600">{address.addressLine}</p>
                  <p className="text-gray-600">{address.city}, {address.province} {address.postalCode}</p>
                  <p className="text-gray-600">{address.country}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <form className="flex flex-col gap-4 border border-gray-200 rounded-lg p-5" onSubmit={handleSubmit}>
          <h2 className="font-medium">Tambah Alamat</h2>
          <input
            value={form.recipientName}
            onChange={(event) => setForm((prev) => ({ ...prev, recipientName: event.target.value }))}
            className="w-full px-4 py-2 border border-gray-300 rounded-md outline-none focus:ring-1 focus:ring-black text-sm"
            placeholder="Nama penerima"
            required
          />
          <input
            value={form.phone}
            onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
            className="w-full px-4 py-2 border border-gray-300 rounded-md outline-none focus:ring-1 focus:ring-black text-sm"
            placeholder="No. HP"
            required
          />
          <input
            value={form.addressLine}
            onChange={(event) => setForm((prev) => ({ ...prev, addressLine: event.target.value }))}
            className="w-full px-4 py-2 border border-gray-300 rounded-md outline-none focus:ring-1 focus:ring-black text-sm"
            placeholder="Alamat lengkap"
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              value={form.city}
              onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-md outline-none focus:ring-1 focus:ring-black text-sm"
              placeholder="Kota"
              required
            />
            <input
              value={form.province}
              onChange={(event) => setForm((prev) => ({ ...prev, province: event.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-md outline-none focus:ring-1 focus:ring-black text-sm"
              placeholder="Provinsi"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              value={form.postalCode}
              onChange={(event) => setForm((prev) => ({ ...prev, postalCode: event.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-md outline-none focus:ring-1 focus:ring-black text-sm"
              placeholder="Kode pos"
              required
            />
            <input
              value={form.country}
              onChange={(event) => setForm((prev) => ({ ...prev, country: event.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-md outline-none focus:ring-1 focus:ring-black text-sm"
              placeholder="Country code (IDN)"
              required
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="mt-2 bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 transition-colors self-start disabled:opacity-50"
          >
            {saving ? "Menyimpan..." : "Simpan Alamat"}
          </button>
        </form>
      </div>
    </div>
  );
}
