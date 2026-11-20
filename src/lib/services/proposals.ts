import { prisma } from "@/lib/db";
import { forbidden, notFound, conflict } from "./errors";
import { notify } from "./notifications";

const requestInclude = {
  request: {
    include: {
      author: {
        select: { id: true, firstName: true, lastName: true, avatarUrl: true },
      },
    },
  },
} as const;

/**
 * Proposer son aide sur une demande.
 * Règles serveur : demande OPEN, pas l'auteur soi-même, une seule
 * proposition par étudiant et par demande.
 */
export async function createProposal(requestId: string, helperId: string, message: string) {
  const request = await prisma.helpRequest.findUnique({
    where: { id: requestId },
    include: { author: { select: { firstName: true, lastName: true } } },
  });
  if (!request) throw notFound("Demande introuvable.");
  if (request.status !== "OPEN") {
    throw conflict("Cette demande n'est plus ouverte aux propositions.");
  }
  if (request.authorId === helperId) {
    throw forbidden("Tu ne peux pas proposer ton aide sur ta propre demande.");
  }

  const existing = await prisma.helpProposal.findUnique({
    where: { requestId_helperId: { requestId, helperId } },
  });
  if (existing) throw conflict("Tu as déjà proposé ton aide sur cette demande.");

  const proposal = await prisma.helpProposal.create({
    data: { requestId, helperId, message },
  });

  const helper = await prisma.user.findUnique({ where: { id: helperId } });
  await notify(
    request.authorId,
    "PROPOSAL_RECEIVED",
    "Nouvelle proposition d'aide",
    {
      body: `${helper?.firstName ?? "Un étudiant"} ${helper?.lastName ?? ""} a proposé son aide sur « ${request.title} ».`,
      link: `/requests/${requestId}`,
    },
  );

  return proposal;
}

/**
 * Accepte une proposition : transaction qui
 *  1. passe la proposition à ACCEPTED,
 *  2. refuse toutes les autres propositions en attente,
 *  3. passe la demande à ACCEPTED (plus de nouvelles propositions),
 *  4. notifie l'étudiant retenu.
 * Réservé à l'auteur de la demande — vérifié côté serveur.
 */
export async function acceptProposal(proposalId: string, userId: string) {
  const proposal = await prisma.helpProposal.findUnique({
    where: { id: proposalId },
    include: { request: true, helper: { select: { firstName: true, lastName: true } } },
  });
  if (!proposal) throw notFound("Proposition introuvable.");
  if (proposal.request.authorId !== userId) {
    throw forbidden("Seul l'auteur de la demande peut accepter une proposition.");
  }
  if (proposal.request.status !== "OPEN" || proposal.status !== "PENDING") {
    throw conflict("Cette proposition ne peut plus être acceptée.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.helpProposal.update({
      where: { id: proposalId },
      data: { status: "ACCEPTED" },
    });
    await tx.helpProposal.updateMany({
      where: { requestId: proposal.requestId, status: "PENDING", id: { not: proposalId } },
      data: { status: "REJECTED" },
    });
    await tx.helpRequest.update({
      where: { id: proposal.requestId },
      data: { status: "ACCEPTED" },
    });
    await notify(proposal.helperId, "PROPOSAL_ACCEPTED", "Proposition acceptée 🎉", {
      body: `Ta proposition sur « ${proposal.request.title} » a été acceptée. Organisez une séance !`,
      link: "/sessions",
      tx,
    });
    // Les autres étudiants refusés sont prévenus.
    const rejected = await tx.helpProposal.findMany({
      where: { requestId: proposal.requestId, status: "REJECTED", id: { not: proposalId } },
      select: { helperId: true },
    });
    for (const p of rejected) {
      await notify(p.helperId, "PROPOSAL_REJECTED", "Proposition non retenue", {
        body: `La demande « ${proposal.request.title} » a été pourvue par un autre étudiant.`,
        link: "/proposals",
        tx,
      });
    }
  });
}

/** Refuse une proposition — réservé à l'auteur de la demande. */
export async function rejectProposal(proposalId: string, userId: string) {
  const proposal = await prisma.helpProposal.findUnique({
    where: { id: proposalId },
    include: { request: true },
  });
  if (!proposal) throw notFound("Proposition introuvable.");
  if (proposal.request.authorId !== userId) {
    throw forbidden("Seul l'auteur de la demande peut refuser une proposition.");
  }
  if (proposal.status !== "PENDING") {
    throw conflict("Cette proposition a déjà été traitée.");
  }
  await prisma.helpProposal.update({
    where: { id: proposalId },
    data: { status: "REJECTED" },
  });
  await notify(proposal.helperId, "PROPOSAL_REJECTED", "Proposition refusée", {
    body: `Ta proposition sur « ${proposal.request.title} » n'a pas été retenue.`,
    link: "/proposals",
  });
}

/** Permet à un étudiant de retirer sa propre proposition en attente. */
export async function withdrawProposal(proposalId: string, userId: string) {
  const proposal = await prisma.helpProposal.findUnique({ where: { id: proposalId } });
  if (!proposal) throw notFound("Proposition introuvable.");
  if (proposal.helperId !== userId) {
    throw forbidden("Tu ne peux retirer que tes propres propositions.");
  }
  if (proposal.status !== "PENDING") {
    throw conflict("Cette proposition a déjà été traitée.");
  }
  await prisma.helpProposal.delete({ where: { id: proposalId } });
}

/** Propositions envoyées par un étudiant. */
export function listSentProposals(helperId: string) {
  return prisma.helpProposal.findMany({
    where: { helperId },
    include: requestInclude,
    orderBy: { createdAt: "desc" },
  });
}

/** Propositions reçues sur les demandes d'un étudiant. */
export function listReceivedProposals(authorId: string) {
  return prisma.helpProposal.findMany({
    where: { request: { authorId } },
    include: {
      ...requestInclude,
      helper: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          specialty: true,
          level: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
