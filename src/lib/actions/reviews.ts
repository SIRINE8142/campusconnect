"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { createReview } from "@/lib/services/reviews";
import { reviewSchema, zodError, type ActionResult, type ReviewInput } from "@/lib/validations";
import { handleService } from "./helpers";

export async function createReviewAction(
  sessionId: string,
  input: ReviewInput,
): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);
  const result = await handleService(() =>
    createReview(sessionId, user.id, parsed.data.rating, parsed.data.comment),
  );
  if (result.ok) revalidatePath("/sessions");
  return result;
}
