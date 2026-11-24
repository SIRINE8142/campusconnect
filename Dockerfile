# syntax=docker/dockerfile:1
# Image multi-étapes : on construit avec toutes les dépendances,
# puis on copie seulement le nécessaire dans l'image finale.

# ---------- Étape 1 : dépendances + build ----------
FROM node:20-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# Dépendances d'abord : cette couche est cachée tant que
# package.json / package-lock.json ne changent pas.
COPY package.json package-lock.json ./
RUN npm ci

# Code ensuite. La migration crée dev.db pour permettre le
# prerender des pages pendant le build (Cache Components).
COPY . .
ENV DATABASE_URL="file:./dev.db"
RUN npx prisma migrate deploy && npm run build

# ---------- Étape 2 : image de production ----------
FROM node:20-slim AS prod
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

COPY package.json ./
# node_modules complets (better-sqlite3 est un module natif déjà
# compilé dans l'étape build ; prisma + tsx restent dispo pour
# les migrations au démarrage).
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/next.config.ts ./
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma7.config.ts ./
COPY --from=build /app/src/generated ./src/generated
COPY docker-entrypoint.sh ./

EXPOSE 3000
ENTRYPOINT ["sh", "docker-entrypoint.sh"]
