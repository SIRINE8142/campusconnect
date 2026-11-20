import { PrismaClient } from "@/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

// Prisma 7 fonctionne via un "driver adapter" (ici better-sqlite3)
// plutôt qu'avec le moteur binaire historique.
function createClient() {
  const adapter = new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL ?? "file:./dev.db",
  });
  return new PrismaClient({ adapter });
}

// En développement, Next.js recharge les modules à chaud : on garde une
// seule instance de PrismaClient sur l'objet global pour éviter de
// multiplier les connexions au fichier SQLite.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
