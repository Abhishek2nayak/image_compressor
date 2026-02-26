# ImagePress — Image Compression SaaS

A production-ready image compression platform with API access, Stripe billing, and a modern SaaS UI.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), Tailwind CSS, TanStack Query, NextAuth.js |
| Backend | Node.js, Express, TypeScript, Prisma ORM |
| Compression | Sharp (JPEG, PNG, WebP, AVIF) |
| Queue | BullMQ + Redis |
| Database | PostgreSQL |
| Auth | JWT + Google OAuth |
| Billing | Stripe |
| Storage | Local disk (S3 adapter ready) |

## Project Structure

```
image-compressor/
├── apps/
│   ├── web/          # Next.js 14 frontend (port 3000)
│   └── api/          # Express backend (port 4000)
└── packages/
    └── shared/       # Shared TypeScript types
```

## Quick Start

### 1. Prerequisites

- Node.js >= 20
- pnpm >= 9
- Docker (for Postgres + Redis)

### 2. Install dependencies

```bash
pnpm install
```

### 3. Start infrastructure

```bash
pnpm docker:up
```

### 4. Set up environment variables

```bash
# Copy and fill in the required values
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.local.example apps/web/.env.local
```

Minimum required for local dev (update `apps/api/.env`):
- `JWT_SECRET` and `JWT_REFRESH_SECRET` — any random 32+ char strings
- `NEXTAUTH_SECRET` — any random 32+ char string (in `apps/web/.env.local`)

### 5. Run database migrations

```bash
pnpm db:migrate
```

### 6. Start development servers

```bash
pnpm dev
```

- Frontend: http://localhost:3000
- API: http://localhost:4000
- API health: http://localhost:4000/health

## API Reference

### Authentication

Include your API key in the `X-API-Key` header:

```bash
curl -X POST http://localhost:4000/api/v1/compress \
  -H "X-API-Key: ic_your_key" \
  -F "image=@photo.jpg" \
  -F "level=MEDIUM"
```

### Compression Levels

| Level | JPEG/WebP/AVIF Quality | PNG Compression |
|-------|------------------------|-----------------|
| LOW | 85 | 3 |
| MEDIUM | 75 | 6 |
| HIGH | 60 | 9 |

### Rate Limits

| Tier | Web Uploads/Day | API Req/Hour |
|------|-----------------|--------------|
| Free | 10 | 20 |
| Pro | 500 | 500 |

## Environment Variables

See [.env.example](.env.example) for the full list.

### Required for full functionality

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_SECRET` | JWT signing secret (32+ chars) |
| `GOOGLE_CLIENT_ID/SECRET` | Google OAuth (optional) |
| `STRIPE_SECRET_KEY` | Stripe (optional for billing) |

## Features

- **Image compression** — JPG, PNG, WebP, AVIF with adjustable quality
- **Batch processing** — Upload up to 20 images, download as ZIP
- **Authentication** — Email/password + Google OAuth
- **Dashboard** — Usage stats, quota tracking, compression history
- **API keys** — Generate and manage API keys for programmatic access
- **Billing** — Stripe-powered Pro tier subscriptions
- **Auto-cleanup** — Compressed files expire after 24 hours
