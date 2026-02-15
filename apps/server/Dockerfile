# ───────────────────────────────────────
# Stage 1 — Base image with pnpm
# ───────────────────────────────────────
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.14.0 --activate

# ───────────────────────────────────────
# Stage 2 — Install dependencies
# ───────────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/server/package.json apps/server/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile --filter @wordpulse/server...

# ───────────────────────────────────────
# Stage 3 — Build the application
# ───────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/server/node_modules ./apps/server/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY packages/shared ./packages/shared
COPY apps/server ./apps/server
RUN cd apps/server && npx prisma generate && pnpm run build

# ───────────────────────────────────────
# Stage 4 — Production image
# ───────────────────────────────────────
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# Create a non-root user
RUN addgroup --system --gid 1001 nestjs && \
    adduser --system --uid 1001 nestjs

COPY --from=builder /app/apps/server/dist ./dist
COPY --from=builder /app/apps/server/node_modules ./node_modules
COPY --from=builder /app/apps/server/prisma ./prisma
COPY --from=builder /app/apps/server/package.json ./

USER nestjs

EXPOSE 3000
CMD ["node", "dist/main"]
