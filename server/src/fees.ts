// Fee schedule for USD sends. All values are in cents.

export const MIN_SEND_MINOR = 1_00;
export const MAX_SEND_MINOR = 10_000_00;

const FLAT_FEE_SMALL = 2_99; // sends up to $100.00
const FLAT_FEE_MEDIUM = 4_99; // sends up to $1,000.00
const PERCENT_FEE_CAP = 25_00; // 1% above $1,000.00, capped at $25.00

export function calculateFeeMinor(sendAmountMinor: number): number {
  if (sendAmountMinor <= 100_00) return FLAT_FEE_SMALL;
  if (sendAmountMinor <= 1_000_00) return FLAT_FEE_MEDIUM;
  return Math.min(Math.round(sendAmountMinor / 100), PERCENT_FEE_CAP);
}
