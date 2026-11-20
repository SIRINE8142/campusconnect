"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Undo2 } from "lucide-react";
import { withdrawProposalAction } from "@/lib/actions/proposals";
import { Button } from "@/components/ui/button";

/** Permet à l'étudiant de retirer sa proposition en attente. */
export function WithdrawButton({ proposalId }: { proposalId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    if (!confirm("Retirer ta proposition ?")) return;
    setPending(true);
    setError(null);
    const result = await withdrawProposalAction(proposalId);
    setPending(false);
    if (!result.ok) setError(result.error);
    else router.refresh();
  }

  return (
    <span className="inline-flex flex-col gap-1">
      <Button size="sm" variant="ghost" onClick={onClick} disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Undo2 className="h-4 w-4" />}
        Retirer
      </Button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </span>
  );
}
