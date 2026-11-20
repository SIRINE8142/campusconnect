import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

export type NotificationType =
  | "PROPOSAL_RECEIVED"
  | "PROPOSAL_ACCEPTED"
  | "PROPOSAL_REJECTED"
  | "SESSION_PLANNED"
  | "REQUEST_COMPLETED"
  | "REVIEW_RECEIVED"
  | "REPORT_CREATED"
  | "REPORT_RESOLVED";

/**
 * Crée une notification pour un utilisateur.
 * `tx` permet de l'inclure dans une transaction métier
 * (ex. acceptation d'une proposition → notification atomique).
 */
export async function notify(
  userId: string,
  type: NotificationType,
  title: string,
  options: { body?: string; link?: string; tx?: Prisma.TransactionClient } = {},
) {
  const client = options.tx ?? prisma;
  await client.notification.create({
    data: { userId, type, title, body: options.body, link: options.link },
  });
}

/** Prévient tous les administrateurs (ex. nouveau signalement). */
export async function notifyAdmins(
  type: NotificationType,
  title: string,
  options: { body?: string; link?: string } = {},
) {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true },
  });
  if (admins.length === 0) return;
  await prisma.notification.createMany({
    data: admins.map((a) => ({
      userId: a.id,
      type,
      title,
      body: options.body,
      link: options.link,
    })),
  });
}
