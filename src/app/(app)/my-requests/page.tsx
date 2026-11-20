import Link from "next/link";
import { PlusCircle, FolderOpen } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { listMyRequests } from "@/lib/services/requests";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { RequestStatusBadge } from "@/components/ui/status-badge";
import { formatDate, levelLabel } from "@/lib/utils";

export const metadata = { title: "Mes demandes" };

export default async function MyRequestsPage() {
  const user = await requireUser();
  const requests = await listMyRequests(user.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mes demandes</h1>
          <p className="mt-1 text-sm text-slate-500">
            Les demandes d'aide que tu as publiées.
          </p>
        </div>
        <Link
          href="/requests/new"
          className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
        >
          <PlusCircle className="h-4 w-4" />
          Nouvelle demande
        </Link>
      </div>

      {requests.length === 0 ? (
        <EmptyState
          icon={<FolderOpen className="h-10 w-10" />}
          title="Aucune demande publiée"
          description="Publie ta première demande d'aide pour recevoir des propositions."
          action={
            <Link href="/requests/new" className="text-sm font-medium text-blue-700 hover:underline">
              Créer une demande →
            </Link>
          }
        />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase text-slate-400">
                <th className="px-5 py-3 font-medium">Demande</th>
                <th className="px-5 py-3 font-medium">Matière</th>
                <th className="px-5 py-3 font-medium">Niveau</th>
                <th className="px-5 py-3 font-medium">Statut</th>
                <th className="px-5 py-3 font-medium">Propositions</th>
                <th className="px-5 py-3 font-medium">Publiée le</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="max-w-64 px-5 py-3">
                    <Link
                      href={`/requests/${r.id}`}
                      className="line-clamp-1 font-medium text-blue-800 hover:underline"
                    >
                      {r.title}
                    </Link>
                  </td>
                  <td className="px-5 py-3">
                    <Badge tone="violet">{r.subject}</Badge>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{levelLabel(r.level)}</td>
                  <td className="px-5 py-3">
                    <RequestStatusBadge status={r.status} />
                  </td>
                  <td className="px-5 py-3 text-slate-600">{r._count.proposals}</td>
                  <td className="px-5 py-3 text-slate-500">{formatDate(r.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
