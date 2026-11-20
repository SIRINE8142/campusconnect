"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const STATUS_COLORS: Record<string, string> = {
  OPEN: "#3b82f6",
  ACCEPTED: "#f59e0b",
  COMPLETED: "#10b981",
};

const STATUS_LABELS: Record<string, string> = {
  OPEN: "Ouvertes",
  ACCEPTED: "Aide acceptée",
  COMPLETED: "Terminées",
};

/** Graphiques du dashboard (Recharts = composants client). */
export function DashboardCharts({
  perMonth,
  statusBreakdown,
}: {
  perMonth: { month: string; count: number }[];
  statusBreakdown: { status: string; count: number }[];
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <h3 className="mb-2 text-sm font-medium text-slate-700">
          Demandes publiées (6 derniers mois)
        </h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={perMonth}>
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} width={28} />
              <Tooltip />
              <Bar dataKey="count" fill="#1d4ed8" radius={[6, 6, 0, 0]} name="Demandes" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div>
        <h3 className="mb-2 text-sm font-medium text-slate-700">Répartition par statut</h3>
        <div className="h-56">
          {statusBreakdown.length === 0 ? (
            <p className="flex h-full items-center justify-center text-sm text-slate-400">
              Aucune demande pour le moment.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusBreakdown.map((s) => ({
                    name: STATUS_LABELS[s.status] ?? s.status,
                    value: s.count,
                    status: s.status,
                  }))}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={3}
                >
                  {statusBreakdown.map((s) => (
                    <Cell key={s.status} fill={STATUS_COLORS[s.status] ?? "#94a3b8"} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
