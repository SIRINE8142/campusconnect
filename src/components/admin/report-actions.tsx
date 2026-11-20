"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Trash2, Loader2 } from "lucide-react";
import {
  resolveReportAction,
  dismissReportAction,
  adminDeleteRequestAction,
} from "@/lib/actions/reports";
import { Button } from "@/components/ui/button";

/**
 * Actions de modération (admin) : traiter le signalement, le rejeter,
 * ou supprimer la publication signalée.
 */
export function ReportActions({ reportId, requestId }: { reportId: string; requestId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(name: string, fn: () => Promise<{ ok: boolean; error?: string }>) {
    setPending(name);
    setError(null);
    const result = await fn();
    setPending(null);
    if (!result.ok) setError(result.error ?? "Erreur");
    else router.refresh();
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="success"
          disabled={pending !== null}
          onClick={() => run("resolve", () => resolveReportAction(reportId))}
        >
          {pending === "resolve" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Traiter
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={pending !== null}
          onClick={() => run("dismiss", () => dismissReportAction(reportId))}
        >
          {pending === "dismiss" ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
          Rejeter
        </Button>
        <Button
          size="sm"
          variant="danger"
          disabled={pending !== null}
          onClick={() => {
            if (confirm("Supprimer définitivement cette publication ?")) {
              run("delete", () => adminDeleteRequestAction(requestId));
            }
          }}
        >
          {pending === "delete" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          Supprimer la publication
        </Button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
