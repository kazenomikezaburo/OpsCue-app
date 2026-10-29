"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import type { AssignmentActionResult } from "@/lib/admin/shifts/assignment-action-types";
import { uuidSchema } from "@/lib/utils/uuid-schema";

const generalMessage = "スタッフを配置できませんでした。最新の配置状況を確認して再度お試しください。";
const cancelGeneralMessage = "配置を解除できませんでした。最新の配置状況を確認して再度お試しください。";
const alreadyStartedMessage = "勤務開始後の配置解除はできません。勤怠管理から対応してください。";
const absentGeneralMessage = "欠勤状態を更新できませんでした。最新の勤務状況を確認して、もう一度お試しください。";
const noShowGeneralMessage = "無断欠勤状態を更新できませんでした。最新の勤務状況を確認して、もう一度お試しください。";
const failure = (message = generalMessage): AssignmentActionResult => ({ ok: false, message });

const acceptedApplicationMessages: Record<string, string> = {
  capacity_reached: "必要人数に達したため、配置できませんでした。",
  not_eligible: "現在の勤務条件では、このスタッフを配置できません。",
  application_decision_required: "応募の承認または却下を先に完了してください。",
  application_rejected: "却下済みの応募は配置できません。",
  application_withdrawn: "辞退済みの応募は配置できません。",
  shift_state_unavailable: "現在のシフト状態では配置できません。",
  unavailable: "対象を確認できないか、この操作を実行する権限がありません。",
  IDEMPOTENCY_CONFLICT: "操作内容が一致しませんでした。画面を再読み込みしてから、もう一度操作してください。",
};
const unknownAssignMessage = "通信結果を確認できませんでした。同じ操作を再度お試しください。";

type CandidateAssignmentRpcResult = {
  ok?: boolean;
  outcome?: string;
  assignmentId?: string | null;
  blockingReasons?: { code: string; label: string }[];
} | null;

// Accepted Application placement goes through the canonical command
// (ensure_candidate_assignment), which checks Worker status, branch,
// requirements, availability, overlap and Shift state, locks Shift then
// Worker, and is idempotent per actor + key. The legacy
// create_assignment_from_application RPC is no longer called from the app.
export async function assignWorkerToShift(
  shiftId: string,
  workerId: string,
  idempotencyKey: string,
): Promise<AssignmentActionResult> {
  if (
    !uuidSchema.safeParse(shiftId).success ||
    !uuidSchema.safeParse(workerId).success ||
    !uuidSchema.safeParse(idempotencyKey).success
  ) {
    return failure();
  }

  const auth = await getCurrentProfile();
  if (
    auth.status !== "authenticated" ||
    auth.profile.account_type === "worker"
  ) {
    return failure();
  }

  try {
    const supabase = await createClient();
    const shiftResult = await supabase
      .from("shift_slots")
      .select("jobs!inner(project_id)")
      .eq("id", shiftId)
      .maybeSingle();
    if (shiftResult.error || !shiftResult.data) return failure();

    const rpcResult = await supabase.rpc("ensure_candidate_assignment", {
      p_shift_id: shiftId,
      p_worker_id: workerId,
      p_assignment_path: "accepted_application",
      p_idempotency_key: idempotencyKey,
    });
    if (rpcResult.error) throw rpcResult.error;

    const result = rpcResult.data as CandidateAssignmentRpcResult;
    const outcome = result?.outcome ?? "unavailable";
    if (
      !result?.ok ||
      !result.assignmentId ||
      !["assignment_created", "existing_assignment"].includes(outcome)
    ) {
      return {
        ok: false,
        message: acceptedApplicationMessages[outcome] ?? generalMessage,
        retryable: false,
        blockingReasons: Array.isArray(result?.blockingReasons) ? result.blockingReasons : undefined,
      };
    }

    const job = shiftResult.data.jobs as unknown as { project_id: string };
    revalidatePath("/admin");
    revalidatePath("/admin/shifts");
    revalidatePath(`/admin/shifts/${shiftId}`);
    revalidatePath(`/admin/projects/${job.project_id}`);
    revalidatePath("/admin/placement");
    return { ok: true };
  } catch (error: unknown) {
    console.error("Failed to assign worker to shift", error);
    return { ok: false, message: unknownAssignMessage, retryable: true };
  }
}

