# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Fact Front** — a mobile quiz app with an admin panel and REST API.

**Stack:** Expo (React Native) · NestJS · PostgreSQL (Prisma) · React + Vite

## Development Commands

### Root (via Makefile)

```bash
make dev-db        # Start PostgreSQL in Docker
make dev-server    # Start NestJS API in watch mode (port 3001)
make dev-web       # Start web admin panel (port 5173)
make dev-all       # Start all services at once
make mobile-ios    # Expo iOS simulator
make mobile-android  # Expo Android emulator
```

### Server (`/server`)

```bash
npm run dev        # NestJS watch mode
npm run build      # TypeScript build
npx prisma generate     # Regenerate Prisma client after schema changes
npx prisma migrate dev  # Apply migrations
```

Tests: `*.spec.ts` files, run with Jest (`npm test`). Module alias `@/` maps to `src/`.

Swagger docs available at `http://localhost:3001/api/docs` in development.

### Web (`/web`)

```bash
npm run dev        # Vite dev server (proxies /api → localhost:3001)
npm run build      # Production build
```

Playwright E2E tests live in `/web/e2e`.

### Mobile (`/mobile`)

```bash
npm run start:development   # Expo dev server
npm run lint                # ESLint check
npm run lint:fix            # Auto-fix linting
npm run test                # Jest tests
```

## Architecture

### Services

| Service | Location | Port | Purpose |
|---------|----------|------|---------|
| NestJS API | `server/` | 3001 | REST API, Swagger |
| React Admin | `web/` | 5173 | Admin panel |
| Expo App | `mobile/` | — | iOS/Android app |
| PostgreSQL | Docker | 5432 | Primary database |

### Server Modules (`server/src/`)

11 feature modules: `users`, `categories`, `questions`, `daily-sets`, `leaderboard`, `collections`, `home`, `reference`, `ai`, `admin`, `feature-flags`, `health`.

- Auth: device ID + JWT for mobile/web users; email/password + JWT for admins
- AI: Anthropic and OpenAI SDKs for question generation
- Storage: Cloudflare R2 via AWS SDK
- Scheduling: `@nestjs/schedule` for daily set generation and other cron tasks
- Rate limiting: Global `ThrottlerGuard`

### Database (Prisma)

Schema at `server/prisma/schema.prisma`. Key models: `User`, `Category`, `Question`, `DailySet`, `DailySetQuestion`, `LeaderboardEntry`, `Collection`, `AdminUser`, `FeatureFlag`, `Notification`.

### Mobile (`mobile/`)

- Routing via Expo Router (file-based)
- Firebase: Analytics, Crashlytics, FCM push notifications
- Localization: i18next (RU/EN)
- State: Zustand
- Forms: React Hook Form + Zod

## Deployment

Stage server: `5.42.105.253` (SSH: `ssh root@5.42.105.253 -i ssh/stage`)

```bash
make -C deploy/stage deploy   # Sync + rebuild Docker containers
make -C deploy/stage init     # First-time setup (SSL + deploy)
make -C deploy/stage logs     # Tail logs
make -C deploy/stage certbot  # Get SSL cert (if rate-limited during init)
```

For production, fill in `deploy/prod/Makefile` (IP, domain) and `deploy/prod/prod.env` before running.

## Environment Files

| File | Used for |
|------|---------|
| `server/.env` | Local server dev |
| `server/.env.development` | Docker Compose local |
| `deploy/stage/stage.env` | Stage server |
| `deploy/prod/prod.env` | Production (fill `CHANGE_ME` values) |
| `mobile/.env.*` | Expo per-environment API URLs |
