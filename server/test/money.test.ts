import { describe, expect, it } from "vitest";
import { convertMinor, formatScaledRate } from "../src/money.js";

describe("convertMinor", () => {
  it("converts between currencies with the same minor digits", () => {
    // $100.00 at 0.9215 EUR/USD = EUR 92.15
    expect(convertMinor(100_00, "USD", "EUR", 921_500n)).toBe(92_15);
  });

  it("converts into a zero-decimal currency", () => {
    // $10.00 at 148.62 JPY/USD = JPY 1,486 (1,486.2 rounded)
    expect(convertMinor(10_00, "USD", "JPY", 148_620_000n)).toBe(1_486);
  });

  it("rounds half up", () => {
    // $0.01 at 0.5 = 0.005 EUR, rounds up to 0.01
    expect(convertMinor(1, "USD", "EUR", 500_000n)).toBe(1);
  });

  it("does not lose precision on large amounts", () => {
    // $10,000.00 at 17.254 MXN/USD = MXN 172,540.00
    expect(convertMinor(10_000_00, "USD", "MXN", 17_254_000n)).toBe(172_540_00);
  });

  it("rejects fractional or negative amounts", () => {
    expect(() => convertMinor(10.5, "USD", "EUR", 921_500n)).toThrow(RangeError);
    expect(() => convertMinor(-1, "USD", "EUR", 921_500n)).toThrow(RangeError);
  });
});

describe("formatScaledRate", () => {
  it("formats with six decimal places", () => {
    expect(formatScaledRate(921_500n)).toBe("0.921500");
    expect(formatScaledRate(148_620_000n)).toBe("148.620000");
  });
});
