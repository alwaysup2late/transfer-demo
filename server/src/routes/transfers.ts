import { Router } from "express";
import { HttpError } from "../errors.js";
import { SEND_CURRENCY } from "../money.js";
import type { QuoteService } from "../quotes.js";
import type { TransferService } from "../transfers.js";

export function transfersRouter(quotes: QuoteService, transfers: TransferService): Router {
  const router = Router();

  router.post("/", async (req, res) => {
    console.log("Creating transfer", JSON.stringify(req.body));

    const { quoteId, sendAmountMinor, feeMinor, recipient } = req.body;
    if (!quoteId || !sendAmountMinor || !recipient?.name || !recipient?.accountNumber) {
      throw new HttpError(400, "invalid_request", "Missing required fields");
    }

    const quote = quotes.get(quoteId);
    if (!quote) {
      throw new HttpError(404, "quote_not_found", "Quote not found");
    }

    const transfer = await transfers.create({
      quote,
      sendAmountMinor,
      feeMinor: feeMinor ?? 0,
      recipient,
      idempotencyKey: req.header("Idempotency-Key"),
    });

    res.status(201).json(transfer);
  });

  router.get("/:id", (req, res) => {
    const transfer = transfers.get(req.params.id);
    if (!transfer) {
      throw new HttpError(404, "transfer_not_found", "Transfer not found");
    }
    res.json(transfer);
  });

  return router;
}
