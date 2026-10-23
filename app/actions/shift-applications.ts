"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import type {
  ApplicationActionResult,
  ApplicationReviewWarning,
} from "@/lib/admin/shifts/application-action-types";
import { uuidSchema } from "@/lib/utils/uuid-schema";

const message = "応募状態を更新できませんでした。時間をおいて再度お試しください。";
const unknownMessage = "通信結果を確認できませんでした。同じ操作を再度お試しください。";
const failure = (): ApplicationActionResult => ({ ok: false, message });

const outcomeMessages: Record<string, string> = {
  application_already_decided: "この応募はすでに処理されています。画面を再読み込みしてください。",
  assignment_exists: "このスタッフはすでにこのシフトに配置されています。",
  shift_state_unavailable: "現在のシフト状態では承認できません。",
  worker_inactive: "このスタッフは現在稼働できない状態のため、承認できません。",
  confirmation_required: "時間が重なる勤務があります。内容を確認してから承認してください。",
  unavailable: "対象を確認できないか、この操作を実行する権限がありません。",
  IDEMPOTENCY_CONFLICT: "操作内容が一致しませんでした。画面を再読み込みしてから、もう一度操作してください。",
};

type ReviewRpcResult = {
  ok?: boolean;
  outcome?: string;
  warnings?: ApplicationReviewWarning[];
} | null;

export async function acceptShiftApplication(
  shiftId: string,
  applicationId: string,
  idempotencyKey: string,
  acknowledgeWarnings = false,
): Promise<ApplicationActionResult> {
  return reviewShiftApplication(shiftId, applicationId, "accepted", idempotencyKey, acknowledgeWarnings);
}

export async function rejectShiftApplication(
  shiftId: string,
  applicationId: string,
  idempotencyKey: string,
): Promise<ApplicationActionResult> {
  return reviewShiftApplication(shiftId, applicationId, "rejected", idempotencyKey, false);
}

// Review goes through the review_shift_application command, which locks
// Shift then Worker then Application, allows only applied -> accepted/rejected,
// blocks accept for unavailable Shift states and inactive Workers, returns
// overlap warnings (C-02) and is idempotent per actor + key. Direct UPDATE on
// shift_applications is closed by the same migration.
async function reviewShiftApplication(
  shiftId: string,
  applicationId: string,
  decision: "accepted" | "rejected",
  idempotencyKey: string,
  acknowledgeWarnings: boolean,
): Promise<ApplicationActionResult> {
  if (
    !uuidSchema.safeParse(shiftId).success ||
    !uuidSchema.safeParse(applicationId).success ||
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
    const { data, error } = await supabase.rpc("review_shift_application", {
      p_shift_id: shiftId,
      p_application_id: applicationId,
      p_decision: decision,
      p_idempotency_key: idempotencyKey,
      p_acknowledge_warnings: acknowledgeWarnings,
    });
    if (error) throw error;

    const result = data as ReviewRpcResult;
    const outcome = result?.outcome ?? "unavailable";
    const warnings = Array.isArray(result?.warnings) ? result.warnings : [];

    if (!result?.ok || outcome !== decision) {
      return {
        ok: false,
        message: outcomeMessages[outcome] ?? message,
        retryable: false,
        confirmationRequired: outcome === "confirmation_required",
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    }

    revalidatePath("/admin");
    revalidatePath("/admin/shifts");
    revalidatePath(`/admin/shifts/${shiftId}`);
    return { ok: true, warnings: warnings.length > 0 ? warnings : undefined };
  } catch (error: unknown) {
    console.error("Failed to review shift application", error);
    return { ok: false, message: unknownMessage, retryable: true };
  }
}
