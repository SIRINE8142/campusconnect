import { Card } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

/** Carte de statistique du tableau de bord. */
export function StatCard({
  label,
  value,
  icon: Icon,
  sub,
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  sub?: string;
}) {
  return (
    <Card className="flex items-center gap-4">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100">
        <Icon className="h-5 w-5 text-blue-700" />
      </span>
      <div>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
        {sub && <p className="text-xs text-slate-400">{sub}</p>}
      </div>
    </Card>
  );
}
