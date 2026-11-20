import { describe, it, expect } from "vitest";
import {
  registerSchema,
  loginSchema,
  helpRequestSchema,
  proposalSchema,
  reviewSchema,
} from "@/lib/validations";

describe("schémas Zod — validation des formulaires", () => {
  it("accepte une inscription valide", () => {
    const result = registerSchema.safeParse({
      firstName: "Yasmine",
      lastName: "Ben Ali",
      email: "yasmine@etudiant.tn",
      password: "motdepasse8",
      specialty: "Génie Logiciel",
      level: 5,
      skills: ["React"],
    });
    expect(result.success).toBe(true);
  });

  it("refuse un email invalide et un mot de passe trop court", () => {
    const result = registerSchema.safeParse({
      firstName: "Ya",
      lastName: "Ben",
      email: "pas-un-email",
      password: "123",
      specialty: "GL",
      level: 3,
      skills: [],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = Object.keys(result.error.flatten().fieldErrors);
      expect(fields).toContain("email");
      expect(fields).toContain("password");
    }
  });

  it("refuse un niveau hors de 1-5", () => {
    expect(
      registerSchema.safeParse({
        firstName: "Ya",
        lastName: "Ben",
        email: "a@b.tn",
        password: "motdepasse8",
        specialty: "GL",
        level: 9,
        skills: [],
      }).success,
    ).toBe(false);
  });

  it("login exige un mot de passe non vide", () => {
    expect(loginSchema.safeParse({ email: "a@b.tn", password: "" }).success).toBe(false);
  });

  it("une demande exige une description suffisante", () => {
    expect(
      helpRequestSchema.safeParse({
        title: "Titre valide",
        description: "trop court",
        subject: "SQL",
        level: 3,
        availability: "jeudi",
      }).success,
    ).toBe(false);
  });

  it("une proposition exige un message de présentation", () => {
    expect(proposalSchema.safeParse({ message: "salut" }).success).toBe(false);
  });

  it("la note d'évaluation est bornée entre 1 et 5", () => {
    expect(reviewSchema.safeParse({ rating: 0 }).success).toBe(false);
    expect(reviewSchema.safeParse({ rating: 6 }).success).toBe(false);
    expect(reviewSchema.safeParse({ rating: 4, comment: "top" }).success).toBe(true);
  });
});
