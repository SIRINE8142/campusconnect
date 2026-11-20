import { connection } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Smart Help — recommandation intelligente d'entraide.
 *
 * Le calcul du score est une FONCTION PURE (`scoreRequest`) séparée de
 * l'accès base de données : elle est testable unitairement et les raisons
 * retournées expliquent la recommandation à l'utilisateur.
 */

export type RecommendationProfile = {
  /** Noms de compétences normalisés (minuscules, sans accents). */
  skills: string[];
  specialty: string | null;
  level: number | null;
};

export type RecommendationCandidate = {
  id: string;
  subject: string;
  level: number;
  createdAt: Date;
};

export type ScoredRecommendation<T> = {
  request: T;
  score: number;
  reasons: string[];
};

/** Normalise une chaîne pour la comparaison (accents/casse ignorés). */
export function normalizeText(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/**
 * Barème du score explicable :
 *   +50 la matière fait exactement partie des compétences
 *   +15 la matière correspond partiellement à une compétence
 *   +25 la matière rejoint la spécialité
 *   +10 le niveau requis est inférieur ou égal au sien
 *    +5 bonus si même niveau exactement
 *    +5 la demande a moins de 3 jours
 */
export function scoreRequest(
  request: RecommendationCandidate,
  profile: RecommendationProfile,
  now = new Date(),
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];
  const subject = normalizeText(request.subject);
  // On re-normalise les compétences : le scoring reste correct
  // même si l'appelant ne les a pas normalisées au préalable.
  const skills = profile.skills.map(normalizeText);

  if (skills.includes(subject)) {
    score += 50;
    reasons.push(`La matière « ${request.subject} » fait partie de tes compétences`);
  } else if (
    skills.some((s) => subject.includes(s) || s.includes(subject))
  ) {
    score += 15;
    reasons.push(`« ${request.subject} » est proche de tes compétences`);
  }

  if (profile.specialty) {
    const specialty = normalizeText(profile.specialty);
    const firstWord = specialty.split(" ")[0];
    if (firstWord.length > 2 && subject.includes(firstWord)) {
      score += 25;
      reasons.push(`En lien avec ta spécialité (${profile.specialty})`);
    }
  }

  if (profile.level != null && request.level <= profile.level) {
    score += 10;
    if (request.level === profile.level) {
      score += 5;
      reasons.push("Même niveau d'études que toi");
    } else {
      reasons.push("Niveau inférieur au tien — tu peux aider");
    }
  }

  const ageDays = (now.getTime() - request.createdAt.getTime()) / 86_400_000;
  if (ageDays <= 3) {
    score += 5;
    reasons.push("Demande récente");
  }

  return { score, reasons };
}

async function fetchCandidates(userId: string) {
  // Une seule requête pour les demandes ouvertes + une pour les
  // propositions déjà envoyées (pas de N+1).
  const [requests, myProposals] = await Promise.all([
    prisma.helpRequest.findMany({
      where: { status: "OPEN", authorId: { not: userId } },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            specialty: true,
            avatarUrl: true,
          },
        },
        _count: { select: { proposals: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.helpProposal.findMany({
      where: { helperId: userId },
      select: { requestId: true },
    }),
  ]);
  const proposedIds = new Set(myProposals.map((p) => p.requestId));
  return requests.filter((r) => !proposedIds.has(r.id));
}

/**
 * Recommande les demandes ouvertes les plus pertinentes pour l'étudiant.
 * Ses propres demandes et celles où il a déjà proposé sont exclues.
 */
export async function getRecommendations(userId: string, limit = 10) {
  await connection();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { skills: { include: { skill: true } } },
  });
  if (!user) return [];

  const profile: RecommendationProfile = {
    skills: user.skills.map((us) => normalizeText(us.skill.name)),
    specialty: user.specialty,
    level: user.level,
  };

  const candidates = await fetchCandidates(userId);
  const now = new Date();

  const scored = candidates
    .map((request) => {
      const { score, reasons } = scoreRequest(request, profile, now);
      return { request, score, reasons };
    })
    .filter((r) => r.score > 0);

  scored.sort(
    (a, b) =>
      b.score - a.score || b.request.createdAt.getTime() - a.request.createdAt.getTime(),
  );
  return scored.slice(0, limit);
}
