# BankingApp

A modern banking web application. This document is the implementation plan for the
**frontend** (Next.js + React), designed so that a **Python/FastAPI backend** can be
plugged in later with minimal churn.

---

## 1. Scope of This Plan

**In scope**

- A complete Next.js frontend in [`Frontend/`](Frontend/)
- A women-centered product and UI design system
- A fully typed API connector layer, backed by mock data today and a live FastAPI
  service tomorrow — swapped via a single environment variable
- A written API contract that the backend team can build against

**Out of scope (for now)**

- Any Python implementation in [`Backend/`](Backend/)
- Real authentication, real money movement, PCI/SOC2 concerns
- Database design

**Status:** the UI layer is built and running. The connector layer (§5) is
specified but not yet implemented — screens currently read from typed fixtures
that already match the planned response shapes. See §11 for exactly what exists.

---

## 2. Design Philosophy

The goal is not to "shrink it and pink it." Research on women and financial services
points consistently at a handful of unmet needs, and those needs — not decoration —
drive the feature set. Aesthetics support the product thesis; they aren't the thesis.

### 2.1 Product Pillars

| Pillar | Why it matters | How it shows up in the UI |
|---|---|---|
| **Safety & privacy** | Financial abuse and coercive control disproportionately affect women; shoulder-surfing in shared spaces is a daily reality | One-tap balance blur ("Privacy Mode"), instant card freeze, active-session list with revoke, trusted-contact designation, alerts on new device logins |
| **Shared-finance transparency** | Joint accounts often obscure who sees and controls what | Explicit "who can see this account" panel, per-account permission badges, activity attribution on every joint transaction |
| **Plain language & fee honesty** | Jargon and buried fees erode trust and are a documented driver of disengagement | No unexplained acronyms; inline glossary tooltips; a standing "Fees you paid this month" card with zero-fee months celebrated |
| **Life-event goal planning** | Career breaks, caregiving, and the pay gap create non-linear income that generic tools model badly | Goal buckets (emergency fund, career break, caregiving, home, education), a "career pause" projector showing the retirement/savings impact of time out of work |
| **Non-condescending education** | Financial content aimed at women often skews patronizing | Short, opt-in explainers attached to the screen they're relevant to — never a separate "learn" ghetto, never "treat yourself" framing |
| **Inclusive identity** | Name changes after marriage/divorce, chosen names, and nonbinary users are all poorly served by legacy banks | Chosen-name and pronoun fields, display name separate from legal name, optional gender field with a real set of options |

### 2.2 Visual Direction

- **Warm, high-contrast neutrals** as the base (warm greys, cream, deep ink) with a
  single confident accent. Not pastel-washed, not corporate-navy.
- **Editorial typography** — a humanist sans for UI, a display face for balances and
  headlines. Numbers get tabular figures so columns align.
- **Generous whitespace and soft geometry** — larger radii, low-contrast shadows,
  no dense data-table-first layouts.
- **Calm color semantics** — money out is not aggressively red; it's a muted terracotta.
  Reserve alarm colors for genuine alarms (fraud, overdraft).
- **Motion with restraint** — 150–250ms easing on state changes, and every animation
  respects `prefers-reduced-motion`.

### 2.3 Accessibility Baseline (non-negotiable)

- WCAG 2.2 AA: 4.5:1 text contrast, 3:1 for UI boundaries and graphical objects
- Full keyboard operability, visible focus rings, logical tab order
- Semantic landmarks, correct heading hierarchy, `aria-live` for balance and
  transaction updates
- Target sizes ≥ 24×24 CSS px (44×44 on touch surfaces)
- Never encode meaning in color alone — pair with icon or text
- Dark mode as a first-class theme, not an inverted afterthought

---

## 3. Tech Stack

