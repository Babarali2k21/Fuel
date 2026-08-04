# SpritCheck Deployment Guide

## Staging / Production Stack

| Service | Provider | Region |
|---------|----------|--------|
| Frontend (Next.js PWA) | Vercel | `fra1` (Frankfurt) |
| Backend (FastAPI) | Railway | EU West |
| PostgreSQL | Neon | EU |
| Redis | Upstash | EU |
| Auth | Clerk | - |
| Payments | Stripe | - |

## 1. Database (Neon)

1. Create a PostgreSQL project in [Neon](https://neon.tech)
2. Copy the connection string to `DATABASE_URL`
3. Run migrations:

```bash
cd backend
alembic upgrade head
```

## 2. Redis (Upstash)

1. Create a Redis database in [Upstash](https://upstash.com)
2. Set `REDIS_URL` in backend environment

## 3. Backend (Railway)

1. Connect this repo and set root directory to `backend/`
2. Railway will use `backend/Dockerfile` and `backend/railway.toml`
3. Set all backend env vars from `.env.example`
4. Health check: `GET /health`

## 4. Frontend (Vercel)

1. Import repo with root directory `frontend/`
2. Set env vars:
   - `NEXT_PUBLIC_API_URL` → Railway backend URL
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
3. Deploy to `fra1` region (see `frontend/vercel.json`)

## 5. Stripe

1. Create products: €4.99/month, €39/year
2. Copy Price IDs to `STRIPE_PRICE_MONTHLY` and `STRIPE_PRICE_YEARLY`
3. Set `STRIPE_TRIAL_DAYS=7` (default) for the free trial period
4. Configure webhook endpoint: `https://<backend>/v1/stripe/webhook`
5. Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
6. In **Stripe Billing Portal** settings:
   - Enable subscription cancellation
   - Allow cancel during trial (access until trial end)
   - Payment method collection happens at Checkout (card on file before trial ends)

Trial flow: new users get 7 days free with card on file; Stripe auto-charges when the trial ends unless canceled. Users manage/cancel via Billing Portal (`/settings` → Manage subscription).

For local testing without paywalls, set `BYPASS_PREMIUM=true` (backend) and `NEXT_PUBLIC_BYPASS_PREMIUM=true` (frontend). Set both to `false` before production launch.

## 6. Clerk

1. Create application at [clerk.com](https://clerk.com)
2. Enable Google OAuth + Email magic link
3. Set JWT issuer URL in `CLERK_JWT_ISSUER`
4. Add frontend URLs to allowed origins

## 7. Optional Premium Services

- **Google Maps Routes API**: `GOOGLE_MAPS_API_KEY` for premium detour calculations
- **Resend**: `RESEND_API_KEY` for price alert emails

## Local Docker

```bash
cp .env.example .env
docker compose up --build
```

- Frontend: http://localhost:3001
- Backend: http://localhost:8000
- API docs: http://localhost:8000/docs
