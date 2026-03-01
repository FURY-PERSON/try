# ───────────────────────────────────────
# Stage 1 — Base image
# ───────────────────────────────────────
FROM node:20-alpine AS base

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
ARG VITE_API_URL=""
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build:prod

# ───────────────────────────────────────
# Stage 4 — Production image (nginx)
# ───────────────────────────────────────
FROM nginx:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