| Concern | Choice | Rationale |
|---|---|---|
| Framework | **Next.js 15+, App Router** | Server Components, route handlers for the BFF proxy, file-based routing |
| Language | **TypeScript**, `strict: true` | The API contract is the whole point; types are the enforcement mechanism |
| Styling | **Tailwind CSS v4** + CSS custom properties for tokens | Fast iteration; tokens keep theming honest |
| Components | **shadcn/ui** (Radix primitives) | Accessible-by-default primitives we own and restyle, no vendor lock |
| Server state | **TanStack Query v5** | Caching, retry, optimistic updates, request dedup — all things we'd otherwise hand-roll around `fetch` |
| Client state | **Zustand** | Small. Only for genuinely client-side state (privacy mode, theme, UI prefs) |
| Forms | **React Hook Form + Zod** | Zod schemas double as the runtime validators for API responses |
| Charts | **Recharts** | Spending/goal visualizations |
| Mocking | **MSW (Mock Service Worker)** | Mocks at the network layer, so app code is identical in mock and live modes |
| Testing | **Vitest** + **Testing Library** + **Playwright** + **axe-core** | Unit, integration, E2E, and automated a11y |
| Quality | ESLint, Prettier, `eslint-plugin-jsx-a11y`, Husky + lint-staged | |

---

## 4. Folder Structure

```
BankingApp/
├── Backend/                        # FastAPI lives here later. Empty for now.
├── Frontend/
│   ├── src/
│   │   ├── app/                    # App Router
│   │   │   ├── (marketing)/        # Public: landing, about, security
│   │   │   ├── (auth)/             # Sign in, sign up, MFA, recovery
│   │   │   ├── (app)/              # Authenticated shell
│   │   │   │   ├── dashboard/
│   │   │   │   ├── accounts/[id]/
│   │   │   │   ├── transactions/
│   │   │   │   ├── transfer/
│   │   │   │   ├── goals/
│   │   │   │   ├── insights/
│   │   │   │   ├── learn/
│   │   │   │   └── settings/
│   │   │   ├── api/                # BFF proxy route handlers -> FastAPI
│   │   │   │   └── [...path]/route.ts
│   │   │   ├── layout.tsx
│   │   │   └── globals.css
│   │   ├── components/
│   │   │   ├── ui/                 # Primitives (Button, Card, Dialog, ...)
│   │   │   ├── banking/            # Domain (AccountCard, TransactionRow, ...)
│   │   │   ├── charts/
│   │   │   └── layout/             # Shell, Nav, Sidebar, MobileTabBar
│   │   ├── lib/
│   │   │   ├── api/                # ◀ THE CONNECTOR LAYER — see §5
│   │   │   │   ├── client.ts
│   │   │   │   ├── config.ts
│   │   │   │   ├── errors.ts
│   │   │   │   ├── types.ts
│   │   │   │   ├── generated/      # openapi-typescript output (gitignored later)
│   │   │   │   ├── schemas/        # Zod runtime validators
│   │   │   │   ├── endpoints/      # One file per FastAPI router
│   │   │   │   ├── hooks/          # TanStack Query hooks
│   │   │   │   └── mock/           # MSW handlers + fixtures
│   │   │   ├── format/             # Currency, date, number formatting
│   │   │   ├── utils/
│   │   │   └── store/              # Zustand slices
│   │   ├── styles/tokens.css
│   │   └── types/
│   ├── public/
│   ├── tests/e2e/
│   ├── .env.example
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   └── package.json
├── docs/
│   └── api-contract.md             # Frontend's expectations, for the backend team
└── ReadMe.md
```

---

## 5. Backend Connector Architecture

This is the part that determines whether swapping in FastAPI is a one-day job or a
two-week refactor. Five rules:

> 1. No component ever calls `fetch` directly.
> 2. URL strings appear in exactly one place: `lib/api/endpoints/`.
> 3. Mock and live modes satisfy the identical TypeScript contract.
> 4. Every response is validated at runtime, not just at compile time.
> 5. Credentials never touch `localStorage` — the BFF proxy owns them.

### 5.1 Layer Diagram

```
React Component
      │  (only ever calls hooks)
      ▼
lib/api/hooks/useAccounts.ts          TanStack Query: cache, retry, invalidation
      ▼
lib/api/endpoints/accounts.ts         listAccounts() — the ONLY place a URL exists
      ▼
lib/api/client.ts                     fetch wrapper: base URL, headers, timeout,
      │                               error normalization, Zod validation
      ├──────────────► MSW handlers (NEXT_PUBLIC_API_MODE=mock)   ← today
      └──────────────► /api/[...path] → FastAPI (mode=live)       ← later
```

Flipping from mock to live is one env var. No application code changes.

### 5.2 `client.ts` — the single fetch wrapper

Responsibilities:

