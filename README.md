# Roxy

Full stack ecommerce demo for PC parts and builds: React storefront, Express API, PostgreSQL. Public shop, cart, checkout, account area, and a role-based staff hub.

**Live demo:** [https://roxy.kcraft.dev](https://roxy.kcraft.dev)

More detail on folders, endpoints, and deployment notes lives in [TECHNICAL-DOCUMENTATION.md](./TECHNICAL-DOCUMENTATION.md).

## Stack

| Area | Notes |
|------|--------|
| Frontend | React 19, React Router 7, Vite 8, Tailwind CSS 4, Radix UI, GSAP / Framer Motion, Three.js on the landing hero |
| Backend | Express 5, TypeScript, Drizzle ORM, PostgreSQL, JWT + refresh cookies, Argon2, Stripe, optional S3 (or local) for catalog uploads |
| Tooling | ESLint on the SPA, `tsc` on the API, Drizzle Kit for migrations, Vitest for backend tests |

## Repo layout

- **`src/`** SPA: routes, layouts, cart, auth, admin/staff UI, landing sections.
- **`backend/`** API: `src/app.ts` mounts `/api/v1/*`, `src/db` schema and migrations, `src/routes/v1` routers.
- **`public/`** Static assets for Vite.

## Requirements

- Node.js LTS and npm
- PostgreSQL (local or remote)
- Optional: Stripe (test keys), Google OAuth app, S3-compatible storage for production image uploads

## Local setup

**1. Frontend**

```bash
npm install
```

**2. Backend**

```bash
cd backend
npm install
cp .env.example .env
```

Edit `backend/.env` at minimum:

- `DATABASE_URL`
- `JWT_SECRET` (long random string, 16+ characters)
- `CORS_ORIGINS` (include your Vite origin, e.g. `http://localhost:5173`)
- `FRONTEND_URL` (same origin as the SPA; used for OAuth and checkout redirects)

Stripe, Google OAuth, and S3 variables are optional until you use those features. See `backend/.env.example` for names and comments.

**3. Database**

From `backend/`:

```bash
npm run db:migrate
# or early dev: npm run db:push
npm run seed
```

Create a staff user with admin-style access:

```bash
npm run create-admin -- --email you@example.com --password 'your-secure-password'
```

**4. Run**

Terminal 1 (API, default port 4000):

```bash
cd backend && npm run dev
```

Terminal 2 (Vite, default 5173):

```bash
npm run dev
```

Open the URL Vite prints. The dev server proxies `/api` and `/uploads` to `http://localhost:4000` unless you set `VITE_DEV_API_PROXY`.

## Useful commands

| Where | Command | What it does |
|-------|---------|----------------|
| Root | `npm run dev` | Vite dev server |
| Root | `npm run build` | Production build to `dist/` |
| Root | `npm run preview` | Preview the production build |
| `backend/` | `npm run dev` | API with hot reload (`tsx watch`) |
| `backend/` | `npm run build` | Compile TypeScript to `dist/` |
| `backend/` | `npm start` | Run compiled server (`node dist/server.js`) |
| `backend/` | `npm run seed` | Reseed DB (read script before using on anything important) |
| `backend/` | `npm run db:migrate` | Apply Drizzle migrations |
| `backend/` | `npm run db:push` | Push schema without a migration file (dev only) |
| `backend/` | `npm run create-admin` | CLI to promote a user by email |
| `backend/` | `npm run products:export` | Dump products JSON from DB |
| `backend/` | `npm run products:import` | Import JSON (supports `--clear`; needs matching category/brand slugs) |
| `backend/` | `npm test` | Vitest |

## Production (short)

- Build the SPA: `npm run build`, serve `dist/` behind your host or CDN.
- Build and run the API: `cd backend && npm run build && npm start` with `NODE_ENV=production` and secrets from the host environment (do not rely on shipping `.env` to production).
- Set `CORS_ORIGINS` and `FRONTEND_URL` to your real frontend URL.
- Stripe webhooks need a public HTTPS URL; the Stripe webhook route in `backend/src/app.ts` must keep the raw body parser before the global JSON middleware.

## What ships in the app

- Browse shop by category/brand, product detail, cart synced to the API when signed in.
- Checkout with Stripe or cash on delivery when enabled in site settings.
- Email/password auth and optional Google sign-in.
- Profile: addresses, payment method stubs, orders, favorites.
- Staff hub (tabbed routes under `/admin/...`) with role-based tabs: catalog, orders, customers, promotions, analytics, store settings, staff management where allowed.

## License

Private project; see `backend/package.json` (`UNLICENSED`) and your own terms for reuse.
