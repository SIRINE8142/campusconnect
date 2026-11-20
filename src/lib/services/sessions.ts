import { prisma } from "@/lib/db";
import type { StudySessionInput } from "@/lib/validations";
import { forbidden, notFound, conflict } from "./errors";
import { notify } from "./notifications";

/** Les deux participants d'une séance = auteur de la demande + aidant accepté. */
export function isParticipant(
  session: { request: { authorId: string }; proposal: { helperId: string } },
  userId: string,
) {
  return session.request.authorId === userId || session.proposal.helperId === userId;
}

/**
 * Planifie une séance sur une proposition acceptée.
 * Réservé aux deux participants, une seule séance par proposition (contrainte unique).
 */
export async function createSession(
  proposalId: string,
  userId: string,
  data: StudySessionInput,
) {
  const proposal = await prisma.helpProposal.findUnique({
    where: { id: proposalId },
    include: { request: true },
  });
  if (!proposal) throw notFound("Proposition introuvable.");
  if (proposal.status !== "ACCEPTED") {
    throw conflict("On ne peut planifier une séance que sur une proposition acceptée.");
  }
  if (proposal.helperId !== userId && proposal.request.authorId !== userId) {
    throw forbidden("Seuls les participants peuvent organiser la séance.");
  }
  const existing = await prisma.studySession.findUnique({ where: { proposalId } });
  if (existing) throw conflict("Une séance existe déjà pour cette proposition.");

  const scheduledAt = new Date(data.scheduledAt);
  if (Number.isNaN(scheduledAt.getTime())) throw conflict("Date de séance invalide.");

  const session = await prisma.studySession.create({
    data: {
      proposalId,
      requestId: proposal.requestId,
      scheduledAt,
      subject: data.subject,
      description: data.description || null,
    },
  });

  const otherId = proposal.helperId === userId ? proposal.request.authorId : proposal.helperId;
  await notify(otherId, "SESSION_PLANNED", "Séance planifiée", {
    body: `Une séance « ${data.subject} » est prévue le ${scheduledAt.toLocaleDateString("fr-FR")}.`,
    link: "/sessions",
  });
  return session;
}

/** Marque une séance comme réalisée (participant uniquement). */
export async function markSessionDone(sessionId: string, userId: string) {
  const session = await prisma.studySession.findUnique({
    where: { id: sessionId },
    include: { request: true, proposal: true },
  });
  if (!session) throw notFound("Séance introuvable.");
  if (!isParticipant(session, userId)) {
    throw forbidden("Seuls les participants peuvent modifier la séance.");
  }
  if (session.status !== "PLANNED") throw conflict("Cette séance est déjà clôturée.");
  return prisma.studySession.update({
    where: { id: sessionId },
    data: { status: "DONE" },
  });
}

/** Annule une séance planifiée (participant uniquement). */
export async function cancelSession(sessionId: string, userId: string) {
  const session = await prisma.studySession.findUnique({
    where: { id: sessionId },
    include: { request: true, proposal: true },
  });
  if (!session) throw notFound("Séance introuvable.");
  if (!isParticipant(session, userId)) {
    throw forbidden("Seuls les participants peuvent annuler la séance.");
  }
  if (session.status !== "PLANNED") throw conflict("Cette séance ne peut plus être annulée.");
  return prisma.studySession.update({
    where: { id: sessionId },
    data: { status: "CANCELLED" },
  });
}

/** Séances où l'utilisateur est participant (auteur OU aidant). */
export function listMySessions(userId: string) {
  return prisma.studySession.findMany({
    where: {
      OR: [{ request: { authorId: userId } }, { proposal: { helperId: userId } }],
    },
    include: {
      request: {
        include: { author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
      },
      proposal: {
        include: { helper: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
      },
      reviews: { select: { authorId: true, rating: true, targetId: true } },
    },
    orderBy: { scheduledAt: "desc" },
  });
}
