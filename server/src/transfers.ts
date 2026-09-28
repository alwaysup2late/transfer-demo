import { randomUUID } from "node:crypto";
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
  private readonly idempotencyKeys = new Map<string, Transfer>();

  constructor(private readonly payout: PayoutProvider) {}

  async create(input: CreateTransferInput): Promise<Transfer> {
    // Return the existing transfer if this request has already been processed
    if (input.idempotencyKey) {
      const existing = this.idempotencyKeys.get(input.idempotencyKey);
      if (existing) {
        return existing;
      }
    }

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
      // Don't fail the whole request if the payout provider is unavailable,
      // the transfer stays pending and can be retried later
      console.log("Payout failed, transfer will remain pending", err);
    }

    this.transfers.set(transfer.id, transfer);
    if (input.idempotencyKey) {
      this.idempotencyKeys.set(input.idempotencyKey, transfer);
    }

    return transfer;
  }

  get(id: string): Transfer | undefined {
    return this.transfers.get(id);
  }
}
