"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { helpRequestSchema, type HelpRequestInput } from "@/lib/validations";
import { createRequestAction, updateRequestAction } from "@/lib/actions/requests";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select, Label, FieldError } from "@/components/ui/input";

/**
 * Formulaire de création/modification d'une demande d'aide.
 * Le même composant sert aux deux pages : si `requestId` est fourni,
 * on appelle l'action de mise à jour, sinon celle de création.
 */
export function RequestForm({
  requestId,
  defaultValues,
}: {
  requestId?: string;
  defaultValues?: HelpRequestInput;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<HelpRequestInput>({
    resolver: zodResolver(helpRequestSchema),
    defaultValues,
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    const result = requestId
      ? await updateRequestAction(requestId, values)
      : await createRequestAction(values);
    if (!result.ok) setServerError(result.error);
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {serverError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {serverError}
        </div>
      )}
      <div>
        <Label htmlFor="title">Titre</Label>
        <Input
          id="title"
          placeholder="Ex. Révision des jointures SQL"
          aria-invalid={!!errors.title}
          {...register("title")}
        />
        <FieldError message={errors.title?.message} />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Décris ce que tu ne comprends pas et ce que tu attends de l'aide…"
          rows={5}
          aria-invalid={!!errors.description}
          {...register("description")}
        />
        <FieldError message={errors.description?.message} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="subject">Matière</Label>
          <Input
            id="subject"
            list="subject-suggestions"
            placeholder="Ex. React, Algèbre…"
            aria-invalid={!!errors.subject}
            {...register("subject")}
          />
          <datalist id="subject-suggestions">
            {["JavaScript", "TypeScript", "React", "Next.js", "Node.js", "Python", "Java", "SQL", "Algèbre", "Analyse", "Probabilités", "Physique", "Anglais", "Réseaux", "Base de données"].map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
          <FieldError message={errors.subject?.message} />
        </div>
        <div>
          <Label htmlFor="level">Niveau requis</Label>
          <Select id="level" aria-invalid={!!errors.level} {...register("level", { valueAsNumber: true })}>
            <option value="">Choisir…</option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>{n === 1 ? "1ère année" : `${n}ème année`}</option>
            ))}
          </Select>
          <FieldError message={errors.level?.message} />
        </div>
      </div>
      <div>
        <Label htmlFor="availability">Disponibilités</Label>
        <Input
          id="availability"
          placeholder="Ex. Mardis et jeudis après-midi, en visio"
          aria-invalid={!!errors.availability}
          {...register("availability")}
        />
        <FieldError message={errors.availability?.message} />
      </div>
      <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
        {requestId ? "Enregistrer les modifications" : "Publier ma demande"}
      </Button>
    </form>
  );
}
