import type { Transfer } from "../api";

interface TransferConfirmationProps {
  transfer: Transfer;
  onDone: () => void;
}

export function TransferConfirmation({ transfer, onDone }: TransferConfirmationProps) {
  return (
    <section className="card" aria-label="Transfer confirmation">
      <h2>Transfer sent!</h2>
      <p className="receive-amount">
        <span className="label">{transfer.recipient.name} receives</span>
        <span className="value">
          {(transfer.receiveAmountMinor / 100).toFixed(2)} {transfer.receiveCurrency}
        </span>
      </p>
      <dl className="summary-rows">
        <div className="summary-row">
          <dt>Total paid</dt>
          <dd>${(transfer.totalMinor / 100).toFixed(2)}</dd>
        </div>
        <div className="summary-row">
          <dt>Reference</dt>
          <dd>{transfer.payoutReference}</dd>
        </div>
        <div className="summary-row">
          <dt>Status</dt>
          <dd>
            <span className="status-badge">{transfer.status}</span>
          </dd>
        </div>
      </dl>
      <div className="actions">
        <button type="button" className="btn" onClick={onDone}>
          Send another transfer
        </button>
      </div>
    </section>
  );
}
