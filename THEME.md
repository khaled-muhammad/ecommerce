# Roxy design theme

This document mirrors the design tokens used in the app. Source of truth remains the CSS and theme code; update this file when tokens change.

## Dark mode

- **Mechanism:** The class `dark` on `document.documentElement` (`<html>`).
- **Provider:** `src/theme/ThemeProvider.jsx` toggles the class and persists choice.
- **Storage key:** `roxy-theme` (`src/theme/theme-context.js`). Values: `light` | `dark`.
- **Initial paint:** `index.html` inline script reads `localStorage` or `prefers-color-scheme` so the first frame matches user preference.
- **Tailwind:** `@custom-variant dark (&:is(.dark *));` in `src/index.css` scopes dark styles.

Semantic UI colors use **shadcn-style variables** under `:root` and `.dark` in `src/index.css`. Landing-specific colors use **`--vexo-*`** in the same blocks.

---

## Site shell (shop chrome)

Defined on `.site-root-vars` in `src/layouts/site-shell.css`.

| Token | Value | Role |
|-------|--------|------|
| `--paper` | `#eaeced` | Light panel / surface |
| `--ink` | `#0e220e` | Primary text, accents, fills (green-tinted black) |
| `--muted` | `#f9f9f9` | Muted surface |
| `--site-font` | `"Saira", system-ui, sans-serif` | UI typography |
| `--site-font-brand` | `"Crystal Shard", var(--site-font)` | Brand wordmark (`src/assets/fonts/CrystalShard.ttf`) |

Base font size in the shell: **12px** on `.site-root-vars` (and buttons).

Many components use Tailwind with `var(--ink)` and `var(--paper)` for text and backgrounds (see JSX across `src/`).

---

## Landing ("Vexo") palette

Scoped in practice under **`.landing-home`**; variables live in `src/index.css` on `:root` (light) and `.dark` (dark). Utility class names for colors are in `src/landing/landing.css` (e.g. `.text-vexo-text`, `.bg-vexo-bg`).

### Light (`:root`)

| Token | Hex / value |
|-------|----------------|
| `--vexo-text` | `#1a1a1a` |
| `--vexo-text-secondary` | `#5f6b76` |
| `--vexo-text-muted` | `#8b96a0` |
| `--vexo-bg` | `#c5d5d8` |
| `--vexo-card` | `#f1f4f5` |
| `--vexo-elevated` | `#e8ecee` |
| `--vexo-dark` | `#1a1a1a` |
| `--vexo-divider` | `rgba(0, 0, 0, 0.1)` |
| `--vexo-watermark` | `rgba(0, 0, 0, 0.05)` |
| `--vexo-shell-grad-start` | `#bed2d8` |
| `--vexo-shell-grad-end` | `#e9ebed` |
| `--vexo-btn-primary-bg` | `#1a1a1a` |
| `--vexo-btn-primary-fg` | `#ffffff` |
| `--vexo-btn-secondary-border` | `#1a1a1a` |
| `--vexo-btn-secondary-fg` | `#1a1a1a` |
| `--vexo-btn-secondary-hover-bg` | `#1a1a1a` |
| `--vexo-btn-secondary-hover-fg` | `#ffffff` |
| `--vexo-contrast-fg` | `#ffffff` |
| `--vexo-focus-ring` | `rgba(26, 26, 26, 0.35)` |
| `--vexo-hero-line` | `rgba(0, 0, 0, 0.18)` |
| `--vexo-avatar-ring` | `#ffffff` |
| `--vexo-play-bg` | `rgba(255, 255, 255, 0.9)` |
| `--vexo-play-icon` | `#1a1a1a` |
| `--vexo-badge-bg` | `rgba(255, 255, 255, 0.92)` |
| `--vexo-badge-fg` | `#1a1a1a` |
| `--vexo-badge-hover-bg` | `#ffffff` |
| `--vexo-badge-muted-bg` | `rgba(255, 255, 255, 0.9)` |

### Dark (`.dark`)

| Token | Hex / value |
|-------|----------------|
| `--vexo-text` | `#e4e9ec` |
| `--vexo-text-secondary` | `#94a3b0` |
| `--vexo-text-muted` | `#71808c` |
| `--vexo-bg` | `#1a2226` |
| `--vexo-card` | `#242e33` |
| `--vexo-elevated` | `#222c31` |
| `--vexo-dark` | `#dce7ec` |
| `--vexo-divider` | `rgba(255, 255, 255, 0.12)` |
| `--vexo-watermark` | `rgba(255, 255, 255, 0.045)` |
| `--vexo-shell-grad-start` | `#1a2226` |
| `--vexo-shell-grad-end` | `#263238` |
| `--vexo-btn-primary-bg` | `#dce7ec` |
| `--vexo-btn-primary-fg` | `#121a1e` |
| `--vexo-btn-secondary-border` | `#4a5c66` |
| `--vexo-btn-secondary-fg` | `#e4e9ec` |
| `--vexo-btn-secondary-hover-bg` | `#dce7ec` |
| `--vexo-btn-secondary-hover-fg` | `#121a1e` |
| `--vexo-contrast-fg` | `#121a1e` |
| `--vexo-focus-ring` | `rgba(220, 231, 236, 0.45)` |
| `--vexo-hero-line` | `rgba(255, 255, 255, 0.14)` |
| `--vexo-avatar-ring` | `#2c383e` |
| `--vexo-play-bg` | `rgba(36, 46, 51, 0.92)` |
| `--vexo-play-icon` | `#e4e9ec` |
| `--vexo-badge-bg` | `rgba(36, 46, 51, 0.92)` |
| `--vexo-badge-fg` | `#e4e9ec` |
| `--vexo-badge-hover-bg` | `#354249` |
| `--vexo-badge-muted-bg` | `rgba(36, 46, 51, 0.88)` |

