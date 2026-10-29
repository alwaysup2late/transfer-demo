import type { Quote } from "../api";
import { formatMoney, formatRate } from "../money";

interface QuoteSummaryProps {
  quote: Quote;
}

export function QuoteSummary({ quote }: QuoteSummaryProps) {
  return (
    <section className="card" aria-label="Quote summary">
      <h2>Your quote</h2>
      <p className="receive-amount">
        <span className="label">They receive</span>
        <span className="value">{formatMoney(quote.receiveAmountMinor, quote.receiveCurrency)}</span>
      </p>
      <dl className="summary-rows">
        <div className="summary-row">
          <dt>You send</dt>
          <dd>{formatMoney(quote.sendAmountMinor, quote.sendCurrency)}</dd>
        </div>
        <div className="summary-row">
          <dt>Fee</dt>
          <dd>{formatMoney(quote.feeMinor, quote.sendCurrency)}</dd>
        </div>
        <div className="summary-row">
          <dt>Exchange rate</dt>
          <dd>
            1 {quote.sendCurrency} = {formatRate(quote.rate)} {quote.receiveCurrency}
          </dd>
        </div>
        <div className="summary-row total">
          <dt>Total to pay</dt>
          <dd>{formatMoney(quote.totalMinor, quote.sendCurrency)}</dd>
        </div>
      </dl>
      <p className="muted">Quote expires at {new Date(quote.expiresAt).toLocaleTimeString()}</p>
    </section>
  );
}
