"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ListTodo,
  PlusCircle,
  FolderOpen,
  Send,
  Inbox,
  CalendarDays,
  Sparkles,
  User,
  GraduationCap,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/lib/actions/auth";
import { LogOut } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/requests", label: "Demandes d'aide", icon: ListTodo },
  { href: "/requests/new", label: "Nouvelle demande", icon: PlusCircle },
  { href: "/my-requests", label: "Mes demandes", icon: FolderOpen },
  { href: "/proposals", label: "Mes propositions", icon: Send },
  { href: "/proposals/received", label: "Propositions reçues", icon: Inbox },
  { href: "/sessions", label: "Séances", icon: CalendarDays },
  { href: "/smart-help", label: "Smart Help", icon: Sparkles },
  { href: "/profile", label: "Mon profil", icon: User },
];

export function Sidebar({
  mobileOpen,
  onClose,
}: {
  mobileOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      {/* Fond assombri sur mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-blue-950 text-blue-100 transition-transform lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <Link href="/dashboard" className="flex items-center gap-2.5" onClick={onClose}>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600">
              <GraduationCap className="h-5 w-5 text-white" />
            </span>
            <span className="text-lg font-bold text-white">CampusConnect</span>
          </Link>
          <button
            className="rounded-lg p-1.5 hover:bg-blue-900 lg:hidden"
            onClick={onClose}
            aria-label="Fermer le menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/requests"
                ? pathname === "/requests"
                : pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-blue-600 text-white"
                    : "text-blue-200 hover:bg-blue-900 hover:text-white",
                )}
              >
                <Icon className="h-4.5 w-4.5 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-blue-900 p-3">
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-blue-200 transition-colors hover:bg-blue-900 hover:text-white"
            >
              <LogOut className="h-4.5 w-4.5" />
              Se déconnecter
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
