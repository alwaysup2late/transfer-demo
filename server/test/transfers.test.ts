import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../src/app.js";
import type { PayoutProvider } from "../src/payout.js";
import { QUOTE_TTL_MS, QuoteService } from "../src/quotes.js";
import { TransferService } from "../src/transfers.js";

describe("transfers API", () => {
  let app: ReturnType<typeof createApp>;
  let payout: PayoutProvider;

  beforeEach(() => {
    payout = { submit: vi.fn().mockResolvedValue("PAY-TEST") };
    app = createApp({ quotes: new QuoteService(), transfers: new TransferService(payout) });
  });

  async function createQuote() {
    const res = await request(app)
      .post("/api/quotes")
      .send({ sendAmountMinor: 250_00, sendCurrency: "USD", receiveCurrency: "MXN" });
    return res.body;
  }

  function transferBody(quote: { id: string; sendAmountMinor: number; feeMinor: number }) {
    return {
      quoteId: quote.id,
      sendAmountMinor: quote.sendAmountMinor,
      feeMinor: quote.feeMinor,
      recipient: { name: "Maria Lopez", accountNumber: "12345678" },
    };
  }

  it("creates a transfer", async () => {
    const quote = await createQuote();

    const res = await request(app).post("/api/transfers").send(transferBody(quote));

    expect(res.status).toBe(201);
    expect(res.body.status).toBe("submitted");
    expect(res.body.payoutReference).toBe("PAY-TEST");
    expect(res.body.totalMinor).toBe(254_99);
    expect(res.body.receiveAmountMinor).toBe(4_313_50);
    expect(payout.submit).toHaveBeenCalled();
  });

  it("returns 400 when required fields are missing", async () => {
    const res = await request(app).post("/api/transfers").send({ quoteId: "abc" });

    expect(res.status).toBe(400);
  });

  it("returns 404 for an unknown quote", async () => {
    const res = await request(app)
      .post("/api/transfers")
      .send({ ...transferBody({ id: "missing", sendAmountMinor: 100_00, feeMinor: 2_99 }) });

    expect(res.status).toBe(404);
  });

  it("uses the quote's amounts and ignores amounts in the request body", async () => {
    const quote = await createQuote();

    const res = await request(app)
      .post("/api/transfers")
      .send({ ...transferBody(quote), sendAmountMinor: 1, feeMinor: 0 });

    expect(res.status).toBe(201);
    expect(res.body.sendAmountMinor).toBe(250_00);
    expect(res.body.feeMinor).toBe(quote.feeMinor);
    expect(res.body.totalMinor).toBe(254_99);
  });

  it("returns 410 for an expired quote", async () => {
    let now = new Date("2026-01-01T00:00:00Z");
    const expiringQuotes = new QuoteService({ now: () => now });
    const expiringApp = createApp({ quotes: expiringQuotes, transfers: new TransferService(payout) });
    const quote = expiringQuotes.create({ sendAmountMinor: 250_00, receiveCurrency: "MXN" });
    now = new Date(now.getTime() + QUOTE_TTL_MS);

    const res = await request(expiringApp).post("/api/transfers").send(transferBody(quote));

    expect(res.status).toBe(410);
    expect(payout.submit).not.toHaveBeenCalled();
  });

  it("returns the same transfer for a repeated idempotency key", async () => {
    const quote = await createQuote();

    const first = await request(app).post("/api/transfers").set("Idempotency-Key", "key-1").send(transferBody(quote));
    const second = await request(app).post("/api/transfers").set("Idempotency-Key", "key-1").send(transferBody(quote));

    expect(second.body.id).toBe(first.body.id);
    expect(payout.submit).toHaveBeenCalledTimes(1);
  });

  it("keeps the transfer pending when the payout fails", async () => {
    vi.mocked(payout.submit).mockRejectedValue(new Error("Provider unavailable"));
    const quote = await createQuote();

    const res = await request(app).post("/api/transfers").send(transferBody(quote));

    expect(res.status).toBe(201);
    expect(res.body.status).toBe("pending");
  });

  it("returns a transfer by id", async () => {
    const quote = await createQuote();
    const created = await request(app).post("/api/transfers").send(transferBody(quote));

    const res = await request(app).get(`/api/transfers/${created.body.id}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(created.body.id);
  });
});
