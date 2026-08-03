# Flows — a flow-based budgeting system

> **Status:** built. The UI, the scrapbook layer, and the splitting arithmetic
> are implemented against fixtures; the API in §13 is not yet wired.
> **Depends on:** the design system and screens in [`../ReadMe.md`](../ReadMe.md).
>
> | Spec section | Where it lives |
> |---|---|
> | §6 arithmetic, §7 edge cases | `Frontend/src/lib/flows/split-deposit.ts` (+ `.test.ts`) |
> | §9 scrapbook layer | `Frontend/src/app/globals.css` (`.paper`, `.taped`, `.thread`, `.grain`, `.tilt-*`) |
> | §10.1 list | `Frontend/src/app/(app)/flows/page.tsx` |
> | §10.2 builder | `Frontend/src/app/(app)/flows/new/` + `components/flows/split-editor.tsx` |
> | §10.2b node canvas | `components/flows/flow-canvas.tsx` + `canvas-nodes.tsx` (React Flow) |
> | §10.3 detail | `Frontend/src/app/(app)/flows/[id]/` |
>
> Flows the user builds are persisted in `lib/store/user-flows.ts` (localStorage)
> as the stand-in for `POST /flows`, and are merged with the shipped examples on
> the flows page.
> | §12 types | `Frontend/src/lib/types/flows.ts` |

---

## 1. The idea in one paragraph

Money arrives. A **Flow** catches it and splits it, by percentage, into the
accounts and goals you chose — automatically, the moment the deposit posts. You
build a Flow by picking **who pays you**, choosing **where their money should
go**, and setting **what share each destination gets**. You can have as many
Flows as you have income sources, and each one behaves independently.

Traditional budgets ask "what did I spend?" after the fact. A Flow asks "where
should this go?" before you can spend it at all.

---

## 2. Why percentages, and why this app

Most budgeting tools assume a fixed monthly salary: you set a $400 grocery
budget, and the tool tells you off when you overspend. That model breaks the
moment income varies — freelance invoices, commission, shift work, a return from
parental leave at reduced hours, two part-time roles.

Percentage-based splitting scales with whatever arrives. A 20% savings share
takes $1,200 from a $6,000 month and $400 from a $2,000 month, with no
re-planning and no failure state. Nothing needs adjusting in a lean month —
which is exactly when re-planning a budget is hardest.

This connects directly to the product pillars already in the ReadMe:

| Pillar | How Flows serve it |
|---|---|
| **Life-event goal planning** | Flows fund goals automatically, including the career-break fund, so the buffer builds without a monthly decision. |
| **Safety & privacy** | Routing money *into* a shared account is a visibility event. The builder says so, out loud, before you finish. |
| **Plain language** | The preview says "About $612 would go here" — never "20% allocation to destination 3". |
| **Non-condescending education** | A Flow explains its own arithmetic. It never grades you or congratulates you for buying less coffee. |

---

## 3. Vocabulary

Pick these words once and use them everywhere — in the UI, the types, and the
API. Users see the left column; the right column never appears on screen.

| User-facing word | Internal name | What it is |
|---|---|---|
| **Flow** | `Flow` | One income source plus the rules for splitting it. |
| **Source** | `FlowSource` | Who pays you — an employer, a client, a benefit body. |
| **Split** | `FlowSplit` | One share, pointing at one destination. |
| **Destination** | `FlowDestination` | An account or a goal that receives a share. |
| **Rest** | `remainder` split | The catch-all that absorbs whatever is left. |
| **Run** | `FlowRun` | One execution — the record of a deposit being split. |

Avoid: "rule", "allocation", "bucket", "envelope", "trigger", "automation". They
are either jargon or someone else's product.

---

## 4. The build journey

Three steps. The user can go back at any point, and nothing is live until the
final confirmation — the same review-before-commit principle as the transfer
flow.

```
  Step 1              Step 2                     Step 3
┌──────────┐       ┌──────────────┐          ┌──────────────┐
│ Who pays │  ───► │ Where should │   ───►   │  Preview &   │
│   you?   │       │  it go, and  │          │  turn it on  │
│          │       │  how much?   │          │              │
└──────────┘       └──────────────┘          └──────────────┘
  Source            Splits + %                Dry run on the
  discovery         (must total 100%)         last real deposit
```

### Step 1 — Who pays you? (source discovery)

