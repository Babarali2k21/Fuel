# SpritCheck Austria

Mobile-first fuel recommendation app for Austria with freemium monetization.

## Stack

- **Frontend:** Next.js 16, TypeScript, Tailwind CSS, Zustand, Clerk, TanStack Query
- **Backend:** FastAPI, SQLAlchemy, Alembic, Redis
- **Database:** PostgreSQL
- **Payments:** Stripe
- **Fuel data:** E-Control Spritpreisrechner API (official Austrian government data)

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 20+
- Python 3.12+ (optional for local backend without Docker)

### 1. Configure environment

```bash
cp .env.example .env
```

Fill in Clerk, Stripe, and optional Google Maps / Resend keys.

### 2. Start with Docker

```bash
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API docs: http://localhost:8000/docs

### 3. Local development (without Docker)

**Backend:**

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev
```

Requires PostgreSQL and Redis running locally (see `.env.example`).

## Features

### Free Tier
- Nearby fuel stations from E-Control API
- Single best recommendation by true total cost
- Manual inputs (fuel type, consumption, tank level)
- 5-minute refresh cache

### Premium Tier (€4.99/mo or €39/yr)
- Google Routes detour calculations
- Route-based multi-stop optimization
- Price trend predictions
- Email price alerts
- Car profiles
- Savings dashboard
- Real-time refresh

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/v1/stations` | Nearby stations |
| POST | `/v1/recommend` | Cost engine recommendation |
| GET | `/v1/me` | Current user profile |
| POST | `/v1/stripe/checkout` | Stripe checkout session |
| POST | `/v1/stripe/webhook` | Stripe webhook handler |

See full API docs at `/docs` when backend is running.

## Deployment

### Frontend (Vercel)

```bash
cd frontend
vercel --prod
```

Set environment variables from `.env.example`.

### Backend (Railway)

Deploy the `backend/` directory. Set `DATABASE_URL`, `REDIS_URL`, and Stripe/Clerk keys.

Recommended services:
- **Neon** for PostgreSQL
- **Upstash** for Redis
- **Railway** for FastAPI + scheduled jobs

## Project Structure

```
fuel/
├── frontend/          # Next.js PWA
├── mobile/            # React Native (Expo) app
├── backend/           # FastAPI API
├── docker-compose.yml
└── .env.example
```

## Mobile App (Expo)

```bash
cd mobile
cp .env.example .env
npm install
npm start
```

Set `EXPO_PUBLIC_API_URL` in `.env`:
- **iOS simulator:** `http://localhost:8000`
- **Android emulator:** `http://10.0.2.2:8000` (default if unset on Android)
- **Physical device:** `http://YOUR_LAN_IP:8000` (same Wi‑Fi as your machine)

Ensure the backend is running (`uvicorn` or Docker) before opening the app.

Screens: Home (real map + live E-Control prices), Insights, Favorites, Alerts, Profile, Premium paywall.

## License

Proprietary – SpritCheck Austria
