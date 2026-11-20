import Link from "next/link";
import { Users, ListTodo, Send, CalendarDays, Flag } from "lucide-react";
import { requireAdmin } from "@/lib/auth/session";
import { getAdminStats } from "@/lib/services/stats";
import { Card, CardHeader } from "@/components/ui/card";

export const metadata = { title: "Administration" };

export default async function AdminPage() {
  await requireAdmin();
  const stats = await getAdminStats();

  const tiles = [
    { label: "Étudiants inscrits", value: stats.users, icon: Users },
    { label: "Demandes publiées", value: stats.requests, icon: ListTodo },
    { label: "Demandes ouvertes", value: stats.openRequests, icon: ListTodo },
    { label: "Propositions", value: stats.proposals, icon: Send },
    { label: "Séances", value: stats.sessions, icon: CalendarDays },
    { label: "Signalements à traiter", value: stats.pendingReports, icon: Flag, highlight: stats.pendingReports > 0 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Espace administrateur</h1>
        <p className="mt-1 text-sm text-slate-500">
          Statistiques globales et modération de la plateforme.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map(({ label, value, icon: Icon, highlight }) => (
          <Card key={label} className="flex items-center gap-4">
            <span
              className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                highlight ? "bg-red-100" : "bg-blue-100"
              }`}
            >
              <Icon className={`h-5 w-5 ${highlight ? "text-red-600" : "text-blue-700"}`} />
            </span>
            <div>
              <p className="text-2xl font-bold text-slate-900">{value}</p>
              <p className="text-sm text-slate-500">{label}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader
          title="Modération"
          description="Consulte et traite les publications signalées par les étudiants."
          action={
            <Link
              href="/admin/reports"
              className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
            >
              Gérer les signalements
            </Link>
          }
        />
        <p className="text-sm text-slate-600">
          {stats.pendingReports} en attente · {stats.resolvedReports} déjà traités.
        </p>
      </Card>
    </div>
  );
}
