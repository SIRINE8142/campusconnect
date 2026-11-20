"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, Menu, ShieldCheck } from "lucide-react";
import { Sidebar } from "./sidebar";
import { Avatar } from "@/components/ui/avatar";

/**
 * Coquille de l'espace connecté : sidebar + topbar.
 * Composant client car il gère l'ouverture du menu mobile.
 */
export function AppShell({
  user,
  unreadNotifications,
  isAdmin,
  children,
}: {
  user: { firstName: string; lastName: string; avatarUrl: string | null; specialty: string | null };
  unreadNotifications: number;
  isAdmin: boolean;
  children: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar mobileOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6">
          <button
            className="rounded-lg p-2 hover:bg-slate-100 lg:hidden"
            onClick={() => setMenuOpen(true)}
            aria-label="Ouvrir le menu"
          >
            <Menu className="h-5 w-5 text-slate-700" />
          </button>

          <div className="hidden text-sm text-slate-500 lg:block">
            Plateforme d'entraide entre étudiants
          </div>

          <div className="flex items-center gap-3">
            {isAdmin && (
              <Link
                href="/admin"
                className="flex items-center gap-1.5 rounded-xl bg-violet-100 px-3 py-1.5 text-sm font-medium text-violet-800 hover:bg-violet-200"
              >
                <ShieldCheck className="h-4 w-4" />
                Administration
              </Link>
            )}
            <Link
              href="/notifications"
              className="relative rounded-xl p-2 hover:bg-slate-100"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5 text-slate-600" />
              {unreadNotifications > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {unreadNotifications > 9 ? "9+" : unreadNotifications}
                </span>
              )}
            </Link>
            <Link href="/profile" className="flex items-center gap-2.5 rounded-xl p-1.5 hover:bg-slate-100">
              <Avatar
                firstName={user.firstName}
                lastName={user.lastName}
                url={user.avatarUrl}
                size="sm"
              />
              <div className="hidden text-left sm:block">
                <p className="text-sm font-medium text-slate-800">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-slate-500">{user.specialty ?? "Étudiant"}</p>
              </div>
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
