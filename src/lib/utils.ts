/** Concatène des classes CSS en ignorant les valeurs falsy. */
export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const dateFmt = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const dateTimeFmt = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDate(d: Date | string) {
  return dateFmt.format(new Date(d));
}

export function formatDateTime(d: Date | string) {
  return dateTimeFmt.format(new Date(d));
}

/** Libellés français des niveaux d'études (1 à 5). */
export function levelLabel(level: number | null | undefined) {
  if (!level) return "—";
  return level === 1 ? "1ère année" : `${level}ème année`;
}

/** Initiales pour l'avatar par défaut. */
export function initials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}
