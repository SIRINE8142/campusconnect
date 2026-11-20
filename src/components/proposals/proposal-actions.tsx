"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Loader2 } from "lucide-react";
import { acceptProposalAction, rejectProposalAction } from "@/lib/actions/proposals";
import { Button } from "@/components/ui/button";

/**
 * Boutons Accepter / Refuser visibles uniquement par l'auteur de la demande.
 * Les vraies vérifications de droits sont dans les Server Actions.
 */
export function ProposalActions({ proposalId }: { proposalId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState<"accept" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(action: "accept" | "reject") {
    setPending(action);
    setError(null);
    const result =
      action === "accept"
        ? await acceptProposalAction(proposalId)
        : await rejectProposalAction(proposalId);
    setPending(null);
    if (!result.ok) setError(result.error);
    else router.refresh();
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Button size="sm" variant="success" onClick={() => run("accept")} disabled={pending !== null}>
          {pending === "accept" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Accepter
        </Button>
        <Button size="sm" variant="danger" onClick={() => run("reject")} disabled={pending !== null}>
          {pending === "reject" ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
          Refuser
        </Button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
