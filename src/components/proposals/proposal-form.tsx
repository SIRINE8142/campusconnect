"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Send } from "lucide-react";
import { proposalSchema, type ProposalInput } from "@/lib/validations";
import { createProposalAction } from "@/lib/actions/proposals";
import { Button } from "@/components/ui/button";
import { Textarea, Label, FieldError } from "@/components/ui/input";

/** Formulaire « proposer mon aide » affiché sur le détail d'une demande OPEN. */
export function ProposalForm({ requestId }: { requestId: string }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProposalInput>({ resolver: zodResolver(proposalSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    const result = await createProposalAction(requestId, values);
    if (!result.ok) setServerError(result.error);
    else setDone(true);
  });

  if (done) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        Ta proposition a été envoyée ! L'auteur de la demande pourra l'accepter ou la refuser.
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3" noValidate>
      {serverError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {serverError}
        </div>
      )}
      <div>
        <Label htmlFor="message">Ton message de présentation</Label>
        <Textarea
          id="message"
          rows={4}
          placeholder="Présente-toi : pourquoi tu peux aider, ton expérience sur le sujet…"
          aria-invalid={!!errors.message}
          {...register("message")}
        />
        <FieldError message={errors.message?.message} />
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        Proposer mon aide
      </Button>
    </form>
  );
}
