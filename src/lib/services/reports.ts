import { prisma } from "@/lib/db";
import { forbidden, notFound } from "./errors";
import { notify, notifyAdmins } from "./notifications";

/** Signale une demande inappropriée (tout étudiant sauf l'auteur). */
export async function createReport(
  requestId: string,
  reporterId: string,
  reason: string,
  details?: string,
) {
  const request = await prisma.helpRequest.findUnique({ where: { id: requestId } });
  if (!request) throw notFound("Demande introuvable.");
  if (request.authorId === reporterId) {
    throw forbidden("Tu ne peux pas signaler ta propre demande.");
  }

  const report = await prisma.report.create({
    data: { requestId, reporterId, reason, details: details || null },
  });
  await notifyAdmins("REPORT_CREATED", "Nouveau signalement", {
    body: `La demande « ${request.title} » a été signalée : ${reason}`,
    link: "/admin/reports",
  });
  return report;
}

/** Liste des signalements pour l'admin. */
export function listReports(status?: "PENDING" | "RESOLVED" | "DISMISSED") {
  return prisma.report.findMany({
    where: { status },
    include: {
      reporter: { select: { firstName: true, lastName: true, email: true } },
      request: {
        include: {
          author: { select: { firstName: true, lastName: true, email: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

/** Marque un signalement comme traité sans supprimer la publication. */
export async function resolveReport(reportId: string, _adminId: string) {
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: { request: true },
  });
  if (!report) throw notFound("Signalement introuvable.");
  if (report.status !== "PENDING") throw forbidden("Signalement déjà traité.");
  const updated = await prisma.report.update({
    where: { id: reportId },
    data: { status: "RESOLVED", resolvedAt: new Date() },
  });
  await notify(report.request.authorId, "REPORT_RESOLVED", "Signalement traité", {
    body: `Un signalement sur « ${report.request.title} » a été traité par la modération.`,
    link: `/requests/${report.requestId}`,
  });
  return updated;
}

/** Rejette un signalement infondé. */
export async function dismissReport(reportId: string) {
  const report = await prisma.report.findUnique({ where: { id: reportId } });
  if (!report) throw notFound("Signalement introuvable.");
  if (report.status !== "PENDING") throw forbidden("Signalement déjà traité.");
  return prisma.report.update({
    where: { id: reportId },
    data: { status: "DISMISSED", resolvedAt: new Date() },
  });
}

/**
 * Supprime une publication inappropriée (admin) :
 * supprime la demande et marque ses signalements comme résolus.
 */
export async function adminDeleteRequest(requestId: string) {
  const request = await prisma.helpRequest.findUnique({ where: { id: requestId } });
  if (!request) throw notFound("Demande introuvable.");
  await prisma.$transaction([
    prisma.report.updateMany({
      where: { requestId, status: "PENDING" },
      data: { status: "RESOLVED", resolvedAt: new Date() },
    }),
    prisma.helpRequest.delete({ where: { id: requestId } }),
  ]);
}
