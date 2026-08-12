# Aster — frontend

The Next.js app for BankingApp. The product plan, design system, and
architecture live in [`../ReadMe.md`](../ReadMe.md); the mapping onto the real
backend lives in [`../docs/api-contract.md`](../docs/api-contract.md).

## Run it

```bash
npm install
npm run dev          # http://localhost:3000
```

That is **mock mode**: every screen renders from typed fixtures, no backend
required, and any credentials on `/signin` sign you in as the demo person.

## Run it against the real backend

The backend is the Go API in the sibling
[`Banking-backend`](../../Banking-backend/) repo.

```bash
# 1. Start the backend (needs Postgres — see Banking-backend/README.md)
cd ../../Banking-backend/go && go run ./cmd/api    # listens on :4000

# 2. Point this app at it
cp .env.example .env.local
# set NEXT_PUBLIC_API_MODE=live in .env.local

npm run dev
```

Register or sign in at `/signin`. The browser only ever talks to the
same-origin BFF proxy (`src/app/api/[...path]/route.ts`), which holds the
tokens in httpOnly cookies and forwards to `API_INTERNAL_URL` server-side —
no CORS, no tokens in JavaScript.

Operations the backend doesn't serve yet fall back to fixtures behind the same
signatures; `src/lib/api/endpoints/registry.ts` is the list. When the backend
ships an endpoint, move one line there.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` / `start` | Production build / serve |
| `npm test` | Vitest (adapters, flow splitting, fixtures) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint (incl. `jsx-a11y`) |
| `npm run gen:api` | Regenerate `src/lib/api/generated/schema.d.ts` from `../../Banking-backend/openapi.yaml` |

## Where things are

```
src/lib/api/        the connector — the only fetch, the only URLs, Zod wire
                    schemas, adapters, and the served-operation registry
src/app/api/        BFF proxy (auth cookie exchange lives here)
src/lib/mock/       fixtures for mock mode and not-yet-served operations
src/lib/types/      the domain types screens are written against
src/lib/flows/      deposit-splitting arithmetic (pure, unit-tested)
```
