#!/bin/sh
# Point d'entrée du conteneur : migrations puis démarrage.
# RUN_SEED=true peuple la base avec les données de démo.
set -e

echo "→ Application des migrations Prisma…"
npx prisma migrate deploy

if [ "$RUN_SEED" = "true" ]; then
  echo "→ Seed de la base de données…"
  npx prisma db seed
fi

echo "→ Démarrage de Next.js…"
exec npm start