The screen opens with **detected sources**, not an empty form. We scan posted
credits from the last 12 months and group them by payer.

A candidate becomes a suggestion when it has **two or more credits from the same
payer**. For each we show:

- The payer name, cleaned up (`NORTHWIND DESIGN STUDIO ACH` → "Northwind Design Studio")
- Cadence, in plain words — "about every 2 weeks", "monthly", "irregular"
- The last three amounts, so the user recognises it
- Which account it lands in

Sorted by total value received, not by date — the main income appears first.

Below that, always: **"Someone else pays me"** → manual entry (payer name, which
account it arrives in, roughly how often). Manual sources are matched on the
payer name once a deposit actually arrives.

> **Do not** require the user to know an amount at this step. Percentage flows
> exist precisely because the amount is not knowable in advance.

### Step 2 — Where should it go?

The heart of the feature. The user adds destinations and assigns each a share.

**Rules:**

1. Shares are percentages of the deposit, and **must total exactly 100%**.
2. Exactly one split is marked **Rest**. It has no percentage of its own — it
   receives whatever the others don't. This guarantees the total always
   reconciles and means the user never has to make the last number fit.
3. A **set-aside** may be added *before* percentages: a fixed amount (e.g.
   $1,450 rent) taken off the top. Percentages then apply to what remains. Fixed
   set-asides are capped at the deposit — see §7.
4. Destinations may be accounts or goals. A goal destination contributes to the
   goal *and* moves the money into the account backing it.
5. Minimum share is 1%. Below that, use a set-aside instead.

**Interaction:** each split is a row with a slider *and* a number input, kept in
sync. Dragging one share adjusts **Rest** only — never the other user-set
shares. This is the single most important interaction rule in the feature: a
slider that silently rebalances everyone else is infuriating and makes the
result impossible to predict. If Rest would go below 0%, the drag stops at the
boundary and a quiet line explains why.

Live under the splits, always visible: **"Of a typical $6,125 deposit"**, with
each row showing its cash equivalent. Percentages are abstract; dollars are not.

### Step 3 — Preview and turn on

A dry run against the **most recent real deposit** from that source. Not an
example, not a round number — their actual last payment, split exactly as the
rules would have split it, cents included.

The screen also states plainly:

- When it will next run ("the next time Northwind pays you")
- Anything routed to a **shared account**, and who else can see it
- That they can pause or delete it at any time, and that pausing is instant

Only then: **Turn on this Flow**.

---

## 5. Multiple Flows

Flows are independent and each is bound to one source.

- **Matching:** when a credit posts, we find the Flow whose source matches the
  payer *and* the destination account. Exactly one Flow may claim a deposit.
- **No match:** the money simply stays where it landed. Nothing happens
  silently, and no default Flow ever claims unmatched income.
- **Ambiguity:** if two Flows could match the same payer, the app refuses to
  activate the second one and says which existing Flow already covers it. This
  is a build-time error, never a runtime surprise.
- **Ordering:** because one deposit maps to one Flow, there is no priority
  system to reason about. This is deliberate — flow-ordering rules are where
  systems like this become unexplainable.

Typical setup:

```
Flow "Northwind"   ← main client        →  Rest 40% · Safety net 20% · Career break 25% · Household 15%
Flow "Two Rivers"  ← second client      →  Rest 30% · Deposit 70%
Flow "Refunds"     ← irregular credits  →  Rest 100%   (paused)
```

---

## 6. Splitting arithmetic

Money is integer minor units throughout, consistent with the rest of the app.
Percentages of an integer never divide evenly, so the method must be specified
or the cents will not reconcile.

**Order of operations, for a deposit of `D` cents:**

1. Subtract set-asides in the order the user listed them. Each is
   **all-or-nothing**: one that doesn't fit is skipped entirely, and so is every
   set-aside after it — even a later, smaller one that would have fitted.
   Funding it would silently reorder the user's stated priorities (see §7).
2. `R` = what's left. For each percentage split, compute `floor(R × pct / 100)`.
3. Sum the floors. The shortfall (always < number of splits, in cents) goes
   **entirely to the Rest destination**.
4. Rest receives `R − sum(floors)`.

Worked example — a $4,127.33 deposit, splits 50 / 30 / 20 with the 20% as Rest:

```
D                = 412733¢
50% → floor(206366.5) = 206366¢   →  $2,063.66
30% → floor(123819.9) = 123819¢   →  $1,238.19
Rest             = 412733 − 206366 − 123819 = 82548¢  →  $825.48
                                     total = 412733¢  ✓ reconciles exactly
```

