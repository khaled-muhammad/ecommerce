# Roxy Ecommerce: Technical Documentation

## Description

Roxy is a full stack demo ecommerce storefront for PC parts and builds. The **frontend** is a React single page application (Vite, Tailwind CSS v4) with a custom site shell, shop flows, cart, checkout (Stripe), authentication (email/password and Google OAuth), and a staff admin area for catalog and orders. The **backend** is a Node.js Express API with PostgreSQL, Drizzle ORM, JWT sessions with refresh cookies, and optional S3 or local disk for admin image uploads.

The project is structured as a monorepo-style layout: application code lives at the repository root (`src/`, `public/`) and the API in `backend/`.

---

## Tech Stack

| Layer | Technologies |
|-------|----------------|
| Frontend | React 19, React Router 7, Vite 8, Tailwind CSS 4, Radix UI, GSAP, Framer Motion, Three.js (hero), Stripe.js (checkout) |
| Backend | Express 5, TypeScript, Drizzle ORM, PostgreSQL, Argon2, JWT, Stripe server SDK, Pino |
| Tooling | ESLint (frontend), `tsc` (backend), Vitest (backend tests), Drizzle Kit migrations |

---

## Prerequisites

- **Node.js** (LTS recommended), **npm**
- **PostgreSQL** running locally or remotely
- Optional: **Stripe** account (test keys) for checkout, **Google Cloud** OAuth credentials for social login, **S3-compatible storage** for production image uploads

---

## Setup Steps

### 1. Clone and install frontend

```bash
cd /path/to/ecommerce
npm install
```

### 2. Install backend

```bash
cd backend
npm install
```

### 3. Configure backend environment

```bash
cp .env.example .env
```

Edit `backend/.env` at minimum:

- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: long random string (16+ characters)
- `CORS_ORIGINS`: comma-separated list including your Vite origin (e.g. `http://localhost:5173`)
- `FRONTEND_URL`: SPA URL used for OAuth and checkout redirects

Add Stripe, Google OAuth, and S3 variables when you need those features. See `backend/.env.example` for the full list.

### 4. Database schema and seed

From `backend/`:

```bash
npm run db:migrate
# or during early development: npm run db:push
npm run seed
```

Create an admin-capable user if needed:

```bash
npm run create-admin -- --email you@example.com --password 'secure-password'
```

### 5. Frontend API base (optional)

In development, Vite proxies `/api` and `/uploads` to `http://localhost:4000` by default. Override with:

```bash
VITE_DEV_API_PROXY=http://127.0.0.1:4000 npm run dev
```

### 6. Run development servers

Terminal 1 (API):

```bash
cd backend && npm run dev
```

Terminal 2 (SPA):

```bash
npm run dev
```

Open the URL Vite prints (typically `http://localhost:5173`).

### 7. Production build (overview)

- Frontend: `npm run build` then serve `dist/` with a static host or integrate with your edge setup.
- Backend: `cd backend && npm run build && npm start` with `NODE_ENV=production` and env vars set in the host environment (production does not auto-load `backend/.env` the same way as development).

---

## Folder Structure

High level layout (excluding `node_modules`, `dist`, lockfiles):

```text
ecommerce/
├── public/                 # Static assets served by Vite
├── src/                    # React application
│   ├── auth/               # Auth provider, guards, OAuth bridge, hooks
│   ├── cart/               # Cart context, side cart UI, selectors
│   ├── components/         # Shared UI (glass, nav shell, effects, shop cards)
│   ├── components/site-shell/
│   ├── context/            # Site config (e.g. social links from API)
│   ├── data/               # Static marketing / fallback data where used
│   ├── hooks/
│   ├── landing/            # Home page sections, hero, landing-only CSS
│   ├── layouts/            # MainLayout, footer, laser footer reveal
│   ├── lib/                # API helpers, money, catalog helpers
│   ├── routes/             # Page components and auth shell pages
│   ├── theme/              # Light/dark theme provider
│   ├── index.css           # Tailwind entry, design tokens
│   └── main.jsx            # Router tree, providers
├── vite.config.js
├── package.json
└── backend/
    ├── drizzle/            # Migration output (if used)
    ├── scripts/            # setup-db.sh and similar
    ├── src/
    │   ├── config/         # env (zod), logger
    │   ├── db/             # Drizzle client, schema, seed, migrations meta
    │   ├── middleware/     # auth, errors, request id
    │   ├── routes/v1/      # HTTP routers per domain
    │   ├── services/       # auth, media upload
    │   ├── lib/            # Stripe helpers, order workflow
    │   ├── scripts/        # create-admin, export/import products
    │   ├── app.ts          # Express app assembly
    │   └── server.ts       # HTTP server entry
    ├── uploads/            # Local catalog images (optional)
    └── package.json
```