**Landing font:** `.landing-home` uses **Inter** (loaded from Google Fonts in `src/landing/landing.css`), not Geist.

---

## Global body (outside token layers)

| Item | Value | File |
|------|--------|------|
| Default `body` background | `#f9f9f9` | `src/index.css` |

With `@layer base`, `body` also gets `bg-background text-foreground` (shadcn variables).

---

## Shadcn semantic tokens (`:root` / `.dark`)

Defined in `src/index.css`. Used by Tailwind (`bg-background`, `text-foreground`, `border-border`, `bg-primary`, chart colors, sidebar, etc.) and `@import "shadcn/tailwind.css"`.

### Light (`:root`)

| Token | Value |
|-------|--------|
| `--background` | `oklch(1 0 0)` |
| `--foreground` | `oklch(0.145 0 0)` |
| `--card` | `oklch(1 0 0)` |
| `--card-foreground` | `oklch(0.145 0 0)` |
| `--popover` | `oklch(1 0 0)` |
| `--popover-foreground` | `oklch(0.145 0 0)` |
| `--primary` | `oklch(0.205 0 0)` |
| `--primary-foreground` | `oklch(0.985 0 0)` |
| `--secondary` | `oklch(0.97 0 0)` |
| `--secondary-foreground` | `oklch(0.205 0 0)` |
| `--muted` | `oklch(0.97 0 0)` |
| `--muted-foreground` | `oklch(0.556 0 0)` |
| `--accent` | `oklch(0.97 0 0)` |
| `--accent-foreground` | `oklch(0.205 0 0)` |
| `--destructive` | `oklch(0.577 0.245 27.325)` |
| `--border` | `oklch(0.922 0 0)` |
| `--input` | `oklch(0.922 0 0)` |
| `--ring` | `oklch(0.708 0 0)` |
| `--chart-1` … `--chart-5` | neutral OKLCH scale (see `index.css`) |
| `--radius` | `0.625rem` |
| `--sidebar` … `--sidebar-ring` | see `index.css` |

### Dark (`.dark`)

Same token names; values shift to a **cool slate** family (hue ~230 in OKLCH). See `src/index.css` lines under `.dark` for `--background`, `--foreground`, `--card`, `--primary`, `--destructive`, `--border`, `--sidebar-*`, etc.

---

## Radius scale (Tailwind `@theme inline`)

Base: `--radius: 0.625rem` (`:root`).

| Token | Formula |
|-------|---------|
| `--radius-sm` | `calc(var(--radius) * 0.6)` |
| `--radius-md` | `calc(var(--radius) * 0.8)` |
| `--radius-lg` | `var(--radius)` |
| `--radius-xl` | `calc(var(--radius) * 1.4)` |
| `--radius-2xl` | `calc(var(--radius) * 1.8)` |
| `--radius-3xl` | `calc(var(--radius) * 2.2)` |
| `--radius-4xl` | `calc(var(--radius) * 2.6)` |

---

## Typography (app-wide)

| Role | Font | Where |
|------|------|--------|
| Default sans (Tailwind `font-sans`) | Geist Variable | `@import "@fontsource-variable/geist"`; `--font-sans` in `@theme inline` |
| UI utility classes | Saira 400 / Saira 800 | `.font-ui`, `.font-ui-medium` in `src/index.css` |
| Saira webfont (weights 400, 500, 600) | Google Fonts | `index.html` |
| Site shell | Saira 12px base | `.site-root-vars` in `site-shell.css` |
| Brand display | Crystal Shard | `--site-font-brand`, local TTF |
| Landing sections | Inter | `landing.css` import |

---

## Optional effects (not part of core palette)

- **Border glow cards:** `src/components/BorderGlow.css` uses multi-stop gradients (HSL accents) and defaults like `--card-bg: #060010` for demo cards.
- **Motion / 3D:** Landing hero uses Three.js / GSAP; no separate color system beyond `--vexo-*` and scene lighting.

---

## File index

| File | Contents |
|------|-----------|
| `src/index.css` | Tailwind, `@theme`, `:root` / `.dark`, Vexo vars, base layer, font utilities |
| `src/layouts/site-shell.css` | `--paper`, `--ink`, shell layout, nav, footer, laser footer, side cart |
| `src/landing/landing.css` | `.landing-home` typography and Vexo utility classes |
| `src/theme/ThemeProvider.jsx` | Theme state and `dark` class |
| `src/theme/theme-context.js` | `STORAGE_KEY` |
| `index.html` | Saira preconnect, theme flash script |
| `shadcn/tailwind.css` | Shadcn component bridge (imported from `index.css`) |
