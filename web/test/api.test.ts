import { describe, expect, it, vi } from "vitest";
import { createTransfer, type Quote, type Transfer } from "../src/api";

const quote = { id: "quote-1", sendAmountMinor: 250_00, feeMinor: 4_99 } as Quote;
const recipient = { name: "Maria Lopez", accountNumber: "12345678" };
const transfer = { id: "transfer-1", quoteId: "quote-1", status: "submitted" } as Transfer;

vi.mock("../src/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../src/api")>()),
  createTransfer: vi.fn().mockResolvedValue({ id: "transfer-1", quoteId: "quote-1", status: "submitted" }),
}));

describe("createTransfer", () => {
  it("creates a transfer", async () => {
    const result = await createTransfer(quote, recipient, "key-1");

    expect(createTransfer).toHaveBeenCalledWith(quote, recipient, "key-1");
    expect(result).toEqual(transfer);
  });
});
