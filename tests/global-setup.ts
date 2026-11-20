import { execSync } from "node:child_process";

/**
 * Prépare une base SQLite dédiée aux tests (prisma/test.db).
 * Le schéma est poussé avant que les fichiers de test ne chargent
 * @/lib/db — qui lit DATABASE_URL au premier import.
 */
export default function globalSetup() {
  process.env.DATABASE_URL = "file:./test.db";
  execSync("npx prisma db push", {
    env: { ...process.env, DATABASE_URL: "file:./test.db" },
    stdio: "inherit",
    cwd: process.cwd(),
  });
}
