"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, X } from "lucide-react";
import { registerSchema, type RegisterInput, type RegisterFormValues } from "@/lib/validations";
import { registerAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError, Select } from "@/components/ui/input";

const SKILL_SUGGESTIONS = [
  "JavaScript", "TypeScript", "React", "Next.js", "Node.js", "Python",
  "Java", "SQL", "Algèbre", "Analyse", "Probabilités", "Physique",
  "Anglais", "Réseaux", "Base de données",
];

/**
 * Formulaire d'inscription : informations du profil + sélection de compétences.
 * Le même schéma Zod est appliqué côté client (resolver) et côté serveur (action).
 */
export function RegisterForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues, unknown, RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { skills: [] },
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
    const result = await registerAction(values);
    if (!result.ok) setServerError(result.error);
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {serverError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {serverError}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="firstName">Prénom</Label>
          <Input id="firstName" autoComplete="given-name" placeholder="Yasmine" aria-invalid={!!errors.firstName} {...register("firstName")} />
          <FieldError message={errors.firstName?.message} />
        </div>
        <div>
          <Label htmlFor="lastName">Nom</Label>
          <Input id="lastName" autoComplete="family-name" placeholder="Ben Ali" aria-invalid={!!errors.lastName} {...register("lastName")} />
          <FieldError message={errors.lastName?.message} />
        </div>
      </div>

      <div>
        <Label htmlFor="email">Adresse email</Label>
        <Input id="email" type="email" autoComplete="email" placeholder="prenom.nom@etudiant.tn" aria-invalid={!!errors.email} {...register("email")} />
        <FieldError message={errors.email?.message} />
      </div>

      <div>
        <Label htmlFor="password">Mot de passe</Label>
        <Input id="password" type="password" autoComplete="new-password" placeholder="8 caractères minimum" aria-invalid={!!errors.password} {...register("password")} />
        <FieldError message={errors.password?.message} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="specialty">Spécialité</Label>
          <Input id="specialty" placeholder="Génie Logiciel" aria-invalid={!!errors.specialty} {...register("specialty")} />
          <FieldError message={errors.specialty?.message} />
        </div>
        <div>
          <Label htmlFor="level">Niveau d'études</Label>
          <Select id="level" aria-invalid={!!errors.level} {...register("level", { valueAsNumber: true })}>
            <option value="">Choisir…</option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n === 1 ? "1ère année" : `${n}ème année`}
              </option>
            ))}
          </Select>
          <FieldError message={errors.level?.message} />
        </div>
      </div>

      <div>
        <Label htmlFor="skillInput">Compétences (facultatif)</Label>
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
        <p className="mt-1 text-xs text-slate-500">
          Utilisées par Smart Help pour te recommander des demandes pertinentes.
        </p>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
        Créer mon compte
      </Button>
    </form>
  );
}