Rest absorbing the odd cents keeps every other destination predictable and makes
the total provably exact. Never use banker's rounding here — it produces totals
that don't add up to the deposit, which is indefensible on a bank statement.

---

## 7. Edge cases

These are the cases that decide whether the feature is trustworthy. Each needs a
defined behaviour and a plain-language message.

| Situation | Behaviour | What the user sees |
|---|---|---|
| Deposit smaller than the set-asides | Set-asides are all-or-nothing and stop at the first that doesn't fit; none is ever partially funded | "This deposit was smaller than usual, so the $200 to Safety net didn't happen. Nothing was overdrawn." |
| Deposit is a **pending** credit | Wait. Flows run on **posted** credits only | Flow shows "Waiting for this to clear" |
| Deposit later reversed | Reverse every transfer in that run, as one linked correction | "Northwind's payment was reversed, so we moved the splits back." |
| A destination account is **frozen** | Skip that split, send its share to Rest, flag the run | "Safety net is frozen, so its share went to Everyday instead." |
| The **Rest** destination is frozen | Flow does not run at all. Rest is the safety valve every redirect depends on, so it must be usable | "The account that receives the rest is frozen, so this flow can't run." |
| A destination was **closed or deleted** | Flow moves to `needs-attention` and does not run | Flow card shows an amber "Needs a moment" state with the fix inline |
| Percentages don't total 100% | Cannot activate. Rest makes this near-impossible by construction | Inline, non-blocking hint while editing |
| Source stops paying | After 2 missed expected cadences, a gentle prompt — never an alarm | "Northwind hasn't paid since March. Pause this Flow?" |
| Two Flows match one payer | Second Flow refuses to activate | Names the conflicting Flow, links to it |
| Destination is a **shared** account | Allowed, but surfaced prominently at Step 3 and on the Flow detail | "Daniel can see money that arrives here." |

**Safety note.** Never notify a joint-account co-owner that a Flow was created,
edited, paused, or deleted. A co-owner sees the *money* that arrives in an
account they share — that is unavoidable and is why we say so up front — but the
existence and configuration of a Flow is private to its owner. This follows the
same reasoning as the "Leaving safely" section in the security centre.

---

## 8. Flow states

| State | Meaning | Visual |
|---|---|---|
| `draft` | Being built, never run | Dashed border, no tape, muted |
| `active` | Running on each matching deposit | Full paper card, tape corner, plum accent |
| `paused` | Kept, but ignores deposits | Desaturated, tape corner peeled up |
| `needs-attention` | Cannot run — broken destination or conflict | Amber edge + an inline explanation and fix |

`paused` must be reachable in **one tap** from the Flow card. Like freezing a
card, the moment you want it is not a moment for a flow of screens.

---

## 9. The scrapbook UI

The brief: *feel like a scrapbook, but not too scrappy.* The resolution is that
**texture and warmth are decorative; structure and type stay disciplined.** The
page should feel handmade. The numbers should never feel handmade.

### What makes it feel like a scrapbook

- **Paper, not glass.** Flow cards sit on a warm paper fill with a soft deckle
  edge and a 1px inner highlight, rather than the flat surface used elsewhere.
- **Tape.** A single semi-transparent tape strip at one corner of each Flow card,
  rotated ~-4°. It is the signature element — one per card, never two.
- **Thread.** Connections between a source and its destinations are drawn as
  **dashed 2px lines** with a small filled node where they meet a card, like
  stitching or a pencil line ruled between clippings.
- **Tilt.** Decorative elements only, and never more than **±1.5°**. Enough to
  read as placed by hand; not enough to look broken.
- **A handwritten face,** used *only* for the Flow's name — nowhere else. Caveat
  or similar, loaded as a third font alongside Inter and Fraunces.
- **Stickers.** Destination chips get a small die-cut look: rounded, a slight
  offset shadow, a hairline ring.
- **Grain.** One very low-opacity noise layer across the Flows canvas
  background — not on cards, and never behind body text.

### What keeps it from being too scrappy

These are hard rules, not preferences:

1. **Nothing interactive is ever rotated.** Buttons, inputs, sliders, links, and
   focus rings stay perfectly square. Tilt applies to decorative wrappers only.
