import { useState } from "react";
import type { Quote } from "./api";
import { QuoteForm } from "./components/QuoteForm";
import { QuoteSummary } from "./components/QuoteSummary";
import { ThemeToggle } from "./components/ThemeToggle";

export function App() {
  const [quote, setQuote] = useState<Quote | null>(null);

  return (
    <main>
      <header className="topbar">
        <h1>Transfer Demo</h1>
        <ThemeToggle />
      </header>
      <QuoteForm onQuote={setQuote} />
      {quote && <QuoteSummary quote={quote} />}
    </main>
  );
}
