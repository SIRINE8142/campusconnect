"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, X } from "lucide-react";
import { profileSchema, type ProfileInput, type ProfileFormValues } from "@/lib/validations";
import { updateProfileAction } from "@/lib/actions/profile";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select, Label, FieldError } from "@/components/ui/input";

const SKILL_SUGGESTIONS = [
  "JavaScript", "TypeScript", "React", "Next.js", "Node.js", "Python",
  "Java", "SQL", "Algèbre", "Analyse", "Probabilités", "Physique",
  "Anglais", "Réseaux", "Base de données",
];

/** Formulaire d'édition du profil (infos + compétences pour Smart Help). */
export function ProfileForm({ defaultValues }: { defaultValues: ProfileFormValues }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [skills, setSkills] = useState<string[]>(defaultValues.skills ?? []);
  const [skillInput, setSkillInput] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues, unknown, ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues,
  });

  function addSkill(name: string) {
    const clean = name.trim();
    if (!clean || skills.includes(clean) || skills.length >= 20) return;
    const next = [...skills, clean];
    setSkills(next);
    setValue("skills", next, { shouldValidate: true });
    setSkillInput("");
  }

  function removeSkill(name: string) {
    const next = skills.filter((s) => s !== name);
    setSkills(next);
    setValue("skills", next, { shouldValidate: true });
  }

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    setSuccess(false);
    const result = await updateProfileAction(values);
    if (!result.ok) setServerError(result.error);
    else setSuccess(true);
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {serverError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {serverError}
        </div>
      )}
      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status">
          Profil mis à jour avec succès.
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="firstName">Prénom</Label>
          <Input id="firstName" aria-invalid={!!errors.firstName} {...register("firstName")} />
          <FieldError message={errors.firstName?.message} />
        </div>
        <div>
          <Label htmlFor="lastName">Nom</Label>
          <Input id="lastName" aria-invalid={!!errors.lastName} {...register("lastName")} />
          <FieldError message={errors.lastName?.message} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="specialty">Spécialité</Label>
          <Input id="specialty" aria-invalid={!!errors.specialty} {...register("specialty")} />
          <FieldError message={errors.specialty?.message} />
        </div>
        <div>
          <Label htmlFor="level">Niveau d'études</Label>
          <Select id="level" aria-invalid={!!errors.level} {...register("level", { valueAsNumber: true })}>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>{n === 1 ? "1ère année" : `${n}ème année`}</option>
            ))}
          </Select>
          <FieldError message={errors.level?.message} />
        </div>
      </div>
      <div>
        <Label htmlFor="bio">Bio (facultatif)</Label>
        <Textarea id="bio" rows={3} placeholder="Présente-toi en quelques lignes…" {...register("bio")} />
        <FieldError message={errors.bio?.message} />
      </div>
      <div>
        <Label htmlFor="avatarUrl">Photo de profil — URL (facultatif)</Label>
        <Input id="avatarUrl" type="url" placeholder="https://…" {...register("avatarUrl")} />
        <FieldError message={errors.avatarUrl?.message} />
      </div>
      <div>
        <Label htmlFor="skillInput">Compétences</Label>
        <div className="flex gap-2">
          <Input
            id="skillInput"
            list="skill-suggestions"
            placeholder="Ex. React, Algèbre…"
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addSkill(skillInput);
              }
            }}
          />
          <Button type="button" variant="secondary" onClick={() => addSkill(skillInput)}>
            Ajouter
          </Button>
          <datalist id="skill-suggestions">
            {SKILL_SUGGESTIONS.filter((s) => !skills.includes(s)).map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>
        {skills.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {skills.map((s) => (
              <span key={s} className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-800">
                {s}
                <button type="button" onClick={() => removeSkill(s)} aria-label={`Retirer ${s}`}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
        Enregistrer
      </Button>
    </form>
  );
}
