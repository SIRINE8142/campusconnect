import { Input, Select, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

/**
 * Filtres de recherche des demandes.
 * Formulaire en GET : les paramètres passent dans l'URL
 * (page rechargée → filtres conservés, liens partageables).
 */
export function RequestFilters({
  subjects,
  current,
}: {
  subjects: string[];
  current: { q?: string; subject?: string; level?: string; status?: string };
}) {
  return (
    <form method="GET" action="/requests" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <div className="lg:col-span-2">
        <Label htmlFor="q" className="sr-only">Recherche</Label>
        <Input
          id="q"
          name="q"
          placeholder="Rechercher une demande…"
          defaultValue={current.q ?? ""}
        />
      </div>
      <div>
        <Label htmlFor="subject" className="sr-only">Matière</Label>
        <Select id="subject" name="subject" defaultValue={current.subject ?? ""}>
          <option value="">Toutes les matières</option>
          {subjects.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="level" className="sr-only">Niveau</Label>
        <Select id="level" name="level" defaultValue={current.level ?? ""}>
          <option value="">Tous les niveaux</option>
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>{n === 1 ? "1ère année" : `${n}ème année`}</option>
          ))}
        </Select>
      </div>
      <div className="flex gap-2">
        <Select id="status" name="status" defaultValue={current.status ?? ""} aria-label="Statut">
          <option value="">Tous les statuts</option>
          <option value="OPEN">Ouvertes</option>
          <option value="ACCEPTED">Aide acceptée</option>
          <option value="COMPLETED">Terminées</option>
        </Select>
        <Button type="submit" aria-label="Rechercher">
          <Search className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}
