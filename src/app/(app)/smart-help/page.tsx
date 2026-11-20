import Link from "next/link";
import { Sparkles, TrendingUp } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { getRecommendations } from "@/lib/services/recommendations";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { RequestStatusBadge } from "@/components/ui/status-badge";
import { formatDate, levelLabel } from "@/lib/utils";

export const metadata = { title: "Smart Help" };

/**
 * Smart Help : recommandations de demandes basées sur les compétences,
 * la spécialité et le niveau de l'étudiant — avec score explicable.
 */
export default async function SmartHelpPage() {
  const user = await requireUser();
  const recommendations = await getRecommendations(user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
          <Sparkles className="h-6 w-6 text-blue-700" />
          Smart Help
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Demandes recommandées selon tes compétences, ta spécialité et ton niveau.
          Le score explique pourquoi chaque demande t'est proposée.
        </p>
      </div>

      {user.skills.length === 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <p className="text-sm text-amber-800">
            Ajoute tes compétences dans{" "}
            <Link href="/profile" className="font-medium underline">
              ton profil
            </Link>{" "}
            pour obtenir des recommandations plus précises.
          </p>
        </Card>
      )}

      {recommendations.length === 0 ? (
        <EmptyState
          icon={<Sparkles className="h-10 w-10" />}
          title="Aucune recommandation"
          description="Aucune demande ouverte ne correspond à ton profil pour le moment. Reviens plus tard !"
          action={
            <Link href="/requests" className="text-sm font-medium text-blue-700 hover:underline">
              Voir toutes les demandes →
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {recommendations.map(({ request, score, reasons }) => (
            <Card key={request.id} className="transition-shadow hover:shadow-md">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="violet">{request.subject}</Badge>
                    <RequestStatusBadge status={request.status} />
                    <span className="text-xs text-slate-400">{formatDate(request.createdAt)}</span>
                  </div>
                  <Link href={`/requests/${request.id}`}>
                    <h3 className="mt-2 font-semibold text-blue-800 hover:underline">
                      {request.title}
                    </h3>
                  </Link>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-600">{request.description}</p>
                  <ul className="mt-3 space-y-1">
                    {reasons.map((r) => (
                      <li key={r} className="flex items-start gap-1.5 text-xs text-slate-600">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                        {r}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
                    <Avatar
                      firstName={request.author.firstName}
                      lastName={request.author.lastName}
                      url={request.author.avatarUrl}
                      size="sm"
                    />
                    <span>
                      {request.author.firstName} {request.author.lastName}
                    </span>
                    <span>·</span>
                    <span>{levelLabel(request.level)}</span>
                    <span>·</span>
                    <span>{request._count.proposals} proposition(s)</span>
                  </div>
                </div>
                {/* Score explicable */}
                <div className="flex shrink-0 flex-col items-center rounded-xl bg-blue-50 px-4 py-3">
                  <span className="flex items-center gap-1 text-2xl font-bold text-blue-800">
                    <TrendingUp className="h-5 w-5" />
                    {score}
                  </span>
                  <span className="text-xs font-medium text-blue-600">score de pertinence</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
