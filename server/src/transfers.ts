import { randomUUID } from "node:crypto";
import { HttpError } from "./errors.js";
import type { PayoutProvider } from "./payout.js";
import type { Quote } from "./quotes.js";

export type TransferStatus = "pending" | "submitted";

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
  receiveCurrency: string;
  recipient: Recipient;
  status: TransferStatus;
  payoutReference?: string;
  createdAt: string;
}

export interface CreateTransferInput {
  quote: Quote;
  sendAmountMinor: number;
  feeMinor: number;
  recipient: Recipient;
  idempotencyKey?: string;
}

export class TransferService {
  private readonly transfers = new Map<string, Transfer>();
  private readonly idempotencyKeys = new Map<string, { fingerprint: string; result: Promise<Transfer> }>();

  constructor(private readonly payout: PayoutProvider) {}

  async create(input: CreateTransferInput): Promise<Transfer> {
    const key = input.idempotencyKey;
    if (!key) {
      return this.process(input);
    }

    // The key is recorded before the payout call, so a concurrent duplicate
    // waits for the first request instead of paying out twice
    const fingerprint = JSON.stringify([input.quote.id, input.recipient.name, input.recipient.accountNumber]);
    const existing = this.idempotencyKeys.get(key);
    if (existing) {
      if (existing.fingerprint !== fingerprint) {
        throw new HttpError(409, "idempotency_key_reused", "Idempotency key was already used for a different request");
      }
      return existing.result;
    }

    const result = this.process(input);
    this.idempotencyKeys.set(key, { fingerprint, result });
    try {
      return await result;
    } catch (err) {
      // A failed attempt must not block a retry with the same key
      this.idempotencyKeys.delete(key);
      throw err;
    }
  }

  private async process(input: CreateTransferInput): Promise<Transfer> {
    const transfer: Transfer = {
      id: randomUUID(),
      quoteId: input.quote.id,
      sendAmountMinor: input.sendAmountMinor,
      feeMinor: input.feeMinor,
      totalMinor: input.sendAmountMinor + input.feeMinor,
      receiveAmountMinor: Math.round(input.sendAmountMinor * parseFloat(input.quote.rate)),
      receiveCurrency: input.quote.receiveCurrency,
      recipient: input.recipient,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    try {
      transfer.payoutReference = await this.payout.submit({
        transferId: transfer.id,
        receiveAmountMinor: transfer.receiveAmountMinor,
        receiveCurrency: transfer.receiveCurrency,
        recipientName: transfer.recipient.name,
        accountNumber: transfer.recipient.accountNumber,
      });
      transfer.status = "submitted";
    } catch (err) {
      // Nothing is stored, so a retry with the same idempotency key tries the payout again
      console.error("Payout failed", err);
      throw new HttpError(502, "payout_failed", "The payout could not be completed. Please try again.");
    }

    this.transfers.set(transfer.id, transfer);
    return transfer;
  }

  get(id: string): Transfer | undefined {
    return this.transfers.get(id);
  }
}
