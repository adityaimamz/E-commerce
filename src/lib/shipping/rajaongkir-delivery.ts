export async function createShipment(payload: any) {
  const res = await fetch(
    `${process.env.RAJAONGKIR_DELIVERY_BASE_URL}/shipment/create`,
    {
      method: "POST",
      headers: {
        key: process.env.RAJAONGKIR_DELIVERY_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to create shipment");
  }

  return res.json();
}
