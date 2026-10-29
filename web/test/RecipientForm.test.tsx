import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Quote, Transfer } from "../src/api";
import { RecipientForm } from "../src/components/RecipientForm";

const quote: Quote = {
  id: "quote-1",
  sendAmountMinor: 250_00,
  sendCurrency: "USD",
  receiveCurrency: "MXN",
  receiveAmountMinor: 4_313_50,
  feeMinor: 4_99,
  totalMinor: 254_99,
  rate: "17.254000",
  createdAt: "2026-01-15T12:00:00.000Z",
  expiresAt: "2026-01-15T12:10:00.000Z",
};

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

describe("RecipientForm", () => {
  it("sends the transfer", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(transfer), { status: 201 })));
    const onSent = vi.fn();
    render(<RecipientForm quote={quote} onSent={onSent} onBack={vi.fn()} />);

    await userEvent.type(screen.getByLabelText(/recipient full name/i), "Maria Lopez");
    await userEvent.type(screen.getByLabelText(/account number/i), "12345678");
    await userEvent.click(screen.getByRole("button", { name: /send/i }));

    expect(onSent).toHaveBeenCalledWith(transfer);
  });

  function sentKeys(fetchMock: ReturnType<typeof vi.fn>): (string | undefined)[] {
    return fetchMock.mock.calls.map(([, init]) => (init.headers as Record<string, string>)["Idempotency-Key"]);
  }

  it("disables the send button while the request is in flight", async () => {
    let respond: (res: Response) => void = () => {};
    const fetchMock = vi.fn().mockReturnValue(new Promise<Response>((resolve) => (respond = resolve)));
    vi.stubGlobal("fetch", fetchMock);
    render(<RecipientForm quote={quote} onSent={vi.fn()} onBack={vi.fn()} />);
    await userEvent.type(screen.getByLabelText(/recipient full name/i), "Maria Lopez");
    await userEvent.type(screen.getByLabelText(/account number/i), "12345678");

    await userEvent.click(screen.getByRole("button", { name: /send/i }));
    const button = screen.getByRole("button", { name: /sending/i });
    await userEvent.click(button);

    expect(button).toBeDisabled();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    respond(new Response(JSON.stringify(transfer), { status: 201 }));
    await screen.findByRole("button", { name: /send \$/i });
  });

  it("reuses the idempotency key on retry and makes a new one when the recipient changes", async () => {
    const failure = () => new Response(JSON.stringify({ error: { code: "payout_failed", message: "Try again" } }), { status: 502 });
    const fetchMock = vi.fn().mockImplementation(async () => failure());
    vi.stubGlobal("fetch", fetchMock);
    render(<RecipientForm quote={quote} onSent={vi.fn()} onBack={vi.fn()} />);
    await userEvent.type(screen.getByLabelText(/recipient full name/i), "Maria Lopez");
    await userEvent.type(screen.getByLabelText(/account number/i), "12345678");

    await userEvent.click(screen.getByRole("button", { name: /send/i }));
    await screen.findByRole("alert");
    await userEvent.click(screen.getByRole("button", { name: /send/i }));
    await userEvent.type(screen.getByLabelText(/account number/i), "9");
    await userEvent.click(screen.getByRole("button", { name: /send/i }));

    const [first, second, third] = sentKeys(fetchMock);
    expect(second).toBe(first);
    expect(third).not.toBe(first);
  });

  it("shows an error when fields are empty", async () => {
    render(<RecipientForm quote={quote} onSent={vi.fn()} onBack={vi.fn()} />);

    await userEvent.click(screen.getByRole("button", { name: /send/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(/recipient's name and account number/i);
  });
});
