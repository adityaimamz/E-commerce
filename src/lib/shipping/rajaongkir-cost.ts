export async function getShippingCost(payload: {
  origin: string;
  destination: string;
  weight: number;
  courier: string;
}) {
  const res = await fetch(
    `${process.env.RAJAONGKIR_COST_BASE_URL}/calculate`,
    {
      method: "POST",
      headers: {
        key: process.env.RAJAONGKIR_COST_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to fetch shipping cost");
  }

  return res.json();
}
