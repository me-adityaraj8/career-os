# Production Dockerfile — single container serving both API and static frontend.
# Works on any Docker host (Render, Fly, a VPS…) that injects a PORT env var.

FROM node:22-alpine AS base

# ---- Build frontend ----
FROM base AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci
COPY frontend/ ./
ARG VITE_API_URL=/api/v1
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# ---- Build backend ----
FROM base AS backend-build
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json* ./
RUN npm ci
COPY backend/ ./
RUN npm run build

# ---- Production image ----
FROM base AS production
WORKDIR /app

COPY backend/package.json backend/package-lock.json* ./backend/
RUN cd backend && npm ci --omit=dev

COPY --from=backend-build /app/backend/dist ./backend/dist
COPY --from=frontend-build /app/frontend/dist ./frontend/dist
COPY backend/migrations ./backend/migrations

RUN mkdir -p /app/backend/uploads

WORKDIR /app/backend

ENV NODE_ENV=production
# Default port; the host (Render, etc.) overrides PORT and the app honors it.
ENV PORT=4000

EXPOSE 4000

# Migrations must succeed before serving. Seeding the demo account is
# best-effort — a seed hiccup should never keep the app from starting.
CMD ["sh", "-c", "node dist/db/migrate.js && (node dist/db/seed.js || echo 'seed skipped') && node dist/index.js"]
