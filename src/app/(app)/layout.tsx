import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { AppShell } from "@/components/layout/app-shell";

/**
 * Layout de l'espace connecté : toutes les pages du groupe (app)
 * exigent une session valide — vérification réelle côté serveur,
 * en plus du proxy qui ne teste que la présence du cookie.
 */
// L'espace connecté dépend de la session et de l'URL (params/searchParams)
// sans boundaries <Suspense> : on déclare le blocage serveur plutôt que
// de viser la navigation instantanée (Cache Components, Next 16).
export const instant = false;

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const unreadNotifications = await prisma.notification.count({
    where: { userId: user.id, read: false },
  });

  return (
    <AppShell user={user} unreadNotifications={unreadNotifications} isAdmin={user.role === "ADMIN"}>
      {children}
    </AppShell>
  );
}
