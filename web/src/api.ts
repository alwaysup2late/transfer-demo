export const RECEIVE_CURRENCIES = ["EUR", "GBP", "MXN", "JPY"] as const;
export type ReceiveCurrency = (typeof RECEIVE_CURRENCIES)[number];

export interface Quote {
  id: string;
  sendAmountMinor: number;
  sendCurrency: "USD";
  receiveCurrency: ReceiveCurrency;
  receiveAmountMinor: number;
  feeMinor: number;
  totalMinor: number;
  rate: string;
  createdAt: string;
  expiresAt: string;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(res.status, body?.error?.code ?? "unknown_error", body?.error?.message ?? res.statusText);
  }
  return body as T;
}

export function createQuote(sendAmountMinor: number, receiveCurrency: ReceiveCurrency): Promise<Quote> {
  return requestJson<Quote>("/api/quotes", {
    method: "POST",
    body: JSON.stringify({ sendAmountMinor, sendCurrency: "USD", receiveCurrency }),
  });
}
