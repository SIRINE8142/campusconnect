import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import type { Role } from "@/generated/prisma/client";

export const SESSION_COOKIE = "cc_session";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 jours

/**
 * Utilisateur authentifié, sans les données sensibles (pas de passwordHash).
 */
export type SessionUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  specialty: string | null;
  level: number | null;
  avatarUrl: string | null;
  bio: string | null;
  /** Noms des compétences déclarées. */
  skills: string[];
};

/** Crée une session en base et pose le cookie httpOnly. */
export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  await prisma.authSession.create({ data: { id: token, userId, expiresAt } });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true, // inaccessible au JS côté client (anti-XSS)
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
}

/** Supprime la session courante (base + cookie). */
export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.authSession.deleteMany({ where: { id: token } });
  }
  cookieStore.delete(SESSION_COOKIE);
}

/**
 * Retourne l'utilisateur connecté ou null.
 * `cache()` de React mémorise le résultat pour la durée d'une requête :
 * plusieurs appels dans la même page ne font qu'une seule requête SQL.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  "use cache: private";
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.authSession.findUnique({
    where: { id: token },
    include: { user: { include: { skills: { include: { skill: true } } } } },
  });
  if (!session) return null;

  if (session.expiresAt < new Date()) {
    await prisma.authSession.delete({ where: { id: token } });
    return null;
  }

  const { user } = session;
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    specialty: user.specialty,
    level: user.level,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    skills: user.skills.map((us) => us.skill.name),
  };
});

/** Exige un utilisateur connecté, sinon redirection vers /login. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Exige un administrateur : redirige les étudiants vers le dashboard. */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/dashboard");
  return user;
}
