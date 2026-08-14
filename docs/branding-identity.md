# Aster — Branding & Color Scheme Assessment

> **Last updated:** August 2026
> **Scope:** Full audit of the current brand identity as expressed in the frontend codebase.

---

## 1. Brand Name & Tagline

| Element | Value |
|---|---|
| **Name** | **Aster** |
| **Title tag** | _"Aster — banking that keeps your money in plain sight"_ |
| **Description** | _"A bank account with real privacy controls, honest fees, and planning built for careers that don't run in a straight line."_ |
| **Template** | `%s · Aster` (page titles follow `Page Name · Aster`) |
| **localStorage namespace** | `aster.theme`, `aster.privacy` |

The name "Aster" (the asterisk-shaped wildflower) is reflected directly in the logomark — a six-pointed asterisk stroke rendered as an inline SVG.

---

## 2. Logo / Brandmark

The logo is an **asterisk-like mark** built from three intersecting strokes:

```svg
<svg viewBox="0 0 24 24" fill="none">
  <path
    d="M12 3v18M4.5 7.5l15 9M19.5 7.5l-15 9"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
  />
</svg>
```

**Usage across the app:**
- **Header mark** ([`app-shell.tsx`](file:///Users/mannyfowler/Desktop/BankingApp/Frontend/src/components/layout/app-shell.tsx#L179-L195)): `size-8`, `rounded-[10px]`, `bg-accent text-accent-on`
- **Landing page** ([`page.tsx`](file:///Users/mannyfowler/Desktop/BankingApp/Frontend/src/app/page.tsx#L39-L51)): Same sizing and treatment
- **Sign-in page** ([`signin/page.tsx`](file:///Users/mannyfowler/Desktop/BankingApp/Frontend/src/app/(auth)/signin/page.tsx#L20-L35)): Slightly larger at `size-9`

The mark always sits inside a plum-filled rounded square with white icon stroke. The wordmark "Aster" appears beside it in the display typeface (Fraunces).

---

## 3. Typography

Three font families are loaded from Google Fonts with `display: "swap"`:

| Font | CSS Variable | Role | Usage |
|---|---|---|---|
| **Inter** | `--font-inter` | Body / UI | All body text, form labels, navigation, metadata. Set as `font-sans` default on `<body>`. |
| **Fraunces** | `--font-fraunces` | Display / Editorial | Balances, page headings (`h1`–`h2`), the "Aster" wordmark. Axes: `SOFT`, `WONK`, `opsz`. Mapped to `font-display`. |
| **Caveat** | `--font-caveat` | Handwritten / Decorative | Flow names only (scrapbook metaphor). **Never used for amounts** — a hand-drawn figure looks uncertain, which is the opposite of what a balance should feel like. Mapped to `font-hand`. |

### Typographic Rules
- **Tabular numerals** (`.tabular`): `font-variant-numeric: tabular-nums lining-nums` — applied to all money amounts so columns align and digits don't jitter
- **Antialiasing**: `-webkit-font-smoothing: antialiased` on body
- **Tracking**: `tracking-tight` on headings and the wordmark; `tracking-wide` on card numbers

---

## 4. Color System

The app uses a **custom CSS token system** with full light and dark theme definitions, switched via a `data-theme` attribute on `<html>`. Every pairing is WCAG 2.2 AA verified.

### 4.1 Core Surfaces

| Token | Light | Dark | Purpose |
|---|---|---|---|
| `--bg` | `#fbf8f5` (warm cream) | `#17141a` | Page background |
| `--surface` | `#ffffff` | `#201c27` | Raised cards |
| `--surface-sunk` | `#f3eee9` | `#131018` | Wells, inset rows, hover states |

### 4.2 Ink (Text)

| Token | Light | Dark | Contrast on bg | Purpose |
|---|---|---|---|---|
| `--ink` | `#1c1917` | `#f5f1f7` | 16.5 : 1 / 16.3 : 1 | Primary text |
| `--ink-muted` | `#57534e` | `#b5aebc` | 7.2 : 1 / 8.5 : 1 | Secondary text, captions |
| `--ink-subtle` | `#6b6560` | `#9a93a2` | 5.4 : 1 / 6.1 : 1 | Tertiary text, timestamps |

### 4.3 Borders

| Token | Light | Dark | Purpose |
|---|---|---|---|
| `--border` | `#e7e0d8` | `#332c3c` | Decorative separation |
| `--border-strong` | `#988c7f` | `#79708a` | Form control boundaries (≥ 3:1 on bg) |

### 4.4 Accent (Brand Color — Deep Plum)

| Token | Light | Dark | Purpose |
|---|---|---|---|
| `--accent` | `#6b4e7a` (deep plum) | `#c9a6dc` (lifted plum) | Primary brand color — buttons, links, active states, focus rings |
| `--accent-hover` | `#573f63` | `#d9bde8` | Hover state for primary buttons |
| `--accent-soft` | `#f0e8f4` | `#2c2336` | Subtle fills — chips, active nav items, pill backgrounds |
| `--accent-on` | `#ffffff` | `#1a1121` | Text on a filled plum surface |

> [!IMPORTANT]
> The accent is a **deep plum/purple**, not a typical banking blue or fintech green. This is a deliberate brand decision — warm and confident without being corporate.

### 4.5 Semantic Colors

| Token | Light | Dark | Purpose |
|---|---|---|---|
| `--positive` | `#2f6b4f` | `#6fc098` | Money in, interest, gains |
| `--positive-soft` | `#e6f0ea` | `#1b3329` | Positive badge/chip backgrounds |
| `--negative` | `#a14a38` (muted terracotta) | `#e39078` | Money out — **deliberately not alarm-red** |
| `--negative-soft` | `#f8e9e5` | `#38231c` | Negative badge backgrounds |
| `--alert` | `#b3261e` | `#f2b8b5` | Reserved for **genuine alerts only** (fraud, overdraft) |
| `--alert-soft` | `#fbe9e7` | `#3d1f1d` | Alert badge backgrounds |

> [!NOTE]
> **Calm color semantics** is a core brand principle: money out is terracotta, not aggressive red. Alarm colors are strictly reserved for actual alarms. This prevents the interface from feeling punitive about ordinary spending.

### 4.6 Chart / Data Visualization

| Token | Light | Dark | Purpose |
|---|---|---|---|
| `--series-1` | `#7a3e9e` | `#9c5fbe` | Spending data series |
| `--series-2` | `#b07a2b` | `#b8862f` | Earning data series |
| `--chart-grid` | `#ece5dd` | `#2c2635` | Grid lines |
| `--chart-track` | `#f0eae3` | `#2a2432` | Unfilled track in meters/progress bars |

Chart colors are intentionally separate from the UI accent — the brand plum is too muted to read well as a chart fill.

### 4.7 Scrapbook / Flows (Decorative Layer)

| Token | Light | Dark | Purpose |
|---|---|---|---|
| `--paper` | `#fdfbf7` | `#241f2b` | Scrapbook card surface |
| `--paper-edge` | `#e8dfd2` | `#372f42` | Card border |
| `--tape` | `#e4d9c3` | `#4a3f58` | Decorative tape strip |
| `--thread` | `#c3b7a6` | `#5a5166` | Dashed connectors between nodes |
| `--grain` | `0.025` | `0.04` | Noise texture opacity |

---

## 5. Geometry & Spacing

| Token | Value | Usage |
|---|---|---|
| `--radius-card` | `14px` | Cards, primary containers |
| `--radius-field` | `10px` | Buttons, inputs, form fields |
| `--radius-pill` | `999px` | Badges, avatars, tags, progress bars |

### Shadows (Elevation Levels)

| Token | Light Value | Purpose |
|---|---|---|
| `--shadow-sm` / `--shadow-card` | `0 1px 2px rgb(28 25 23 / 0.05)` | Default card elevation |
| `--shadow-md` / `--shadow-raised` | `0 4px 12px -2px rgb(28 25 23 / 0.08)` | Raised elements, card face |
| `--shadow-lg` / `--shadow-float` | `0 12px 32px -8px rgb(28 25 23 / 0.14)` | Floating elements |

Dark theme shadows use `rgb(0 0 0 / ...)` at higher opacities.

---

## 6. Motion & Transitions

| Property | Value |
|---|---|
| **Easing curve** | `cubic-bezier(0.22, 1, 0.36, 1)` — an aggressive ease-out for snappy state changes |
| **Typical duration** | `150ms` for color transitions, `180ms` for privacy blur, `500ms` for meter width |
| **Reduced motion** | Fully honored — all animations and transitions collapse to `0.01ms` under `prefers-reduced-motion: reduce` |

---

## 7. Iconography

- **Library:** [Lucide React](https://lucide.dev) (`lucide-react ^1.28.0`)
- **Standard sizes:** `size-4` (inline), `size-5` (navigation, toggles), `size-7` (section accent)
- **Styling:** Icons inherit color from text; always marked `aria-hidden` when a text label is present
- **Category system:** Transaction categories each have a dedicated Lucide icon (e.g., `ShoppingBasket` for groceries, `House` for housing)

---

## 8. Component Design Language

### Buttons ([`button.tsx`](file:///Users/mannyfowler/Desktop/BankingApp/Frontend/src/components/ui/button.tsx))

| Variant | Style |
|---|---|
| **Primary** | `bg-accent`, `text-accent-on`, `shadow-card` — the plum brand button |
| **Secondary** | `bg-surface`, `border border-border-strong` — outlined neutral |
| **Ghost** | Transparent, `text-ink-muted`, hover reveals `bg-accent-soft` |
| **Danger** | `bg-alert-soft`, `text-alert`, `border-alert/30` |

All buttons are `rounded-field` (10px) with minimum touch target `h-9` / `h-11` / `h-13`.

### Cards ([`card.tsx`](file:///Users/mannyfowler/Desktop/BankingApp/Frontend/src/components/ui/card.tsx))

`rounded-card` (14px), `border border-border`, `bg-surface`, `shadow-card`. Clean, elevated white rectangles with warm border.

### Badges ([`badge.tsx`](file:///Users/mannyfowler/Desktop/BankingApp/Frontend/src/components/ui/badge.tsx))

Five tones: `neutral`, `accent`, `positive`, `negative`, `alert`. Each uses the `-soft` background variant with a semi-transparent border. `rounded-pill` shape.

### Bank Card ([`card-face.tsx`](file:///Users/mannyfowler/Desktop/BankingApp/Frontend/src/components/banking/card-face.tsx))

Physical card representation at `aspect-[1.586/1]`, filled with `bg-accent` (plum), with a circular white highlight overlay. Frozen cards switch to `bg-ink-subtle saturate-50`.

### Profile Avatar

User initial in a `rounded-pill bg-accent-soft text-accent` circle — no photo, deliberate simplicity.

---

## 9. Brand Voice & Tone

Derived from copy across the landing page, metadata, and component comments:

| Attribute | Expression |
|---|---|
| **Direct** | _"Banking that keeps your money in plain sight"_ — not aspirational, descriptive |
| **Honest** | _"Fees that explain themselves"_ — no fine print framing |
| **Non-condescending** | _"A bank account that assumes you can read a number"_ |
| **Protective without paternalism** | _"If someone else controls your money, we'll help you change that quietly."_ |
| **Understated confidence** | _"No lectures, no pastel condescension."_ |

### Copy Rules (from README § 2.1)
- No unexplained acronyms
- Inline glossary tooltips rather than separate "learn" sections
- Never use "treat yourself" framing
- Fee explanations attached to the charge, not hidden in settings

---

## 10. Dark Mode Philosophy

Dark mode is **authored deliberately, not mechanically inverted**:

- Surfaces use deep plum-tinted blacks (`#17141a`, `#201c27`) rather than pure gray
- The accent lifts to a lighter lavender (`#c9a6dc`) to maintain contrast
- Chart colors are re-stepped specifically for dark surfaces, not flipped
- Scrapbook textures get their own dark variants
- Shadows use higher opacity pure black

---

## 11. Accessibility as Brand Identity

Accessibility is not a layer — it's listed as a **non-negotiable baseline** in the design philosophy:

- All contrast ratios documented inline in the CSS (e.g., `/* 16.5:1 on bg */`)
- Focus ring: `2px solid var(--accent)` with `2px` offset — never removed, only restyled
- `::selection` uses `bg: accent-soft` for on-brand text selection
- `forced-colors` media query strips all decorative elements (tape, grain, tilts)
- Touch targets minimum 44×44px on touch, 24×24px on pointer
- Color is never the sole carrier of meaning — always paired with icon or text

---

## 12. Brand Color Palette Summary

```
  LIGHT THEME                    DARK THEME

  ┌─────────────────┐            ┌─────────────────┐
  │  #fbf8f5  bg     │            │  #17141a  bg     │
  │  #ffffff  surface│            │  #201c27  surface│
  │  #f3eee9  sunk   │            │  #131018  sunk   │
  └─────────────────┘            └─────────────────┘

  Ink:    #1c1917 → #57534e → #6b6560
  Dark:   #f5f1f7 → #b5aebc → #9a93a2

  ┌─────────────────────────────────────────┐
  │  ACCENT (Deep Plum)                     │
  │  Light: #6b4e7a  │  Dark: #c9a6dc       │
  │  Hover: #573f63  │  Hover: #d9bde8      │
  │  Soft:  #f0e8f4  │  Soft:  #2c2336      │
  └─────────────────────────────────────────┘

  ┌─────────────────────────────────────────┐
  │  SEMANTIC                               │
  │  Positive:  #2f6b4f / #6fc098  (green)  │
  │  Negative:  #a14a38 / #e39078  (terra)  │
  │  Alert:     #b3261e / #f2b8b5  (red)    │
  └─────────────────────────────────────────┘

  ┌─────────────────────────────────────────┐
  │  DATA VIZ                               │
  │  Series 1:  #7a3e9e / #9c5fbe (purple)  │
  │  Series 2:  #b07a2b / #b8862f (amber)   │
  └─────────────────────────────────────────┘
```

---

## 13. Key Brand Differentiators (Design Decisions)

1. **Plum, not blue** — Intentionally avoids corporate banking blue and fintech green
2. **Terracotta for debits** — Spending is normal, not alarming; red is reserved for real danger
3. **Warm neutrals** — Cream backgrounds, not clinical white; plum-tinted dark mode, not gray
4. **Editorial type** — Fraunces display serif gives balances weight and seriousness
5. **Scrapbook metaphor** — Flows use paper/tape/thread textures for warmth; handwritten font (Caveat) only for labels, never for numbers
6. **Privacy as first-class UI** — Privacy toggle in the header, not buried in settings; blur effect is instant and reversible
7. **No color-coding per account** — Deliberately avoided because only three tokens clear contrast in both themes, and color alone fails for color-blind users
