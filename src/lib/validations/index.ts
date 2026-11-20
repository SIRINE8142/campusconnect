import { z } from "zod";

// Schémas Zod partagés : utilisés par React Hook Form côté client
// ET par les Server Actions côté serveur (une seule source de vérité).

export const registerSchema = z.object({
  firstName: z.string().trim().min(2, "Prénom trop court").max(50),
  lastName: z.string().trim().min(2, "Nom trop court").max(50),
  email: z.email("Adresse email invalide"),
  password: z
    .string()
    .min(8, "Au moins 8 caractères")
    .max(100),
  specialty: z.string().trim().min(2, "Spécialité requise").max(80),
  level: z.number("Niveau requis").int("Niveau invalide").min(1, "Entre 1 et 5").max(5, "Entre 1 et 5"),
  skills: z.array(z.string().trim().min(1).max(50)).max(20).default([]),
});
export type RegisterInput = z.infer<typeof registerSchema>;
/** Valeurs du formulaire : `skills` y est optionnel (rempli par .default() côté serveur). */
export type RegisterFormValues = z.input<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.email("Adresse email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const profileSchema = z.object({
  firstName: z.string().trim().min(2).max(50),
  lastName: z.string().trim().min(2).max(50),
  specialty: z.string().trim().min(2).max(80),
  level: z.number("Niveau requis").int().min(1).max(5),
  bio: z.string().trim().max(500).optional().or(z.literal("")),
  avatarUrl: z.string().trim().max(300).optional().or(z.literal("")),
  skills: z.array(z.string().trim().min(1).max(50)).max(20).default([]),
});
export type ProfileInput = z.infer<typeof profileSchema>;
export type ProfileFormValues = z.input<typeof profileSchema>;

export const helpRequestSchema = z.object({
  title: z.string().trim().min(5, "Au moins 5 caractères").max(120),
  description: z.string().trim().min(20, "Décris ta demande (min. 20 caractères)").max(2000),
  subject: z.string().trim().min(2, "Matière requise").max(80),
  level: z.number("Niveau requis").int().min(1).max(5),
  availability: z.string().trim().min(2, "Indique tes disponibilités").max(200),
});
export type HelpRequestInput = z.infer<typeof helpRequestSchema>;

export const proposalSchema = z.object({
  message: z.string().trim().min(10, "Présente-toi brièvement (min. 10 caractères)").max(1000),
});
export type ProposalInput = z.infer<typeof proposalSchema>;

export const studySessionSchema = z.object({
  // Chaîne ISO issue d'un <input type="datetime-local">, convertie en Date côté serveur.
  scheduledAt: z.string().min(1, "Date et heure requises"),
  subject: z.string().trim().min(2).max(80),
  description: z.string().trim().max(500).optional().or(z.literal("")),
});
export type StudySessionInput = z.infer<typeof studySessionSchema>;

export const reviewSchema = z.object({
  rating: z.number("Note requise").int().min(1, "De 1 à 5").max(5, "De 1 à 5"),
  comment: z.string().trim().max(500).optional().or(z.literal("")),
});
export type ReviewInput = z.infer<typeof reviewSchema>;

export const reportSchema = z.object({
  reason: z.string().trim().min(5, "Précise la raison").max(200),
  details: z.string().trim().max(1000).optional().or(z.literal("")),
});
export type ReportInput = z.infer<typeof reportSchema>;

/** Résultat standard des Server Actions. */
export type ActionResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> };

export function zodError(error: z.ZodError): ActionResult {
  return {
    ok: false,
    error: "Veuillez corriger le formulaire.",
    fieldErrors: z.flattenError(error).fieldErrors as Record<string, string[] | undefined>,
  };
}
