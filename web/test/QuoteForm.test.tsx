import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Quote } from "../src/api";
import { QuoteForm } from "../src/components/QuoteForm";

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

function mockFetch(status: number, body: unknown) {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("QuoteForm", () => {
  it("requests a quote in minor units and reports the result", async () => {
    const fetchMock = mockFetch(201, quote);
    const onQuote = vi.fn();
    render(<QuoteForm onQuote={onQuote} />);

    await userEvent.type(screen.getByLabelText(/you send/i), "250.00");
    await userEvent.selectOptions(screen.getByLabelText(/they receive/i), "MXN");
    await userEvent.click(screen.getByRole("button", { name: /get quote/i }));

    expect(fetchMock).toHaveBeenCalledOnce();
    const [, init] = fetchMock.mock.calls[0]!;
    expect(JSON.parse(init.body)).toEqual({ sendAmountMinor: 250_00, sendCurrency: "USD", receiveCurrency: "MXN" });
    expect(onQuote).toHaveBeenCalledWith(quote);
  });

  it("validates the amount before calling the API", async () => {
    const fetchMock = mockFetch(201, quote);
    render(<QuoteForm onQuote={vi.fn()} />);

    await userEvent.type(screen.getByLabelText(/you send/i), "12.345");
    await userEvent.click(screen.getByRole("button", { name: /get quote/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(/valid usd amount/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows the API error message", async () => {
    mockFetch(400, { error: { code: "invalid_request", message: "Request validation failed" } });
    render(<QuoteForm onQuote={vi.fn()} />);

    await userEvent.type(screen.getByLabelText(/you send/i), "0.50");
    await userEvent.click(screen.getByRole("button", { name: /get quote/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Request validation failed");
  });
});
