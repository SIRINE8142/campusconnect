import Link from "next/link";
import { CalendarDays, Star } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { listMySessions } from "@/lib/services/sessions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Avatar } from "@/components/ui/avatar";
import { SessionStatusBadge } from "@/components/ui/status-badge";
import { SessionActions, ReviewForm } from "@/components/sessions/session-forms";
import { formatDateTime } from "@/lib/utils";

export const metadata = { title: "Séances" };

export default async function SessionsPage() {
  const user = await requireUser();
  const sessions = await listMySessions(user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Mes séances</h1>
        <p className="mt-1 text-sm text-slate-500">
          Séances de révision organisées après acceptation d'une proposition.
        </p>
      </div>

      {sessions.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="h-10 w-10" />}
          title="Aucune séance"
          description="Les séances apparaissent ici quand une proposition est acceptée."
          action={
            <Link href="/proposals/received" className="text-sm font-medium text-blue-700 hover:underline">
              Voir les propositions reçues →
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => {
            const isAuthor = s.request.authorId === user.id;
            const other = isAuthor ? s.proposal.helper : s.request.author;
            const myReview = s.reviews.find((r) => r.authorId === user.id);
            const otherReview = s.reviews.find((r) => r.authorId !== user.id);
            const canReview =
              s.status === "DONE" && s.request.status === "COMPLETED" && !myReview;

            return (
              <Card key={s.id}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-slate-900">{s.subject}</span>
                      <SessionStatusBadge status={s.status} />
                      <Badge tone="slate">{formatDateTime(s.scheduledAt)}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">
                      <Link href={`/requests/${s.request.id}`} className="text-blue-800 hover:underline">
                        {s.request.title}
                      </Link>
                      {s.description ? ` — ${s.description}` : ""}
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                      <Avatar
                        firstName={other.firstName}
                        lastName={other.lastName}
                        url={other.avatarUrl}
                        size="sm"
                      />
                      <span>
                        avec {other.firstName} {other.lastName}
                        {isAuthor ? " (aidant)" : " (demandeur)"}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                      {myReview && (
                        <span className="inline-flex items-center gap-1">
                          Ta note : <Stars rating={myReview.rating} />
                        </span>
                      )}
                      {otherReview && (
                        <span className="inline-flex items-center gap-1">
                          Reçue : <Stars rating={otherReview.rating} />
                        </span>
                      )}
                    </div>
                  </div>
                  <SessionActions sessionId={s.id} status={s.status} />
                </div>
                {canReview && (
                  <div className="mt-3 border-t border-slate-100 pt-3">
                    <ReviewForm sessionId={s.id} />
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={
            n <= rating ? "h-3.5 w-3.5 fill-amber-400 text-amber-400" : "h-3.5 w-3.5 text-slate-300"
          }
        />
      ))}
    </span>
  );
}
