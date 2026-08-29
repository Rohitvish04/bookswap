# 📚 BookSwap — Community Book Exchange Platform

**Exchange books, not money.** A full-stack, production-shaped platform where readers list
the books they own, discover compatible readers nearby, trade book-for-book, pay only a
small configurable service fee via Razorpay, message their exchange partner, and rate each
other when the swap is done.

Every feature is wired end-to-end to a real PostgreSQL database — **no mock data, no fake
payment success, no placeholder pages.**

---

## Table of Contents

1. [Main Functionality](#1-main-functionality)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Prerequisites](#4-prerequisites)
5. [Full Setup Guide](#5-full-setup-guide)
6. [Environment Variables](#6-environment-variables)
7. [Default Accounts & Seed Data](#7-default-accounts--seed-data)
8. [Walkthrough: a Complete Exchange](#8-walkthrough-a-complete-exchange)
9. [Razorpay Setup](#9-razorpay-setup)
10. [Location / Geocoding Setup](#10-location--geocoding-setup)
11. [Running Tests](#11-running-tests)
12. [API Reference](#12-api-reference)
13. [Exchange State Machine](#13-exchange-state-machine)
14. [Security Model](#14-security-model)
15. [Troubleshooting](#15-troubleshooting)
16. [Production Deployment](#16-production-deployment)
17. [Known Limitations](#17-known-limitations)

---

## 1. Main Functionality

### For readers

| Feature | What it does |
|---|---|
| **List books** | Add books with cover upload (or real Open Library covers via ISBN), condition, category, language, edition — and the titles you want in return. |
| **Smart matching** | A scoring engine finds direct swaps (you want theirs, they want yours), one-sided offers, and multi-book trades — ranked by match %, distance, and condition. |
| **Location-based discovery** | Your address is geocoded once; other readers see only your city and an approximate distance ("2.4 km away"). Filter by 5 / 10 / 25 / 50 km or Anywhere. |
| **Exchange requests** | Request a swap by offering one of your own books. The owner can Accept, Reject, or **Counter-Offer** with a different book — both sides must agree. |
| **Payments** | On acceptance the requester pays the service fee through real Razorpay checkout, verified **server-side** (HMAC signature + webhook safety net). Books are never priced. |
| **Completion & ownership** | Choose Meet Nearby or Delivery; both sides must click "Mark Completed" — then book ownership actually swaps in the database and history is recorded. |
| **Messaging** | Private chat opens automatically per exchange request; only the two participants can read it. |
| **Wishlist** | Save wanted titles; get notified the moment a matching book is listed. |
| **Notifications** | In-app notifications for requests, acceptances, counter-offers, payments, completions, wishlist matches, and messages. |
| **Ratings & reviews** | After completion each side leaves a 1–5★ review (one per exchange); averages show on public profiles. |

### For admins (`/admin`)

Dashboard with charts (registrations, exchanges, revenue) · user management (search /
suspend / delete) · book moderation (approve / reject / remove) · exchange monitoring and
dispute resolution · payment ledger · category CRUD · **fee configuration (fixed ₹ or
percentage — no hardcoded fee anywhere)** · report handling · review moderation.

### Engineering highlights

- **Race-condition-safe reservations** — two users requesting the same book at the same
  moment can't both win: conditional `updateMany` inside a transaction reserves both books
  atomically; the loser gets a clean "just reserved by someone else" error.
- **Tokenized search** — "rich dad and poor dad" finds *Rich Dad Poor Dad*: every
  meaningful word must match title/author/ISBN; filler words (and/the/of…) are ignored.
- **Webhook idempotency** — Razorpay webhook deliveries are deduplicated by event id, so a
  payment that succeeds after the browser disconnects is still confirmed exactly once.
- **Auto-expiry** — stale pending exchanges expire after an admin-configurable window and
  their books are released automatically.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS, Radix UI primitives, Framer Motion, React Hook Form + Zod, Recharts, Sonner |
| Fonts | Inter (UI) + Fraunces (editorial serif) via `next/font` |
| Backend | Next.js Route Handlers (`app/api/**`) |
| Database | PostgreSQL 14+ via Prisma ORM |
| Auth | DB-backed session cookies (SHA-256-hashed tokens), bcrypt (cost 12), double-submit CSRF middleware |
| Payments | Razorpay Orders API + server-side signature verification + webhook |
| Location | Nominatim (free, default) or LocationIQ geocoding, Haversine distance |
| Testing | Vitest (business-logic unit tests) |

---

## 3. Project Structure

```
bookswap/
├─ app/
│  ├─ (public)/           # home, browse, book detail, user profile, about, faq, terms…
│  ├─ (auth)/             # register, login, forgot/reset password, verify email
│  ├─ dashboard/          # user area: books, discover, exchanges, wishlist, messages…
│  ├─ admin/              # admin panel: users, books, exchanges, payments, fees…
│  └─ api/                # every REST endpoint (see §12)
├─ components/
│  ├─ ui/                 # Radix-based primitives (button, dialog, select, tabs…)
│  ├─ site/               # shared widgets (navbar, footer, book cover, star rating…)
│  ├─ home/               # animated homepage sections (hero, featured, FAQ, CTA…)
│  ├─ dashboard/          # sidebar, book form, exchange actions, Razorpay button…
│  └─ admin/              # admin sidebar
├─ lib/
│  ├─ auth.ts             # sessions, password hashing, role guards
│  ├─ db.ts               # Prisma client singleton
│  ├─ api.ts              # response helpers + Zod error formatting
│  ├─ validation.ts       # every Zod schema used by the API
│  ├─ matching.ts         # match-scoring engine
│  ├─ exchange-service.ts # exchange state machine (transactions, race guards)
│  ├─ razorpay.ts         # order creation + signature/webhook verification
│  ├─ location.ts         # geocoding + Haversine + privacy-safe distance copy
│  ├─ book-query.ts       # shared tokenized search/filter builder
│  ├─ settings.ts         # fee configuration (PlatformSetting-backed)
│  └─ rate-limit.ts       # in-memory fixed-window rate limiter
├─ prisma/
│  ├─ schema.prisma       # 20+ models, enums, indexes, relations
│  └─ seed.ts             # admin, demo users, categories, 36 books, demo exchange
├─ tests/                 # Vitest: matching, fees, location, validation, utils
└─ middleware.ts          # double-submit CSRF for all mutating /api requests
```

---

## 4. Prerequisites

| Requirement | Version | Check with |
|---|---|---|
| Node.js | 18.18+ (20+ recommended) | `node -v` |
| npm | 9+ | `npm -v` |
| PostgreSQL | 14+ (local or managed) | `psql --version` |

You do **not** need Razorpay or geocoding keys just to run the app — everything except
the payment step works without them (see §9–§10).

---

## 5. Full Setup Guide

### Step 1 — Get the code & install dependencies

```bash
cd bookswap
npm install
```

### Step 2 — Start a PostgreSQL database

Pick **one** of these:

**Option A — Docker (fastest if you have Docker):**
```bash
docker run --name bookswap-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=bookswap -p 5432:5432 -d postgres:16
```

**Option B — Windows, no Docker (winget):**
```bash
winget install --id PostgreSQL.PostgreSQL.17 -e
```
Then create the database (default superuser password is whatever you set during install;
the silent install used in development set it to `postgres`):
```bash
psql -U postgres -h localhost -c "CREATE DATABASE bookswap;"
```

**Option C — Managed Postgres:** create a free database at Neon / Supabase / Railway and
copy its connection string.

### Step 3 — Configure environment

```bash
cp .env.example .env
```
Open `.env` and set at minimum:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/bookswap?schema=public"
AUTH_SECRET="<any long random string — node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\">"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```
Everything else can stay as-is for a first run (see §6 for the full table).

### Step 4 — Create the schema and seed data

```bash
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
```

The seed is **idempotent** — you can re-run `npx prisma db seed` any time to top up
missing data without duplicating anything.

### Step 5 — Run the app

```bash
npm run dev
```

Open **http://localhost:3000** (pass `-- -p 3002` to `npm run dev` if 3000 is taken).

### Step 6 — Log in

- Admin: `admin@bookswap.in` / `Admin@12345` → then visit `/admin`
- Demo readers: `rohit@example.com`, `ananya@example.com`, `meera@example.com` — all `Demo@12345`

That's it. Browse `/books` to see the seeded catalogue with real cover art.

---

## 6. Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `AUTH_SECRET` | ✅ | Long random string (≥32 chars) |
| `NEXT_PUBLIC_APP_URL` | ✅ | Public base URL (emails, sitemap) |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | for payments | From Razorpay dashboard (test mode works) |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | for payments | Same key id, exposed to the checkout widget |
| `RAZORPAY_WEBHOOK_SECRET` | recommended | Webhook signature secret (see §9) |
| `LOCATION_PROVIDER` | optional | `nominatim` (free, default) or `locationiq` |
| `LOCATION_API_KEY` | optional | Only for `locationiq` |
| `SMTP_HOST/PORT/USER/PASSWORD`, `EMAIL_FROM` | optional | If unset, emails (verification/reset links) are **printed to the server console** — perfect for dev |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | optional | Credentials the seed uses for the admin account |

---

## 7. Default Accounts & Seed Data

The seed (`prisma/seed.ts`) creates:

- **1 admin** — `admin@bookswap.in` / `Admin@12345`
- **3 demo readers** (password `Demo@12345`) with geocoded addresses in Mumbai, Pune, Bengaluru
- **14 categories** — including India-specific ones: Competitive Exams, Engineering, Medical, School & NCERT
- **36 books with real cover art** (Open Library, by ISBN) — Atomic Habits, Sapiens, 1984, The Hobbit, Clean Code, Zero to One, Ikigai… — each listing "wanted in exchange" titles so the matching engine has a rich trade web
- **1 completed demo exchange** between Rohit and Ananya, with mutual 5★ reviews
- **Default fee settings** — fixed ₹49 (change any time in Admin → Fees)

---

## 8. Walkthrough: a Complete Exchange

This is the full happy path, exactly as verified end-to-end:

1. **Log in as Rohit** (`rohit@example.com` / `Demo@12345`).
2. Dashboard → **Discover Books → Best Matches**. If you see no matches, widen your
   radius: Dashboard → Address & Location → set radius to *Anywhere* (the demo users are
   in different cities ~120 km apart).
3. Click **Request** on a match — the dialog pre-selects the suggested book from your
   shelf; add a message and **Send Request**. Both books are now reserved.
4. **Log in as the other reader** (e.g. `ananya@example.com`), go to
   **Exchange Requests**, open the request. You'll see Rohit's public info only (name,
   city, rating — never address/phone/email). Click **Accept Exchange**
   (or try **Counter Offer** to propose a different book).
5. **Back as Rohit**, open the exchange → **Pay ₹49 Service Fee** → real Razorpay
   checkout opens (needs test keys, §9; use test card `4111 1111 1111 1111`).
6. On payment success the exchange flips to **CONFIRMED** (verified server-side).
   Pick **Meet Nearby** or **Arrange Delivery**.
7. Both users click **Mark Exchange Completed**. When the *second* confirmation lands:
   status → **COMPLETED**, book ownership swaps in the database, history is recorded.
8. Each side can now **Leave a Review** — ratings recompute instantly on public profiles.

**Admin flow:** log in as admin → `/admin` → view users/books/exchanges/payments, change
the fee in **Fees** (affects future exchanges only), manage categories, resolve reports.

---

## 9. Razorpay Setup

1. Create a free account at <https://dashboard.razorpay.com> (test mode is on by default).
2. **Settings → API Keys → Generate Test Key.** Put the key id in both `RAZORPAY_KEY_ID`
   and `NEXT_PUBLIC_RAZORPAY_KEY_ID`, the secret in `RAZORPAY_KEY_SECRET`. Restart the dev server.
3. *(Recommended)* **Settings → Webhooks** → add
   `https://<your-domain>/api/payments/webhook` with events `payment.captured` and
   `payment.failed`; copy the secret into `RAZORPAY_WEBHOOK_SECRET`. This is the safety
   net for "payment succeeded but the browser closed" — deliveries are deduplicated, so
   retries are safe. (For local webhook testing, tunnel with `ngrok http 3000`.)
4. Pay with [Razorpay test cards](https://razorpay.com/docs/payments/payments/test-card-upi-details/):
   e.g. card `4111 1111 1111 1111`, any future expiry, any CVV.

Without keys, the app still runs — the pay button will return a clean server error
instead of faking success (by design: payment status is never trusted from the frontend).

---

## 10. Location / Geocoding Setup

- **Default:** `LOCATION_PROVIDER=nominatim` uses OpenStreetMap's free geocoder — no key
  needed. Fine for development; keep volume light (it's rate-limited).
- **Production:** sign up at <https://locationiq.com>, set `LOCATION_PROVIDER=locationiq`
  and `LOCATION_API_KEY`.
- **Offline fallback:** if geocoding fails entirely, `lib/location.ts` falls back to a
  built-in table of major-Indian-city centroids, so distance features keep working in dev.

Privacy rule enforced everywhere: exact street addresses are **never** returned by any
public API or rendered on any public page — only city, state, and a rounded distance.

---

## 11. Running Tests

```bash
npm run test          # one-shot
npm run test:watch    # watch mode
```

35 Vitest tests cover the pure business logic (no database needed): the match-scoring
engine, fee calculator (fixed/percentage/floor), Haversine distance + privacy-safe
distance copy, and every Zod schema (password strength, ISBN, Indian phone/pincode, fee
rules). The transactional state machine (reservations, counter-offers, completion) is
exercised against real Postgres via the walkthrough in §8.

---

## 12. API Reference

All routes return `{ ok: true, data }` or `{ ok: false, error, fieldErrors? }`.
Mutating requests require the `x-csrf-token` header matching the `bookswap_csrf` cookie
(the frontend's `lib/api-client.ts` does this automatically).

| Area | Routes |
|---|---|
| Auth | `POST /api/auth/{register,login,logout,verify-email,resend-verification,forgot-password,reset-password,change-password}` · `GET /api/auth/me` |
| Users | `GET/PATCH /api/users/me` · `POST /api/users/me/radius` · `POST /api/users/me/delete` · `GET /api/users/:id/public` · `GET /api/users/:id/reviews` |
| Addresses | `GET/POST /api/addresses` · `PATCH/DELETE /api/addresses/:id` · `POST /api/addresses/:id/default` · `POST /api/addresses/geocode` |
| Books | `GET/POST /api/books` · `GET/PATCH/DELETE /api/books/:id` · `PATCH /api/books/:id/status` · `GET /api/books/mine` · `GET /api/books/discover` |
| Matching | `GET /api/matches` |
| Exchanges | `GET/POST /api/exchanges` · `GET /api/exchanges/:id` · `POST /api/exchanges/:id/{accept,reject,cancel,complete,delivery}` · `POST /api/exchanges/:id/counter-offer` · `POST /api/exchanges/:id/counter-offer/:offerId/respond` · `POST /api/exchanges/:id/review` |
| Payments | `POST /api/payments/create-order` · `POST /api/payments/verify` · `POST /api/payments/webhook` |
| Messaging | `GET /api/messages` · `GET/POST /api/messages/:conversationId` |
| Notifications | `GET /api/notifications` · `POST /api/notifications/read-all` · `POST /api/notifications/:id/read` · `GET /api/notifications/unread-count` |
| Wishlist | `GET/POST /api/wishlist` · `DELETE /api/wishlist/:id` |
| Misc | `POST /api/reports` · `POST/DELETE /api/blocks` · `POST /api/contact` · `POST /api/uploads` · `GET /api/categories` |
| Admin | `GET /api/admin/stats` · CRUD/moderation under `/api/admin/{users,books,exchanges,payments,categories,fees,reports,reviews}` |

---

## 13. Exchange State Machine

```
PENDING ──accept──▶ ACCEPTED ──create order──▶ PAYMENT_PENDING ──verified──▶ CONFIRMED
   │                    │                            │                          │
   │ reject/cancel      │ cancel                     │ retry on failure         │ both mark done
   ▼                    ▼                            ▼                          ▼
REJECTED/CANCELLED  CANCELLED                 (books stay reserved)         COMPLETED
                                                                        (ownership swaps)
Timeouts: PENDING/ACCEPTED/PAYMENT_PENDING auto-expire → EXPIRED (books released).
Admin can force DISPUTED / CANCELLED / COMPLETED from /admin/exchanges.
```

Any terminal transition (reject, cancel, expire) releases both reserved books back to
`AVAILABLE` inside the same transaction.

---

## 14. Security Model

- **Passwords:** bcrypt cost 12; never logged or returned.
- **Sessions:** opaque random tokens, only SHA-256 hashes stored; cookies are `httpOnly`,
  `sameSite=lax`, `secure` in production. Password reset invalidates all sessions.
- **CSRF:** double-submit cookie/header check in `middleware.ts` on every mutating `/api` call.
- **Authorization:** every route re-validates ownership and role server-side — the client
  never decides who owns a book, whether a payment succeeded, or who can read a chat.
- **Payments:** the *only* paths to `PAID` are the server-side HMAC verification and the
  signature-verified, idempotent webhook.
- **Privacy:** exact addresses and contact details are excluded from all public queries.
- **Rate limiting:** login, registration, uploads, payments, messages, geocoding.
- **SQL injection:** all access goes through Prisma's parameterized queries.

---

## 15. Troubleshooting

| Symptom | Cause & fix |
|---|---|
| `Can't reach database server at localhost:5432` | Postgres isn't running. Docker: `docker start bookswap-db`. Windows service: `Get-Service postgresql*` → start it. |
| `Database "bookswap" does not exist` | Create it: `psql -U postgres -h localhost -c "CREATE DATABASE bookswap;"` then re-run migrate + seed. |
| `EPERM: operation not permitted, rename …query_engine-windows.dll.node` during `prisma generate`/`npm run build` | The dev server is holding the Prisma engine file (Windows lock). Stop `npm run dev`, run the command, start dev again. |
| Page loads but nothing animates / buttons dead / 404s for `main-app.js` | Corrupted `.next` cache (usually from running `next build` while `next dev` was running). Stop the dev server, delete the `.next` folder, restart. |
| Port 3000 in use | `npm run dev -- -p 3002` (any free port). |
| Payment button returns "Something went wrong" | Razorpay keys are missing/placeholder in `.env` — see §9. This is intentional: no fake success. |
| Geocoding returns "Could not locate that address" | Nominatim rate limit or unusual address — try a major city name; a built-in city-centroid fallback keeps dev working. |
| Book covers blank | Seeded covers load from `covers.openlibrary.org` — needs internet; the UI falls back to a styled placeholder offline. |
| No matches in Discover | The demo users live in different cities. Set your radius to **Anywhere** (Dashboard → Address & Location) or add books/wants for two users in the same city. |

---

## 16. Production Deployment

1. Provision PostgreSQL and set every variable from §6 in your host's environment
   (Vercel / Render / Railway / Fly / a VPS).
2. Migrate: `npx prisma migrate deploy` (against the production DB).
3. Seed once: `npx prisma db seed` — or create the admin manually; never ship the default
   admin password (`ADMIN_PASSWORD` env controls what the seed uses).
4. Build & start: `npm run build` then `npm start`.
5. Point the Razorpay webhook at `https://<your-domain>/api/payments/webhook` (live-mode
   keys + webhook secret).
6. **File uploads:** book covers/avatars are written to local `public/uploads` — on
   serverless hosts this is ephemeral, so swap `app/api/uploads/route.ts` for
   S3/Cloudinary/UploadThing before real traffic.
7. **Rate limiting:** the in-memory limiter is per-instance; use Redis/Upstash if you run
   more than one instance.
8. Set a strong `AUTH_SECRET`, use HTTPS (cookies are `secure` in production), and keep
   `LOCATION_PROVIDER=locationiq` (or similar) for reliable geocoding volume.

---

## 17. Known Limitations

Deliberate simplifications, each marked with a `ponytail:` comment in code and an upgrade path:

- **Chat is 4-second polling**, not WebSockets — swap in Pusher/Ably/SSE if true realtime matters.
- **Percentage fees** compute against a nominal ₹500 base value (books aren't individually priced) with a configurable floor — add a per-book value field if percentages must track real prices.
- **Matching/discover scans are capped** (300–500 candidates) — add PostGIS + full-text search when the catalogue grows past a few thousand books.
- **Rate limiter and exchange-expiry sweep are in-process** — fine for one instance; use Redis + a cron job for a fleet.

---

**License:** MIT. Built as a production-quality reference implementation — PRs and forks welcome.
