"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import {
  createRequest,
  updateRequest,
  deleteRequest,
  completeRequest,
} from "@/lib/services/requests";
import { helpRequestSchema, zodError, type ActionResult, type HelpRequestInput } from "@/lib/validations";
import { handleService } from "./helpers";

export async function createRequestAction(input: HelpRequestInput): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = helpRequestSchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);
  const request = await createRequest(user.id, parsed.data);
  revalidatePath("/requests");
  revalidatePath("/my-requests");
  redirect(`/requests/${request.id}`);
}

export async function updateRequestAction(
  requestId: string,
  input: HelpRequestInput,
): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = helpRequestSchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);
  const result = await handleService(() => updateRequest(requestId, user.id, parsed.data));
  if (result.ok) {
    revalidatePath(`/requests/${requestId}`);
    revalidatePath("/requests");
    revalidatePath("/my-requests");
    redirect(`/requests/${requestId}`);
  }
  return result;
}

export async function deleteRequestAction(requestId: string): Promise<ActionResult> {
  const user = await requireUser();
  const result = await handleService(() => deleteRequest(requestId, user.id));
  if (result.ok) {
    revalidatePath("/requests");
    revalidatePath("/my-requests");
    redirect("/my-requests");
  }
  return result;
}

export async function completeRequestAction(requestId: string): Promise<ActionResult> {
  const user = await requireUser();
  const result = await handleService(() => completeRequest(requestId, user.id));
  if (result.ok) {
    revalidatePath(`/requests/${requestId}`);
    revalidatePath("/my-requests");
    revalidatePath("/sessions");
  }
  return result;
}
