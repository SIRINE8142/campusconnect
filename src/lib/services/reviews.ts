import { prisma } from "@/lib/db";
import { forbidden, notFound, conflict } from "./errors";
import { notify } from "./notifications";
import { isParticipant } from "./sessions";

/**
 * Évalue l'autre participant après une séance.
 * Règles serveur :
 *  - réservé aux deux participants,
 *  - la demande doit être clôturée (COMPLETED) et la séance réalisée (DONE),
 *  - une seule évaluation par participant et par séance (contrainte unique).
 */
export async function createReview(
  sessionId: string,
  authorId: string,
  rating: number,
  comment?: string,
) {
  const session = await prisma.studySession.findUnique({
    where: { id: sessionId },
    include: { request: true, proposal: true },
  });
  if (!session) throw notFound("Séance introuvable.");
  if (!isParticipant(session, authorId)) {
    throw forbidden("Seuls les participants peuvent évaluer cette séance.");
  }
  if (session.status !== "DONE" || session.request.status !== "COMPLETED") {
    throw conflict("L'évaluation n'est possible qu'après la clôture de la demande.");
  }

  const targetId =
    authorId === session.request.authorId
      ? session.proposal.helperId
      : session.request.authorId;

  const existing = await prisma.review.findUnique({
    where: { sessionId_authorId: { sessionId, authorId } },
  });
  if (existing) throw conflict("Tu as déjà évalué cette séance.");

  const review = await prisma.review.create({
    data: { sessionId, authorId, targetId, rating, comment: comment || null },
  });
  await notify(targetId, "REVIEW_RECEIVED", "Nouvelle évaluation reçue", {
    body: `Tu as reçu une évaluation ${rating}/5 pour la séance « ${session.subject} ».`,
    link: "/sessions",
  });
  return review;
}

/** Évaluations reçues par un utilisateur (pour son profil). */
export function listReviewsForUser(userId: string) {
  return prisma.review.findMany({
    where: { targetId: userId },
    include: {
      author: { select: { firstName: true, lastName: true, avatarUrl: true } },
      session: { select: { subject: true, scheduledAt: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

/** Moyenne des notes reçues (réputation d'entraide). */
export async function averageRating(userId: string) {
  const agg = await prisma.review.aggregate({
    where: { targetId: userId },
    _avg: { rating: true },
    _count: { rating: true },
  });
  return { average: agg._avg.rating ?? null, count: agg._count.rating };
}
