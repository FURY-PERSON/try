# Fact Front

Mobile quiz app with admin panel and REST API.

**Stack:** Expo (React Native) · NestJS · PostgreSQL · React + Vite

---

## Project Structure

```
├── mobile/          # Expo app (iOS / Android)
├── server/          # NestJS API
├── web/             # React admin panel
├── deploy/
│   ├── stage/       # Stage server config & scripts
│   └── prod/        # Production server config & scripts
└── docker-compose.yml  # Local development (DB + server)
```

---

## Local Development

### Prerequisites
- Node.js 20+
- Docker

### 1. Server

Copy env and start the database:

```bash
# DB runs in Docker, server runs natively
make dev-db
make dev-server
```

The API will be available at `http://localhost:3001`.

### 2. Web admin panel

```bash
make dev-web
```

Available at `http://localhost:5173`.

### 3. Mobile app

```bash
make mobile-ios      # iOS simulator
make mobile-android  # Android emulator
```

---

## Deploy

All deploy commands run from the respective subfolder.

### Stage

```bash
# First time on a new server (gets SSL cert + full deploy)
make -C deploy/stage init

# Regular deploy (code update)
make -C deploy/stage deploy

# Get SSL cert separately (if rate-limited during init)
make -C deploy/stage certbot

# Renew SSL cert (run manually or via cron)
make -C deploy/stage renew-cert

# Logs
make -C deploy/stage logs
```

### Production

Same commands, different folder:

```bash
make -C deploy/prod init
make -C deploy/prod deploy
make -C deploy/prod logs
```

Before first prod deploy, fill in `deploy/prod/Makefile` (server IP, domain) and `deploy/prod/prod.env` (secrets).

### iOS build

```bash
make -C deploy/stage xcode   # stage build
make -C deploy/prod xcode    # production build
```

Open Xcode → **Product → Archive**.

---

## Environment Variables

| File | Purpose |
|------|---------|
| `server/.env` | Local server development |
| `server/.env.development` | Used by docker-compose locally |
| `deploy/stage/stage.env` | Stage server environment |
| `deploy/prod/prod.env` | Production environment (fill CHANGE_ME) |
| `mobile/.env.*` | Expo per-environment API URLs |