export async function cancelAssignmentByCompany(
  shiftId: string,
  assignmentId: string,
): Promise<AssignmentActionResult> {
  if (!uuidSchema.safeParse(shiftId).success || !uuidSchema.safeParse(assignmentId).success) {
    return failure(cancelGeneralMessage);
  }

  const auth = await getCurrentProfile();
  if (
    auth.status !== "authenticated" ||
    auth.profile.account_type === "worker"
  ) {
    return failure(cancelGeneralMessage);
  }

  try {
    const supabase = await createClient();
    const shiftResult = await supabase
      .from("shift_slots")
      .select("jobs!inner(project_id)")
      .eq("id", shiftId)
      .maybeSingle();
    if (shiftResult.error || !shiftResult.data) {
      return failure(cancelGeneralMessage);
    }

    const rpcResult = await supabase.rpc("cancel_assignment_by_company", {
      p_shift_id: shiftId,
      p_assignment_id: assignmentId,
    });
    if (rpcResult.error?.message === "assignment_already_started") {
      return failure(alreadyStartedMessage);
    }
    if (rpcResult.error) throw rpcResult.error;

    const job = shiftResult.data.jobs as unknown as { project_id: string };
    revalidatePath("/admin");
    revalidatePath("/admin/shifts");
    revalidatePath(`/admin/shifts/${shiftId}`);
    revalidatePath(`/admin/projects/${job.project_id}`);
    return { ok: true };
  } catch (error: unknown) {
    console.error("Failed to cancel assignment by company", error);
    return failure(cancelGeneralMessage);
  }
}

async function markAssignmentAbsence(
  shiftId: string,
  assignmentId: string,
  kind: "absent" | "no_show",
): Promise<AssignmentActionResult> {
  const message = kind === "absent" ? absentGeneralMessage : noShowGeneralMessage;
  if (!uuidSchema.safeParse(shiftId).success || !uuidSchema.safeParse(assignmentId).success) return failure(message);

  const auth = await getCurrentProfile();
  if (auth.status !== "authenticated" || auth.profile.account_type === "worker") {
    return failure(message);
  }

  try {
    const supabase = await createClient();
    const shiftResult = await supabase
      .from("shift_slots")
      .select("jobs!inner(project_id)")
      .eq("id", shiftId)
      .maybeSingle();
    if (shiftResult.error || !shiftResult.data) return failure(message);

    const rpcResult = kind === "absent"
      ? await supabase.rpc("mark_assignment_absent", { p_shift_id: shiftId, p_assignment_id: assignmentId })
      : await supabase.rpc("mark_assignment_no_show", { p_shift_id: shiftId, p_assignment_id: assignmentId });
    if (rpcResult.error) throw rpcResult.error;

    const job = shiftResult.data.jobs as unknown as { project_id: string };
    revalidatePath("/admin");
    revalidatePath("/admin/attendance");
    revalidatePath("/admin/shifts");
    revalidatePath(`/admin/shifts/${shiftId}`);
    revalidatePath(`/admin/projects/${job.project_id}`);
    revalidatePath("/worker");
    revalidatePath("/worker/shifts");
    revalidatePath(`/worker/assignments/${assignmentId}`);
    return { ok: true };
  } catch (error: unknown) {
    console.error(`Failed to mark assignment ${kind}`, error);
    return failure(message);
  }
}

export async function markAssignmentAbsent(shiftId: string, assignmentId: string) {
  return markAssignmentAbsence(shiftId, assignmentId, "absent");
}

export async function markAssignmentNoShow(shiftId: string, assignmentId: string) {
  return markAssignmentAbsence(shiftId, assignmentId, "no_show");
}
