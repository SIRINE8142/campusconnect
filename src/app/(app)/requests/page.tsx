import Link from "next/link";
import { PlusCircle, ListTodo } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { listRequests, listSubjects } from "@/lib/services/requests";
import { RequestCard } from "@/components/requests/request-card";
import { RequestFilters } from "@/components/requests/request-filters";
import { EmptyState } from "@/components/ui/empty-state";
import { Card } from "@/components/ui/card";
import type { RequestStatus } from "@/generated/prisma/client";

export const metadata = { title: "Demandes d'aide" };

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireUser();
  const params = await searchParams;

  const status =
    params.status === "OPEN" || params.status === "ACCEPTED" || params.status === "COMPLETED"
      ? (params.status as RequestStatus)
      : undefined;
  const levelNum = typeof params.level === "string" ? Number(params.level) : NaN;

  const [requests, subjects] = await Promise.all([
    listRequests({
      q: typeof params.q === "string" ? params.q : undefined,
      subject: typeof params.subject === "string" && params.subject ? params.subject : undefined,
      level: Number.isInteger(levelNum) ? levelNum : undefined,
      status,
    }),
    listSubjects(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Demandes d'aide</h1>
          <p className="mt-1 text-sm text-slate-500">
            Trouve un étudiant pour t'aider, ou propose tes compétences.
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

      <Card>
        <RequestFilters
          subjects={subjects}
          current={{
            q: typeof params.q === "string" ? params.q : undefined,
            subject: typeof params.subject === "string" ? params.subject : undefined,
            level: typeof params.level === "string" ? params.level : undefined,
            status: typeof params.status === "string" ? params.status : undefined,
          }}
        />
      </Card>

      {requests.length === 0 ? (
        <EmptyState
          icon={<ListTodo className="h-10 w-10" />}
          title="Aucune demande trouvée"
          description="Essaie d'autres filtres, ou publie ta propre demande d'aide."
          action={
            <Link href="/requests/new" className="text-sm font-medium text-blue-700 hover:underline">
              Créer une demande →
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {requests.map((r) => (
            <RequestCard key={r.id} request={r} />
          ))}
        </div>
      )}
    </div>
  );
}
