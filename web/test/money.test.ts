import { describe, expect, it } from "vitest";
import { formatMoney, formatRate, parseAmount } from "../src/money";

describe("parseAmount", () => {
  it.each([
    ["250", 250_00],
    ["250.5", 250_50],
    ["250.05", 250_05],
    ["1,250.00", 1_250_00],
    [" 0.10 ", 10],
  ])("parses %s as %i cents", (input, expected) => {
    expect(parseAmount(input, "USD")).toBe(expected);
  });

  it.each(["", "abc", "-5", "1.234", "1.2.3", "1e3"])("rejects %j", (input) => {
    expect(parseAmount(input, "USD")).toBeNull();
  });

  it("does not accept decimals for zero-decimal currencies", () => {
    expect(parseAmount("1500", "JPY")).toBe(1_500);
    expect(parseAmount("1500.5", "JPY")).toBeNull();
  });
});

describe("formatMoney", () => {
  it("formats using the currency's minor digits", () => {
    expect(formatMoney(1_250_50, "USD")).toBe("$1,250.50");
    expect(formatMoney(1_486, "JPY")).toBe("¥1,486");
  });
});

describe("formatRate", () => {
  it.each([
    ["17.254000", "17.254"],
    ["148.620000", "148.62"],
    ["2.000000", "2"],
    ["10.000000", "10"],
    ["0.921500", "0.9215"],
  ])("formats %s as %s", (rate, expected) => {
    expect(formatRate(rate)).toBe(expected);
  });
});
