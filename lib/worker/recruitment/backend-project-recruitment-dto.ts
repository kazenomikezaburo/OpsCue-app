import { z } from "zod";
import { recruitmentInstantSchema as instant, recruitmentUuidSchema as uuid } from "./project-recruitment-schema";

/** Read-only snapshot of PR #20 at 43880abafbb9403339ab418f2cc78a8a9600817e.
 * Source: project-recruitment-contract.ts, RecruitmentShift and Task A SQL.
 * SQL strips null keys (including nested eligibility keys) from shift items.
 * No Backend implementation, RPC client or migration is imported here.
 */
export const BACKEND_PROJECT_PAGE_SIZE = 12;
export const BACKEND_PROJECT_SHIFT_PAGE_SIZE = 24;
const count = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const money = z.number().nonnegative();
const nullableText = z.string().nullish();

const summary = z.object({
  projectId: uuid,
  projectName: z.string(),
  shiftCount: count,
  appliedCount: count,
  firstStartsAt: instant,
  lastEndsAt: instant,
  nearestApplicationDeadline: instant.optional(),
  hourlyWageMin: money.optional(),
  hourlyWageMax: money.optional(),
}).refine((item) => item.appliedCount <= item.shiftCount
  && Date.parse(item.lastEndsAt) > Date.parse(item.firstStartsAt)
  && (item.hourlyWageMin === undefined || item.hourlyWageMax === undefined || item.hourlyWageMin <= item.hourlyWageMax));

export const backendProjectListSchema = z.object({
  ok: z.literal(true), items: z.array(summary).max(BACKEND_PROJECT_PAGE_SIZE),
  hasMore: z.boolean(), totalProjects: count,
});
const header = z.object({ projectId: uuid, projectName: z.string() });
const shift = z.object({
  projectId: uuid, shiftId: uuid, projectName: z.string(), jobName: z.string(),
  startsAt: instant, endsAt: instant, applicationDeadline: instant,
  workplaceName: z.string(), workplaceAddress: z.string(),
  label: nullableText, meetingAt: instant.nullish(), accessNote: nullableText,
  meetingNote: nullableText, description: nullableText, clothingNote: nullableText,
  belongingsNote: nullableText, mealNotes: nullableText, recruitmentNotes: nullableText,
  manualUrl: nullableText, mapUrl: nullableText, requirementsText: nullableText,
  hourlyWage: money.nullish(), transportationFeeCap: z.number().nullish(),
  transportType: z.string(), transportAmount: z.number().nullish(), transportMaxAmount: z.number().nullish(),
  requirements: z.array(z.object({ kind: z.enum(["skill", "qualification"]), name: z.string() })),
  remainingCapacity: count,
  applicationState: z.enum(["applied", "accepted", "rejected", "withdrawn"]).nullish(),
  state: z.enum(["available", "available_with_warning", "not_eligible", "applied",
    "accepted_waiting_assignment", "rejected", "withdrawn", "capacity_full", "deadline_passed"]),
  eligibility: z.object({ availabilityState: nullableText, safeReasons: z.array(z.string()) }),
}).refine((item) => Date.parse(item.endsAt) > Date.parse(item.startsAt));

export const backendProjectDetailSchema = z.discriminatedUnion("ok", [
  z.object({ ok: z.literal(true), project: header.nullable(),
    items: z.array(shift).max(BACKEND_PROJECT_SHIFT_PAGE_SIZE), hasMore: z.boolean() }),
  z.object({ ok: z.literal(false), outcome: z.literal("invalid_request"),
    project: z.null(), items: z.tuple([]), hasMore: z.literal(false) }),
]);

export type BackendRecruitmentProjectSummary = z.infer<typeof summary>;
export type BackendRecruitmentProjectShift = z.infer<typeof shift>;
