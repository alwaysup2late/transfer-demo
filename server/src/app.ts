import express from "express";
import { errorHandler } from "./errors.js";
import { QuoteService } from "./quotes.js";
import { quotesRouter } from "./routes/quotes.js";

export interface AppDependencies {
  quotes: QuoteService;
}

export function createApp(deps: AppDependencies = { quotes: new QuoteService() }) {
  const app = express();
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });
  app.use("/api/quotes", quotesRouter(deps.quotes));

  app.use(errorHandler);
  return app;
}
