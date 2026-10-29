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

export interface Recipient {
  name: string;
  accountNumber: string;
}

export interface Transfer {
  id: string;
  quoteId: string;
  sendAmountMinor: number;
  feeMinor: number;
  totalMinor: number;
  receiveAmountMinor: number;
  receiveCurrency: ReceiveCurrency;
  recipient: Recipient;
  status: "pending" | "submitted";
  payoutReference?: string;
  createdAt: string;
}

export function createTransfer(quote: Quote, recipient: Recipient, idempotencyKey: string): Promise<Transfer> {
  return requestJson<Transfer>("/api/transfers", {
    method: "POST",
    headers: { "Idempotency-Key": idempotencyKey },
    body: JSON.stringify({
      quoteId: quote.id,
      sendAmountMinor: quote.sendAmountMinor,
      feeMinor: quote.feeMinor,
      recipient,
    }),
  });
}
