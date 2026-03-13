export async function getShippingCost(payload: {
  origin: string;
  destination: string;
  weight: number;
  courier: string;
  price?: string;
}) {
  const apiKey = process.env.RAJAONGKIR_COST_API_KEY || process.env.RAJAONGKIR_API_KEY;
  const baseUrl = process.env.RAJAONGKIR_KOMERCE_API_URL || "https://rajaongkir.komerce.id/api/v1";

  if (!apiKey) {
    throw new Error("RajaOngkir API Key tidak dikonfigurasi");
  }

  const formData = new URLSearchParams();
  formData.append("origin", payload.origin);
  formData.append("destination", payload.destination);
  formData.append("weight", payload.weight.toString());
  formData.append("courier", payload.courier);
  formData.append("price", payload.price || "lowest");

  const res = await fetch(`${baseUrl}/calculate/district/domestic-cost`, {
    method: "POST",
    headers: {
      key: apiKey,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formData.toString(),
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json?.meta?.message || json?.message || "Gagal mengambil tarif ongkir");
  }

  return json;
}
