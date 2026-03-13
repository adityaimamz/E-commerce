"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Loader2, Store, MapPin, Phone, Save } from "lucide-react";

type LocationItem = {
  id: string;
  name: string;
};

const isSameId = (left: string | number | null | undefined, right: string | number | null | undefined) => {
  if (left == null || right == null) return false;
  return String(left) === String(right);
};

type StoreSettings = {
  shopName: string;
  phone: string;
  address: string;
  province: string;
  city: string;
  district: string;
  village: string;
  provinceId: string;
  cityId: string;
  districtId: string;
  subDistrictId: string;
  postalCode: string;
  originId: string;
};

const initialSettings: StoreSettings = {
  shopName: "",
  phone: "",
  address: "",
  province: "",
  city: "",
  district: "",
  village: "",
  provinceId: "",
  cityId: "",
  districtId: "",
  subDistrictId: "",
  postalCode: "",
  originId: "501",
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<StoreSettings>(initialSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [provinces, setProvinces] = useState<LocationItem[]>([]);
  const [cities, setCities] = useState<LocationItem[]>([]);
  const [districts, setDistricts] = useState<LocationItem[]>([]);
  const [villages, setVillages] = useState<LocationItem[]>([]);

  const [selectedProvinceId, setSelectedProvinceId] = useState("");
  const [selectedCityId, setSelectedCityId] = useState("");
  const [selectedDistrictId, setSelectedDistrictId] = useState("");
  const [selectedVillageId, setSelectedVillageId] = useState("");

  const fetchProvinces = async () => {
    try {
      const res = await fetch("/api/locations/provinces");
      const json = await res.json();
      if (json.success) setProvinces(json.data);
    } catch (error) {
      console.error("Failed to fetch provinces", error);
    }
  };

  const fetchCities = async (provinceId: string) => {
    try {
      const res = await fetch(`/api/locations/cities?provinceId=${provinceId}`);
      const json = await res.json();
      if (json.success) setCities(json.data);
    } catch (error) {
      console.error("Failed to fetch cities", error);
    }
  };

  const fetchDistricts = async (cityId: string) => {
    try {
      const res = await fetch(`/api/locations/districts?cityId=${cityId}`);
      const json = await res.json();
      if (json.success) setDistricts(json.data);
    } catch (error) {
      console.error("Failed to fetch districts", error);
    }
  };

  const fetchVillages = async (districtId: string) => {
    try {
      const res = await fetch(`/api/locations/sub-districts?districtId=${districtId}`);
      const json = await res.json();
      if (json.success) setVillages(json.data);
    } catch (error) {
      console.error("Failed to fetch villages", error);
    }
  };

  const loadSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings");
      const json = await res.json();

      if (json.success && json.data) {
        setSettings({
          ...initialSettings,
          ...json.data,
        });

        // Prefer saved IDs if available to avoid guessing by name.
        if (json.data.provinceId) setSelectedProvinceId(json.data.provinceId);
        if (json.data.cityId) setSelectedCityId(json.data.cityId);
        if (json.data.districtId) setSelectedDistrictId(json.data.districtId);
        if (json.data.subDistrictId) setSelectedVillageId(json.data.subDistrictId);
        
        // Try to match IDs for dropdowns based on names
        const loadedProvinces = await fetch("/api/locations/provinces").then(r => r.json()).then(j => j.data as LocationItem[]);
        setProvinces(loadedProvinces);
        
        const prov =
          loadedProvinces.find(p => isSameId(p.id, json.data.provinceId)) ||
          loadedProvinces.find(p => p.name.toLowerCase() === json.data.province?.toLowerCase());
        if (prov) {
          setSelectedProvinceId(String(prov.id));
          const loadedCities = await fetch(`/api/locations/cities?provinceId=${prov.id}`).then(r => r.json()).then(j => j.data as LocationItem[]);
          setCities(loadedCities);
          
          const ct =
            loadedCities.find(c => isSameId(c.id, json.data.cityId)) ||
            loadedCities.find(c => c.name.toLowerCase() === json.data.city?.toLowerCase());
          if (ct) {
            setSelectedCityId(String(ct.id));
            const loadedDistricts = await fetch(`/api/locations/districts?cityId=${ct.id}`).then(r => r.json()).then(j => j.data as LocationItem[]);
            setDistricts(loadedDistricts);
            
            const dist =
              loadedDistricts.find(d => isSameId(d.id, json.data.districtId)) ||
              loadedDistricts.find(d => d.name.toLowerCase() === json.data.district?.toLowerCase());
            if (dist) {
              setSelectedDistrictId(String(dist.id));
              const loadedVillages = await fetch(`/api/locations/sub-districts?districtId=${dist.id}`).then(r => r.json()).then(j => j.data as LocationItem[]);
              setVillages(loadedVillages);
              
              const vill =
                loadedVillages.find(v => isSameId(v.id, json.data.subDistrictId)) ||
                loadedVillages.find(v => v.name.toLowerCase() === json.data.village?.toLowerCase());
              if (vill) setSelectedVillageId(String(vill.id));
            }
          }
        }
      }
    } catch (error) {
      console.error("Failed to load settings", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Gagal menyimpan pengaturan");

      toast.success("Pengaturan toko berhasil diperbarui");
      setSettings(json.data);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleProvinceChange = async (id: string) => {
    const name = provinces.find(p => isSameId(p.id, id))?.name || "";
    setSelectedProvinceId(id);
    setSelectedCityId("");
    setSelectedDistrictId("");
    setSelectedVillageId("");
    setCities([]);
    setDistricts([]);
    setVillages([]);
    setSettings(prev => ({
      ...prev,
      province: name,
      provinceId: id,
      city: "",
      cityId: "",
      district: "",
      districtId: "",
      village: "",
      subDistrictId: "",
      originId: "501",
    }));
    if (id) await fetchCities(id);
  };

  const handleCityChange = async (id: string) => {
    const name = cities.find(c => isSameId(c.id, id))?.name || "";
    setSelectedCityId(id);
    setSelectedDistrictId("");
    setSelectedVillageId("");
    setDistricts([]);
    setVillages([]);
    setSettings(prev => ({
      ...prev,
      city: name,
      cityId: id,
      district: "",
      districtId: "",
      village: "",
      subDistrictId: "",
      originId: "501",
    }));
    if (id) await fetchDistricts(id);
  };

  const handleDistrictChange = async (id: string) => {
    const name = districts.find(d => isSameId(d.id, id))?.name || "";
    setSelectedDistrictId(id);
    setSelectedVillageId("");
    setVillages([]);
    setSettings(prev => ({
      ...prev,
      district: name,
      districtId: id,
      village: "",
      subDistrictId: "",
      originId: id,
    }));
    if (id) await fetchVillages(id);
  };

  const handleVillageChange = (id: string) => {
    const name = villages.find(v => isSameId(v.id, id))?.name || "";
    setSelectedVillageId(id);
    setSettings(prev => ({ ...prev, village: name, subDistrictId: id }));
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Store className="w-6 h-6" />
          Pengaturan Toko
        </h1>
        <p className="text-muted-foreground mt-2">Atur identitas dan alamat asal pengiriman toko Anda.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-xl border border-gray-100 shadow-sm">
        {/* Basic Info */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
            <Phone className="w-4 h-4" /> Informasi Dasar
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Nama Toko</label>
              <input
                value={settings.shopName || ""}
                onChange={e => setSettings(p => ({ ...p, shopName: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md outline-none focus:ring-1 focus:ring-black text-sm"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">No. Telepon Toko</label>
              <input
                value={settings.phone || ""}
                onChange={e => setSettings(p => ({ ...p, phone: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md outline-none focus:ring-1 focus:ring-black text-sm"
                required
              />
            </div>
          </div>
        </section>

        {/* Address */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
            <MapPin className="w-4 h-4" /> Alamat Asal Pengiriman (Origin)
          </h2>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Alamat Lengkap</label>
            <textarea
              value={settings.address || ""}
              onChange={e => setSettings(p => ({ ...p, address: e.target.value }))}
              className="w-full px-3 py-2 border rounded-md outline-none focus:ring-1 focus:ring-black text-sm min-h-[80px]"
              placeholder="Jl. Raya Utama No. 123..."
              required
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Provinsi</label>
              <select
                value={selectedProvinceId}
                onChange={e => handleProvinceChange(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm outline-none bg-white"
                required
              >
                <option value="">Pilih Provinsi</option>
                {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Kota/Kabupaten</label>
              <select
                value={selectedCityId}
                onChange={e => handleCityChange(e.target.value)}
                disabled={!selectedProvinceId}
                className="w-full px-3 py-2 border rounded-md text-sm outline-none bg-white disabled:bg-gray-50"
                required
              >
                <option value="">Pilih Kota/Kabupaten</option>
                {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Kecamatan</label>
              <select
                value={selectedDistrictId}
                onChange={e => handleDistrictChange(e.target.value)}
                disabled={!selectedCityId}
                className="w-full px-3 py-2 border rounded-md text-sm outline-none bg-white disabled:bg-gray-50"
                required
              >
                <option value="">Pilih Kecamatan</option>
                {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Kelurahan</label>
              <select
                value={selectedVillageId}
                onChange={e => handleVillageChange(e.target.value)}
                disabled={!selectedDistrictId}
                className="w-full px-3 py-2 border rounded-md text-sm outline-none bg-white disabled:bg-gray-50"
                required
              >
                <option value="">Pilih Kelurahan</option>
                {villages.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Kode Pos</label>
              <input
                value={settings.postalCode || ""}
                onChange={e => setSettings(p => ({ ...p, postalCode: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md outline-none focus:ring-1 focus:ring-black text-sm"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Komerce Origin ID (Auto-resolved)</label>
              <input
                value={settings.originId || ""}
                readOnly
                className="w-full px-3 py-2 border rounded-md bg-gray-50 text-gray-400 text-sm outline-none"
              />
              <p className="text-[10px] text-gray-400">ID ini akan diperbarui otomatis saat Anda menyimpan alamat baru.</p>
            </div>
          </div>
        </section>

        <div className="flex justify-end pt-4 border-t">
          <button
            type="submit"
            disabled={saving}
            className="bg-black text-white px-8 py-2.5 rounded-lg hover:bg-gray-800 transition-all flex items-center gap-2 font-semibold disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Simpan Pengaturan
          </button>
        </div>
      </form>
    </div>
  );
}