- Read base URL from config; prefix every path
- Attach `Content-Type`, `Accept`, request-ID, and `credentials: 'include'`
- Enforce a timeout via `AbortController`
- Normalize **FastAPI's actual error shapes**:
  - `4xx/5xx` → `{ "detail": "string" }`
  - `422` → `{ "detail": [{ "loc": [...], "msg": "...", "type": "..." }] }`
    → mapped into field-level errors React Hook Form can consume directly
- Parse and validate the body against a Zod schema, throwing `ApiValidationError`
  on a contract mismatch (this is what catches backend drift on day one)
- Retry idempotent GETs with backoff; never retry POST/PUT/PATCH/DELETE
- Throw a typed `ApiError` with `status`, `code`, `message`, `fieldErrors`, `requestId`

```ts
// Shape of the public surface
export async function apiFetch<T>(
  path: string,
  opts: {
    method?: HttpMethod;
    body?: unknown;
    query?: Record<string, string | number | boolean | undefined>;
    schema?: ZodType<T>;
    signal?: AbortSignal;
  },
): Promise<T>;
```

### 5.3 `endpoints/` — one module per FastAPI router

Mirroring FastAPI's router structure keeps the mapping obvious:

```ts
// lib/api/endpoints/accounts.ts   ⇄  Backend/app/routers/accounts.py
export const accountsApi = {
  list:        ()                     => apiFetch('/accounts', { schema: AccountListSchema }),
  get:         (id: string)           => apiFetch(`/accounts/${id}`, { schema: AccountSchema }),
  transactions:(id: string, q: TxQuery)=> apiFetch(`/accounts/${id}/transactions`,
                                            { query: q, schema: TxPageSchema }),
};
```

Planned modules: `auth`, `accounts`, `transactions`, `transfers`, `goals`,
`insights`, `cards`, `security`, `profile`, `education`.

### 5.4 Types: hand-written now, generated later

Phase 1: hand-write TypeScript types + Zod schemas from the contract in
[`docs/api-contract.md`](docs/api-contract.md).

Phase 2 (once FastAPI exists): FastAPI auto-publishes OpenAPI at
`/openapi.json`. Add a script:

```json
"gen:api": "openapi-typescript http://localhost:8000/openapi.json -o src/lib/api/generated/schema.d.ts"
```

The generated types then become the source of truth, and any drift between the
Pydantic models and the frontend surfaces as a TypeScript error in CI. Zod schemas
stay hand-maintained for runtime validation (or move to `zod-openapi` codegen).

**Convention that avoids a whole class of pain:** FastAPI/Pydantic emit `snake_case`.
Rather than mapping case at every call site, we either (a) configure Pydantic with a
camelCase alias generator on the backend, or (b) run a single `camelizeKeys` transform
inside `client.ts`. **Decision: option (a)** — the backend serializes camelCase. This
is recorded in the contract doc so it isn't discovered late. `client.ts` ships with the
transform available as a fallback if that decision changes.

### 5.5 Auth: BFF proxy, not localStorage

A Next.js Route Handler at `app/api/[...path]/route.ts` proxies to FastAPI:

- FastAPI issues a JWT → the route handler stores it in an **httpOnly, Secure,
  SameSite=Lax cookie**. It is never readable by JavaScript, which removes the
  XSS token-theft path entirely.
- The browser calls same-origin `/api/*`; the proxy attaches `Authorization: Bearer`
  server-side and forwards to `API_INTERNAL_URL`.
- Side benefits: no CORS configuration, the real backend URL is never exposed to the
  client, and refresh-token rotation is handled in one server-side place.

Until FastAPI exists, the same route handler returns fixtures — so the auth flow is
real and exercised from day one.

### 5.6 Mock mode

MSW handlers in `lib/api/mock/handlers/` implement every endpoint in the contract,
backed by fixtures in `lib/api/mock/fixtures/`. Because MSW intercepts at the network
layer, **the app cannot tell the difference** between mock and live. Handlers also
simulate latency, 422 validation errors, 401 expiry, and 500s, so loading and error
states are built against realistic conditions rather than retrofitted.

### 5.7 Config

