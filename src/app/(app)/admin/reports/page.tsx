import Link from "next/link";
import { Flag } from "lucide-react";
import { requireAdmin } from "@/lib/auth/session";
import { listReports } from "@/lib/services/reports";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ReportStatusBadge, RequestStatusBadge } from "@/components/ui/status-badge";
import { ReportActions } from "@/components/admin/report-actions";
import { Select, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Signalements" };

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const status =
    params.status === "PENDING" || params.status === "RESOLVED" || params.status === "DISMISSED"
      ? params.status
      : undefined;

  const reports = await listReports(status);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Signalements</h1>
          <p className="mt-1 text-sm text-slate-500">
            Publications signalées par les étudiants.
          </p>
        </div>
        <form method="GET" action="/admin/reports" className="flex items-center gap-2">
          <Label htmlFor="status" className="sr-only">Statut</Label>
          <Select id="status" name="status" defaultValue={status ?? ""}>
            <option value="">Tous</option>
            <option value="PENDING">À traiter</option>
            <option value="RESOLVED">Traités</option>
            <option value="DISMISSED">Rejetés</option>
          </Select>
          <Button type="submit" size="sm">Filtrer</Button>
        </form>
      </div>

      {reports.length === 0 ? (
        <EmptyState
          icon={<Flag className="h-10 w-10" />}
          title="Aucun signalement"
          description="Aucune publication signalée dans cette catégorie."
        />
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <Card key={r.id}>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <ReportStatusBadge status={r.status} />
                    <RequestStatusBadge status={r.request.status} />
                    <Badge tone="violet">{r.request.subject}</Badge>
                  </div>
                  <p className="mt-2 font-medium text-slate-900">
                    <Link href={`/requests/${r.request.id}`} className="text-blue-800 hover:underline">
                      {r.request.title}
                    </Link>
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-600">{r.request.description}</p>
                  <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
                    <div>
                      <dt className="text-xs uppercase text-slate-400">Raison</dt>
                      <dd className="text-red-700">{r.reason}</dd>
                      {r.details && <dd className="text-xs text-slate-500">{r.details}</dd>}
                    </div>
                    <div>
                      <dt className="text-xs uppercase text-slate-400">Signalé par</dt>
                      <dd className="text-slate-700">
                        {r.reporter.firstName} {r.reporter.lastName}
                      </dd>
                      <dd className="text-xs text-slate-500">{r.reporter.email}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase text-slate-400">Auteur</dt>
                      <dd className="text-slate-700">
                        {r.request.author.firstName} {r.request.author.lastName}
                      </dd>
                      <dd className="text-xs text-slate-500">{formatDate(r.createdAt)}</dd>
                    </div>
                  </dl>
                </div>
                {r.status === "PENDING" && (
                  <ReportActions reportId={r.id} requestId={r.request.id} />
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
