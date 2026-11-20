import { ServiceError } from "@/lib/services/errors";
import type { ActionResult } from "@/lib/validations";

/**
 * Enveloppe un appel de service : convertit les ServiceError en
 * ActionResult lisible côté client. Les autres erreurs remontent
 * (elles seront journalisées par Next.js).
 */
export async function handleService(fn: () => Promise<unknown>): Promise<ActionResult> {
  try {
    await fn();
    return { ok: true };
  } catch (e) {
    if (e instanceof ServiceError) {
      return { ok: false, error: e.message };
    }
    throw e;
  }
}
