# Backend task: real portfolio value history

**Repo:** `Banking-backend` (Go). **Frontend is already built against this** — it
calls the endpoint, falls back to an approximation when it 404s, and swaps over
with no frontend change the moment it returns data.

---

## The problem

The Invest page charts the account's value over time. It currently fakes it:
it takes **today's** quantities and multiplies them by each symbol's historical
price. That answers *"what would what I hold now have been worth then"*, which
is not the same question as *"what was this account worth then"*. The two
diverge the moment anything was bought or sold mid-period — the approximation
shows a gain the account never made, on money it did not yet hold.

The frontend labels it as approximate. It should stop needing to.

## What to build

```
GET /brokerage/portfolio/history?range=1mo
Authorization: Bearer <token>
```

`range` ∈ `1d | 5d | 1mo | 6mo | 1y | 5y` (mirror the ranges the UI already
offers; default `1mo`, reject anything else with `VALIDATION_FAILED`).

**Response** — the envelope convention in this codebase is a key named after
the resource, and `Money` is `{amount, formatted, currency}`:

```json
{
  "points": [
    { "at": "2026-07-15T00:00:00Z",
      "value":     { "amount": 124030, "formatted": "1240.30", "currency": "USD" },
      "costBasis": { "amount": 120000, "formatted": "1200.00", "currency": "USD" } }
  ],
  "range": "1mo"
}
```

`costBasis` is optional — include it if it is cheap, since it turns the chart
into gain-vs-invested rather than just value. The frontend ignores unknown
fields, so adding it later is safe.

Ordering: oldest → newest. Roughly 30–250 points; match the interval to the
range the way `providers/alpaca.go` already does for bars (daily for `1mo`,
weekly for `1y`, and so on).

## How to compute it

Everything needed is already in the database and in Alpaca. **No new provider.**

1. **Positions over time** — `orders` holds `side`, `symbol`,
   `filled_quantity_scaled`, `filled_avg_price` and `created_at` for every
   fill. Replaying them in time order gives the exact quantity held for each
   symbol at any instant. Remember `quantity_scaled` is shares × 1e9
   (`providers.QuantityScale`) — integer arithmetic throughout, never float.

2. **Prices over time** — Alpaca's historical bars endpoint, the same
   credentials `ALPACA_API_KEY_ID` / `ALPACA_API_SECRET` already configured in
   staging. `Alpaca.Simulated()` is the existing pattern for the no-credentials
   case: return an empty `points` array rather than inventing a curve, and the
   frontend will fall back on its own.

3. **Value at t** = Σ over symbols of `quantity_at_t × close_at_t`. Include
   uninvested brokerage cash if you want the number to match what the account
   is actually worth — say which you chose in the handler comment, because the
   two are defensibly different and the next reader will wonder.

### Two ways to do it

- **Derive on request** (recommended first). No new table, no backfill, always
  correct. Cache the Alpaca bars — they are immutable once the day closes.
- **Snapshot daily** via a River job into a `portfolio_snapshots` table
  (`brokerage_account_id`, `at`, `value_minor`, `cost_basis_minor`). Faster,
  but it needs a backfill and a "this account has no snapshots yet" path —
  the same class of gap `BackfillBankAccountsArgs` exists to close.

Start with derive-on-request. Snapshot only if it is measurably too slow.

## Rules this codebase already holds itself to

- Authorize with `requireAccount(..., PermAccountRead)` against the brokerage
  account's `funding_account_id`, the way `handlers_brokerage.go` does. A
  portfolio is per-user.
- Money as integer minor units. `money.Minor`, never a float.
- Errors through `Errorf(CodeUpstream, ...)` when Alpaca fails — never leak a
  provider's raw response.
- Add the path to `openapi.yaml`. The frontend's contract test reads it.
- No credentials → empty points, not fabricated ones. Same discipline as
  `fillSimulated`: the sandbox never invents a number and calls it real.

## Definition of done

- `GET /brokerage/portfolio/history?range=1mo` returns 200 with points for an
  account that has filled orders.
- An account with no orders returns `{"points": []}`, not a 404 or an error.
- An account whose orders are all still `submitted` returns `{"points": []}` —
  nothing has been bought yet.
- Selling everything mid-period shows the value going to zero and staying
  there, rather than tracking the stock's price afterwards. **This is the case
  the current approximation gets wrong, so it is the one worth a test.**
- Route registered in `server.go`, path in `openapi.yaml`.

## Then

Move `"brokerage.portfolioHistory"` from `pendingOperations` to
`liveOperations` in the frontend's
`Frontend/src/lib/api/endpoints/registry.ts`. That is the entire frontend
change — the chart switches to real data and drops its "approximate" caption
on its own.
