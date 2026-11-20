import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@/lib/db";
import { createRequest, updateRequest, deleteRequest, completeRequest } from "@/lib/services/requests";
import { createProposal, acceptProposal, rejectProposal } from "@/lib/services/proposals";
import { createSession } from "@/lib/services/sessions";
import { createReview } from "@/lib/services/reviews";
import { ServiceError } from "@/lib/services/errors";

/**
 * Tests d'intégration : les services tournent contre une vraie base
 * SQLite de test (prisma/test.db) et vérifient que les règles métier
 * sont bien bloquées côté serveur.
 */

async function makeUser(email: string, name = "Test") {
  return prisma.user.create({
    data: {
      email,
      passwordHash: "x",
      firstName: name,
      lastName: "User",
      specialty: "GL",
      level: 3,
    },
  });
}

const requestData = {
  title: "Demande de test",
  description: "Description suffisamment longue pour le test.",
  subject: "SQL",
  level: 3,
  availability: "Mardi",
};

let author: { id: string };
let helper: { id: string };
let other: { id: string };

beforeEach(async () => {
  await prisma.notification.deleteMany();
  await prisma.report.deleteMany();
  await prisma.review.deleteMany();
  await prisma.studySession.deleteMany();
  await prisma.helpProposal.deleteMany();
  await prisma.helpRequest.deleteMany();
  await prisma.authSession.deleteMany();
  await prisma.userSkill.deleteMany();
  await prisma.user.deleteMany();
  author = await makeUser("auteur@test.tn", "Auteur");
  helper = await makeUser("aidant@test.tn", "Aidant");
  other = await makeUser("autre@test.tn", "Autre");
});

describe("règles métier — demandes d'aide", () => {
  it("seul l'auteur peut modifier sa demande", async () => {
    const r = await createRequest(author.id, requestData);
    await expect(updateRequest(r.id, other.id, requestData)).rejects.toThrow(ServiceError);
    await expect(updateRequest(r.id, author.id, { ...requestData, title: "Nouveau titre" })).resolves.toBeTruthy();
  });

  it("seul l'auteur peut supprimer sa demande", async () => {
    const r = await createRequest(author.id, requestData);
    await expect(deleteRequest(r.id, other.id)).rejects.toThrow(ServiceError);
    await expect(deleteRequest(r.id, author.id)).resolves.toBeUndefined();
  });
});

describe("règles métier — propositions", () => {
  it("on ne peut pas proposer sur sa propre demande", async () => {
    const r = await createRequest(author.id, requestData);
    await expect(createProposal(r.id, author.id, "Je m'aide moi-même")).rejects.toThrow(ServiceError);
  });

  it("une seule proposition par étudiant et par demande", async () => {
    const r = await createRequest(author.id, requestData);
    await createProposal(r.id, helper.id, "Je peux aider !");
    await expect(createProposal(r.id, helper.id, "Encore moi")).rejects.toThrow(ServiceError);
  });

  it("seul l'auteur peut accepter/refuser une proposition", async () => {
    const r = await createRequest(author.id, requestData);
    const p = await createProposal(r.id, helper.id, "Je peux aider !");
    await expect(acceptProposal(p.id, other.id)).rejects.toThrow(ServiceError);
    await expect(rejectProposal(p.id, other.id)).rejects.toThrow(ServiceError);
    await expect(acceptProposal(p.id, author.id)).resolves.toBeUndefined();
  });

  it("accepter une proposition refuse les autres et ferme la demande", async () => {
    const r = await createRequest(author.id, requestData);
    const p1 = await createProposal(r.id, helper.id, "Moi !");
    const p2 = await createProposal(r.id, other.id, "Moi aussi !");
    await acceptProposal(p1.id, author.id);

    const after = await prisma.helpProposal.findUnique({ where: { id: p2.id } });
    expect(after?.status).toBe("REJECTED");
    const req = await prisma.helpRequest.findUnique({ where: { id: r.id } });
    expect(req?.status).toBe("ACCEPTED");

    // Une demande pourvue ne reçoit plus de propositions.
    const third = await makeUser("troisieme@test.tn", "Trois");
    await expect(createProposal(r.id, third.id, "Je veux aider")).rejects.toThrow(ServiceError);
  });
});

describe("règles métier — séances et évaluations", () => {
  async function setupAccepted() {
    const r = await createRequest(author.id, requestData);
    const p = await createProposal(r.id, helper.id, "Je peux aider !");
    await acceptProposal(p.id, author.id);
    return { r, p };
  }

  it("séance impossible sur une proposition refusée ou par un tiers", async () => {
    const { p } = await setupAccepted();
    await expect(
      createSession(p.id, other.id, { scheduledAt: "2030-01-01T10:00", subject: "SQL" }),
    ).rejects.toThrow(ServiceError);
  });

  it("évaluation impossible avant clôture, possible après", async () => {
    const { r, p } = await setupAccepted();
    const s = await createSession(p.id, author.id, {
      scheduledAt: "2030-01-01T10:00",
      subject: "SQL",
    });

    // Avant clôture : interdit.
    await expect(createReview(s.id, author.id, 5)).rejects.toThrow(ServiceError);

    // Séance réalisée + demande clôturée : autorisé pour les participants.
    await prisma.studySession.update({ where: { id: s.id }, data: { status: "DONE" } });
    await completeRequest(r.id, author.id);
    await expect(createReview(s.id, author.id, 5, "Top !")).resolves.toBeTruthy();
    await expect(createReview(s.id, helper.id, 4)).resolves.toBeTruthy();

    // Un tiers ne peut pas évaluer, et pas de double évaluation.
    await expect(createReview(s.id, other.id, 1)).rejects.toThrow(ServiceError);
    await expect(createReview(s.id, author.id, 3)).rejects.toThrow(ServiceError);
  });
});
