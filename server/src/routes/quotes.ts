import { Router } from "express";
import { z } from "zod";
import { HttpError } from "../errors.js";
import { MAX_SEND_MINOR, MIN_SEND_MINOR } from "../fees.js";
import { RECEIVE_CURRENCIES, SEND_CURRENCY } from "../money.js";
import type { QuoteService } from "../quotes.js";

const createQuoteSchema = z.object({
  sendAmountMinor: z.number().int().min(MIN_SEND_MINOR).max(MAX_SEND_MINOR),
  sendCurrency: z.literal(SEND_CURRENCY),
  receiveCurrency: z.enum(RECEIVE_CURRENCIES),
});

export function quotesRouter(quotes: QuoteService): Router {
  const router = Router();

  router.post("/", (req, res) => {
    const input = createQuoteSchema.parse(req.body);
    const quote = quotes.create(input);
    res.status(201).json(quote);
  });

  router.get("/:id", (req, res) => {
    const quote = quotes.get(req.params.id);
    if (!quote) {
      throw new HttpError(404, "quote_not_found", "Quote not found");
    }
    res.json({ ...quote, expired: quotes.isExpired(quote) });
  });

  return router;
}
