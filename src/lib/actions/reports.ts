"use server";

import { revalidatePath } from "next/cache";
import { requireUser, requireAdmin } from "@/lib/auth/session";
import { createReport, resolveReport, dismissReport, adminDeleteRequest } from "@/lib/services/reports";
import { reportSchema, zodError, type ActionResult, type ReportInput } from "@/lib/validations";
import { handleService } from "./helpers";

/** Signaler une demande (étudiant connecté). */
export async function createReportAction(
  requestId: string,
  input: ReportInput,
): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = reportSchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);
  const result = await handleService(() =>
    createReport(requestId, user.id, parsed.data.reason, parsed.data.details),
  );
  if (result.ok) revalidatePath(`/requests/${requestId}`);
  return result;
}

// — Actions réservées à l'administrateur (requireAdmin côté serveur) —

export async function resolveReportAction(reportId: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  const result = await handleService(() => resolveReport(reportId, admin.id));
  if (result.ok) revalidatePath("/admin/reports");
  return result;
}

export async function dismissReportAction(reportId: string): Promise<ActionResult> {
  await requireAdmin();
  const result = await handleService(() => dismissReport(reportId));
  if (result.ok) revalidatePath("/admin/reports");
  return result;
}

export async function adminDeleteRequestAction(requestId: string): Promise<ActionResult> {
  await requireAdmin();
  const result = await handleService(() => adminDeleteRequest(requestId));
  if (result.ok) {
    revalidatePath("/admin/reports");
    revalidatePath("/requests");
  }
  return result;
}