2. **Layout stays on the grid.** Tilt is a `transform` — it must never change
   where an element actually sits or how big its hit target is.
3. **All amounts stay in the existing type system** — Fraunces or Inter, tabular
   figures. The handwritten face is banned from anything numeric. A figure that
   looks hand-drawn looks *uncertain*, which is the opposite of what a balance
   should feel like.
4. **Text never sits on texture.** Grain and paper edges live behind solid fills.
5. **Two decorative accents visible at once, maximum.** Past that it reads as a
   craft project rather than a bank.
6. **One tape strip per card. One grain layer per screen.**
7. **Contrast is unaffected.** Every token pairing keeps its verified ratio
   (4.5:1 text / 3:1 boundaries). Texture that costs contrast is removed, not
   argued for.
8. **All of it degrades.** Under `prefers-reduced-motion` nothing settles or
   wobbles. Under `forced-colors`, tape, grain, and deckle edges disappear and
   the layout stands on its own.

### Tokens to add

```css
:root {
  --paper:        #FDFBF7;  /* warmer and lighter than --surface */
  --paper-edge:   #E8DFD2;  /* deckle edge + inner hairline      */
  --tape:         #E4D9C3;  /* used at ~55% alpha                */
  --thread:       #C3B7A6;  /* dashed connectors                 */
  --grain:        0.025;    /* noise layer opacity               */
  --tilt-a:      -1.2deg;
  --tilt-b:       0.9deg;
}

[data-theme="dark"] {
  --paper:        #241F2B;
  --paper-edge:   #372F42;
  --tape:         #4A3F58;
  --thread:       #5A5166;
  --grain:        0.04;
}
```

Dark mode gets its own paper, not a dimmed sheet of the light one — same rule the
rest of the system follows.

---

## 10. Screens

### 10.1 Flows list — `/flows`

The canvas. Flow cards laid out as clippings on a page, each slightly tilted,
each taped at a corner.

```
┌──────────────────────────────────────────────────────────┐
│  Flows                                     [ + New flow ] │
│  Where your money goes before you can spend it.           │
│                                                           │
│    ╔═══════════════════╗        ╔═══════════════════╗    │
│    ║▒▒                 ║        ║▒▒                 ║    │
│    ║  ℱ Northwind      ║        ║  ℱ Two Rivers     ║    │
│    ║  every 2 weeks    ║        ║  monthly          ║    │
│    ║                   ║        ║                   ║    │
│    ║  ╌╌╌┬╌╌ Rest  40% ║        ║  ╌╌╌┬╌╌ Rest  30% ║    │
│    ║     ├╌╌ Safety 20%║        ║     └╌╌ Deposit70%║    │
│    ║     ├╌╌ Career 25%║        ║                   ║    │
│    ║     └╌╌ House  15%║        ║  ~$1,800 monthly  ║    │
│    ║                   ║        ║                   ║    │
│    ║  Active · Pause   ║        ║  Paused · Resume  ║    │
│    ╚═══════════════════╝        ╚═══════════════════╝    │
│         (tilt -1.2°)                 (tilt 0.9°)          │
└──────────────────────────────────────────────────────────┘
    ▒▒ = tape strip     ╌╌ = dashed thread connector
```

Empty state does real work — it explains the concept with a worked example
rather than showing an illustration and a button.

### 10.2 Flow builder — `/flows/new`

Three steps, one per screen on mobile, a single scrolling column on desktop with
the preview pinned alongside from `lg` up.

The split editor, the most-used screen in the feature:

```
  Where should Northwind's money go?
  ─────────────────────────────────────────────────────────
  Of a typical deposit of $6,125.00

  ┌───────────────────────────────────────────────────────┐
  │  🏛  Everyday                              40%  (rest) │
  │      Gets whatever's left                 ≈ $2,450.00 │
  ├───────────────────────────────────────────────────────┤
  │  🛡  Safety net            ●━━━━━○━━━━━━━━━━  [20] % │
  │      Goal · 71% funded                    ≈ $1,225.00 │
  ├───────────────────────────────────────────────────────┤
  │  ⏸  Career break           ●━━━━━━━○━━━━━━━━  [25] % │
  │      Goal · 31% funded                    ≈ $1,531.25 │
  ├───────────────────────────────────────────────────────┤
  │  👥  Household             ●━━━━○━━━━━━━━━━━  [15] % │
  │      Shared with Daniel                     ≈ $918.75 │
  └───────────────────────────────────────────────────────┘
             [ + Add a destination ]

  Total  100%  ✓                         Rest adjusts itself
```

