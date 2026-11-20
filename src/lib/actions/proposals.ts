"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import {
  createProposal,
  acceptProposal,
  rejectProposal,
  withdrawProposal,
} from "@/lib/services/proposals";
import { proposalSchema, zodError, type ActionResult, type ProposalInput } from "@/lib/validations";
import { handleService } from "./helpers";

export async function createProposalAction(
  requestId: string,
  input: ProposalInput,
): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = proposalSchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);
  const result = await handleService(() =>
    createProposal(requestId, user.id, parsed.data.message),
  );
  if (result.ok) {
    revalidatePath(`/requests/${requestId}`);
    revalidatePath("/proposals");
  }
  return result;
}

export async function acceptProposalAction(proposalId: string): Promise<ActionResult> {
  const user = await requireUser();
  const result = await handleService(() => acceptProposal(proposalId, user.id));
  if (result.ok) {
    revalidatePath("/proposals/received");
    revalidatePath("/requests");
    revalidatePath("/requests/[id]", "page");
    revalidatePath("/sessions");
  }
  return result;
}

export async function rejectProposalAction(proposalId: string): Promise<ActionResult> {
  const user = await requireUser();
  const result = await handleService(() => rejectProposal(proposalId, user.id));
  if (result.ok) {
    revalidatePath("/proposals/received");
    revalidatePath("/requests/[id]", "page");
  }
  return result;
}

export async function withdrawProposalAction(proposalId: string): Promise<ActionResult> {
  const user = await requireUser();
  const result = await handleService(() => withdrawProposal(proposalId, user.id));
  if (result.ok) {
    revalidatePath("/proposals");
    revalidatePath("/requests/[id]", "page");
  }
  return result;
}
