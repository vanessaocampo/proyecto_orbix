# =========================================================
# ORBIX - Backend Dockerfile (build multi-stage)
# SENA - ADSO - Ficha 3114227
# =========================================================

# ---------- Etapa de compilación ----------
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

# Solo se usa para generar el cliente Prisma en tiempo de build.
# En runtime la URL real la inyecta Docker Compose (no se copia .env).
ENV DATABASE_URL=postgresql://dummy:dummy@localhost:5432/dummy
RUN npx prisma generate

RUN npm run build

# ---------- Etapa de producción ----------
FROM node:22-alpine AS runner

ENV NODE_ENV=production
WORKDIR /app

# OpenSSL requerido por los engines de Prisma en Alpine
RUN apk add --no-cache openssl

COPY package*.json ./
# Producción: solo dependencias runtime. El cliente Prisma ya viene generado.
RUN npm ci --omit=dev --ignore-scripts

# Cliente Prisma generado durante la etapa builder
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Esquema Prisma, config y código compilado
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/dist ./dist

EXPOSE 3001

USER node

# Aplica las migraciones pendientes contra la BD (Neon) y arranca la API.
# prisma viene como dependencia de runtime para poder usar `migrate deploy`.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
