import {
  normalizeRecruitmentUuid,
  recruitmentInstantSchema,
  recruitmentTimeZone,
  recruitmentUuidSchema,
} from "./project-recruitment-schema";
import type {
  RecruitmentSelection,
  RecruitmentSelectionError,
  RecruitmentSelectionResult,
  RecruitmentShiftDTO,
  RecruitmentShiftReference,
} from "./project-recruitment-types";

export const MAX_RECRUITMENT_SELECTION = 10;

function normalizeReference(shift: RecruitmentShiftReference): RecruitmentShiftReference {
  return {
    projectId: normalizeRecruitmentUuid(shift.projectId),
    shiftId: normalizeRecruitmentUuid(shift.shiftId),
  };
}

function selectionError(selection: RecruitmentSelection): RecruitmentSelectionError | null {
  if (selection.some((shift) => !recruitmentUuidSchema.safeParse(shift.projectId).success
    || !recruitmentUuidSchema.safeParse(shift.shiftId).success)) return "invalid_identity";
  const normalized = selection.map(normalizeReference);
  if (new Set(normalized.map((shift) => shift.projectId)).size > 1) return "mixed_projects";
  if (new Set(normalized.map((shift) => shift.shiftId)).size !== selection.length) return "duplicate_shift";
  if (selection.length > MAX_RECRUITMENT_SELECTION) return "limit_exceeded";
  return null;
}

/** Selection is not eligibility. No overlap, application-state or capacity inference. */
export function addRecruitmentShift(
  selection: RecruitmentSelection,
  shift: RecruitmentShiftReference,
): RecruitmentSelectionResult {
  const next = [...selection, shift].map(normalizeReference);
  const reason = selectionError(next);
  return reason ? { ok: false, reason, selection } : { ok: true, selection: next };
}

export function removeRecruitmentShift(
  selection: RecruitmentSelection,
  shift: RecruitmentShiftReference,
): RecruitmentSelection {
  const target = normalizeReference(shift);
  return selection.map(normalizeReference).filter(
    (item) => item.projectId !== target.projectId || item.shiftId !== target.shiftId,
  );
}

export function canSubmitRecruitmentSelection(selection: RecruitmentSelection): boolean {
  return selection.length >= 1 && selectionError(selection) === null;
}

/** null preserves unavailable date information; dates are never guessed. */
export function getRecruitmentStartDate(startsAt: string): string | null {
  const parsed = recruitmentInstantSchema.safeParse(startsAt);
  if (!parsed.success) return null;
  const instant = new Date(parsed.data);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: recruitmentTimeZone, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(instant);
  return `${parts.find((part) => part.type === "year")?.value}-${parts.find((part) => part.type === "month")?.value}-${parts.find((part) => part.type === "day")?.value}`;
}

/** Exact start-day matching only; the eventual date-picker mode is not fixed. */
export function filterRecruitmentShiftsByStartDate(
  shifts: readonly RecruitmentShiftDTO[],
  date: string | null,
): RecruitmentShiftDTO[] {
  return shifts.filter((shift) => date === null || getRecruitmentStartDate(shift.startsAt) === date);
}

/** Preview-only preflight. Backend must atomically revalidate the whole batch.
 * C-01/C-04: active-state mapping is supplied, never derived here.
 */
export function checkRecruitmentBatchApplications(
  shifts: readonly Pick<RecruitmentShiftDTO, "hasActiveApplication">[],
): { status: "rejected"; newApplicationCount: 0 } | { status: "unknown" } | { status: "no_known_active_application" } {
  if (shifts.some((shift) => shift.hasActiveApplication === true)) {
    return { status: "rejected", newApplicationCount: 0 };
  }
  if (shifts.length === 0 || shifts.some((shift) => shift.hasActiveApplication === null)) return { status: "unknown" };
  return { status: "no_known_active_application" };
}
