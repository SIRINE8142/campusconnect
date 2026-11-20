import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Clock, ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { getRequest } from "@/lib/services/requests";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { RequestStatusBadge, ProposalStatusBadge } from "@/components/ui/status-badge";
import { RequestOwnerActions } from "@/components/requests/request-owner-actions";
import { ProposalForm } from "@/components/proposals/proposal-form";
import { ProposalActions } from "@/components/proposals/proposal-actions";
import { ReportForm } from "@/components/reports/report-form";
import { SessionForm } from "@/components/sessions/session-forms";
import { formatDate, levelLabel } from "@/lib/utils";

export const metadata = { title: "Détail de la demande" };

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const request = await getRequest(id).catch(() => null);
  if (!request) notFound();

  const isAuthor = request.authorId === user.id;
  const myProposal = request.proposals.find((p) => p.helperId === user.id);
  const canPropose = request.status === "OPEN" && !isAuthor && !myProposal;

  return (
    <div className="space-y-6">
      <Link href="/requests" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-700">
        <ArrowLeft className="h-4 w-4" />
        Retour aux demandes
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Colonne principale : le contenu de la demande */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <Badge tone="violet">{request.subject}</Badge>
                <RequestStatusBadge status={request.status} />
              </div>
              {isAuthor && <RequestOwnerActions requestId={request.id} status={request.status} />}
            </div>
            <h1 className="mt-4 text-2xl font-bold text-slate-900">{request.title}</h1>
            <p className="mt-3 whitespace-pre-line text-slate-700">{request.description}</p>
            <dl className="mt-6 grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-3">
              <div>
                <dt className="text-xs font-medium uppercase text-slate-400">Niveau requis</dt>
                <dd className="mt-1 text-sm text-slate-800">{levelLabel(request.level)}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase text-slate-400">Disponibilités</dt>
                <dd className="mt-1 flex items-center gap-1.5 text-sm text-slate-800">
                  <Clock className="h-4 w-4 text-slate-400" />
                  {request.availability}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase text-slate-400">Publiée le</dt>
                <dd className="mt-1 flex items-center gap-1.5 text-sm text-slate-800">
                  <CalendarDays className="h-4 w-4 text-slate-400" />
                  {formatDate(request.createdAt)}
                </dd>
              </div>
            </dl>
            {!isAuthor && user.role !== "ADMIN" && (
              <div className="mt-4 border-t border-slate-100 pt-4">
                <ReportForm requestId={request.id} />
              </div>
            )}
          </Card>

          {/* Zone proposer son aide */}
          {canPropose && (
            <Card>
              <CardHeader
                title="Proposer ton aide"
                description="L'auteur pourra accepter ou refuser ta proposition."
              />
              <ProposalForm requestId={request.id} />
            </Card>
          )}
          {myProposal && !isAuthor && (
            <Card>
              <CardHeader title="Ta proposition" />
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-slate-700">{myProposal.message}</p>
                <ProposalStatusBadge status={myProposal.status} />
              </div>
            </Card>
          )}
          {request.status !== "OPEN" && !isAuthor && !myProposal && (
            <p className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
              Cette demande n'accepte plus de propositions.
            </p>
          )}

          {/* Séance : planifiable par les deux participants une fois l'aide acceptée */}
          {(() => {
            const accepted = request.proposals.find((p) => p.status === "ACCEPTED");
            const isParticipant =
              isAuthor || (accepted && accepted.helperId === user.id);
            if (!accepted || !isParticipant) return null;
            if (request.session) {
              return (
                <Card>
                  <CardHeader
                    title="Séance organisée"
                    description={`Prévue le ${formatDate(request.session.scheduledAt)}`}
                    action={
                      <Link href="/sessions" className="text-sm font-medium text-blue-700 hover:underline">
                        Voir mes séances →
                      </Link>
                    }
                  />
                </Card>
              );
            }
            return (
              <Card>
                <CardHeader
                  title="Organiser la séance"
                  description="L'aide est acceptée : planifiez votre séance de révision."
                />
                <SessionForm proposalId={accepted.id} defaultSubject={request.subject} />
              </Card>
            );
          })()}
        </div>

        {/* Colonne latérale : auteur + propositions */}
        <div className="space-y-6">
          <Card>
            <CardHeader title="Auteur de la demande" />
            <Link
              href={`/profile/${request.author.id}`}
              className="flex items-center gap-3 rounded-xl p-1 hover:bg-slate-50"
            >
              <Avatar
                firstName={request.author.firstName}
                lastName={request.author.lastName}
                url={request.author.avatarUrl}
              />
              <div>
                <p className="font-medium text-slate-900">
                  {request.author.firstName} {request.author.lastName}
                </p>
                <p className="text-xs text-slate-500">
                  {request.author.specialty ?? "Étudiant"} · {levelLabel(request.author.level)}
                </p>
              </div>
            </Link>
          </Card>

          {isAuthor && (
            <Card>
              <CardHeader
                title={`Propositions reçues (${request.proposals.length})`}
                description="Toi seul peux accepter ou refuser."
              />
              {request.proposals.length === 0 ? (
                <p className="text-sm text-slate-500">Aucune proposition pour le moment.</p>
              ) : (
                <ul className="space-y-4">
                  {request.proposals.map((p) => (
                    <li key={p.id} className="rounded-xl border border-slate-200 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <Link
                          href={`/profile/${p.helper.id}`}
                          className="flex items-center gap-2 hover:underline"
                        >
                          <Avatar
                            firstName={p.helper.firstName}
                            lastName={p.helper.lastName}
                            url={p.helper.avatarUrl}
                            size="sm"
                          />
                          <span className="text-sm font-medium text-slate-900">
                            {p.helper.firstName} {p.helper.lastName}
                          </span>
                        </Link>
                        <ProposalStatusBadge status={p.status} />
                      </div>
                      <p className="mt-2 text-sm text-slate-600">{p.message}</p>
                      {p.status === "PENDING" && request.status === "OPEN" && (
                        <div className="mt-3">
                          <ProposalActions proposalId={p.id} />
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
