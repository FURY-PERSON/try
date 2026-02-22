# ───────────────────────────────────────
# Stage 1 — Base image
# ───────────────────────────────────────
FROM node:20-alpine AS base
RUN apk add --no-cache openssl

# ───────────────────────────────────────
# Stage 2 — Install dependencies
# ───────────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# ───────────────────────────────────────
# Stage 3 — Build the application
# ───────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npm run build && \
    npx tsc prisma/seed.ts --outDir prisma/compiled --esModuleInterop --module commonjs --target ES2022 --skipLibCheck --resolveJsonModule

# ───────────────────────────────────────
# Stage 4 — Production image
# ───────────────────────────────────────
FROM base AS runner
RUN apk add --no-cache su-exec openssl
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nestjs && \
    adduser --system --uid 1001 nestjs

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma/compiled/seed.js ./prisma/seed.js
COPY --from=builder /app/package.json ./

COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x docker-entrypoint.sh

EXPOSE 3001
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/main"]
