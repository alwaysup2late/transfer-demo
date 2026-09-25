import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { QUOTE_TTL_MS, QuoteService } from "../src/quotes.js";

describe("quotes API", () => {
  let now: Date;
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    now = new Date("2026-01-15T12:00:00.000Z");
    app = createApp({ quotes: new QuoteService({ now: () => now, newId: () => "quote-1" }) });
  });

  const validBody = { sendAmountMinor: 250_00, sendCurrency: "USD", receiveCurrency: "MXN" };

  it("creates a quote", async () => {
    const res = await request(app).post("/api/quotes").send(validBody);

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
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
    });
  });

  it.each([
    ["a fractional amount", { ...validBody, sendAmountMinor: 250.5 }],
    ["an amount below the minimum", { ...validBody, sendAmountMinor: 99 }],
    ["an amount above the maximum", { ...validBody, sendAmountMinor: 10_000_01 }],
    ["an amount sent as a string", { ...validBody, sendAmountMinor: "25000" }],
    ["an unsupported send currency", { ...validBody, sendCurrency: "EUR" }],
    ["an unsupported receive currency", { ...validBody, receiveCurrency: "XYZ" }],
  ])("rejects %s", async (_label, body) => {
    const res = await request(app).post("/api/quotes").send(body);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("invalid_request");
  });

  it("returns a stored quote", async () => {
    await request(app).post("/api/quotes").send(validBody);

    const res = await request(app).get("/api/quotes/quote-1");

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: "quote-1", expired: false });
  });

  it("marks a quote as expired after the TTL", async () => {
    await request(app).post("/api/quotes").send(validBody);
    now = new Date(now.getTime() + QUOTE_TTL_MS);

    const res = await request(app).get("/api/quotes/quote-1");

    expect(res.body.expired).toBe(true);
  });

  it("returns 404 for an unknown quote", async () => {
    const res = await request(app).get("/api/quotes/missing");

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("quote_not_found");
  });
});