Note the affordances: every row shows both a percentage *and* its cash
equivalent; the shared destination is labelled in the row, not in a footnote;
and the total is a passive confirmation rather than an error waiting to happen.

The **Rest** row has no slider and no input — its 40% is derived, and it moves as
the others move. That asymmetry is the point: it is the reason the total can
never be wrong, and the reason the user is never asked to make the last number
fit.

### 10.2b Node canvas — the second view of step 2

Step 2 offers two views of the *same* shares: the list editor above, and a node
canvas built on React Flow. Whichever you use, the flow that comes out is the
same object — there is no "canvas flow" as a separate kind of thing.

```
   Add to canvas:  [+ Household] [+ Safety Net] [+ Aster Card] [+ Deposit]
  ┌──────────────────────────────────────────────────────────────────┐
  │ · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · ·  │
  │                                    ╔════════════════════════╗    │
  │   ╔══════════════════╗             ║ THE REST               ║    │
  │   ║ MONEY COMES IN   ║╌╌╌╌╌╌╌╌╌╌╌╌►║ Everyday               ║    │
  │   ║ 𝓜eridian Studio  ║      ╎      ║ 55%   ≈ $1,562.00      ║    │
  │   ║ irregularly      ║      ╎      ╚════════════════════════╝    │
  │   ║ $2,840           ║      ╎      ╔════════════════════════╗    │
  │   ╚══════════════════╝      ╰╌╌╌╌╌►║ Safety net        [🗑] ║    │
  │                                    ║ ●━━━━━○━━━━━  [35] %   ║    │
  │ · · · · · · · · · · · · · · · · ·  ║ ≈ $994.00              ║    │
  │  [+][−][⛶]                         ╚════════════════════════╝    │
  └──────────────────────────────────────────────────────────────────┘
```

Rules carried over from the list editor, unchanged:

- **Rest is derived on the canvas too** — its card has no slider and no input,
  and its incoming thread cannot be deleted. It is the safety valve every
  redirect depends on.
- **Dragging a share adjusts Rest only.** The per-node maximum is computed from
  the other connected nodes, so a share can never push Rest below 0%.
- Destinations added from the palette arrive **already connected** (the fast
  path); the thread can be deleted and redrawn by dragging from the source
  handle for anyone who prefers to wire it themselves.
- An unconnected card is not a split. It sits on the canvas dashed and faded,
  and is simply absent from the resulting flow.

