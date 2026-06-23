# Marketplace API (NestJS)

Backend for the multi-vendor e-commerce marketplace. NestJS + TypeORM + PostgreSQL,
JWT/Google auth, Stripe Connect payouts, Cloudinary images, Swagger docs.

## Prerequisites

- Node 20+
- PostgreSQL running locally (default `localhost:5432`)
- (optional) [Stripe CLI](https://stripe.com/docs/stripe-cli) for webhook testing
- (optional) Mailpit/MailHog for catching local email

## Setup

```bash
cp .env.example .env          # then fill in secrets (Stripe, Cloudinary, Google)
npm install
# create the database (psql or any client): CREATE DATABASE "multi-vendor-ecommerce";
npm run migration:run         # apply schema
npm run seed                  # seed categories + admin user
npm run start:dev             # http://localhost:4000  (Swagger at /api/docs)
```

The seed creates an admin from `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env`.

## Migrations

```bash
npm run migration:generate -- src/migrations/<Name>   # diff entities -> migration
npm run migration:run                                 # apply
npm run migration:revert                              # roll back last
```

`synchronize` is **off** — schema changes always go through migrations.

## Stripe webhook (local)

Checkout completion creates the order via the webhook. To test end-to-end:

```bash
stripe listen --forward-to localhost:4000/checkout/webhook
# copy the printed whsec_... into STRIPE_WEBHOOK_SECRET in .env, then restart the API
```

Without `STRIPE_WEBHOOK_SECRET` the webhook endpoint returns 503 (by design).
Checkout session creation and Connect onboarding work with just `STRIPE_SECRET_KEY`.

## Local email (Mailpit)

Defaults target `localhost:1025`. Run a catcher and view mail at http://localhost:8025:

```bash
docker run -d -p 1025:1025 -p 8025:8025 axllent/mailpit
```

If no SMTP server is present, sends fail softly and are logged (flows still work).

## Useful scripts

| Script | Purpose |
| --- | --- |
| `npm run start:dev` | Watch-mode dev server |
| `npm run build` | Compile to `dist/` |
| `npm run lint` | ESLint (with `--fix`) |
| `npm run seed` | Seed categories + admin |
