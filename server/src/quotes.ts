import { randomUUID } from "node:crypto";
import { calculateFeeMinor } from "./fees.js";
import { convertMinor, formatScaledRate, SEND_CURRENCY, type ReceiveCurrency } from "./money.js";
import { getUsdRate } from "./rates.js";

export const QUOTE_TTL_MS = 10 * 60 * 1000;

export interface Quote {
  id: string;
  sendAmountMinor: number;
  sendCurrency: typeof SEND_CURRENCY;
  receiveCurrency: ReceiveCurrency;
  receiveAmountMinor: number;
  feeMinor: number;
  totalMinor: number;
  rate: string;
  createdAt: string;
  expiresAt: string;
}

export interface CreateQuoteInput {
  sendAmountMinor: number;
  receiveCurrency: ReceiveCurrency;
}

export interface QuoteServiceOptions {
  now?: () => Date;
  newId?: () => string;
}

export class QuoteService {
  private readonly quotes = new Map<string, Quote>();
  private readonly now: () => Date;
  private readonly newId: () => string;

  constructor(options: QuoteServiceOptions = {}) {
    this.now = options.now ?? (() => new Date());
    this.newId = options.newId ?? randomUUID;
  }

  create(input: CreateQuoteInput): Quote {
    const rate = getUsdRate(input.receiveCurrency);
    const feeMinor = calculateFeeMinor(input.sendAmountMinor);
    const createdAt = this.now();

    const quote: Quote = {
      id: this.newId(),
      sendAmountMinor: input.sendAmountMinor,
      sendCurrency: SEND_CURRENCY,
      receiveCurrency: input.receiveCurrency,
      receiveAmountMinor: convertMinor(input.sendAmountMinor, SEND_CURRENCY, input.receiveCurrency, rate),
      feeMinor,
      totalMinor: input.sendAmountMinor + feeMinor,
      rate: formatScaledRate(rate),
      createdAt: createdAt.toISOString(),
      expiresAt: new Date(createdAt.getTime() + QUOTE_TTL_MS).toISOString(),
    };

    this.quotes.set(quote.id, quote);
    return quote;
  }

  get(id: string): Quote | undefined {
    return this.quotes.get(id);
  }

  isExpired(quote: Quote): boolean {
    return this.now().getTime() >= Date.parse(quote.expiresAt);
  }
}
