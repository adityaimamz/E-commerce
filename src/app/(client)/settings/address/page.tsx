"use client";

import { useEffect, useState } from "react";
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
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AddressForm>(initialForm);
  const [isDefault, setIsDefault] = useState(false);

  const [provinces, setProvinces] = useState<LocationItem[]>([]);
  const [cities, setCities] = useState<LocationItem[]>([]);
  const [districts, setDistricts] = useState<LocationItem[]>([]);
  const [villages, setVillages] = useState<LocationItem[]>([]);

  const [selectedProvinceId, setSelectedProvinceId] = useState("");
  const [selectedCityId, setSelectedCityId] = useState("");
  const [selectedDistrictId, setSelectedDistrictId] = useState("");
  const [selectedVillageId, setSelectedVillageId] = useState("");

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
      if (json.success) {
        setProvinces(json.data);
        return json.data as LocationItem[];
      }
    } catch (error) {
      console.error("Failed to fetch provinces", error);
    }

    return [] as LocationItem[];
  };

  const fetchCities = async (provinceId: string) => {
    try {
      const res = await fetch(`/api/locations/cities?provinceId=${provinceId}`);
      const json = await res.json();
      if (json.success) {
        setCities(json.data);
        return json.data as LocationItem[];
      }
    } catch (error) {
      console.error("Failed to fetch cities", error);
    }

    setCities([]);
    return [] as LocationItem[];
  };

  const fetchDistricts = async (cityId: string) => {
    try {
      const res = await fetch(`/api/locations/districts?cityId=${cityId}`);
      const json = await res.json();
      if (json.success) {
        setDistricts(json.data);
        return json.data as LocationItem[];
      }
    } catch (error) {
      console.error("Failed to fetch districts", error);
    }

    setDistricts([]);
    return [] as LocationItem[];
  };

  const fetchVillages = async (districtId: string) => {
    try {
      const res = await fetch(`/api/locations/villages?districtId=${districtId}`);
      const json = await res.json();
      if (json.success) {
        setVillages(json.data);
        return json.data as LocationItem[];
      }
    } catch (error) {
      console.error("Failed to fetch villages", error);
    }

    setVillages([]);
    return [] as LocationItem[];
  };

  useEffect(() => {
    loadAddresses();
    fetchProvinces();
  }, []);

  const resetFormMode = () => {
    setEditingId(null);
    setForm(initialForm);
    setIsDefault(false);
    setSelectedProvinceId("");
    setSelectedCityId("");
    setSelectedDistrictId("");
    setSelectedVillageId("");
    setCities([]);
    setDistricts([]);
    setVillages([]);
  };

  const handleSubmit = async (event: { preventDefault: () => void }) => {
    event.preventDefault();
    setSaving(true);

    try {
      const isEditing = Boolean(editingId);
      const endpoint = isEditing ? `/api/addresses/${editingId}` : "/api/addresses";
      const method = isEditing ? "PUT" : "POST";
      const shouldBeDefault = isEditing ? isDefault : isDefault || addresses.length === 0;

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, isDefault: shouldBeDefault }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(
          json.message || (isEditing ? "Gagal memperbarui alamat" : "Gagal menyimpan alamat")
        );
      }

      toast.success(isEditing ? "Alamat berhasil diperbarui" : "Alamat tersimpan");
      resetFormMode();
      await loadAddresses();
    } catch (error: any) {
      toast.error(error.message || "Gagal menyimpan alamat");
    } finally {
      setSaving(false);
    }
  };

  const handleProvinceChange = async (provinceId: string) => {
    const selectedProvince = provinces.find((item) => item.id === provinceId);

    setSelectedProvinceId(provinceId);
    setSelectedCityId("");
    setSelectedDistrictId("");
    setSelectedVillageId("");
    setDistricts([]);
    setVillages([]);
    setForm((prev) => ({
      ...prev,
      province: selectedProvince?.name || "",
      city: "",
      district: "",
      village: "",
    }));

    if (provinceId) {
      await fetchCities(provinceId);
    } else {
      setCities([]);
    }
  };

  const handleCityChange = async (cityId: string) => {
    const selectedCity = cities.find((item) => item.id === cityId);

    setSelectedCityId(cityId);
    setSelectedDistrictId("");
    setSelectedVillageId("");
    setVillages([]);
    setForm((prev) => ({
      ...prev,
      city: selectedCity?.name || "",
      district: "",
      village: "",
    }));

    if (cityId) {
      await fetchDistricts(cityId);
    } else {
      setDistricts([]);
    }
  };

  const handleDistrictChange = async (districtId: string) => {
    const selectedDistrict = districts.find((item) => item.id === districtId);

    setSelectedDistrictId(districtId);
    setSelectedVillageId("");
    setForm((prev) => ({
      ...prev,
      district: selectedDistrict?.name || "",
      village: "",
    }));

    if (districtId) {
      await fetchVillages(districtId);
    } else {
      setVillages([]);
    }
  };

  const handleVillageChange = (villageId: string) => {
    const selectedVillage = villages.find((item) => item.id === villageId);
    setSelectedVillageId(villageId);
    setForm((prev) => ({ ...prev, village: selectedVillage?.name || "" }));
  };

  const normalize = (value: string) => value.trim().toLowerCase();

  const handleStartEdit = async (address: Address) => {
    setEditingId(address.id);
    setIsDefault(address.isDefault);
    setForm({
      recipientName: address.recipientName,
      phone: address.phone,
      addressLine: address.addressLine,
      province: address.province,
      city: address.city,
      district: address.district || "",
      village: address.village || "",
      postalCode: address.postalCode,
      country: address.country,
    });

    const loadedProvinces = provinces.length > 0 ? provinces : await fetchProvinces();
    const selectedProvince = loadedProvinces.find(
      (item) => normalize(item.name) === normalize(address.province)
    );

    if (!selectedProvince) {
      setSelectedProvinceId("");
      setSelectedCityId("");
      setSelectedDistrictId("");
      setSelectedVillageId("");
      setCities([]);
      setDistricts([]);
      setVillages([]);
      return;
    }

    setSelectedProvinceId(selectedProvince.id);
    const loadedCities = await fetchCities(selectedProvince.id);
    const selectedCity = loadedCities.find(
      (item) => normalize(item.name) === normalize(address.city)
    );

    if (!selectedCity) {
      setSelectedCityId("");
      setSelectedDistrictId("");
      setSelectedVillageId("");
      setDistricts([]);
      setVillages([]);
      return;
    }

    setSelectedCityId(selectedCity.id);
    const loadedDistricts = await fetchDistricts(selectedCity.id);
    const selectedDistrict = loadedDistricts.find(
      (item) => normalize(item.name) === normalize(address.district || "")
    );

    if (!selectedDistrict) {
      setSelectedDistrictId("");
      setSelectedVillageId("");
      setVillages([]);
      return;
    }

    setSelectedDistrictId(selectedDistrict.id);
    const loadedVillages = await fetchVillages(selectedDistrict.id);
    const selectedVillage = loadedVillages.find(
      (item) => normalize(item.name) === normalize(address.village || "")
    );

    if (!selectedVillage) {
      setSelectedVillageId("");
      return;
    }

    setSelectedVillageId(selectedVillage.id);
    setForm((prev) => ({ ...prev, village: selectedVillage.name }));
  };

  const handleCancelEdit = () => {
    resetFormMode();
  };

  const handleDeleteAddress = async (addressId: string) => {
    const confirmed = globalThis.confirm("Hapus alamat ini?");
    if (!confirmed) {
      return;
    }

    setDeletingId(addressId);
    try {
      const res = await fetch(`/api/addresses/${addressId}`, {
        method: "DELETE",
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal menghapus alamat");
      }

      toast.success("Alamat berhasil dihapus");
      if (editingId === addressId) {
        handleCancelEdit();
      }
      await loadAddresses();
    } catch (error: any) {
      toast.error(error.message || "Gagal menghapus alamat");
    } finally {
      setDeletingId(null);
    }
  };

  let addressListContent = (
    <div className="flex flex-col gap-3">
      {addresses.map((address) => (
        <div key={address.id} className="border border-gray-200 rounded-md p-3 text-sm hover:border-black transition-colors">
          <div className="font-medium flex items-center justify-between">
            <span className="flex items-center gap-2">
              {address.recipientName}
              {address.isDefault && <span className="text-[10px] bg-black text-white px-1.5 py-0.5 rounded leading-none uppercase font-bold tracking-tight">Default</span>}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleStartEdit(address)}
                className="text-xs text-blue-600 hover:underline"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => handleDeleteAddress(address.id)}
                disabled={deletingId === address.id}
                className="text-xs text-red-500 hover:underline disabled:opacity-50"
              >
                {deletingId === address.id ? "Menghapus..." : "Hapus"}
              </button>
            </div>
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
  );

  if (loading) {
    addressListContent = (
      <div className="flex justify-center p-4">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  } else if (addresses.length === 0) {
    addressListContent = (
      <p className="text-sm text-gray-500 text-center py-8">Belum ada alamat tersimpan.</p>
    );
  }

  const submitButtonLabel = editingId ? "Update Alamat" : "Simpan Alamat";

  return (
    <div className="p-6 flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold mb-1">Alamat Pengiriman</h1>
        <p className="text-sm text-gray-500">Alamat lengkap memudahkan kurir mencari lokasi Anda.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="border border-gray-200 rounded-lg p-5">
          <h2 className="font-medium mb-4">Daftar Alamat</h2>
          {addressListContent}
        </div>

        <form className="flex flex-col gap-4 border border-gray-200 rounded-lg p-6 bg-gray-50/50" onSubmit={handleSubmit}>
          <h2 className="font-semibold text-lg mb-2">
            {editingId ? "Edit Alamat" : "Tambah Alamat Baru"}
          </h2>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="new-recipient-name" className="text-xs font-medium text-gray-600">Nama Penerima</label>
              <input
                id="new-recipient-name"
                value={form.recipientName}
                onChange={(event) => setForm((prev) => ({ ...prev, recipientName: event.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:ring-1 focus:ring-black text-sm bg-white"
                placeholder="Contoh: Budi Santoso"
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="new-phone" className="text-xs font-medium text-gray-600">No. HP</label>
              <input
                id="new-phone"
                value={form.phone}
                onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:ring-1 focus:ring-black text-sm bg-white"
                placeholder="0812xxxx"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="new-address-line" className="text-xs font-medium text-gray-600">Alamat Lengkap (Jalan, No Rumah, RT/RW)</label>
            <textarea
              id="new-address-line"
              value={form.addressLine}
              onChange={(event) => setForm((prev) => ({ ...prev, addressLine: event.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:ring-1 focus:ring-black text-sm bg-white min-h-[80px]"
              placeholder="Jl. Merdeka No. 10..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="new-province" className="text-xs font-medium text-gray-600">Provinsi</label>
              <select
                id="new-province"
                value={selectedProvinceId}
                onChange={(event) => {
                  void handleProvinceChange(event.target.value);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:ring-1 focus:ring-black text-sm bg-white"
                required
              >
                <option value="">Pilih Provinsi</option>
                {provinces.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="new-city" className="text-xs font-medium text-gray-600">Kota/Kabupaten</label>
              <select
                id="new-city"
                value={selectedCityId}
                disabled={!selectedProvinceId}
                onChange={(event) => {
                  void handleCityChange(event.target.value);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:ring-1 focus:ring-black text-sm bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                required
              >
                <option value="">Pilih Kota/Kabupaten</option>
                {cities.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="new-district" className="text-xs font-medium text-gray-600">Kecamatan</label>
              <select
                id="new-district"
                value={selectedDistrictId}
                disabled={!selectedCityId}
                onChange={(event) => {
                  void handleDistrictChange(event.target.value);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:ring-1 focus:ring-black text-sm bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                required
              >
                <option value="">Pilih Kecamatan</option>
                {districts.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="new-village" className="text-xs font-medium text-gray-600">Kelurahan</label>
              <select
                id="new-village"
                value={selectedVillageId}
                disabled={!selectedDistrictId}
                onChange={(event) => {
                  handleVillageChange(event.target.value);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:ring-1 focus:ring-black text-sm bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                required
              >
                <option value="">Pilih Kelurahan</option>
                {villages.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 items-end">
            <div className="flex flex-col gap-1">
              <label htmlFor="new-postal-code" className="text-xs font-medium text-gray-600">Kode Pos</label>
              <input
                id="new-postal-code"
                value={form.postalCode}
                onChange={(event) => setForm((prev) => ({ ...prev, postalCode: event.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:ring-1 focus:ring-black text-sm bg-white"
                placeholder="Contoh: 12345"
                required
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700 pb-2">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(event) => setIsDefault(event.target.checked)}
              />
              <span>Jadikan alamat default</span>
            </label>
          </div>

          <div className="flex items-center gap-3 mt-4">
            <button
              type="submit"
              disabled={saving}
              className="bg-black text-white px-8 py-2.5 rounded-md hover:bg-gray-800 transition-all disabled:opacity-50 flex items-center gap-2 font-medium"
            >
              {saving ? (
                <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Menyimpan...</span>
              ) : submitButtonLabel}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-6 py-2.5 rounded-md border border-gray-300 hover:bg-gray-50 transition-all"
              >
                Batal
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
