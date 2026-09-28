import { useState } from "react";
import type { Quote, Transfer } from "./api";
import { QuoteForm } from "./components/QuoteForm";
import { QuoteSummary } from "./components/QuoteSummary";
import { RecipientForm } from "./components/RecipientForm";
import { ThemeToggle } from "./components/ThemeToggle";
import { TransferConfirmation } from "./components/TransferConfirmation";

type Step = "quote" | "recipient" | "done";

export function App() {
  const [step, setStep] = useState<Step>("quote");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [transfer, setTransfer] = useState<Transfer | null>(null);

  function reset() {
    setQuote(null);
    setTransfer(null);
    setStep("quote");
  }

  return (
    <main>
      <header className="topbar">
        <h1>Transfer Demo</h1>
        <ThemeToggle />
      </header>
      {step === "quote" && (
        <>
          <QuoteForm onQuote={setQuote} />
          {quote && <QuoteSummary quote={quote} onContinue={() => setStep("recipient")} />}
        </>
      )}
      {step === "recipient" && (
        <RecipientForm
          quote={quote!}
          onBack={() => setStep("quote")}
          onSent={(t) => {
            setTransfer(t);
            setStep("done");
          }}
        />
      )}
      {step === "done" && <TransferConfirmation transfer={transfer!} onDone={reset} />}
    </main>
  );
}
