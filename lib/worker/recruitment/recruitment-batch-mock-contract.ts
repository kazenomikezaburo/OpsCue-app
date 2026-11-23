import { z } from "zod";
import { recruitmentUuidSchema } from "./project-recruitment-schema";

/** Task B design ch. 3/11 + Frontend acceptance cases (2026-11-19).
 * Mock validation boundary only: not a complete/final RPC wire schema.
 * No RPC binding, authorization, retention, or transaction guarantee.
 */
const ids = z.array(recruitmentUuidSchema).min(1).max(10).refine(
  (values) => new Set(values).size === values.length,
);
const sortedIds = ids.refine((values) => values.every((id, i) => i === 0 || values[i - 1]! < id));
export const recruitmentBatchMockRequestSchema = z.object({
  projectId: recruitmentUuidSchema,
  batchKey: recruitmentUuidSchema,
  shiftIds: ids.transform((values) => [...values].sort()),
}).strict();

export const recruitmentBatchRejectionReasonSchema = z.enum([
  "not_eligible", "deadline_passed", "capacity_full", "not_recruiting",
  "already_assigned", "application_accepted", "application_rejected", "application_withdrawn",
]);
const appliedSchema = z.object({
  ok: z.literal(true), outcome: z.literal("applied"),
  newApplicationCount: z.number().int().min(0).max(10),
  alreadyAppliedCount: z.number().int().min(0).max(10),
  appliedShiftIds: sortedIds,
  replayed: z.boolean(),
});
const rejectedSchema = z.object({
  ok: z.literal(false), outcome: z.literal("batch_rejected"), newApplicationCount: z.literal(0),
  rejections: z.array(z.object({
    shiftId: recruitmentUuidSchema, reason: recruitmentBatchRejectionReasonSchema,
  })).min(1).max(10).refine((values) => values.every((value, i) => i === 0 || values[i - 1]!.shiftId < value.shiftId)),
  // Initial rejection's replayed requiredness is unspecified. Never default it.
  replayed: z.boolean().optional(),
});
const completedResultSchema = z.union([appliedSchema, rejectedSchema]);
const receiptRequestSchema = z.object({ projectId: recruitmentUuidSchema, shiftIds: ids });
const receiptSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("not_found") }),
  z.object({ status: z.literal("completed"), request: receiptRequestSchema, result: z.unknown() }),
]);
const conflictIndicatorSchema = z.object({ outcome: z.literal("IDEMPOTENCY_CONFLICT") });
const receiptConflictIndicatorSchema = z.object({ result: conflictIndicatorSchema });
const conflictSchema = z.object({
  ok: z.literal(false), outcome: z.literal("IDEMPOTENCY_CONFLICT"), replayed: z.literal(false),
});
const unavailableSchema = z.object({ ok: z.literal(false), outcome: z.literal("unavailable") });

export type RecruitmentBatchMockRequest = z.infer<typeof recruitmentBatchMockRequestSchema>;
export type RecruitmentBatchMockResult = z.infer<typeof completedResultSchema>;
export type RecruitmentBatchRejectionReason = z.infer<typeof recruitmentBatchRejectionReasonSchema>;
export type RecruitmentBatchMockIssue =
  | "invalid_request" | "invalid_response" | "receipt_mismatch" | "not_found"
  | "transport_unknown" | "idempotency_conflict" | "invalid_conflict_response" | "unavailable_unconfirmed";
export type RecruitmentBatchMockObservation =
  | { status: "completed"; result: RecruitmentBatchMockResult }
  | { status: "unresolved"; issue: RecruitmentBatchMockIssue };

function sameIds(left: readonly string[], right: readonly string[]): boolean {
  const expected = [...right].sort();
  return left.length === right.length && [...left].sort().every((id, i) => id === expected[i]);
}
function checkResult(request: RecruitmentBatchMockRequest, raw: unknown): RecruitmentBatchMockObservation {
  // A conflict inside completed.result is malformed, but must still latch resend prevention.
  if (conflictIndicatorSchema.safeParse(raw).success) return { status: "unresolved", issue: "invalid_conflict_response" };
  const parsed = completedResultSchema.safeParse(raw);
  if (!parsed.success) return { status: "unresolved", issue: "invalid_response" };
  const result = parsed.data;
  if (result.outcome === "applied") {
    if (result.newApplicationCount + result.alreadyAppliedCount !== request.shiftIds.length
      || !sameIds(result.appliedShiftIds, request.shiftIds)) {
      return { status: "unresolved", issue: "invalid_response" };
    }
  } else if (result.rejections.some(({ shiftId }) => !request.shiftIds.includes(shiftId))) {
    return { status: "unresolved", issue: "invalid_response" };
  }
  return { status: "completed", result };
}

/** Apply responses are associated with the exact retained request by the mock session. */
export function inspectRecruitmentBatchMockReply(request: RecruitmentBatchMockRequest, raw: unknown): RecruitmentBatchMockObservation {
  // Safety indication is independent from wire validity: malformed conflicts never permit retry.
  if (conflictIndicatorSchema.safeParse(raw).success) {
    return { status: "unresolved", issue: conflictSchema.safeParse(raw).success ? "idempotency_conflict" : "invalid_conflict_response" };
  }
  if (unavailableSchema.safeParse(raw).success) return { status: "unresolved", issue: "unavailable_unconfirmed" };
  return checkResult(request, raw);
}

/** lookup(batchKey) supplies key context; the receipt does NOT invent a batchKey field. */
export function inspectRecruitmentBatchMockReceipt(request: RecruitmentBatchMockRequest, raw: unknown): RecruitmentBatchMockObservation {
  // Even an invalid/mismatched receipt envelope must not hide a conflict in its result.
  if (conflictIndicatorSchema.safeParse(raw).success || receiptConflictIndicatorSchema.safeParse(raw).success) {
    return { status: "unresolved", issue: "invalid_conflict_response" };
  }
  const parsed = receiptSchema.safeParse(raw);
  if (!parsed.success) return { status: "unresolved", issue: "invalid_response" };
  if (parsed.data.status === "not_found") return { status: "unresolved", issue: "not_found" };
  if (parsed.data.request.projectId !== request.projectId || !sameIds(parsed.data.request.shiftIds, request.shiftIds)) {
    return { status: "unresolved", issue: "receipt_mismatch" };
  }
  return checkResult(request, parsed.data.result);
}