```ts
// lib/api/config.ts
export const apiConfig = {
  mode:      process.env.NEXT_PUBLIC_API_MODE ?? 'mock',  // 'mock' | 'live'
  baseUrl:   process.env.NEXT_PUBLIC_API_BASE_URL ?? '/api',
  internalUrl: process.env.API_INTERNAL_URL ?? 'http://localhost:8000',  // server-only
  timeoutMs: Number(process.env.NEXT_PUBLIC_API_TIMEOUT_MS ?? 15000),
};
```

`.env.example`:

```bash
NEXT_PUBLIC_API_MODE=mock
NEXT_PUBLIC_API_BASE_URL=/api
NEXT_PUBLIC_API_TIMEOUT_MS=15000
API_INTERNAL_URL=http://localhost:8000       # server-only, never NEXT_PUBLIC_
```

---

## 6. API Contract (v0 draft)

Written frontend-first so the backend has a target. Full detail lives in
[`docs/api-contract.md`](docs/api-contract.md).

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/auth/register` | Create account |
| `POST` | `/auth/login` | Credentials → JWT |
| `POST` | `/auth/mfa/verify` | MFA challenge |
| `POST` | `/auth/refresh` | Rotate token |
| `POST` | `/auth/logout` | Revoke session |
| `GET` | `/me` | Current user + preferences |
| `PATCH` | `/me` | Update display name, pronouns, prefs |
| `GET` | `/accounts` | List accounts |
| `GET` | `/accounts/{id}` | Account detail + balance |
| `GET` | `/accounts/{id}/permissions` | Who can see this account (shared-finance pillar) |
| `GET` | `/transactions` | Paginated, filterable, searchable |
| `GET` | `/transactions/{id}` | Detail + merchant enrichment |
| `PATCH` | `/transactions/{id}` | Recategorize, add note |
| `POST` | `/transfers` | Move money |
| `GET` | `/transfers/recipients` | Saved payees |
| `GET` | `/goals` · `POST` `/goals` | Goal buckets |
| `PATCH`/`DELETE` | `/goals/{id}` | Edit / remove |
| `POST` | `/goals/{id}/contribute` | Fund a goal |
| `GET` | `/insights/spending` | Category breakdown by period |
| `GET` | `/insights/fees` | Fees paid — transparency pillar |
| `GET` | `/insights/career-pause` | Career-break projection |
| `GET` | `/cards` | Cards + status |
| `POST` | `/cards/{id}/freeze` | Freeze / unfreeze |
| `GET` | `/security/sessions` | Active devices |
| `DELETE` | `/security/sessions/{id}` | Revoke a session |
| `GET` | `/education/articles` | Learning content |

**Conventions:** cursor pagination (`?cursor=&limit=`), ISO-8601 UTC timestamps,
money as **integer minor units + ISO-4217 currency code** (never floats), camelCase
response keys, `X-Request-ID` echoed on every response.

---

## 7. Route Map

| Route | Description |
|---|---|
| `/` | Landing — product thesis, security posture, no dark patterns |
| `/security` | Plain-language explanation of how money and data are protected |
| `/signin`, `/signup`, `/mfa`, `/recover` | Auth flows |
| `/dashboard` | Balance summary, Privacy Mode toggle, goals-at-a-glance, recent activity, fee card |
| `/accounts/[id]` | Account detail, permissions panel, statements |
| `/transactions` | Search, filter, category editing, receipt notes |
| `/transfer` | Multi-step transfer with a real review step |
| `/goals` | Goal buckets, progress, contribution scheduling |
| `/goals/career-pause` | Career-break planner and projection |
| `/insights` | Spending, trends, fee transparency |
| `/learn` | Contextual explainers |
| `/settings/*` | Profile (chosen name, pronouns), security, sessions, privacy, notifications, appearance |

---

## 8. Design Tokens — deep plum (implemented)

Defined as CSS custom properties in `Frontend/src/app/globals.css` and exposed to
Tailwind via `@theme inline`, so utilities read `bg-surface` / `text-ink` /
`border-border` and both themes flip from one place.

```css
:root {
  --bg:            #FBF8F5;  /* warm cream                            */
  --surface:       #FFFFFF;
  --surface-sunk:  #F3EEE9;
  --ink:           #1C1917;  /* 16.5:1 on bg                          */
  --ink-muted:     #57534E;  /*  7.2:1 on bg                          */
  --ink-subtle:    #6B6560;  /*  5.4:1 on bg                          */
  --border:        #E7E0D8;  /* decorative separation                 */
  --border-strong: #988C7F;  /*  3.1:1 — form-control boundaries      */
  --accent:        #6B4E7A;  /* deep plum — 6.6:1 on bg               */
  --accent-hover:  #573F63;
  --accent-soft:   #F0E8F4;
  --accent-on:     #FFFFFF;  /*  7.0:1 on filled plum                 */
  --positive:      #2F6B4F;  /* money in                              */
  --negative:      #A14A38;  /* money out — muted terracotta          */
  --alert:         #B3261E;  /* genuine alerts only                   */
}
```

The dark theme redefines every one of these under `[data-theme="dark"]` with steps
selected for a dark surface (plum lifts to `#C9A6DC`), not an inversion.

