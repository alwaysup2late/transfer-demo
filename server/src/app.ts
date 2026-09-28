import express from "express";
import { errorHandler } from "./errors.js";
import { SimulatedPayoutProvider } from "./payout.js";
import { QuoteService } from "./quotes.js";
import { quotesRouter } from "./routes/quotes.js";
import { transfersRouter } from "./routes/transfers.js";
import { TransferService } from "./transfers.js";

export interface AppDependencies {
  quotes: QuoteService;
  transfers: TransferService;
}

export function createApp(deps: Partial<AppDependencies> = {}) {
  const quotes = deps.quotes ?? new QuoteService();
  const transfers = deps.transfers ?? new TransferService(new SimulatedPayoutProvider());

  const app = express();
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });
  app.use("/api/quotes", quotesRouter(quotes));
  app.use("/api/transfers", transfersRouter(quotes, transfers));

  app.use(errorHandler);
  return app;
}
