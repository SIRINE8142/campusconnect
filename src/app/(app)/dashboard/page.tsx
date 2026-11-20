import Link from "next/link";
import {
  ListTodo,
  FolderOpen,
  Send,
  Inbox,
  CalendarDays,
  CheckCircle2,
  Star,
  FilePlus2,
  ArrowRight,
  Activity,
} from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import {
  getStudentStats,
  getRequestStatusBreakdown,
  getRequestsPerMonth,
  getRecentActivity,
} from "@/lib/services/stats";
import { getRecommendations } from "@/lib/services/recommendations";
import { StatCard } from "@/components/dashboard/stat-card";
import { DashboardCharts } from "@/components/dashboard/dashboard-charts";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";

export const metadata = { title: "Tableau de bord" };

export default async function DashboardPage() {
  const user = await requireUser();
  const [stats, statusBreakdown, perMonth, activity, recommendations] = await Promise.all([
    getStudentStats(user.id),
    getRequestStatusBreakdown(user.id),
    getRequestsPerMonth(user.id),
    getRecentActivity(user.id),
    getRecommendations(user.id, 3),
  ]);

  const ACTIVITY_ICON = {
    request: FilePlus2,
    sent: Send,
    received: Inbox,
  } as const;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Bonjour {user.firstName} 👋
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Voici l'activité de ton compte CampusConnect.
          </p>
        </div>
        <Link
          href="/requests/new"
          className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
        >
          <FilePlus2 className="h-4 w-4" />
          Nouvelle demande
        </Link>
      </div>

      {/* Cartes de statistiques — données réelles de la base */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Demandes publiées" value={stats.requestsPublished} icon={FolderOpen} />
        <StatCard label="Demandes ouvertes" value={stats.openRequests} icon={ListTodo} />
        <StatCard label="Propositions envoyées" value={stats.proposalsSent} icon={Send} />
        <StatCard label="Propositions reçues" value={stats.proposalsReceived} icon={Inbox} />
        <StatCard
          label="Séances réalisées"
          value={stats.sessionsDone}
          icon={CalendarDays}
          sub={stats.sessionsPlanned > 0 ? `${stats.sessionsPlanned} planifiée(s)` : undefined}
        />
        <StatCard label="Demandes terminées" value={stats.completedRequests} icon={CheckCircle2} />
        <StatCard
          label="Note moyenne"
          value={stats.averageRating ? `${stats.averageRating.toFixed(1)}/5` : "—"}
          icon={Star}
          sub={`${stats.reviewsCount} évaluation(s)`}
        />
        <StatCard label="Compétences" value={user.skills.length} icon={Activity} />
      </div>

      <Card>
        <CardHeader title="Statistiques" description="Ta participation à la plateforme." />
        <DashboardCharts perMonth={perMonth} statusBreakdown={statusBreakdown} />
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Activité récente */}
        <Card>
          <CardHeader title="Activité récente" />
          {activity.length === 0 ? (
            <p className="text-sm text-slate-500">
              Aucune activité pour le moment. Commence par publier une demande ou proposer ton aide.
            </p>
          ) : (
            <ul className="space-y-3">
              {activity.map((a, i) => {
                const Icon = ACTIVITY_ICON[a.icon];
                return (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100">
                      <Icon className="h-4 w-4 text-blue-700" />
                    </span>
                    <div className="min-w-0">
                      <Link href={a.link} className="text-sm text-slate-700 hover:text-blue-800">
                        {a.text}
                      </Link>
                      <p className="text-xs text-slate-400">{formatDateTime(a.date)}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* Recommandations Smart Help */}
        <Card>
          <CardHeader
            title="Recommandé pour toi"
            description="Smart Help analyse tes compétences."
            action={
              <Link
                href="/smart-help"
                className="inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:underline"
              >
                Tout voir <ArrowRight className="h-4 w-4" />
              </Link>
            }
          />
          {recommendations.length === 0 ? (
            <p className="text-sm text-slate-500">
              Aucune recommandation pour le moment — ajoute des compétences à ton profil.
            </p>
          ) : (
            <ul className="space-y-3">
              {recommendations.map(({ request, score }) => (
                <li
                  key={request.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-3"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/requests/${request.id}`}
                      className="line-clamp-1 text-sm font-medium text-slate-900 hover:text-blue-800"
                    >
                      {request.title}
                    </Link>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge tone="violet">{request.subject}</Badge>
                      <span className="text-xs text-slate-400">
                        {request.author.firstName} {request.author.lastName}
                      </span>
                    </div>
                  </div>
                  <Badge tone="blue">score {score}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
