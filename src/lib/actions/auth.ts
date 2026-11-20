"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createSession, destroySession } from "@/lib/auth/session";
import {
  loginSchema,
  registerSchema,
  zodError,
  type ActionResult,
  type LoginInput,
  type RegisterInput,
} from "@/lib/validations";

/**
 * Inscription : valide, vérifie l'unicité de l'email, hash le mot de passe
 * avec bcrypt (jamais stocké en clair), crée la session puis redirige.
 */
export async function registerAction(input: RegisterInput): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);
  const data = parsed.data;
  const email = data.email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { ok: false, error: "Un compte existe déjà avec cette adresse email." };
  }

  const passwordHash = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      specialty: data.specialty,
      level: data.level,
      // connectOrCreate : réutilise une compétence existante ou la crée.
      skills: {
        create: data.skills.map((name) => ({
          skill: { connectOrCreate: { where: { name }, create: { name } } },
        })),
      },
    },
  });

  await createSession(user.id);
  redirect("/dashboard");
}

/** Connexion : vérifie le hash bcrypt puis crée la session. */
export async function loginAction(input: LoginInput): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);
  const email = parsed.data.email.toLowerCase();

  const user = await prisma.user.findUnique({ where: { email } });
  // Message générique volontaire : on ne révèle pas si l'email existe.
  if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
    return { ok: false, error: "Email ou mot de passe incorrect." };
  }

  await createSession(user.id);
  redirect(user.role === "ADMIN" ? "/admin" : "/dashboard");
}

/** Déconnexion : détruit la session et renvoie vers l'accueil. */
export async function logoutAction() {
  await destroySession();
  redirect("/");
}