**Accessibility.** A node graph is not an accessible control surface, so it is
never the only one. The list editor is a peer view reachable in one click, the
canvas carries a collapsible *"The same shares, as a list"* summary beneath it,
and every in-node slider keeps the same `aria-valuetext` ("35 percent, about
$994") as its list-view counterpart. The share total is announced through the
same `aria-live` region in both views.

### 10.3 Flow detail — `/flows/[id]`

The Flow's rules at the top, then its **run history** — the scrapbook payoff.
Each past run is a small dated clipping showing the deposit and where it went,
stacked down the page like pasted receipts. This is where the feature earns
trust: it is a visible record that the thing did what it said.

---

## 11. Accessibility

Beyond the app-wide baseline:

- **Sliders are real `<input type="range">`** with `aria-valuetext` set to the
  spoken form — "40 percent, about $2,450" — not a bare number.
- **The number input is not a fallback, it's a peer.** Percentages must be
  settable without dragging. Anyone who cannot use a pointer precisely gets the
  same control, not a degraded one.
- **The split total is an `aria-live="polite"` region.** Adjusting one share
  changes Rest, and that change must be announced.
- **The flow diagram has a text equivalent.** The dashed-thread visual is
  decorative; the underlying list is a real `<ul>` and reads correctly with the
  diagram hidden via `aria-hidden`.
- **State is never colour alone.** Active / paused / needs-attention each carry
  an icon and a word, per the app-wide rule.
- **Tape, grain, and deckle edges are `aria-hidden` and disappear under
  `forced-colors`.**

---

## 12. Data model

Extends `Frontend/src/lib/types/banking.ts`, following the same conventions —
camelCase, ISO-8601 UTC, integer minor units.

```ts
export type FlowState = "draft" | "active" | "paused" | "needs-attention";

export type FlowSource = {
  id: string;
  /** Cleaned-up payer name shown to the user. */
  displayName: string;
  /** Raw descriptor(s) used for matching incoming credits. */
  matchPatterns: string[];
  /** Account the deposit lands in. */
  arrivesInAccountId: string;
  cadence: "weekly" | "biweekly" | "monthly" | "irregular";
  /** Median of observed deposits — for previews only, never for arithmetic. */
  typicalAmount?: Money;
  lastSeenAt?: string;
};

export type FlowDestination =
  | { kind: "account"; accountId: string }
  | { kind: "goal"; goalId: string };

export type FlowSplit = {
  id: string;
  destination: FlowDestination;
  /** Percentage of the post-set-aside remainder. Absent on the Rest split. */
  percentage?: number;
  /** Exactly one split per Flow has this. It absorbs the remainder + odd cents. */
  isRemainder: boolean;
};

export type FlowSetAside = {
  id: string;
  destination: FlowDestination;
  /** Fixed amount taken off the top, before percentages. */
  amount: Money;
  label: string;
};

export type Flow = {
  id: string;
  name: string;
  state: FlowState;
  source: FlowSource;
  setAsides: FlowSetAside[];
  splits: FlowSplit[];
  createdAt: string;
  lastRunAt?: string;
  /** Present only in needs-attention; explains what to fix, in plain words. */
  attentionReason?: string;
};

export type FlowRunLine = {
  splitId: string;
  destination: FlowDestination;
  amount: Money;
  status: "sent" | "skipped" | "redirected";
  /** Why it was skipped or redirected — shown verbatim to the user. */
  note?: string;
};

export type FlowRun = {
  id: string;
  flowId: string;
  transactionId: string;
  depositAmount: Money;
  occurredAt: string;
  lines: FlowRunLine[];
  reversedAt?: string;
};
```

**Invariants** worth asserting in tests:

- Exactly one split has `isRemainder: true`.
- Non-remainder percentages sum to ≤ 100.
- `sum(run.lines.amount) === run.depositAmount` — always, exactly.

---

## 13. API additions

New endpoints for the contract in ReadMe §6, following the same conventions.

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/flows` | List Flows with state and summary |
| `POST` | `/flows` | Create (starts in `draft`) |
| `GET` | `/flows/{id}` | Detail including splits |
| `PATCH` | `/flows/{id}` | Edit name, splits, set-asides |
| `DELETE` | `/flows/{id}` | Remove |
| `POST` | `/flows/{id}/activate` | Validate and go live; 409 on payer conflict |
| `POST` | `/flows/{id}/pause` | Pause / resume |
| `GET` | `/flows/{id}/runs` | Run history, cursor-paginated |
| `POST` | `/flows/preview` | **Dry run** — rules + a deposit amount, returns the exact lines |
| `GET` | `/flows/sources/suggestions` | Detected recurring depositors |

`POST /flows/preview` is the important one: the split arithmetic must live in
**one** implementation, server-side, and the UI must render what that returns
rather than reimplementing the maths in TypeScript. Two implementations of a
rounding rule is two rounding rules.

---

## 14. Build order

1. Types, plus a pure `splitDeposit()` function with unit tests covering the
   reconciliation invariant and every §7 edge case. Arithmetic first — the UI is
   easy to change later, a rounding bug in production is not.
2. Fixtures: 3 Flows across the states, one with run history.
3. Scrapbook tokens and the paper / tape / thread / sticker primitives, checked
   in both themes and under `forced-colors`.
4. Flows list + empty state.
5. Builder step 2 (split editor) — the hardest interaction, build it early.
6. Builder steps 1 and 3.
7. Flow detail with run history.
8. Accessibility pass: keyboard-only split editing, screen-reader run-through of
   the diagram, reduced-motion, forced-colors.

---

## 15. Open questions

1. **Should a Flow be able to fire on a schedule** rather than on a deposit
   (e.g. "the 1st of each month")? It's a common ask, but it reintroduces the
   overdraft risk that deposit-triggered flows avoid entirely. Recommend
   deferring.
2. **Should destinations include external accounts** at other banks? Materially
   changes settlement timing and failure modes; out of scope for v1.
3. **Percentage of gross vs. net** for salaried users whose deposit is already
   net of tax. Currently everything is a percentage of what actually arrives —
   worth confirming that matches expectations.
4. **Should Rest be nameable?** "Rest" is clear but flat; "Everything else" or
   letting the user title it may read better on the card.
