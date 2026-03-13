"use client";

import { FormEvent, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Loader2 } from "lucide-react";

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

type LocationItem = {
  id: string;
  name: string;
};

type AddressForm = {
  recipientName: string;
  phone: string;
  addressLine: string;
  province: string;
  city: string;
  district: string;
  village: string;
  postalCode: string;
  country: string;
};

const initialForm: AddressForm = {
  recipientName: "",
  phone: "",
  addressLine: "",
  province: "",
  city: "",
  district: "",
  village: "",
  postalCode: "",
  country: "IDN",
};

export default function AddressPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<AddressForm>(initialForm);

  // States for chained dropdowns
  const [provinces, setProvinces] = useState<LocationItem[]>([]);
  const [cities, setCities] = useState<LocationItem[]>([]);
  const [districts, setDistricts] = useState<LocationItem[]>([]);
  const [villages, setVillages] = useState<LocationItem[]>([]);

  // Selected IDs for API calls
  const [selectedProvinceId, setSelectedProvinceId] = useState("");
  const [selectedCityId, setSelectedCityId] = useState("");
  const [selectedDistrictId, setSelectedDistrictId] = useState("");

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

  const fetchProvinces = async () => {
    try {
      const res = await fetch("/api/locations/provinces");
      const json = await res.json();
      if (json.success) setProvinces(json.data);
    } catch (error) {
      console.error("Failed to fetch provinces", error);
    }
  };

  useEffect(() => {
    loadAddresses();
    fetchProvinces();
  }, []);

  // Fetch Cities when Province changes
  useEffect(() => {
    if (!selectedProvinceId) {
      setCities([]);
      return;
    }
    const fetchCities = async () => {
      try {
        const res = await fetch(`/api/locations/cities?provinceId=${selectedProvinceId}`);
        const json = await res.json();
        if (json.success) setCities(json.data);
      } catch (error) {
        console.error("Failed to fetch cities", error);
      }
    };
    fetchCities();
    setForm(prev => ({ ...prev, city: "", district: "", village: "" }));
    setSelectedCityId("");
    setSelectedDistrictId("");
  }, [selectedProvinceId]);

  // Fetch Districts when City changes
  useEffect(() => {
    if (!selectedCityId) {
      setDistricts([]);
      return;
    }
    const fetchDistricts = async () => {
      try {
        const res = await fetch(`/api/locations/districts?cityId=${selectedCityId}`);
        const json = await res.json();
        if (json.success) setDistricts(json.data);
      } catch (error) {
        console.error("Failed to fetch districts", error);
      }
    };
    fetchDistricts();
    setForm(prev => ({ ...prev, district: "", village: "" }));
    setSelectedDistrictId("");
  }, [selectedCityId]);

  // Fetch Villages when District changes
  useEffect(() => {
    if (!selectedDistrictId) {
      setVillages([]);
      return;
    }
    const fetchVillages = async () => {
      try {
        const res = await fetch(`/api/locations/villages?districtId=${selectedDistrictId}`);
        const json = await res.json();
        if (json.success) setVillages(json.data);
      } catch (error) {
        console.error("Failed to fetch villages", error);
      }
    };
    fetchVillages();
    setForm(prev => ({ ...prev, village: "" }));
  }, [selectedDistrictId]);

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
      setSelectedProvinceId("");
      setSelectedCityId("");
      setSelectedDistrictId("");
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
        <p className="text-sm text-gray-500">Alamat lengkap memudahkan kurir mencari lokasi Anda.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="border border-gray-200 rounded-lg p-5">
          <h2 className="font-medium mb-4">Daftar Alamat</h2>
          {loading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : addresses.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">Belum ada alamat tersimpan.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {addresses.map((address) => (
                <div key={address.id} className="border border-gray-200 rounded-md p-3 text-sm hover:border-black transition-colors">
                  <div className="font-medium flex items-center justify-between">
                    <span className="flex items-center gap-2">
                       {address.recipientName}
                       {address.isDefault && <span className="text-[10px] bg-black text-white px-1.5 py-0.5 rounded leading-none uppercase font-bold tracking-tight">Default</span>}
                    </span>
                  </div>
                  <p className="text-gray-500 text-xs mt-1">{address.phone}</p>
                  <p className="text-gray-700 mt-2 font-medium">{address.addressLine}</p>
                  <p className="text-gray-600 text-xs">
                    {address.village && `${address.village}, `}
                    {address.district && `${address.district}, `}
                    {address.city}, {address.province} {address.postalCode}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <form className="flex flex-col gap-4 border border-gray-200 rounded-lg p-6 bg-gray-50/50" onSubmit={handleSubmit}>
          <h2 className="font-semibold text-lg mb-2">Tambah Alamat Baru</h2>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Nama Penerima</label>
              <input
                value={form.recipientName}
                onChange={(event) => setForm((prev) => ({ ...prev, recipientName: event.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:ring-1 focus:ring-black text-sm bg-white"
                placeholder="Contoh: Budi Santoso"
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">No. HP</label>
              <input
                value={form.phone}
                onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:ring-1 focus:ring-black text-sm bg-white"
                placeholder="0812xxxx"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">Alamat Lengkap (Jalan, No Rumah, RT/RW)</label>
            <textarea
              value={form.addressLine}
              onChange={(event) => setForm((prev) => ({ ...prev, addressLine: event.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:ring-1 focus:ring-black text-sm bg-white min-h-[80px]"
              placeholder="Jl. Merdeka No. 10..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Provinsi</label>
              <select
                value={selectedProvinceId}
                onChange={(e) => {
                  setSelectedProvinceId(e.target.value);
                  const name = provinces.find(p => p.id === e.target.value)?.name || "";
                  setForm(prev => ({ ...prev, province: name }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:ring-1 focus:ring-black text-sm bg-white appearance-none"
                required
              >
                <option value="">Pilih Provinsi</option>
                {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Kota/Kabupaten</label>
              <select
                value={selectedCityId}
                disabled={!selectedProvinceId}
                onChange={(e) => {
                  setSelectedCityId(e.target.value);
                  const name = cities.find(c => c.id === e.target.value)?.name || "";
                  setForm(prev => ({ ...prev, city: name }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:ring-1 focus:ring-black text-sm bg-white appearance-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                required
              >
                <option value="">Pilih Kota</option>
                {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Kecamatan</label>
              <select
                value={selectedDistrictId}
                disabled={!selectedCityId}
                onChange={(e) => {
                  setSelectedDistrictId(e.target.value);
                  const name = districts.find(d => d.id === e.target.value)?.name || "";
                  setForm(prev => ({ ...prev, district: name }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:ring-1 focus:ring-black text-sm bg-white appearance-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                required
              >
                <option value="">Pilih Kecamatan</option>
                {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Kelurahan</label>
              <select
                value={form.village}
                disabled={!selectedDistrictId}
                onChange={(e) => setForm(prev => ({ ...prev, village: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:ring-1 focus:ring-black text-sm bg-white appearance-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                required
              >
                <option value="">Pilih Kelurahan</option>
                {villages.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Kode Pos</label>
              <input
                value={form.postalCode}
                onChange={(event) => setForm((prev) => ({ ...prev, postalCode: event.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:ring-1 focus:ring-black text-sm bg-white"
                placeholder="Contoh: 12345"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="mt-4 bg-black text-white px-8 py-2.5 rounded-md hover:bg-gray-800 transition-all self-start disabled:opacity-50 flex items-center gap-2 font-medium"
          >
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</> : "Simpan Alamat"}
          </button>
        </form>
      </div>
    </div>
  );
}
