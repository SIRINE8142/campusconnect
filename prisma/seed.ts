// Seed de démonstration CampusConnect.
// Crée un compte admin, plusieurs étudiants avec compétences,
// des demandes, propositions, séances, évaluations, notifications et signalements.
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

const SKILLS = [
  "JavaScript",
  "TypeScript",
  "React",
  "Next.js",
  "Node.js",
  "Python",
  "Java",
  "SQL",
  "Algèbre",
  "Analyse",
  "Probabilités",
  "Physique",
  "Anglais",
  "Réseaux",
  "Base de données",
];

async function main() {
  console.log("Nettoyage de la base…");
  // On supprime dans l'ordre des dépendances pour respecter les clés étrangères.
  await prisma.notification.deleteMany();
  await prisma.report.deleteMany();
  await prisma.review.deleteMany();
  await prisma.studySession.deleteMany();
  await prisma.helpProposal.deleteMany();
  await prisma.helpRequest.deleteMany();
  await prisma.authSession.deleteMany();
  await prisma.userSkill.deleteMany();
  await prisma.user.deleteMany();
  await prisma.skill.deleteMany();

  console.log("Création des compétences…");
  const skills = new Map<string, string>();
  for (const name of SKILLS) {
    const skill = await prisma.skill.create({ data: { name } });
    skills.set(name, skill.id);
  }

  const hash = (pw: string) => bcrypt.hashSync(pw, 10);

  console.log("Création des utilisateurs…");
  await prisma.user.create({
    data: {
      email: "admin@campusconnect.tn",
      passwordHash: hash("Admin123!"),
      firstName: "Administrateur",
      lastName: "CampusConnect",
      role: "ADMIN",
    },
  });

  async function createStudent(
    email: string,
    firstName: string,
    lastName: string,
    specialty: string,
    level: number,
    skillNames: string[],
    bio: string,
  ) {
    return prisma.user.create({
      data: {
        email,
        passwordHash: hash("Etudiant123!"),
        firstName,
        lastName,
        specialty,
        level,
        bio,
        skills: {
          create: skillNames.map((name) => ({ skillId: skills.get(name)! })),
        },
      },
    });
  }

  const yasmine = await createStudent(
    "yasmine@etudiant.tn",
    "Yasmine",
    "Ben Ali",
    "Génie Logiciel",
    5,
    ["JavaScript", "TypeScript", "React", "Next.js", "SQL"],
    "Étudiante en génie logiciel, passionnée par le web.",
  );
  const ahmed = await createStudent(
    "ahmed@etudiant.tn",
    "Ahmed",
    "Trabelsi",
    "Génie Logiciel",
    4,
    ["Java", "Python", "SQL", "Base de données"],
    "Je donne volontiers un coup de main en Java et en bases de données.",
  );
  const fatma = await createStudent(
    "fatma@etudiant.tn",
    "Fatma",
    "Gharbi",
    "Mathématiques appliquées",
    4,
    ["Algèbre", "Analyse", "Probabilités", "Python"],
    "Solide en maths, disponible pour des séances de révision.",
  );
  const karim = await createStudent(
    "karim@etudiant.tn",
    "Karim",
    "Mansour",
    "Réseaux et systèmes",
    4,
    ["Réseaux", "Python", "Anglais"],
    "Spécialiste réseaux, je prépare les certifications Cisco.",
  );
  const sarah = await createStudent(
    "sarah@etudiant.tn",
    "Sarah",
    "Khelifi",
    "Sciences physiques",
    1,
    ["Physique", "Anglais", "Analyse"],
    "Première année, motivée pour progresser !",
  );

  console.log("Création des demandes d'aide…");
  const req1 = await prisma.helpRequest.create({
    data: {
      title: "Besoin d'aide sur les Server Actions Next.js",
      description:
        "Je bloque sur la validation côté serveur avec les Server Actions dans Next.js App Router. J'aimerais comprendre comment structurer proprement le code métier.",
      subject: "Next.js",
      level: 5,
      availability: "Mardis et jeudis après-midi",
      status: "OPEN",
      authorId: sarah.id,
    },
  });

  const req2 = await prisma.helpRequest.create({
    data: {
      title: "Révision Algèbre linéaire avant l'examen",
      description:
        "Je cherche quelqu'un pour réviser les espaces vectoriels et les applications linéaires avant le partiel de la semaine prochaine.",
      subject: "Algèbre",
      level: 1,
      availability: "Week-end, en visio ou à la bibliothèque",
      status: "OPEN",
      authorId: karim.id,
    },
  });

  const req3 = await prisma.helpRequest.create({
    data: {
      title: "Projet Java : modélisation UML",
      description:
        "Notre projet Java nécessite une modélisation UML propre (diagrammes de classes et de séquence). Je voudrais un retour d'expérience.",
      subject: "Java",
      level: 4,
      availability: "Lundis et mercredis soir",
      status: "ACCEPTED",
      authorId: yasmine.id,
    },
  });

  const req4 = await prisma.helpRequest.create({
    data: {
      title: "Requêtes SQL avancées et jointures",
      description:
        "Je ne comprends pas bien les jointures externes et les sous-requêtes corrélées. Un étudiant en BDD pourrait-il m'expliquer ?",
      subject: "SQL",
      level: 4,
      availability: "Flexibles, plutôt en soirée",
      status: "COMPLETED",
      authorId: fatma.id,
      closedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
  });

  console.log("Création des propositions…");
  const propAccepted3 = await prisma.helpProposal.create({
    data: {
      message:
        "Je maîtrise bien UML et les design patterns Java, je peux t'aider à modéliser ton projet proprement.",
      status: "ACCEPTED",
      requestId: req3.id,
      helperId: ahmed.id,
    },
  });

  await prisma.helpProposal.create({
    data: {
      message: "Je peux t'expliquer les bases d'UML si tu veux.",
      status: "REJECTED",
      requestId: req3.id,
      helperId: karim.id,
    },
  });

  const propAccepted4 = await prisma.helpProposal.create({
    data: {
      message:
        "J'adore SQL ! Je peux te faire une session sur les jointures avec plein d'exemples concrets.",
      status: "ACCEPTED",
      requestId: req4.id,
      helperId: ahmed.id,
    },
  });

  await prisma.helpProposal.create({
    data: {
      message:
        "J'ai déjà fait plusieurs projets Next.js avec Server Actions, je peux t'expliquer les bonnes pratiques.",
      status: "PENDING",
      requestId: req1.id,
      helperId: yasmine.id,
    },
  });

  await prisma.helpProposal.create({
    data: {
      message:
        "L'algèbre linéaire est ma spécialité, je peux préparer une fiche de révision avec toi.",
      status: "PENDING",
      requestId: req2.id,
      helperId: fatma.id,
    },
  });

  console.log("Création des séances…");
  const session3 = await prisma.studySession.create({
    data: {
      scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      subject: "Java / UML",
      description: "Revue de la modélisation UML du projet Java.",
      status: "PLANNED",
      requestId: req3.id,
      proposalId: propAccepted3.id,
    },
  });

  const session4 = await prisma.studySession.create({
    data: {
      scheduledAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      subject: "SQL",
      description: "Jointures externes et sous-requêtes corrélées.",
      status: "DONE",
      requestId: req4.id,
      proposalId: propAccepted4.id,
    },
  });

  console.log("Création des évaluations…");
  await prisma.review.create({
    data: {
      rating: 5,
      comment: "Explications très claires, merci Ahmed !",
      sessionId: session4.id,
      authorId: fatma.id,
      targetId: ahmed.id,
    },
  });
  await prisma.review.create({
    data: {
      rating: 4,
      comment: "Bonne séance, questions pertinentes.",
      sessionId: session4.id,
      authorId: ahmed.id,
      targetId: fatma.id,
    },
  });

  console.log("Création des notifications…");
  await prisma.notification.createMany({
    data: [
      {
        userId: sarah.id,
        type: "PROPOSAL_RECEIVED",
        title: "Nouvelle proposition d'aide",
        body: "Yasmine Ben Ali a proposé son aide sur « Besoin d'aide sur les Server Actions Next.js ».",
        link: `/requests/${req1.id}`,
      },
      {
        userId: ahmed.id,
        type: "PROPOSAL_ACCEPTED",
        title: "Proposition acceptée",
        body: "Ta proposition sur « Projet Java : modélisation UML » a été acceptée.",
        link: `/sessions`,
      },
      {
        userId: fatma.id,
        type: "REVIEW_RECEIVED",
        title: "Nouvelle évaluation",
        body: "Tu as reçu une évaluation 4/5 pour la séance SQL.",
        link: `/sessions`,
      },
    ],
  });

  console.log("Création d'un signalement de démonstration…");
  await prisma.report.create({
    data: {
      reason: "Contenu potentiellement inapproprié",
      details: "Signalement de démonstration pour l'espace administrateur.",
      status: "PENDING",
      reporterId: karim.id,
      requestId: req1.id,
    },
  });

  console.log("Seed terminé !");
  console.log("Comptes de démonstration :");
  console.log("  Admin     : admin@campusconnect.tn / Admin123!");
  console.log("  Étudiants : yasmine|ahmed|fatma|karim|sarah@etudiant.tn / Etudiant123!");
  console.log("Session planifiée :", session3.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
