# OpenStall — Multi-Vendor E-commerce Marketplace

A lightweight Etsy/Shopify hybrid where independent sellers register storefronts, list
products, and fulfill orders, while buyers browse, check out, and track deliveries.
Built as a monorepo: a **Next.js** storefront at the repo root and a **NestJS** REST API
in `server/`.

> Roles: **Admin** (platform owner) · **Seller** (owns a store) · **Buyer** · **Guest** (browse-only).

## Tech stack

| Layer | Tech |
| --- | --- |
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS v4, shadcn/ui on **Base UI**, TanStack Query, Axios |
| Backend | NestJS 11, TypeORM 1.0, PostgreSQL, Passport (JWT access+refresh, Google OAuth) |
| Payments | Stripe Connect (separate charges & transfers, per-seller payouts minus commission) |
| Media / Mail | Cloudinary (product images), Nodemailer (Mailpit locally) |
| Docs | Swagger at `/api/docs` |

## Features

- **Auth** — email/password (bcrypt), JWT access + httpOnly refresh rotation, Google OAuth, email verification, forgot/reset password.
- **Seller** — store onboarding + Stripe Connect, product CRUD with image upload, order management, sales analytics, payout history.
- **Catalog** — filters (category, price, rating, in-stock), debounced search, sorting, pagination, product detail, related products.
- **Cart & checkout** — guest (localStorage) + DB cart that merges on login, Stripe hosted checkout, multi-seller split payouts, order confirmation.
- **Orders** — buyer history + detail with status timeline; buyer/seller email notifications.
- **Reviews** — 1–5★ + text after delivery (one per product), average ratings, seller replies.
- **Admin** — user management (ban/role), seller approval, product moderation, platform analytics (GMV, commission), runtime commission-rate config.

## Repository layout

```
.                      # Next.js storefront (App Router)
├── app/               # routes: /, /products, /cart, /buyer, /seller, /admin, /auth
├── components/        # UI + feature components (ui/ is shadcn-on-Base-UI)
├── lib/               # api client, auth/cart context, queries, types
└── server/            # NestJS API (see server/README.md)
    └── src/           # auth, stores, products, cart, checkout, orders, reviews, admin, …
```

`SPEC.md` holds the full feature spec and progress checklist.

## Prerequisites

- Node 20+
- PostgreSQL running locally (default `localhost:5432`)
- _(optional)_ [Stripe CLI](https://stripe.com/docs/stripe-cli) for webhook testing
- _(optional)_ Mailpit/MailHog for catching local email

## Quick start

### 1. Backend (`server/`)

```bash
cd server
cp .env.example .env          # fill in DB creds + secrets (Stripe/Cloudinary/Google optional)
npm install
# create the DB once: CREATE DATABASE "multi-vendor-ecommerce";
npm run migration:run         # apply schema
npm run seed                  # categories + admin user
npm run seed:products         # optional: demo store + 20 products with images
npm run start:dev             # http://localhost:4000  (Swagger at /api/docs)
```

### 2. Frontend (repo root)

```bash
npm install
# optional: echo "NEXT_PUBLIC_API_URL=http://localhost:4000" > .env.local
npm run dev                   # http://localhost:3000
```

The Axios client defaults to `http://localhost:4000`; override with `NEXT_PUBLIC_API_URL`.

## Demo accounts

Created by the seeders (values come from `server/.env` on **first** seed; defaults shown):

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@marketplace.test` | `Admin123!` |
| Demo seller | `seller@marketplace.test` | `Seller123!` |

Admins can't self-register — sign in with the seeded admin, then promote users at `/admin/users`.

## Stripe webhook (local)

Orders are created by the `checkout.session.completed` **webhook**, not the success page. To test end-to-end:

```bash
cd server
stripe listen --forward-to localhost:4000/checkout/webhook
# copy the printed whsec_... into STRIPE_WEBHOOK_SECRET, then restart the API
```

> ⚠️ The Stripe CLI must be logged into the **same Stripe account (and mode)** as your
> `STRIPE_SECRET_KEY`. If they differ, events fire in one account while `stripe listen`
> watches another, so no order is ever created. Verify with `stripe config --list`.

## Local email (Mailpit)

Defaults target `localhost:1025`; view mail at http://localhost:8025:

```bash
docker run -d -p 1025:1025 -p 8025:8025 axllent/mailpit
```

With no SMTP server present, sends fail softly and are logged — flows still work.

## Useful scripts

**Frontend (root):** `npm run dev` · `npm run build` · `npm run lint`

**Backend (`server/`):** `npm run start:dev` · `npm run build` · `npm run lint` ·
`npm run migration:run` · `npm run seed` · `npm run seed:products`

See [`server/README.md`](server/README.md) for backend specifics (migrations, Stripe, mail).
