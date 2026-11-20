import { prisma } from "@/lib/db";
import type { HelpRequestInput } from "@/lib/validations";
import type { RequestStatus } from "@/generated/prisma/client";
import { forbidden, notFound } from "./errors";

export type RequestFilters = {
  q?: string;
  subject?: string;
  level?: number;
  status?: RequestStatus;
};

const authorInclude = {
  author: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      specialty: true,
      level: true,
      avatarUrl: true,
    },
  },
} as const;

/** Liste paginée/filtrée des demandes (recherche par titre, matière, niveau, statut). */
export async function listRequests(filters: RequestFilters) {
  return prisma.helpRequest.findMany({
    where: {
      status: filters.status,
      level: filters.level,
      subject: filters.subject
        ? { equals: filters.subject }
        : undefined,
      ...(filters.q
        ? {
            OR: [
              { title: { contains: filters.q } },
              { description: { contains: filters.q } },
              { subject: { contains: filters.q } },
            ],
          }
        : {}),
    },
    include: {
      ...authorInclude,
      _count: { select: { proposals: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

/** Demandes créées par un utilisateur donné. */
export function listMyRequests(authorId: string) {
  return prisma.helpRequest.findMany({
    where: { authorId },
    include: {
      _count: { select: { proposals: true } },
      session: { select: { id: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

/** Détail complet d'une demande (auteur + propositions + séance). */
export async function getRequest(id: string) {
  const request = await prisma.helpRequest.findUnique({
    where: { id },
    include: {
      ...authorInclude,
      proposals: {
        include: {
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
      },
      session: { include: { reviews: true } },
    },
  });
  if (!request) throw notFound("Demande introuvable.");
  return request;
}

export function createRequest(authorId: string, data: HelpRequestInput) {
  return prisma.helpRequest.create({
    data: { ...data, authorId },
  });
}

/** Modification réservée à l'auteur — vérifié côté serveur. */
export async function updateRequest(
  requestId: string,
  userId: string,
  data: HelpRequestInput,
) {
  const request = await prisma.helpRequest.findUnique({ where: { id: requestId } });
  if (!request) throw notFound("Demande introuvable.");
  if (request.authorId !== userId) {
    throw forbidden("Tu ne peux modifier que tes propres demandes.");
  }
  if (request.status === "COMPLETED") {
    throw forbidden("Une demande terminée ne peut plus être modifiée.");
  }
  return prisma.helpRequest.update({ where: { id: requestId }, data });
}

/** Suppression réservée à l'auteur (ou admin, géré ailleurs). */
export async function deleteRequest(requestId: string, userId: string) {
  const request = await prisma.helpRequest.findUnique({ where: { id: requestId } });
  if (!request) throw notFound("Demande introuvable.");
  if (request.authorId !== userId) {
    throw forbidden("Tu ne peux supprimer que tes propres demandes.");
  }
  await prisma.helpRequest.delete({ where: { id: requestId } });
}

/** Marque une demande comme terminée (auteur uniquement, après aide acceptée). */
export async function completeRequest(requestId: string, userId: string) {
  const request = await prisma.helpRequest.findUnique({ where: { id: requestId } });
  if (!request) throw notFound("Demande introuvable.");
  if (request.authorId !== userId) {
    throw forbidden("Seul l'auteur peut clôturer sa demande.");
  }
  if (request.status === "OPEN") {
    throw forbidden("Accepte d'abord une proposition avant de clôturer la demande.");
  }
  if (request.status === "COMPLETED") return request;
  return prisma.helpRequest.update({
    where: { id: requestId },
    data: { status: "COMPLETED", closedAt: new Date() },
  });
}

/** Matières distinctes existantes (pour les filtres). */
export async function listSubjects() {
  const rows = await prisma.helpRequest.findMany({
    select: { subject: true },
    distinct: ["subject"],
    orderBy: { subject: "asc" },
  });
  return rows.map((r) => r.subject);
}
