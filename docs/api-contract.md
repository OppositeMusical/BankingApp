# API contract — frontend ⇄ backend

The authoritative contract is **`../../Banking-backend/openapi.yaml`**, not this
file. This file records the two things the contract cannot tell you: how the
UI's vocabulary maps onto it, and where the two genuinely disagree.

Referenced by [`src/lib/types/banking.ts`](../Frontend/src/lib/types/banking.ts).

---

## 1. Where things live

```
Frontend/src/lib/api/
  generated/schema.d.ts   ← npm run gen:api, straight from openapi.yaml
  wire.ts                 ← Zod schemas: runtime validation of the wire format
  adapters/               ← wire shapes → the domain types screens use
  endpoints/              ← the ONLY place a URL string appears
  client.ts               ← the ONLY place fetch is called
  config.ts               ← mode, base URL, timeout
Frontend/src/app/api/[...path]/route.ts   ← BFF proxy; owns the tokens
```

Screens import from `@/lib/api` and never below it. The contract's vocabulary
stops at `adapters/`.

## 2. Serialization

The backend serializes **camelCase** already, so the case-transform decision in
ReadMe §5.4 needs no action. `client.ts` applies no transform.

Money is `{ amount, formatted, currency }` on the wire. The adapter drops
`formatted`: every amount renders through `<Amount>`, which owns Privacy Mode
and locale, and a server-formatted string would bypass both. `amount` is
integer minor units and is the only field arithmetic touches.

## 3. Errors

ReadMe §5.2 was written against FastAPI's `{ detail }` and its 422
`loc/msg/type` array. **That backend does not exist.** The real envelope is:

```json
{ "error": { "code": "INSUFFICIENT_FUNDS", "message": "…" }, "requestId": "…" }
```

`openapi.yaml` is explicit: *"Branch on this, never on `message`."* So
`ApiError.code` is the only thing callers switch on, and user-facing wording is
owned by `describeError()` in `errors.ts` — a server-side string change can
never alter what a user reads.

## 4. Noun mapping

| UI type | Wire type | Notes |
| --- | --- | --- |
| `Account` | **`SubAccount`** | A wire `Account` is the legal container (`personal`/`business`, no name). The things people call accounts are labelled pots inside it. |
| `Account.name` | `SubAccount.label` | |
| `Account.sharedWith[]` | `Member[]` on the **parent** account | Roles are granted on the container, not the pot. |
| `Account.visibility` | *derived* | `sole` when no other member; `joint` when another member can act; `viewable` when they can only look. |
| `AccountShare.access` | `MemberRole` | `owner→manage`, `member→spend`, `viewer→view`, `dependent→view`. `dependent` maps to view because the contract notes it lacks transfer permissions entirely — showing it as able to spend would be a lie. |
| `Transaction.merchant` | `merchantName`, falling back to `description` | |
| `Transaction.amount` | `signedAmount` | Already negative for a debit from this holder's perspective — the UI's convention exactly. |
| `Flow` | **a set of `Rule`s** | See §5. |
| `Money` | `Money` minus `formatted` | |

## 5. Flows are a view over Rules

There is no `/flows` endpoint and there should not be one — a parallel resource
would put the same state in two places. A Flow is the set of rules sharing one
`deposit_detected` trigger:

| Flow | Rule |
| --- | --- |
| `source` | `triggerType: deposit_detected` + `triggerConfig.merchantContains` |
| `splits[]` | one rule each: `internal_transfer` + `actionConfig.percentOfTrigger` |
| `setAsides[]` | same, but `actionConfig.amount` |
| `state` | `enabled` |

Rules are grouped by `accountId` + a fingerprint of `triggerConfig`. The Flow's
name is recovered from a naming convention written on the way out —
`"<flow name> → <destination>"` — and falls back to the payer name when the
rules were not created by this app.

## 6. Known contract gaps

These are places the backend cannot currently represent something the UI needs.
Each is handled in the adapter, and each would be better fixed in `openapi.yaml`.

| # | Gap | Handled today by | Proposed fix |
| --- | --- | --- | --- |
| 1 | **`isRemainder` — "the rest"** | Round-tripped as a marker key inside the open `actionConfig` object | Add `isRemainder: boolean` to the `internal_transfer` action config. This is load-bearing: it absorbs the rounding remainder so a split sums to exactly what arrived (`lib/flows/split-deposit.ts`). |
| 2 | **Goal targets** | Not represented — `Goal` cannot round-trip at all | Add `targetAmount` and `targetDate` to `SubAccount` |
| 3 | **`Account.last4`** | Derived from the sub-account UUID's digits | Add a display identifier to `SubAccount` |
| 4 | **`Account.kind`** | Inferred from the label by regex | Add `kind` to `SubAccount` |
| 5 | **`Account.interestRateBps`** | Omitted; the UI simply doesn't render the line | Add to `SubAccount` |
| 6 | **Flow cadence / typical amount** | Defaults to `irregular` and undefined — an honest "no claim" | Publish observed cadence and median deposit on the rule or a source resource |
| 7 | **`Transaction.initiatedBy`** | Unset — the contract never says who made a charge on a joint account | Add the acting user to `Transaction` |
| 8 | **Category vocabularies** | Lossy map; unmapped values become `other` | Reconcile the two enums. UI lacks `dining`, `fuel`, `shopping`, `entertainment`, `subscriptions`, `transfers`; wire lacks `housing`, `childcare`, `personal`, `savings`, `fees`. |
| 9 | **Flow atomicity** | Rules posted in sequence; a partial failure leaves a partial Flow | A batch endpoint, or a transactional rule-group resource |

## 7. What the backend actually serves

`go/internal/api/server.go` registers **14** of the ~40 operations in the
contract. The rest exist only in the TypeScript prototype, which is being
discarded.

Live today: `health.*`, `auth.*`, `accounts.list`, `accounts.balance`,
`accounts.transactions`, `transfers.internal`, `transfers.get`,
`simulate.deposit`.

Not yet: sub-accounts, members, rules, budgets, cards, brokerage,
linked-accounts, external transfers.

`src/lib/api/endpoints/registry.ts` holds this list. Endpoints on it go over
HTTP in live mode; everything else resolves to the same fixtures mock mode
uses, behind an identical signature — so a screen cannot tell which it got.
**When Go ships an endpoint, move one line in that file.** Nothing else
changes.

> Note the consequence: **Flows has no live backend until `/rules` is ported to
> Go.** It is the app's headline feature and it currently runs entirely on
> fixtures.
