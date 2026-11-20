import Link from "next/link";
import { Inbox } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { listReceivedProposals } from "@/lib/services/proposals";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Avatar } from "@/components/ui/avatar";
import { ProposalStatusBadge, RequestStatusBadge } from "@/components/ui/status-badge";
import { ProposalActions } from "@/components/proposals/proposal-actions";
import { formatDate, levelLabel } from "@/lib/utils";

export const metadata = { title: "Propositions reçues" };

export default async function ReceivedProposalsPage() {
  const user = await requireUser();
  const proposals = await listReceivedProposals(user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Propositions reçues</h1>
        <p className="mt-1 text-sm text-slate-500">
          Les étudiants qui proposent leur aide sur tes demandes.
        </p>
      </div>

      {proposals.length === 0 ? (
        <EmptyState
          icon={<Inbox className="h-10 w-10" />}
          title="Aucune proposition reçue"
          description="Publie une demande d'aide pour recevoir des propositions."
          action={
            <Link href="/requests/new" className="text-sm font-medium text-blue-700 hover:underline">
              Créer une demande →
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {proposals.map((p) => (
            <Card key={p.id}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/requests/${p.request.id}`}
                      className="font-medium text-blue-800 hover:underline"
                    >
                      {p.request.title}
                    </Link>
                    <RequestStatusBadge status={p.request.status} />
                    <ProposalStatusBadge status={p.status} />
                  </div>
                  <p className="mt-2 text-sm text-slate-700">{p.message}</p>
                </div>
                {p.status === "PENDING" && p.request.status === "OPEN" && (
                  <ProposalActions proposalId={p.id} />
                )}
              </div>
              <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
                <Avatar
                  firstName={p.helper.firstName}
                  lastName={p.helper.lastName}
                  url={p.helper.avatarUrl}
                  size="sm"
                />
                <Link href={`/profile/${p.helper.id}`} className="hover:underline">
                  {p.helper.firstName} {p.helper.lastName}
                </Link>
                <Badge tone="slate">{p.helper.specialty ?? "—"}</Badge>
                <span>{levelLabel(p.helper.level)}</span>
                <span>·</span>
                <span>{formatDate(p.createdAt)}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
