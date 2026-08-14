# Aster v2 — Branding & Color Scheme (Arcade Edition)

> **Last updated:** August 2026
> **Status:** 🟢 Applied to codebase
> **Supersedes:** [branding-identity.md](file:///Users/mannyfowler/Desktop/BankingApp/docs/branding-identity.md)

---

## 1. Brand Direction

The new identity draws from **classic arcade cabinets and coin-ops** — black surfaces, gold coin accents, and the unmistakable neon palette of an 80s game room. The result should feel like a premium arcade machine, not a retro novelty: dark, confident, and coin-gold where it counts.

### Mood Keywords
`black cabinet` · `gold coin slot` · `CRT phosphor glow` · `neon signage` · `pixel grid` · `insert coin` · `high score`

### What Stays
- The **Aster** name and SVG asterisk logomark (placeholder — will be replaced with a gold 8-bit blank arcade coin)
- The token-based CSS architecture (`--bg`, `--surface`, `--accent`, etc.)
- The Tailwind `@theme inline` mapping layer
- All component class names (they reference tokens, not raw colors)
- Accessibility baselines (WCAG 2.2 AA contrast ratios)

### What Changes
- Every color token (both themes)
- Typography pairing (moving from editorial warmth to arcade precision)
- Shadow and geometry feel
- Brand voice undertone (from "warm and protective" to "confident and coin-fed")

---

## 2. Logo / Brandmark

| Element | Current | New |
|---|---|---|
| **Mark** | Asterisk SVG stroke | 🟡 **Placeholder:** Keep current SVG. **Target:** Gold 8-bit blank arcade coin |
| **Mark container** | `bg-accent text-accent-on` rounded square | `bg-gold text-black` rounded square |
| **Wordmark** | "Aster" in Fraunces display serif | "Aster" in new display face (TBD — consider a pixel/mono-inspired display font) |

---

## 3. Color System — Black & Gold Base

### 3.1 Core Surfaces

The app lives on black. Cards float on near-black. Wells sink into pure black.

| Token | Light Theme | Dark Theme | Purpose |
|---|---|---|---|
| `--bg` | `#0a0a0a` | `#050505` | Cabinet black — the darkest surface |
| `--surface` | `#141414` | `#111111` | Raised cards — like the bezel around a screen |
| `--surface-sunk` | `#0d0d0d` | `#080808` | Wells, inset rows — the coin slot shadow |

> [!NOTE]
> Both themes are dark-on-dark. The "light" theme is really "arcade floor lighting" — slightly lifted blacks. The dark theme is "lights off." This is a departure from the original warm cream light mode.

### 3.2 Ink (Text)

Gold-tinted whites for high readability on black surfaces.

| Token | Light Theme | Dark Theme | Contrast on bg | Purpose |
|---|---|---|---|---|
| `--ink` | `#f0e6d3` | `#ede3cf` | ~16:1 | Primary text — warm white with a gold cast |
| `--ink-muted` | `#a89a84` | `#9e9080` | ~7.5:1 | Secondary text — faded gold |
| `--ink-subtle` | `#7a7060` | `#6e6455` | ~5:1 | Tertiary — like dimmed marquee letters |

### 3.3 Borders

| Token | Light Theme | Dark Theme | Purpose |
|---|---|---|---|
| `--border` | `#2a2520` | `#1f1b17` | Decorative separation — dark bronze edge |
| `--border-strong` | `#5c5040` | `#4a4030` | Form boundaries — visible bronze line (≥ 3:1) |

### 3.4 Accent — Coin Gold

The hero color. Every primary button, every active state, every focus ring.

| Token | Light Theme | Dark Theme | Purpose |
|---|---|---|---|
| `--accent` | `#d4a843` | `#c89b38` | **Coin gold** — the quarter in the slot |
| `--accent-hover` | `#e0b84f` | `#d4a843` | Brighter gold on hover — coin catching the light |
| `--accent-soft` | `#1f1a10` | `#1a1508` | Subtle gold fill — like a dim glow behind glass |
| `--accent-on` | `#0a0a0a` | `#0a0a0a` | Black text on gold surfaces |

### 3.5 Semantic Colors — Arcade Neons

These are the classic arcade screen colors, tuned for readability on black:

| Token | Light Theme | Dark Theme | Purpose |
|---|---|---|---|
| `--positive` | `#39e075` | `#30c965` | **Neon green** — money in, like a score going up |
| `--positive-soft` | `#0d1f12` | `#0a1a0e` | Green glow background |
| `--negative` | `#e0a030` | `#cc9028` | **Amber** — money out, like a caution light on a cabinet. Not red — spending is normal |
| `--negative-soft` | `#1f1808` | `#1a1406` | Amber glow background |
| `--alert` | `#ff4060` | `#e83855` | **Hot pink/red** — the "GAME OVER" flash. Reserved for real alarms |
| `--alert-soft` | `#1f0a10` | `#1a080d` | Alert glow background |

> [!IMPORTANT]
> The same calm-semantics rule from v1 applies: **spending is amber, not red.** Red/pink is reserved for genuine alerts (fraud, overdraft). The color changes from terracotta to arcade amber, but the philosophy holds.

### 3.6 Chart / Data Visualization

| Token | Light Theme | Dark Theme | Purpose |
|---|---|---|---|
| `--series-1` | `#d4a843` | `#c89b38` | Spending — coin gold |
| `--series-2` | `#39e075` | `#30c965` | Earning — neon green |
| `--chart-grid` | `#1a1815` | `#151310` | Grid lines — barely visible scanlines |
| `--chart-track` | `#1e1c18` | `#181612` | Unfilled meter track |

### 3.7 Scrapbook / Flows (Arcade Cabinet Variant)

The scrapbook metaphor shifts from paper/tape to **arcade cabinet panels and wiring**.

| Token | Light Theme | Dark Theme | Purpose |
|---|---|---|---|
| `--paper` | `#121010` | `#0e0c0a` | Cabinet panel surface |
| `--paper-edge` | `#2a2520` | `#201c18` | Panel edge — dark bronze |
| `--tape` | `#3a3228` | `#302820` | Metallic strip — like a coin rail |
| `--thread` | `#5c5040` | `#4a4030` | Wiring between nodes |
| `--grain` | `0.03` | `0.05` | CRT noise texture |

---

## 4. Shadows

On dark surfaces, shadows are deep blacks with slight gold-warm tinting. Glows replace traditional drop shadows in key places.

| Token | Light Theme | Dark Theme |
|---|---|---|
| `--shadow-sm` | `0 1px 2px rgb(0 0 0 / 0.4)` | `0 1px 2px rgb(0 0 0 / 0.5)` |
| `--shadow-md` | `0 4px 12px -2px rgb(0 0 0 / 0.5)` | `0 4px 12px -2px rgb(0 0 0 / 0.6)` |
| `--shadow-lg` | `0 12px 32px -8px rgb(0 0 0 / 0.6)` | `0 12px 32px -8px rgb(0 0 0 / 0.7)` |

---

## 5. Typography (Arcade Pixel & Tech Stack)

| Font | Role | Usage |
|---|---|---|
| **VT323** (`--font-sans`) | Body / UI | Classic retro CRT terminal font for body copy, labels, form controls, and lists. |
| **Silkscreen** (`--font-display`) | Display / Headings | Authentic 8-bit arcade pixel font for page headings (`h1`–`h2`) and the Aster wordmark. |
| **Teko** (`--font-numbers`) | Numbers / Balances | Tall, impactful retro-tech font for account balances and amounts. Legible but heavily stylized. |
| **Press Start 2P** (`--font-arcade` / `--font-hand`) | Arcade Accents / Badges / Flows | Classic 8-bit coin-op pixel font for flow nodes, arcade accents, and retro badges. |

### Typographic Rules
- **Tabular lining numerals** (`.tabular`): Digits render with consistent monospace arcade alignment for fast scanning.
- **Arcade balances**: Account balances and hero metrics render with `Teko` to provide an impactful, legible arcade dashboard feel.

---

## 6. Geometry

| Token | Value | Change from v1 |
|---|---|---|
| `--radius-card` | `12px` | Slightly tighter — more cabinet, less pillow |
| `--radius-field` | `8px` | Crisper button edges |
| `--radius-pill` | `999px` | No change |

---

## 7. Component Mapping (How Tokens Apply)

Because the entire UI is built on the token system, components don't need structural changes — just the token values swap.

| Component | Key Tokens Used | New Visual Result |
|---|---|---|
| **Button (primary)** | `bg-accent`, `text-accent-on` | Gold button with black text |
| **Button (secondary)** | `bg-surface`, `border-border-strong` | Dark bezel with bronze outline |
| **Button (ghost)** | `hover:bg-accent-soft` | Dim gold glow on hover |
| **Card** | `bg-surface`, `border-border`, `shadow-card` | Dark panel floating on black |
| **Badge (accent)** | `bg-accent-soft`, `text-accent` | Gold text on dark gold tint |
| **Badge (positive)** | `bg-positive-soft`, `text-positive` | Neon green on deep green |
| **Badge (negative)** | `bg-negative-soft`, `text-negative` | Amber on deep amber |
| **Bank card face** | `bg-accent` | Full gold card — the coin itself |
| **Profile avatar** | `bg-accent-soft`, `text-accent` | Gold initial on dark surface |
| **Active nav item** | `bg-accent-soft`, `text-accent` | Gold text with subtle glow fill |
| **Meter fill** | `bg-accent` or `bg-positive` | Gold or neon green progress bar |
| **Sparkline** | `--positive` / `--negative` | Green up, amber down |

---

## 8. Brand Color Palette Summary

```
  BOTH THEMES (dark-on-dark)

  ┌──────────────────────────────────────┐
  │  SURFACES                            │
  │  bg:       #0a0a0a  (cabinet black)  │
  │  surface:  #141414  (screen bezel)   │
  │  sunk:     #0d0d0d  (coin slot)      │
  └──────────────────────────────────────┘

  ┌──────────────────────────────────────┐
  │  INK (gold-tinted whites)            │
  │  primary:  #f0e6d3                   │
  │  muted:    #a89a84                   │
  │  subtle:   #7a7060                   │
  └──────────────────────────────────────┘

  ┌──────────────────────────────────────┐
  │  ACCENT — COIN GOLD                  │
  │  main:     #d4a843  ████████         │
  │  hover:    #e0b84f  ████████         │
  │  soft:     #1f1a10  ████████         │
  │  on:       #0a0a0a  ████████         │
  └──────────────────────────────────────┘

  ┌──────────────────────────────────────┐
  │  SEMANTIC — ARCADE NEONS             │
  │  positive: #39e075  ████ neon green  │
  │  negative: #e0a030  ████ amber       │
  │  alert:    #ff4060  ████ hot pink    │
  └──────────────────────────────────────┘

  ┌──────────────────────────────────────┐
  │  DATA VIZ                            │
  │  series-1: #d4a843  ████ coin gold   │
  │  series-2: #39e075  ████ neon green  │
  └──────────────────────────────────────┘

  ┌──────────────────────────────────────┐
  │  BORDERS — DARK BRONZE               │
  │  border:   #2a2520                   │
  │  strong:   #5c5040                   │
  └──────────────────────────────────────┘
```

---

## 9. Arcade Accent Colors (Future Use)

These are the extended neon palette — available for highlights, Easter eggs, special states, or feature-specific accents once the base black+gold is applied:

| Color | Hex | Arcade Reference | Potential Use |
|---|---|---|---|
| **Electric Blue** | `#00bfff` | Tron grid, Pac-Man ghosts | Links, info states, secondary charts |
| **Hot Magenta** | `#ff2a6d` | Neon signs, Galaga explosions | Premium/VIP features, celebrations |
| **Laser Purple** | `#b44aff` | Tempest vectors, Space Invaders | Insights, AI features |
| **Pixel Cyan** | `#00ffc8` | Matrix rain, terminal green | Success confirmations, verified states |
| **CRT Amber** | `#ffb347` | Monochrome monitors | Warnings, pending states |

> [!TIP]
> These are not in the token system yet. They're listed here as the accent palette to draw from when adding secondary brand colors after the base black+gold ships.

---

## 10. Files That Need Updating

| File | What Changes |
|---|---|
| [`globals.css`](file:///Users/mannyfowler/Desktop/BankingApp/Frontend/src/app/globals.css) | All `:root` and `[data-theme="dark"]` token values, shadow values, `color-scheme` |
| [`layout.tsx`](file:///Users/mannyfowler/Desktop/BankingApp/Frontend/src/app/layout.tsx) | Font imports if typography changes; theme script fallback color |
| [`global-error.tsx`](file:///Users/mannyfowler/Desktop/BankingApp/Frontend/src/app/global-error.tsx) | Hardcoded inline colors (`#fbf8f5`, `#1c1917`, `#6b4e7a`, etc.) |
| [`page.tsx`](file:///Users/mannyfowler/Desktop/BankingApp/Frontend/src/app/page.tsx) | No changes needed — uses token classes only |
| All components | No changes needed — all reference tokens, not raw hex values |

> [!IMPORTANT]
> Because the design system is fully tokenized, **only 3 files need color edits**. Every component (`button.tsx`, `card.tsx`, `badge.tsx`, `card-face.tsx`, etc.) will pick up the new palette automatically through the CSS custom properties.

---

## 11. Implementation Order

1. **Apply base tokens** — Swap all hex values in `globals.css` `:root` and `[data-theme="dark"]`
2. **Fix hardcoded colors** — Update `global-error.tsx` inline styles
3. **Set color-scheme** — Both themes get `color-scheme: dark` since both are dark-on-dark
4. **Test in browser** — Verify contrast, card faces, charts, badges all read correctly
5. **Accent refinement** — Introduce extended arcade neons from §9 as needed
6. **Typography decision** — Decide on display face after seeing colors in context
7. **Logo swap** — Replace asterisk SVG with gold 8-bit coin when asset is ready
