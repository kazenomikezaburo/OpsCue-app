// Phase 4 / Task A: Worker project-level recruitment read contract.
// Pure module (no server-only import) so the DTO shapes and the response
// normalisers can be unit-tested without a database.
//
// Server RPCs (read-only, Worker scope, SECURITY DEFINER):
//   public.get_own_recruitment_projects(p_limit, p_offset, p_date)
//   public.get_own_recruitment_project_shifts(p_project_id, p_limit, p_offset, p_date)
// p_date (optional, JST calendar day, "YYYY-MM-DD"): only Shifts that START on that JST day. With p_date set, every list
// aggregate is computed over the matching Shifts only (see supabase/migrations/20261117000000_*.sql).
import type { RecruitmentShift } from "./get-worker-recruitment";

export const PROJECT_PAGE_SIZE = 12; // server clamps limit to 1..48
export const PROJECT_SHIFT_PAGE_SIZE = 24; // server clamps limit to 1..48

/** One visible recruiting Project. Optional keys are absent (never null) when unknown. */
export type RecruitmentProjectSummary = {
  projectId: string;
  projectName: string;
  /** Visible Shifts of this Project for the Worker (any application state). */
  shiftCount: number;
  /** Shifts the Worker has an applied or accepted Application for. */
  appliedCount: number;
  /**
   * Shifts in scope whose read-model state is available / available_with_warning. A read-model fact, NOT the apply command's
   * decision and NOT applicationAvailability. Absent when the server predates 20261117000000.
   */
  availableShiftCount?: number;
  firstStartsAt: string;
  lastEndsAt: string;
  /** Earliest application deadline that is still in the future; absent when all have passed. */
  nearestApplicationDeadline?: string;
  hourlyWageMin?: number;
  hourlyWageMax?: number;
};

export type RecruitmentProjectList = {
  ok: true;
  items: RecruitmentProjectSummary[];
  hasMore: boolean;
  /** All visible Projects across pages (within the date filter when one is applied). */
  totalProjects: number;
  /** Echo of the applied JST day; absent when no date filter was applied. */
  dateFilter?: string;
};

export type RecruitmentProjectShift = RecruitmentShift & { projectId: string };

export type RecruitmentProjectHeader = { projectId: string; projectName: string };

/** `project` is null when the Project is not visible to this Worker (see "Not visible" in the contract). */
export type RecruitmentProjectDetail =
  | { ok: true; project: RecruitmentProjectHeader | null; items: RecruitmentProjectShift[]; hasMore: boolean; dateFilter?: string }
  | { ok: false; outcome: "invalid_request"; project: null; items: []; hasMore: false };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (value: unknown): value is string => typeof value === "string" && UUID.test(value);

/** A real calendar day "YYYY-MM-DD" (interpreted as a JST day by the server). */
export function isJstDateString(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);

/** A response that does not match the contract is a retrieval failure, not an empty result. */
export class RecruitmentContractError extends Error {
  constructor(message: string) {
    super(`recruitment_contract_violation: ${message}`);
  }
}

function summary(raw: unknown): RecruitmentProjectSummary {
  if (!isRecord(raw)) throw new RecruitmentContractError("project item");
  const { projectId, projectName, shiftCount, appliedCount, firstStartsAt, lastEndsAt } = raw;
  if (!isUuid(projectId) || typeof projectName !== "string" || typeof shiftCount !== "number" || typeof appliedCount !== "number" || typeof firstStartsAt !== "string" || typeof lastEndsAt !== "string") {
    throw new RecruitmentContractError("project item fields");
  }
  const out: RecruitmentProjectSummary = { projectId, projectName, shiftCount, appliedCount, firstStartsAt, lastEndsAt };
  if (typeof raw.nearestApplicationDeadline === "string") out.nearestApplicationDeadline = raw.nearestApplicationDeadline;
  if (typeof raw.hourlyWageMin === "number") out.hourlyWageMin = raw.hourlyWageMin;
  if (typeof raw.hourlyWageMax === "number") out.hourlyWageMax = raw.hourlyWageMax;
  if (raw.availableShiftCount !== undefined) {
    if (typeof raw.availableShiftCount !== "number" || !Number.isInteger(raw.availableShiftCount) || raw.availableShiftCount < 0 || raw.availableShiftCount > shiftCount) {
      throw new RecruitmentContractError("availableShiftCount");
    }
    out.availableShiftCount = raw.availableShiftCount;
  }
  return out;
}

export function parseProjectList(data: unknown): RecruitmentProjectList {
  if (!isRecord(data) || data.ok !== true || !Array.isArray(data.items) || typeof data.hasMore !== "boolean" || typeof data.totalProjects !== "number") {
    throw new RecruitmentContractError("project list");
  }
  const out: RecruitmentProjectList = { ok: true, items: data.items.map(summary), hasMore: data.hasMore, totalProjects: data.totalProjects };
  if (data.dateFilter !== undefined) {
    if (!isJstDateString(data.dateFilter)) throw new RecruitmentContractError("dateFilter");
    out.dateFilter = data.dateFilter;
  }
  return out;
}

export function parseProjectDetail(data: unknown): RecruitmentProjectDetail {
  if (!isRecord(data) || typeof data.ok !== "boolean") throw new RecruitmentContractError("project detail");
  if (data.ok === false) {
    if (data.outcome !== "invalid_request") throw new RecruitmentContractError("project detail outcome");
    return { ok: false, outcome: "invalid_request", project: null, items: [], hasMore: false };
  }
  if (!Array.isArray(data.items) || typeof data.hasMore !== "boolean") throw new RecruitmentContractError("project detail items");
  let project: RecruitmentProjectHeader | null = null;
  if (data.project !== null && data.project !== undefined) {
    if (!isRecord(data.project) || !isUuid(data.project.projectId) || typeof data.project.projectName !== "string") throw new RecruitmentContractError("project header");
    project = { projectId: data.project.projectId, projectName: data.project.projectName };
  }
  const items = data.items.map((item) => {
    if (!isRecord(item) || !isUuid(item.shiftId) || !isUuid(item.projectId)) throw new RecruitmentContractError("shift item");
    if (project && item.projectId !== project.projectId) throw new RecruitmentContractError("shift item outside project");
    return item as unknown as RecruitmentProjectShift;
  });
  if (!project && items.length > 0) throw new RecruitmentContractError("items without project");
  const out: RecruitmentProjectDetail = { ok: true, project, items, hasMore: data.hasMore };
  if (data.dateFilter !== undefined) {
    if (!isJstDateString(data.dateFilter)) throw new RecruitmentContractError("dateFilter");
    out.dateFilter = data.dateFilter;
  }
  return out;
}
