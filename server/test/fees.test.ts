import { describe, expect, it } from "vitest";
import { calculateFeeMinor } from "../src/fees.js";

describe("calculateFeeMinor", () => {
  it.each([
    [1_00, 2_99],
    [100_00, 2_99],
    [100_01, 4_99],
    [1_000_00, 4_99],
    [1_000_01, 10_00],
    [1_550_00, 15_50],
    [2_500_00, 25_00],
    [10_000_00, 25_00],
  ])("charges %i cents a fee of %i cents", (sendAmountMinor, expectedFee) => {
    expect(calculateFeeMinor(sendAmountMinor)).toBe(expectedFee);
  });
});
