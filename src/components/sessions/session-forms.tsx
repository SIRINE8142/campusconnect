"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, CalendarPlus, CheckCircle2, XCircle, Star } from "lucide-react";
import {
  studySessionSchema,
  reviewSchema,
  type StudySessionInput,
  type ReviewInput,
} from "@/lib/validations";
import { createSessionAction, markSessionDoneAction, cancelSessionAction } from "@/lib/actions/sessions";
import { createReviewAction } from "@/lib/actions/reviews";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label, FieldError } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** Formulaire de planification d'une séance sur une proposition acceptée. */
export function SessionForm({ proposalId, defaultSubject }: { proposalId: string; defaultSubject: string }) {
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<StudySessionInput>({
    resolver: zodResolver(studySessionSchema),
    defaultValues: { subject: defaultSubject },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    const result = await createSessionAction(proposalId, values);
    if (!result.ok) setServerError(result.error);
    else setOpen(false);
  });

  if (!open) {
    return (
      <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
        <CalendarPlus className="h-4 w-4" />
        Planifier une séance
      </Button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-3 space-y-3 rounded-xl border border-slate-200 p-4">
      {serverError && <p className="text-sm text-red-600">{serverError}</p>}
      <div>
        <Label htmlFor="scheduledAt">Date et heure</Label>
        <Input id="scheduledAt" type="datetime-local" aria-invalid={!!errors.scheduledAt} {...register("scheduledAt")} />
        <FieldError message={errors.scheduledAt?.message} />
      </div>
      <div>
        <Label htmlFor="subject">Matière / thème</Label>
        <Input id="subject" aria-invalid={!!errors.subject} {...register("subject")} />
        <FieldError message={errors.subject?.message} />
      </div>
      <div>
        <Label htmlFor="description">Description (facultatif)</Label>
        <Textarea id="description" rows={2} {...register("description")} />
        <FieldError message={errors.description?.message} />
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Planifier
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Annuler
        </Button>
      </div>
    </form>
  );
}

/** Boutons de cycle de vie d'une séance (participants uniquement). */
export function SessionActions({ sessionId, status }: { sessionId: string; status: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setPending(true);
    setError(null);
    const result = await fn();
    setPending(false);
    if (!result.ok) setError(result.error ?? "Erreur");
    else router.refresh();
  }

  if (status !== "PLANNED") return null;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="success" disabled={pending} onClick={() => run(() => markSessionDoneAction(sessionId))}>
          <CheckCircle2 className="h-4 w-4" />
          Marquer réalisée
        </Button>
        <Button size="sm" variant="ghost" disabled={pending} onClick={() => run(() => cancelSessionAction(sessionId))}>
          <XCircle className="h-4 w-4" />
          Annuler
        </Button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

/** Formulaire d'évaluation par étoiles, après séance réalisée + demande clôturée. */
export function ReviewForm({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ReviewInput>({ resolver: zodResolver(reviewSchema) });
  const rating = watch("rating") ?? 0;

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    const result = await createReviewAction(sessionId, values);
    if (!result.ok) setServerError(result.error);
    else {
      setOpen(false);
      router.refresh();
    }
  });

  if (!open) {
    return (
      <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
        <Star className="h-4 w-4" />
        Évaluer la séance
      </Button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-3 space-y-3 rounded-xl border border-slate-200 p-4">
      {serverError && <p className="text-sm text-red-600">{serverError}</p>}
      <div>
        <Label>Note</Label>
        <input type="hidden" {...register("rating", { valueAsNumber: true })} />
        <div className="flex gap-1" role="radiogroup" aria-label="Note de 1 à 5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setValue("rating", n, { shouldValidate: true })}
              aria-label={`${n} étoile${n > 1 ? "s" : ""}`}
              className="p-0.5"
            >
              <Star
                className={cn(
                  "h-6 w-6 transition-colors",
                  n <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300",
                )}
              />
            </button>
          ))}
        </div>
        <FieldError message={errors.rating?.message} />
      </div>
      <div>
        <Label htmlFor="comment">Commentaire (facultatif)</Label>
        <Textarea id="comment" rows={2} placeholder="Comment s'est passée la séance ?" {...register("comment")} />
        <FieldError message={errors.comment?.message} />
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Envoyer l'évaluation
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Annuler
        </Button>
      </div>
    </form>
  );
}
