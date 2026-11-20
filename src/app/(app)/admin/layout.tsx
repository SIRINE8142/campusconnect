import { requireAdmin } from "@/lib/auth/session";

/**
 * Layout de l'espace admin : requireAdmin redirige les étudiants
 * vers /dashboard — la zone est protégée côté serveur.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return <>{children}</>;
}
