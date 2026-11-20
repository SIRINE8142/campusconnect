import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Toutes les pages lisent la session via cookies() : rendu bloquant autorisé
// (Cache Components de Next 16 interdit "force-dynamic").
export const instant = false;

export const metadata: Metadata = {
  title: {
    default: "CampusConnect — Entraide entre étudiants",
    template: "%s | CampusConnect",
  },
  description:
    "Plateforme d'entraide et de partage de compétences entre étudiants : demandes d'aide, séances de révision et évaluations.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
