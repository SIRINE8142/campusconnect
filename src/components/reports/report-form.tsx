"use client";

import { useState } from "react";
import { Flag, Loader2 } from "lucide-react";
import { createReportAction } from "@/lib/actions/reports";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label } from "@/components/ui/input";

/**
 * Formulaire de signalement d'une publication (modal léger inline).
 * Affiché aux étudiants qui ne sont pas l'auteur de la demande.
 */
export function ReportForm({ requestId }: { requestId: string }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const result = await createReportAction(requestId, { reason, details });
    setPending(false);
    if (!result.ok) setError(result.error);
    else setSent(true);
  }

  if (sent) {
    return (
      <p className="text-sm text-emerald-700">
        Merci, ton signalement a été transmis à la modération.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-600"
      >
        <Flag className="h-4 w-4" />
        Signaler cette publication
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border border-slate-200 p-4">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div>
        <Label htmlFor="reason">Raison du signalement</Label>
        <Input
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Ex. Contenu inapproprié"
          required
          minLength={5}
        />
      </div>
      <div>
        <Label htmlFor="details">Détails (facultatif)</Label>
        <Textarea
          id="details"
          rows={3}
          value={details}
          onChange={(e) => setDetails(e.target.value)}
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" variant="danger" disabled={pending}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Envoyer le signalement
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Annuler
        </Button>
      </div>
    </form>
  );
}
