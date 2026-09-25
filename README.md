# Transfer Demo

A small demo app that quotes international money transfers. It has two parts:

- `server/`: Express API written in TypeScript (quotes, fees, exchange rates)
- `web/`: React front-end built with Vite

This app is synthetic and exists only for interview exercises.

## Requirements

- Node.js 22 or newer (`node --version`)
- npm 10 or newer (`npm --version`)
- git

## Setup Check (Please Complete Before the Interview)

```sh
git clone <repository-url>
cd transfer-demo
npm install
npm test
npm run dev
```

Then open http://localhost:5173, enter an amount, and select **Get quote**. If you see a quote, you are ready. If any step fails, let your recruiting contact know before the interview.

## Project Layout

```
server/
  src/
    money.ts         Currencies, minor units, and conversion
    rates.ts         Static demo exchange rates
    fees.ts          Fee schedule
    quotes.ts        Quote creation and expiry (in-memory store)
    routes/quotes.ts HTTP routes for /api/quotes
    errors.ts        Error types and JSON error handler
  test/
web/
  src/
    api.ts           API client
    money.ts         Parsing and formatting amounts
    theme.ts         Light and dark theme preference
    components/      QuoteForm, QuoteSummary, ThemeToggle
  test/
```

## Conventions

- All money is stored and calculated as integers in minor units (cents for USD, yen for JPY). Floating point values are only used for display formatting.
- Exchange rates are integers scaled by 1,000,000.
- Request bodies are validated with zod at the route boundary.
- Errors are returned as `{ "error": { "code": "...", "message": "..." } }`.

## API

| Method | Path              | Description                        |
|--------|-------------------|------------------------------------|
| GET    | `/api/health`     | Health check                       |
| POST   | `/api/quotes`     | Create a quote (valid for 10 min)  |
| GET    | `/api/quotes/:id` | Get a quote and its expiry status  |

Example:

```sh
curl -X POST http://localhost:3001/api/quotes \
  -H "Content-Type: application/json" \
  -d '{"sendAmountMinor": 25000, "sendCurrency": "USD", "receiveCurrency": "MXN"}'
```
