"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, CheckCircle2, Loader2 } from "lucide-react";
import { deleteRequestAction, completeRequestAction } from "@/lib/actions/requests";
import { Button } from "@/components/ui/button";

/**
 * Actions réservées à l'auteur de la demande : modifier, supprimer,
 * clôturer (après acceptation d'une aide). Confirmations avant suppression.
 */
export function RequestOwnerActions({
  requestId,
  status,
}: {
  requestId: string;
  status: "OPEN" | "ACCEPTED" | "COMPLETED";
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onDelete() {
    if (!confirm("Supprimer définitivement cette demande ?")) return;
    setPending(true);
    setError(null);
    const result = await deleteRequestAction(requestId);
    setPending(false);
    if (!result.ok) setError(result.error);
  }

  async function onComplete() {
    if (!confirm("Marquer cette demande comme terminée ?")) return;
    setPending(true);
    setError(null);
    const result = await completeRequestAction(requestId);
    setPending(false);
    if (!result.ok) setError(result.error);
    else router.refresh();
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {status !== "COMPLETED" && (
          <Link href={`/requests/${requestId}/edit`}>
            <Button size="sm" variant="secondary">
              <Pencil className="h-4 w-4" />
              Modifier
            </Button>
          </Link>
        )}
        {status === "ACCEPTED" && (
          <Button size="sm" variant="success" onClick={onComplete} disabled={pending}>
            <CheckCircle2 className="h-4 w-4" />
            Marquer terminée
          </Button>
        )}
        <Button size="sm" variant="danger" onClick={onDelete} disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          Supprimer
        </Button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
