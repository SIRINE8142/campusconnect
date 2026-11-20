import { Badge } from "@/components/ui/badge";

const requestStatus = {
  OPEN: { label: "Ouverte", tone: "blue" },
  ACCEPTED: { label: "Aide acceptée", tone: "amber" },
  COMPLETED: { label: "Terminée", tone: "green" },
} as const;

const proposalStatus = {
  PENDING: { label: "En attente", tone: "amber" },
  ACCEPTED: { label: "Acceptée", tone: "green" },
  REJECTED: { label: "Refusée", tone: "red" },
} as const;

const sessionStatus = {
  PLANNED: { label: "Planifiée", tone: "blue" },
  DONE: { label: "Réalisée", tone: "green" },
  CANCELLED: { label: "Annulée", tone: "red" },
} as const;

const reportStatus = {
  PENDING: { label: "À traiter", tone: "amber" },
  RESOLVED: { label: "Traitée", tone: "green" },
  DISMISSED: { label: "Rejetée", tone: "slate" },
} as const;

export function RequestStatusBadge({ status }: { status: keyof typeof requestStatus }) {
  const s = requestStatus[status];
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

export function ProposalStatusBadge({ status }: { status: keyof typeof proposalStatus }) {
  const s = proposalStatus[status];
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

export function SessionStatusBadge({ status }: { status: keyof typeof sessionStatus }) {
  const s = sessionStatus[status];
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

export function ReportStatusBadge({ status }: { status: keyof typeof reportStatus }) {
  const s = reportStatus[status];
  return <Badge tone={s.tone}>{s.label}</Badge>;
}
