/**
 * Erreur métier : levée par les services quand une règle est violée
 * (droits, statut interdit, ressource introuvable…).
 * Les Server Actions l'interceptent et la renvoient au client en message lisible.
 */
export class ServiceError extends Error {
  readonly code: "NOT_FOUND" | "FORBIDDEN" | "CONFLICT" | "BAD_REQUEST";

  constructor(message: string, code: ServiceError["code"] = "BAD_REQUEST") {
    super(message);
    this.name = "ServiceError";
    this.code = code;
  }
}

export function notFound(message = "Ressource introuvable.") {
  return new ServiceError(message, "NOT_FOUND");
}

export function forbidden(message = "Action non autorisée.") {
  return new ServiceError(message, "FORBIDDEN");
}

export function conflict(message: string) {
  return new ServiceError(message, "CONFLICT");
}
