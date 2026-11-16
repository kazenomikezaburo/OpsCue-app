import { z } from "zod";
import { uuidSchema } from "@/lib/utils/uuid-schema";

// v1.0-RC: UI proposal only. These schemas do not describe an approved RPC.
export const recruitmentContractVersion = "v1.0-RC" as const;
export const recruitmentTimeZone = "Asia/Tokyo" as const;

export function normalizeRecruitmentUuid(value: string): string {
  return value.toLowerCase();
}

// Input and output stay string; parsed UUID values are always lowercase.
export const recruitmentUuidSchema = uuidSchema.transform(normalizeRecruitmentUuid);

const shiftIdsSchema = z.array(recruitmentUuidSchema).min(1).max(10).refine(
  (ids) => new Set(ids).size === ids.length,
  "シフトを重複して指定できません。",
);
// Zod validates calendar dates (including leap years) before Date can normalize
// them. Share the exact accepted format with the JST date conversion helper.
export const recruitmentInstantSchema = z.iso.datetime({ offset: true }).refine(
  (value) => Number.isFinite(Date.parse(value)),
  "有効な日時を指定してください。",
);
const nullableText = z.string().nullable();

export const recruitmentShiftSchema = z.object({
  projectId: recruitmentUuidSchema,
  shiftId: recruitmentUuidSchema,
  jobName: z.string(),
  startsAt: recruitmentInstantSchema,
  endsAt: recruitmentInstantSchema,
  workplaceName: nullableText,
  hourlyWage: z.number().nonnegative().nullable(),
  remainingCapacity: z.number().int().nonnegative().nullable(),
  applicationDeadline: recruitmentInstantSchema.nullable(),
  // C-04: independent facts; null means unknown, never false or zero.
  applicationAvailability: z.enum(["allowed", "unavailable"]).nullable(),
  applicationState: z.enum(["none", "applied", "accepted", "rejected", "withdrawn"]).nullable(),
  // C-01/C-04: supplied by the future Backend adapter, not inferred from state.
  hasActiveApplication: z.boolean().nullable(),
  safeReasonText: nullableText,
}).strict().refine(
  (shift) => Date.parse(shift.endsAt) > Date.parse(shift.startsAt),
  "勤務終了は勤務開始より後にしてください。",
);

export const projectRecruitmentSummarySchema = z.object({
  projectId: recruitmentUuidSchema,
  projectName: z.string(),
  description: nullableText,
}).strict();

export const projectRecruitmentListSchema = z.object({
  contractVersion: z.literal(recruitmentContractVersion),
  source: z.enum(["synthetic", "backend-proposal"]),
  items: z.array(projectRecruitmentSummarySchema),
  // C-05: no cursor, sorting or aggregate contract is fixed here.
  paginationContract: z.literal("unconfirmed"),
}).strict().refine(
  (list) => new Set(list.items.map((item) => item.projectId)).size === list.items.length,
  "案件IDが重複しています。",
);

export const projectRecruitmentDetailSchema = z.object({
  contractVersion: z.literal(recruitmentContractVersion),
  source: z.enum(["synthetic", "backend-proposal"]),
  project: projectRecruitmentSummarySchema,
  shifts: z.array(recruitmentShiftSchema),
}).strict().refine(
  (detail) => detail.shifts.every((shift) => shift.projectId === detail.project.projectId)
    && new Set(detail.shifts.map((shift) => shift.shiftId)).size === detail.shifts.length,
  "別案件または重複するシフトを含められません。",
);

export const recruitmentBatchRequestSchema = z.object({
  contractVersion: z.literal(recruitmentContractVersion),
  projectId: recruitmentUuidSchema,
  batchKey: recruitmentUuidSchema,
  shiftIds: shiftIdsSchema,
}).strict();

// C-03: no receipt ID, RPC name, retention or query permissions are invented.
// A success covers the entire request; no per-shift partial result exists.
const batchContext = { request: recruitmentBatchRequestSchema };
export const recruitmentBatchResultSchema = z.discriminatedUnion("status", [
  z.object({ ...batchContext, status: z.literal("pending") }).strict(),
  z.object({ ...batchContext, status: z.literal("success"), meaning: z.literal("application_received") }).strict(),
  z.object({ ...batchContext, status: z.literal("rejected"), newApplicationCount: z.literal(0), safeReasonText: nullableText }).strict(),
  z.object({ ...batchContext, status: z.literal("unknown"), recovery: z.literal("retain_same_batch_key") }).strict(),
]);
