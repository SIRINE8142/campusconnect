import { prisma } from "@/lib/db";
import type { ProfileInput } from "@/lib/validations";
import { notFound } from "./errors";

/** Met à jour le profil de l'utilisateur connecté (compétences remplacées). */
export async function updateProfile(userId: string, data: ProfileInput) {
  // On remplace l'ensemble des compétences : deleteMany + createMany
  // dans une transaction pour rester atomique.
  return prisma.$transaction(async (tx) => {
    await tx.userSkill.deleteMany({ where: { userId } });
    const user = await tx.user.update({
      where: { id: userId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        specialty: data.specialty,
        level: data.level,
        bio: data.bio || null,
        avatarUrl: data.avatarUrl || null,
        skills: {
          create: data.skills.map((name) => ({
            skill: { connectOrCreate: { where: { name }, create: { name } } },
          })),
        },
      },
    });
    return user;
  });
}

/** Profil public d'un étudiant (consultable par les autres). */
export async function getPublicProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      specialty: true,
      level: true,
      bio: true,
      avatarUrl: true,
      createdAt: true,
      role: true,
      skills: { include: { skill: true } },
      _count: { select: { helpRequests: true, proposals: true } },
    },
  });
  if (!user) throw notFound("Étudiant introuvable.");
  return user;
}
