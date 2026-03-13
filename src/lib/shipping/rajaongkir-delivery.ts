const DEFAULT_SANDBOX_BASE_URL = "https://api-sandbox.collaborator.komerce.id";

type QueryValue = string | number | undefined | null;
type QueryParams = Record<string, QueryValue>;

const getDeliveryBaseUrl = () => {
  const configuredBaseUrl = process.env.RAJAONGKIR_DELIVERY_BASE_URL || DEFAULT_SANDBOX_BASE_URL;

  // Accept both raw host and legacy '/api/v1' config values.
  return configuredBaseUrl.replace(/\/api\/v1\/?$/, "").replace(/\/$/, "");
};

const appendQueryParams = (
  url: URL,
  query?: QueryParams
) => {
  for (const [key, value] of Object.entries(query || {})) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }
};

const getCandidateApiKeys = (preferred?: string) => {
  const keys = [
    preferred,
    process.env.RAJAONGKIR_DELIVERY_API_KEY,
    process.env.RAJAONGKIR_COST_API_KEY,
    process.env.RAJAONGKIR_API_KEY,
  ].filter((value): value is string => Boolean(value));

  return Array.from(new Set(keys));
};

const tryParseJson = (value: string) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const extractJsonCandidate = (rawText: string) => {
  const objectStart = rawText.indexOf("{");
  const objectEnd = rawText.lastIndexOf("}");
  if (objectStart !== -1 && objectEnd !== -1 && objectEnd > objectStart) {
    return rawText.slice(objectStart, objectEnd + 1);
  }

  const arrayStart = rawText.indexOf("[");
  const arrayEnd = rawText.lastIndexOf("]");
  if (arrayStart !== -1 && arrayEnd !== -1 && arrayEnd > arrayStart) {
    return rawText.slice(arrayStart, arrayEnd + 1);
  }

  return "";
};

const parseApiPayload = (rawText: string) => {
  if (!rawText) return null;

  const parsedDirect = tryParseJson(rawText);
  if (parsedDirect !== null) return parsedDirect;

  const candidate = extractJsonCandidate(rawText);
  if (!candidate) return null;

  return tryParseJson(candidate);
};

const requestDeliveryApi = async (
  endpoint: string,
  options?: {
    method?: "GET" | "POST";
    body?: Record<string, unknown>;
    query?: QueryParams;
    apiKey?: string;
  }
) => {
  const apiKeys = getCandidateApiKeys(options?.apiKey);
  if (apiKeys.length === 0) {
    throw new Error("RajaOngkir API key is not configured");
  }

  const url = new URL(`${getDeliveryBaseUrl()}${endpoint}`);
  appendQueryParams(url, options?.query);

  let lastErrorMessage = "Delivery API request failed";

  for (const apiKey of apiKeys) {
    const res = await fetch(url.toString(), {
      method: options?.method || "GET",
      headers: {
        "x-api-key": apiKey,
        key: apiKey,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: options?.body ? JSON.stringify(options.body) : undefined,
    });

    const rawText = await res.text();
    const json = parseApiPayload(rawText);
    const message =
      json?.message ||
      json?.meta?.message ||
      json?.error ||
      rawText?.trim() ||
      "Delivery API request failed";

    if (res.ok) {
      return json ?? { raw: rawText };
    }

    lastErrorMessage = message;

    const retryable =
      res.status === 401 ||
      res.status === 403 ||
      message.toLowerCase().includes("invalid api key") ||
      message.toLowerCase().includes("key not found");

    if (!retryable) {
      throw new Error(message);
    }
  }

  throw new Error(lastErrorMessage || "Delivery API request failed");
};

const requestWithEndpointFallback = async (
  endpoints: string[],
  options: {
    method?: "GET" | "POST";
    body?: Record<string, unknown>;
    query?: QueryParams;
  }
) => {
  let lastError: Error | null = null;

  for (const endpoint of endpoints) {
    try {
      return await requestDeliveryApi(endpoint, options);
    } catch (error: any) {
      const message = (error?.message || "").toLowerCase();
      const isNotFound = message.includes("404") || message.includes("not found");

      if (!isNotFound) {
        throw error;
      }

      lastError = error;
    }
  }

  if (lastError) {
    throw lastError;
  }

  throw new Error("Delivery API request failed");
};

export async function searchDestination(keyword: string) {
  return requestWithEndpointFallback([
    "/order/api/v1/destination/search",
    "/tariff/api/v1/destination/search",
  ], {
    method: "GET",
    query: { keyword },
  });
}

export async function calculateDelivery(payload: {
  origin: string;
  destination: string;
  weight: number;
  courier: string;
}) {
  return requestWithEndpointFallback([
    "/order/api/v1/calculate",
    "/tariff/api/v1/calculate",
    "/tariff/api/v1/calculate/domestic-cost",
  ], {
    method: "POST",
    body: payload,
  });
}

export async function createDeliveryOrder(payload: Record<string, unknown>) {
  return requestDeliveryApi("/order/api/v1/orders", {
    method: "POST",
    body: payload,
  });
}

export async function generateDeliveryLabel(payload: Record<string, unknown>) {
  return requestDeliveryApi("/order/api/v1/label-order", {
    method: "POST",
    body: payload,
  });
}

export async function getDeliveryAwbHistory(shipping: string, airwayBill: string) {
  return requestDeliveryApi("/order/api/v1/orders/history-airway-bill", {
    method: "GET",
    query: {
      shipping,
      airway_bill: airwayBill,
    },
  });
}

// Backward-compatible aliases used by existing route handlers.
export const createShipment = createDeliveryOrder;
export const trackWaybill = getDeliveryAwbHistory;
