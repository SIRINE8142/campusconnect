import Link from "next/link";
import { Send } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { listSentProposals } from "@/lib/services/proposals";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Avatar } from "@/components/ui/avatar";
import { ProposalStatusBadge } from "@/components/ui/status-badge";
import { WithdrawButton } from "@/components/proposals/withdraw-button";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Mes propositions" };

export default async function SentProposalsPage() {
  const user = await requireUser();
  const proposals = await listSentProposals(user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Mes propositions</h1>
        <p className="mt-1 text-sm text-slate-500">
          L'aide que tu as proposée aux autres étudiants.
        </p>
      </div>

      {proposals.length === 0 ? (
        <EmptyState
          icon={<Send className="h-10 w-10" />}
          title="Aucune proposition envoyée"
          description="Parcours les demandes ouvertes et propose ton aide !"
          action={
            <Link href="/requests" className="text-sm font-medium text-blue-700 hover:underline">
              Voir les demandes →
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {proposals.map((p) => (
            <Card key={p.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/requests/${p.request.id}`}
                    className="font-medium text-blue-800 hover:underline"
                  >
                    {p.request.title}
                  </Link>
                  <Badge tone="violet">{p.request.subject}</Badge>
                  <ProposalStatusBadge status={p.status} />
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-slate-600">{p.message}</p>
                <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                  <Avatar
                    firstName={p.request.author.firstName}
                    lastName={p.request.author.lastName}
                    url={p.request.author.avatarUrl}
                    size="sm"
                  />
                  <span>
                    pour {p.request.author.firstName} {p.request.author.lastName}
                  </span>
                  <span>·</span>
                  <span>{formatDate(p.createdAt)}</span>
                </div>
              </div>
              {p.status === "PENDING" && <WithdrawButton proposalId={p.id} />}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