---

## Main Files Explanation

### Frontend

| Path | Role |
|------|------|
| `src/main.jsx` | Registers routes under `MainLayout`, wraps app with theme, cart, auth, site config, toasts. |
| `src/layouts/MainLayout.jsx` | Site shell: hero viewport, nav, side cart, conditional footer laser section; flags auth-style full bleed pages (`/sign-in`, `/about`, `/contact`, etc.). |
| `src/auth/AuthProvider.jsx` | Login state, tokens, refresh, `authorizedFetch` for staff calls. |
| `src/auth/RouteGuards.jsx` | `RequireAuth`, `RequireStaffDashboard`, `GuestOnly`. |
| `src/lib/apiUrl.js` | Builds API URLs; uses relative `/api` in browser for proxy compatibility. |
| `src/cart/CartProvider.jsx` | Syncs cart with backend by session/user. |
| `src/routes/ShopPage.jsx`, `ProductPage.jsx`, `CartPage.jsx`, `CheckoutPage.jsx` | Core commerce UX. |
| `src/routes/AdminDashboardPage.jsx`, `AdminCatalogPanel.jsx`, `AdminProductModal.jsx` | Staff dashboard and product editor (modal wizard). |
| `src/routes/AuthPageShell.jsx` | Shared background (gradient, light rays) for sign-in, register, contact, about, support. |
| `src/landing/*` | Marketing home: hero 3D model, product grids, GSAP sections. |

### Backend

| Path | Role |
|------|------|
| `backend/src/server.ts` | Binds HTTP server to `PORT`. |
| `backend/src/app.ts` | Middleware stack (helmet, CORS, compression, Stripe webhook raw body, static `/uploads`, JSON, cookies), mounts `/api/v1/*` routers, 404 and error handler. |
| `backend/src/config/env.ts` | Loads and validates environment with Zod; resolves `backend` package root for `.env`. |
| `backend/src/db/schema/*.ts` | Drizzle tables: users, sessions, catalog, cart, orders, coupons, site settings, etc. |
| `backend/src/db/seed.ts` | Seeds roles, categories, brands, sample products. |
| `backend/src/routes/v1/auth.ts` | Register, login, refresh, Google OAuth callback. |
| `backend/src/routes/v1/catalog.ts` | Public product listing and detail. |
| `backend/src/routes/v1/cart.ts` | Cart CRUD. |
| `backend/src/routes/v1/checkout.ts` | Checkout session, Stripe webhook, order creation. |
| `backend/src/routes/v1/adminCatalog.ts` | Staff-only catalog CRUD and upload endpoint. |
| `backend/src/routes/v1/staff.ts` | Staff dashboard aggregates (orders, analytics hooks). |
| `backend/src/scripts/export-products.ts` | Exports products to JSON with category/brand slugs. |
| `backend/src/scripts/import-products.ts` | Imports JSON; optional `--clear` removes cart lines and products first. |

---

## Useful NPM Scripts

| Location | Command | Purpose |
|----------|---------|---------|
| Root | `npm run dev` | Vite dev server. |
| Root | `npm run build` | Production SPA build to `dist/`. |
| `backend/` | `npm run dev` | API with `tsx watch`. |
| `backend/` | `npm run seed` | Reseed database (destructive to seed-owned data; read script before production). |
| `backend/` | `npm run products:export` | Write `products.export.json` from current DB. |
| `backend/` | `npm run products:import -- --file ./products.export.json --clear` | Replace products on target DB (requires matching category/brand slugs). |

---

## Reflection

This codebase balances a **polished marketing surface** (landing animations, glass UI, theme-aware shell) with **practical ecommerce mechanics** (real cart, checkout, staff tools). Keeping the API under `/api/v1` and proxying from Vite avoids CORS friction in local development while still allowing explicit CORS configuration for deployed origins.

**Strengths:** Clear split between public catalog routes and staff-only admin routes; Drizzle schema keeps types close to SQL; shared auth shell and tokens reduce duplicate UI for account flows.

**Tradeoffs:** The frontend bundle includes heavy visuals (Three.js, GSAP); consider lazy routes for admin-only chunks if load time becomes an issue. Staff permissions are enforced on the server; the UI should stay aligned with role checks whenever new endpoints are added.

**Operational note:** Production deployments must inject secrets via the host environment. Stripe webhooks require a public HTTPS URL and the raw body route order in `app.ts` must stay before the global JSON parser.

---

*Document version: aligned with repository layout at time of writing. Update paths or scripts if the project evolves.*
