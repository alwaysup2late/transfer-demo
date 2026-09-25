// All monetary amounts are integers in the currency's minor unit (cents for USD,
// yen for JPY). Never store or calculate money with floating point values.

export const CURRENCIES = {
  USD: { minorDigits: 2 },
  EUR: { minorDigits: 2 },
  GBP: { minorDigits: 2 },
  MXN: { minorDigits: 2 },
  JPY: { minorDigits: 0 },
} as const;

export type CurrencyCode = keyof typeof CURRENCIES;

export const SEND_CURRENCY = "USD" satisfies CurrencyCode;
export const RECEIVE_CURRENCIES = ["EUR", "GBP", "MXN", "JPY"] as const satisfies readonly CurrencyCode[];
export type ReceiveCurrency = (typeof RECEIVE_CURRENCIES)[number];

export function minorDigits(currency: CurrencyCode): number {
  return CURRENCIES[currency].minorDigits;
}

// Exchange rates are integers scaled by RATE_SCALE (6 decimal places).
export const RATE_SCALE = 1_000_000n;

/**
 * Converts a minor-unit amount using a scaled rate, adjusting for the difference
 * in minor digits between currencies. Rounds half up. Amounts must be non-negative.
 */
export function convertMinor(
  amountMinor: number,
  from: CurrencyCode,
  to: CurrencyCode,
  scaledRate: bigint,
): number {
  if (!Number.isSafeInteger(amountMinor) || amountMinor < 0) {
    throw new RangeError(`Invalid minor amount: ${amountMinor}`);
  }
  const numerator = BigInt(amountMinor) * scaledRate * 10n ** BigInt(minorDigits(to));
  const denominator = RATE_SCALE * 10n ** BigInt(minorDigits(from));
  return Number((numerator + denominator / 2n) / denominator);
}

export function formatScaledRate(scaledRate: bigint): string {
  const whole = scaledRate / RATE_SCALE;
  const fraction = (scaledRate % RATE_SCALE).toString().padStart(6, "0");
  return `${whole}.${fraction}`;
}
