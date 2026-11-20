"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { createSession, markSessionDone, cancelSession } from "@/lib/services/sessions";
import {
  studySessionSchema,
  zodError,
  type ActionResult,
  type StudySessionInput,
} from "@/lib/validations";
import { handleService } from "./helpers";

export async function createSessionAction(
  proposalId: string,
  input: StudySessionInput,
): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = studySessionSchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);
  const result = await handleService(() => createSession(proposalId, user.id, parsed.data));
  if (result.ok) {
    revalidatePath("/sessions");
    revalidatePath("/requests/[id]", "page");
  }
  return result;
}

export async function markSessionDoneAction(sessionId: string): Promise<ActionResult> {
  const user = await requireUser();
  const result = await handleService(() => markSessionDone(sessionId, user.id));
  if (result.ok) {
    revalidatePath("/sessions");
    revalidatePath("/requests/[id]", "page");
  }
  return result;
}

export async function cancelSessionAction(sessionId: string): Promise<ActionResult> {
  const user = await requireUser();
  const result = await handleService(() => cancelSession(sessionId, user.id));
  if (result.ok) {
    revalidatePath("/sessions");
    revalidatePath("/requests/[id]", "page");
  }
  return result;
}
