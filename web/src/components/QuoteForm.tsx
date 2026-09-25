import { useState, type FormEvent } from "react";
import { createQuote, RECEIVE_CURRENCIES, type Quote, type ReceiveCurrency } from "../api";
import { parseAmount } from "../money";

interface QuoteFormProps {
  onQuote: (quote: Quote) => void;
}

export function QuoteForm({ onQuote }: QuoteFormProps) {
  const [amount, setAmount] = useState("");
  const [receiveCurrency, setReceiveCurrency] = useState<ReceiveCurrency>("EUR");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const sendAmountMinor = parseAmount(amount, "USD");
    if (sendAmountMinor === null) {
      setError("Enter a valid USD amount, for example 250 or 250.00");
      return;
    }

    setLoading(true);
    try {
      onQuote(await createQuote(sendAmountMinor, receiveCurrency));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not get a quote");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="card stack" onSubmit={handleSubmit} noValidate>
      <h2>Get a quote</h2>
      <div className={`float-field${error ? " has-error" : ""}`}>
        <input
          id="amount"
          name="amount"
          inputMode="decimal"
          autoComplete="off"
          placeholder=" "
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "quote-error" : undefined}
        />
        <label htmlFor="amount" className="float-label">
          You send (USD)
        </label>
      </div>
      <div className="float-field">
        <select
          id="receiveCurrency"
          name="receiveCurrency"
          value={receiveCurrency}
          onChange={(e) => setReceiveCurrency(e.target.value as ReceiveCurrency)}
        >
          {RECEIVE_CURRENCIES.map((code) => (
            <option key={code} value={code}>
              {code}
            </option>
          ))}
        </select>
        <label htmlFor="receiveCurrency" className="float-label floated">
          They receive
        </label>
        <svg className="chevron" width="14" height="8" viewBox="0 0 14 8" fill="none" aria-hidden="true">
          <path d="M1.75 1.5L7 6.25L12.25 1.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      {error && (
        <p id="quote-error" className="field-error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="btn" disabled={loading}>
        {loading ? "Getting quote..." : "Get quote"}
      </button>
    </form>
  );
}
