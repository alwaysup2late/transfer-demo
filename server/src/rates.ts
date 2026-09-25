import type { ReceiveCurrency } from "./money.js";

// Static demo rates for 1 USD, scaled by RATE_SCALE. A real system would fetch
// these from a rate provider.
const USD_RATES: Record<ReceiveCurrency, bigint> = {
  EUR: 921_500n,
  GBP: 789_300n,
  MXN: 17_254_000n,
  JPY: 148_620_000n,
};

export function getUsdRate(to: ReceiveCurrency): bigint {
  return USD_RATES[to];
}