**Verified, not asserted.** Every foreground/background pairing in both themes was
checked with a WCAG contrast script: 4.5:1 for text, 3:1 for UI boundaries and focus
indicators. The first pass failed on `--border-strong` in both themes (2.2:1) and
those values were re-stepped until they passed. All pairings currently pass.

### Data-visualization colors are separate on purpose

The brand plum is deliberately muted, which means it reads as **gray** when it
becomes a chart fill — it fails the chroma floor for a data mark. Charts therefore
use their own validated steps:

| Role | Light | Dark |
|---|---|---|
| `--series-1` (money out) | `#7A3E9E` | `#9C5FBE` |
| `--series-2` (money in) | `#B07A2B` | `#B8862F` |

This pair passes all five checks in both modes — lightness band, chroma floor,
CVD separation (ΔE 27.2 deutan light / 23.6 dark, against a ≥ 8 target),
normal-vision separation, and ≥ 3:1 contrast on its surface. A plum/green pairing
was tried first and rejected: 7.4 ΔE under deuteranopia.

Chart forms follow from the data's job, not from decoration: spending-by-category
is a **single-hue sorted bar chart** (identity comes from the axis label, so color
never has to carry it), and only the two-series money-in/out trend uses a
categorical pair. Both offer a table view; neither uses a second y-axis.

---

## 9. Implementation Roadmap

### Phase 1 — Foundation
1. `create-next-app` in [`Frontend/`](Frontend/) — TypeScript, App Router, Tailwind
2. ESLint, Prettier, `jsx-a11y`, Husky, lint-staged, `tsconfig` strict
3. Tokens, theme provider, dark mode, base layout shell
4. shadcn/ui primitives installed and restyled to the token set

### Phase 2 — Connector layer (before any screen is built)
5. `config.ts`, `errors.ts`, `client.ts` with FastAPI error normalization
6. Types + Zod schemas for the full v0 contract
7. All `endpoints/` modules
8. MSW handlers + fixtures, including error and latency simulation
9. TanStack Query provider, hooks, cache-key conventions
10. Write [`docs/api-contract.md`](docs/api-contract.md) and hand it to the backend

### Phase 3 — Core banking UI
11. Auth flows against the BFF proxy
12. Dashboard, account cards, Privacy Mode
13. Transaction list — virtualized, filterable, searchable
14. Transfer flow with review step
15. Loading skeletons and error boundaries on every route

### Phase 4 — Differentiating features
16. Goals, contributions, progress visualization
17. Career-pause planner
18. Fee transparency card and insights charts
19. Security center: sessions, card freeze, trusted contact
20. Account permissions panel
21. Contextual education modules

### Phase 5 — Polish and verification
22. Full responsive pass (mobile tab bar → desktop sidebar)
23. Motion pass with `prefers-reduced-motion` support
24. axe-core automated audit + manual keyboard and screen-reader pass
25. Playwright E2E on the critical paths
26. Lighthouse: performance, a11y, best practices ≥ 95

### Phase 6 — Backend integration (when FastAPI is ready)
27. Point `API_INTERNAL_URL` at the live service
28. Run `gen:api` to generate types from `/openapi.json`
29. Reconcile any drift between generated types and hand-written schemas
30. Set `NEXT_PUBLIC_API_MODE=live`, keep MSW for tests
31. Contract tests in CI to catch future drift automatically

---

## 10. Testing Strategy

