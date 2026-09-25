// Amounts from the API are integers in minor units. Convert to and from display
// strings here only, never with floating point arithmetic on user input.

export function minorDigits(currency: string): number {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).resolvedOptions()
    .maximumFractionDigits ?? 2;
}

/**
 * Parses a user-entered amount such as "1,250.50" into minor units.
 * Returns null if the input is not a valid amount for the currency.
 */
export function parseAmount(input: string, currency: string): number | null {
  const digits = minorDigits(currency);
  const normalized = input.trim().replaceAll(",", "");
  const pattern = digits > 0 ? new RegExp(`^(\\d+)(?:\\.(\\d{1,${digits}}))?$`) : /^(\d+)$/;
  const match = pattern.exec(normalized);
  if (!match) return null;

  const whole = match[1] ?? "0";
  const fraction = (match[2] ?? "").padEnd(digits, "0");
  const minor = Number(whole + fraction);
  return Number.isSafeInteger(minor) ? minor : null;
}

export function formatMoney(amountMinor: number, currency: string): string {
  const digits = minorDigits(currency);
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amountMinor / 10 ** digits);
}

/** Trims trailing zeros from an API rate string for display, e.g. "17.254000" to "17.254". */
export function formatRate(rate: string): string {
  return rate.includes(".") ? rate.replace(/\.?0+$/, "") : rate;
}
