import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Transfer } from "../src/api";
import { TransferConfirmation } from "../src/components/TransferConfirmation";

const transfer: Transfer = {
  id: "transfer-1",
  quoteId: "quote-1",
  sendAmountMinor: 250_00,
  feeMinor: 4_99,
  totalMinor: 254_99,
  receiveAmountMinor: 4_313_50,
  receiveCurrency: "MXN",
  recipient: { name: "Maria Lopez", accountNumber: "12345678" },
  status: "submitted",
  payoutReference: "PAY-TRANSFER",
  createdAt: "2026-01-15T12:01:00.000Z",
};

describe("TransferConfirmation", () => {
  it("formats the amounts with the currency", () => {
    render(<TransferConfirmation transfer={transfer} onDone={vi.fn()} />);

    expect(screen.getByText("$254.99")).toBeInTheDocument();
    expect(screen.getByText("MX$4,313.50")).toBeInTheDocument();
    expect(screen.getByText("PAY-TRANSFER")).toBeInTheDocument();
  });

  it("does not show decimals for a zero-decimal currency", () => {
    render(<TransferConfirmation transfer={{ ...transfer, receiveAmountMinor: 38_000, receiveCurrency: "JPY" }} onDone={vi.fn()} />);

    expect(screen.getByText("¥38,000")).toBeInTheDocument();
  });
});
