import { useState, type FormEvent } from "react";
import { createTransfer, type Quote, type Transfer } from "../api";
import { formatMoney } from "../money";

interface RecipientFormProps {
  quote: Quote;
  onSent: (transfer: Transfer) => void;
  onBack: () => void;
}

export function RecipientForm({ quote, onSent, onBack }: RecipientFormProps) {
  const [name, setName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!name || !accountNumber) {
      setError("Enter the recipient's name and account number");
      return;
    }

    // Generate an idempotency key so the server can detect duplicate submissions
    const idempotencyKey = crypto.randomUUID();

    setSending(true);
    try {
      const transfer = await createTransfer(quote, { name, accountNumber }, idempotencyKey);
      onSent(transfer);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send transfer");
    }
    setSending(false);
  }

  return (
    <form className="card stack" onSubmit={handleSubmit} noValidate>
      <h2>Who are you sending to?</h2>
      <div className="float-field">
        <input
          id="recipientName"
          name="recipientName"
          autoComplete="off"
          placeholder=" "
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <label htmlFor="recipientName" className="float-label">
          Recipient full name
        </label>
      </div>
      <div className="float-field">
        <input
          id="accountNumber"
          name="accountNumber"
          inputMode="numeric"
          autoComplete="off"
          placeholder=" "
          value={accountNumber}
          onChange={(e) => setAccountNumber(e.target.value)}
        />
        <label htmlFor="accountNumber" className="float-label">
          Account number
        </label>
      </div>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
      <div className="actions" style={{ marginTop: 4 }}>
        <button type="submit" className="btn">
          {sending ? "Sending..." : `Send ${formatMoney(quote.totalMinor, quote.sendCurrency)}`}
        </button>
        <button type="button" className="btn secondary" onClick={onBack}>
          Back
        </button>
      </div>
    </form>
  );
}
