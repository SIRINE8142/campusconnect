import { connection } from "next/server";
import { prisma } from "@/lib/db";

/** Statistiques du tableau de bord étudiant — vraies données SQL. */
export async function getStudentStats(userId: string) {
  const [
    requestsPublished,
    openRequests,
    completedRequests,
    proposalsSent,
    proposalsReceived,
    sessionsDone,
    sessionsPlanned,
    reviewsReceived,
  ] = await Promise.all([
    prisma.helpRequest.count({ where: { authorId: userId } }),
    prisma.helpRequest.count({ where: { authorId: userId, status: "OPEN" } }),
    prisma.helpRequest.count({ where: { authorId: userId, status: "COMPLETED" } }),
    prisma.helpProposal.count({ where: { helperId: userId } }),
    prisma.helpProposal.count({ where: { request: { authorId: userId } } }),
    prisma.studySession.count({
      where: {
        status: "DONE",
        OR: [{ request: { authorId: userId } }, { proposal: { helperId: userId } }],
      },
    }),
    prisma.studySession.count({
      where: {
        status: "PLANNED",
        OR: [{ request: { authorId: userId } }, { proposal: { helperId: userId } }],
      },
    }),
    prisma.review.aggregate({
      where: { targetId: userId },
      _avg: { rating: true },
      _count: { rating: true },
    }),
  ]);

  return {
    requestsPublished,
    openRequests,
    completedRequests,
    proposalsSent,
    proposalsReceived,
    sessionsDone,
    sessionsPlanned,
    averageRating: reviewsReceived._avg.rating,
    reviewsCount: reviewsReceived._count.rating,
  };
}

/** Répartition des demandes par statut (camembert du dashboard). */
export async function getRequestStatusBreakdown(userId: string) {
  const rows = await prisma.helpRequest.groupBy({
    by: ["status"],
    where: { authorId: userId },
    _count: { _all: true },
  });
  return rows.map((r) => ({ status: r.status, count: r._count._all }));
}

/** Demandes publiées par mois sur les 6 derniers mois (graphique en barres). */
export async function getRequestsPerMonth(userId: string) {
  await connection();
  const since = new Date();
  since.setMonth(since.getMonth() - 5);
  since.setDate(1);
  const rows = await prisma.helpRequest.findMany({
    where: { authorId: userId, createdAt: { gte: since } },
    select: { createdAt: true },
  });
  const fmt = new Intl.DateTimeFormat("fr-FR", { month: "short" });
  const buckets = new Map<string, number>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    buckets.set(`${d.getFullYear()}-${d.getMonth()}`, 0);
  }
  for (const r of rows) {
    const key = `${r.createdAt.getFullYear()}-${r.createdAt.getMonth()}`;
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  return [...buckets.entries()].map(([key, count]) => {
    const [y, m] = key.split("-").map(Number);
    return { month: fmt.format(new Date(y, m)), count };
  });
}

/** Activité récente de l'utilisateur (dernières demandes + propositions + notifications). */
export async function getRecentActivity(userId: string) {
  const [myRequests, myProposals, receivedProposals] = await Promise.all([
    prisma.helpRequest.findMany({
      where: { authorId: userId },
      select: { id: true, title: true, status: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    prisma.helpProposal.findMany({
      where: { helperId: userId },
      include: { request: { select: { id: true, title: true } } },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    prisma.helpProposal.findMany({
      where: { request: { authorId: userId } },
      include: {
        helper: { select: { firstName: true, lastName: true } },
        request: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
  ]);

  type Activity = { date: Date; icon: "request" | "sent" | "received"; text: string; link: string };
  const items: Activity[] = [
    ...myRequests.map((r) => ({
      date: r.createdAt,
      icon: "request" as const,
      text: `Demande publiée : « ${r.title} »`,
      link: `/requests/${r.id}`,
    })),
    ...myProposals.map((p) => ({
      date: p.createdAt,
      icon: "sent" as const,
      text: `Proposition envoyée sur « ${p.request.title} »`,
      link: `/requests/${p.request.id}`,
    })),
    ...receivedProposals.map((p) => ({
      date: p.createdAt,
      icon: "received" as const,
      text: `${p.helper.firstName} ${p.helper.lastName} a proposé son aide sur « ${p.request.title} »`,
      link: "/proposals/received",
    })),
  ];
  return items.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 8);
}

/** Statistiques globales pour l'espace administrateur. */
export async function getAdminStats() {
  const [users, requests, openRequests, proposals, sessions, pendingReports, resolvedReports] =
    await Promise.all([
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.helpRequest.count(),
      prisma.helpRequest.count({ where: { status: "OPEN" } }),
      prisma.helpProposal.count(),
      prisma.studySession.count(),
      prisma.report.count({ where: { status: "PENDING" } }),
      prisma.report.count({ where: { status: { not: "PENDING" } } }),
    ]);
  return { users, requests, openRequests, proposals, sessions, pendingReports, resolvedReports };
}