| Layer | Tool | Coverage |
|---|---|---|
| Unit | Vitest | Formatters, Zod schemas, `client.ts` error mapping, store logic |
| Component | Testing Library | Rendering, interaction, ARIA |
| Integration | Vitest + MSW | Hooks against mocked endpoints, including 401/422/500 paths |
| E2E | Playwright | Sign in → dashboard → transfer → goal contribution |
| A11y | axe-core in CI | Every route, zero violations gate |
| Contract | Generated types vs. Zod schemas | Fails CI when the backend drifts |

---

## 11. Implementation Status

Run it with `cd Frontend && npm run dev`, then open `http://localhost:3000`.

### Built

- **Design system** — deep plum tokens, light + dark themes, WCAG-verified
  (§8). Theme applied pre-paint by an inline script, so there's no flash of the
  wrong theme; `prefers-reduced-motion` honoured globally.
- **App shell** — desktop sidebar, mobile tab bar, skip link, sticky header.
- **Privacy Mode** — one control in the header blurs every amount in the app at
  once and persists across reloads. Implemented once, in the `Amount` component,
  so no screen can forget it.
- **Screens** — landing, dashboard, accounts, account detail (with the "who can
  see this account" panel), activity with search + category filters, goals,
  career-break planner, insights, security centre, settings.
- **Charts** — money in/out trend and spending-by-category, both hand-built,
  both with a table view and hover tooltips, no charting dependency.
- **Money handling** — integer minor units end to end, formatted only at the
  edge; tabular figures so columns align.
- **Flows** — the flow-based budgeting system specified in
  [`docs/flow-budgets.md`](docs/flow-budgets.md): source discovery, a
  three-step builder with a derived-Rest split editor, a preview that dry-runs
  against a real past deposit, and run history. Its splitting arithmetic is a
  pure, unit-tested function (`src/lib/flows/split-deposit.ts`) — 27 tests,
  including a 5,000-case sweep asserting every split reconciles to the cent.
  Carries its own scrapbook surface (paper, tape, dashed thread, grain) layered
  on the same tokens. Shares can be arranged either in a list editor or on a
  **node canvas** (React Flow, restyled onto the same tokens) — both are views
  of the same state, and a flow built either way lands on the flows page
  identically.

### Deliberate deviations from the plan above

| Plan said | Built instead | Why |
|---|---|---|
| Zustand for UI state | React context + `useSyncExternalStore` | Only two preferences, and both live on `<html>` already. Reading the DOM as an external store avoids a hydration mismatch with no dependency. |
| Recharts | Hand-built SVG/CSS charts | Full control of the validated palette and token theming, no React 19 peer risk, ~0 KB added. |
| — | **React Flow** (`@xyflow/react`) for the Flows node canvas | The one place a library earned its weight: panning, zooming, edge routing, and connection dragging are a lot of correctness to hand-roll. Restyled onto our tokens; the accessible list view remains a peer, never a fallback. |
| shadcn/ui | Hand-written primitives | Same Radix-free markup at this scale, without pulling in a generator. Swap in later if a dialog/menu needs real focus management. |

### Not built yet

The entire connector layer (§5): `client.ts`, `endpoints/`, Zod schemas, TanStack
Query hooks, MSW handlers, and the BFF proxy at `app/api/[...path]`. Also absent:
auth flows, tests, and `docs/api-contract.md`. Fixtures live in
`Frontend/src/lib/mock/data.ts` and are typed against
`Frontend/src/lib/types/banking.ts`, which is written to the wire conventions in
§6 — so introducing the real client is a matter of swapping the data source
behind the same types, not reshaping the screens.

---

## 12. Notes for the Backend Team

When [`Backend/`](Backend/) is built, these frontend assumptions matter:

1. **Serialize camelCase** — configure a Pydantic alias generator (`to_camel`) with
   `populate_by_name=True`.
2. **Money as integer minor units** plus a currency code. No floats, ever.
3. **Keep the `422` validation shape** — the frontend maps `detail[].loc` straight
   into form field errors.
4. **Cursor pagination**, returning `{ items, nextCursor, hasMore }`.
5. **Publish OpenAPI at `/openapi.json`** with `operation_id`s set explicitly —
   they become the generated client's function names.
6. **Router names should match** `lib/api/endpoints/` module names.
7. **Echo `X-Request-ID`** so client and server logs can be correlated.
8. **Auth**: short-lived access token + rotating refresh token; the Next.js BFF
   holds both, the browser holds neither.
