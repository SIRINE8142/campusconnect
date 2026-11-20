import { describe, it, expect } from "vitest";
import {
  scoreRequest,
  normalizeText,
  type RecommendationProfile,
} from "@/lib/services/recommendations";

const now = new Date("2026-11-14T12:00:00Z");

function request(overrides: Partial<Parameters<typeof scoreRequest>[0]> = {}) {
  return {
    id: "r1",
    subject: "React",
    level: 3,
    createdAt: new Date("2026-11-13T12:00:00Z"),
    ...overrides,
  };
}

function profile(overrides: Partial<RecommendationProfile> = {}): RecommendationProfile {
  return { skills: [], specialty: null, level: null, ...overrides };
}

describe("Smart Help — score explicable", () => {
  it("donne +50 quand la matière est une compétence exacte", () => {
    const { score, reasons } = scoreRequest(request(), profile({ skills: ["react"] }), now);
    expect(score).toBeGreaterThanOrEqual(50);
    expect(reasons.join(" ")).toContain("compétences");
  });

  it("normalise les accents et la casse", () => {
    expect(normalizeText("Algèbre")).toBe("algebre");
    const { score } = scoreRequest(
      request({ subject: "Algèbre" }),
      profile({ skills: ["ALGEBRE"] }),
      now,
    );
    expect(score).toBeGreaterThanOrEqual(50);
  });

  it("donne +25 quand la matière rejoint la spécialité", () => {
    const { score, reasons } = scoreRequest(
      request({ subject: "Génie des réseaux" }),
      profile({ specialty: "Génie Logiciel" }),
      now,
    );
    expect(score).toBeGreaterThanOrEqual(25);
    expect(reasons.join(" ")).toContain("spécialité");
  });

  it("n'attribue pas de points niveau si la demande vise un niveau supérieur", () => {
    const { score, reasons } = scoreRequest(
      request({ level: 5 }),
      profile({ level: 2 }),
      now,
    );
    expect(score).toBeLessThan(10);
    expect(reasons.join(" ")).not.toContain("niveau");
  });

  it("donne un bonus pour une demande récente (< 3 jours)", () => {
    const { reasons } = scoreRequest(
      request({ createdAt: new Date("2026-11-14T10:00:00Z") }),
      profile(),
      now,
    );
    expect(reasons).toContain("Demande récente");
  });

  it("score 0 = pas de recommandation", () => {
    const { score, reasons } = scoreRequest(
      request({ subject: "Droit romain", createdAt: new Date("2026-01-01") }),
      profile({ skills: ["java"], specialty: "Réseaux", level: 1 }),
      now,
    );
    expect(score).toBe(0);
    expect(reasons).toHaveLength(0);
  });
});
