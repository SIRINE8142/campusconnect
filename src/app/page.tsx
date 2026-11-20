import Link from "next/link";
import { redirect } from "next/navigation";
import {
  GraduationCap,
  Search,
  Handshake,
  CalendarCheck,
  Star,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";

const features = [
  {
    icon: Search,
    title: "Trouve de l'aide",
    text: "Publie une demande dans n'importe quelle matière et reçois des propositions d'étudiants compétents.",
  },
  {
    icon: Handshake,
    title: "Propose ton aide",
    text: "Partage tes compétences, propose ton aide sur les demandes ouvertes et fais la différence.",
  },
  {
    icon: CalendarCheck,
    title: "Organise des séances",
    text: "Planifie des séances de révision avec les étudiants qui t'aident, en présentiel ou en visio.",
  },
  {
    icon: Star,
    title: "Évalue et progresse",
    text: "Évalue les séances réalisées et construis ta réputation d'entraide sur le campus.",
  },
  {
    icon: Sparkles,
    title: "Smart Help",
    text: "Notre moteur de recommandation te propose les demandes qui correspondent à tes compétences.",
  },
];

export default async function LandingPage() {
  // Un utilisateur déjà connecté n'a pas besoin de la landing page.
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="border-b border-slate-100">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-700">
              <GraduationCap className="h-5 w-5 text-white" />
            </span>
            <span className="text-lg font-bold text-blue-950">CampusConnect</span>
          </div>
          <nav className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-xl px-4 py-2 text-sm font-medium text-blue-800 hover:bg-blue-50"
            >
              Se connecter
            </Link>
            <Link
              href="/register"
              className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
            >
              S'inscrire
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="bg-gradient-to-b from-blue-50 to-white">
          <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-1.5 text-sm font-medium text-blue-800">
              <GraduationCap className="h-4 w-4" />
              Par des étudiants, pour des étudiants
            </span>
            <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold tracking-tight text-blue-950 sm:text-5xl">
              L'entraide qui fait réussir ton campus
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">
              Demande de l'aide dans tes matières, propose tes compétences,
              organise des séances de révision et progresse avec ta communauté.
            </p>
            <div className="mt-8 flex items-center justify-center gap-3">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-6 py-3 font-medium text-white hover:bg-blue-800"
              >
                Rejoindre CampusConnect
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="rounded-xl border border-blue-200 bg-white px-6 py-3 font-medium text-blue-800 hover:bg-blue-50"
              >
                J'ai déjà un compte
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-center text-2xl font-bold text-blue-950">
            Comment ça marche ?
          </h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100">
                  <Icon className="h-5 w-5 text-blue-700" />
                </span>
                <h3 className="mt-4 font-semibold text-slate-900">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-100 py-6 text-center text-sm text-slate-500">
        CampusConnect — Projet React & Next.js, Génie Logiciel
      </footer>
    </div>
  );
}
