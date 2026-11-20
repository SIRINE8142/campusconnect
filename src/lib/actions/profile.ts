"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { updateProfile } from "@/lib/services/profiles";
import { profileSchema, zodError, type ActionResult, type ProfileInput } from "@/lib/validations";

export async function updateProfileAction(input: ProfileInput): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);
  await updateProfile(user.id, parsed.data);
  revalidatePath("/profile");
  revalidatePath("/dashboard");
  return { ok: true };
}
