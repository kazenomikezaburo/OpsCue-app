import {
  BACKEND_PROJECT_PAGE_SIZE, BACKEND_PROJECT_SHIFT_PAGE_SIZE,
  backendProjectDetailSchema, backendProjectListSchema,
  type BackendRecruitmentProjectSummary, type BackendRecruitmentProjectShift,
} from "./backend-project-recruitment-dto";
import {
  projectRecruitmentDetailSchema, recruitmentContractVersion, recruitmentUuidSchema,
} from "./project-recruitment-schema";
import type { RecruitmentProjectCardItem } from "./project-recruitment-reader";
import type { ProjectRecruitmentDetailDTO, RecruitmentShiftDTO } from "./project-recruitment-types";
import { getRecruitmentStartDate } from "./recruitment-selection";

/** Matches Task A's two reader signatures. Only mocks are supplied in this PR.
 * Future server reads must enter through backend-project-recruitment-reader.ts.
 * No date filter or write operation is part of this interface.
 */
export interface BackendProjectRecruitmentSource {
  getWorkerRecruitmentProjects(page: number): Promise<unknown>;
  getWorkerRecruitmentProjectShifts(projectId: string, page: number): Promise<unknown>;
  // Task A readers parse before returning and may throw RecruitmentContractError.
  // The future server binding supplies instanceof; never classify by message.
  isContractError(error: unknown): boolean;
}
type BackendProjectCard = RecruitmentProjectCardItem & { firstStartsAt: string; lastEndsAt: string };
export type BackendProjectListPage = {
  source: "backend-proposal"; items: BackendProjectCard[]; dates: [];
  page: number; hasMore: boolean; totalProjects: number;
};
export type BackendProjectDetailPage = { detail: ProjectRecruitmentDetailDTO; page: number; hasMore: boolean };
export type BackendReadError = { status: "error"; reason: "retrieval_failed" | "contract_violation" };
export type BackendPageResult<T> = { status: "ready"; data: T } | BackendReadError | { status: "invalid_request" };
export type BackendDetailResult = BackendPageResult<BackendProjectDetailPage> | { status: "not_found" };
export type PaginationIssue = "duplicate_id" | "out_of_order" | "page_sequence" | "total_changed" | "project_changed";
type PageMergeResult<T> = { status: "ready"; data: T } | { status: "error"; reason: "pagination_violation"; issue: PaginationIssue };
const contractError: BackendReadError = { status: "error", reason: "contract_violation" };
function sourceError(source: BackendProjectRecruitmentSource, error: unknown): BackendReadError {
  try { if (source.isContractError(error)) return contractError; }
  catch { /* A failed classifier must still redact the original diagnostic. */ }
  return { status: "error", reason: "retrieval_failed" };
}
const validPage = (page: number, size: number) => Number.isSafeInteger(page) && page >= 0 && Number.isSafeInteger(page * size);

type OrderKey = { id: string; startsAt: string };
function compare(a: OrderKey, b: OrderKey): number {
  return Date.parse(a.startsAt) - Date.parse(b.startsAt) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
}
function orderIssue(keys: OrderKey[]): "duplicate_id" | "out_of_order" | null {
  if (new Set(keys.map((key) => key.id)).size !== keys.length) return "duplicate_id";
  return keys.some((key, i) => i > 0 && compare(keys[i - 1]!, key) >= 0) ? "out_of_order" : null;
}
const projectKeys = (items: BackendProjectCard[]) => items.map((item) => ({ id: item.project.projectId, startsAt: item.firstStartsAt }));
const shiftKeys = (items: RecruitmentShiftDTO[]) => items.map((item) => ({ id: item.shiftId, startsAt: item.startsAt }));
const validPageLength = (length: number, hasMore: boolean, size: number) => !hasMore || length === size;

function projectCard(item: BackendRecruitmentProjectSummary): BackendProjectCard {
  return {
    project: { projectId: item.projectId, projectName: item.projectName, description: null },
    venueText: null,
    scheduleText: `${getRecruitmentStartDate(item.firstStartsAt)}〜${getRecruitmentStartDate(item.lastEndsAt)}`,
    publishedShiftCount: item.shiftCount, appliedShiftCount: item.appliedCount,
    applyAllowedShiftCount: null, hourlyWage: null,
    hourlyWageMin: item.hourlyWageMin ?? null, hourlyWageMax: item.hourlyWageMax ?? null,
    firstStartsAt: item.firstStartsAt, lastEndsAt: item.lastEndsAt,
    nearestApplicationDeadline: item.nearestApplicationDeadline ?? null,
  };
}
function shiftView(item: BackendRecruitmentProjectShift): RecruitmentShiftDTO {
  return {
    projectId: item.projectId, shiftId: item.shiftId, jobName: item.jobName,
    startsAt: item.startsAt, endsAt: item.endsAt, workplaceName: item.workplaceName,
    hourlyWage: item.hourlyWage ?? null, remainingCapacity: item.remainingCapacity,
    applicationDeadline: item.applicationDeadline, applicationState: item.applicationState ?? null,
    // Task A has no independent availability/active-application facts. Neither
    // state, remainingCapacity, applicationState nor reasons authorize a write.
    applicationAvailability: null, hasActiveApplication: null, safeReasonText: null,
  };
}

/** Pure, dependency-injected read adapter. Exceptions never expose raw diagnostics. */
export function createBackendProjectRecruitmentAdapter(source: BackendProjectRecruitmentSource) {
  return {
    async readListPage(page = 0): Promise<BackendPageResult<BackendProjectListPage>> {
      if (!validPage(page, BACKEND_PROJECT_PAGE_SIZE)) return { status: "invalid_request" };
      let raw: unknown;
      try { raw = await source.getWorkerRecruitmentProjects(page); }
      catch (error) { return sourceError(source, error); }
      const parsed = backendProjectListSchema.safeParse(raw);
      if (!parsed.success) return contractError;
      const data = parsed.data;
      const items = data.items.map(projectCard);
      if (orderIssue(projectKeys(items)) || data.totalProjects < items.length
        || !validPageLength(items.length, data.hasMore, BACKEND_PROJECT_PAGE_SIZE)) return contractError;
      return { status: "ready", data: { source: "backend-proposal", items, dates: [], page,
        hasMore: data.hasMore, totalProjects: data.totalProjects } };
    },
    async readDetailPage(projectId: string, page = 0): Promise<BackendDetailResult> {
      const id = recruitmentUuidSchema.safeParse(projectId);
      if (!id.success || !validPage(page, BACKEND_PROJECT_SHIFT_PAGE_SIZE)) return { status: "invalid_request" };
      let raw: unknown;
      try { raw = await source.getWorkerRecruitmentProjectShifts(id.data, page); }
      catch (error) { return sourceError(source, error); }
      const parsed = backendProjectDetailSchema.safeParse(raw);
      if (!parsed.success) return contractError;
      const data = parsed.data;
      if (!data.ok) return { status: "invalid_request" };
      if (data.project === null) return data.items.length === 0 && !data.hasMore ? { status: "not_found" } : contractError;
      if (data.project.projectId !== id.data || data.items.some((item) => item.projectId !== id.data)
        || !validPageLength(data.items.length, data.hasMore, BACKEND_PROJECT_SHIFT_PAGE_SIZE)) return contractError;
      const detail = projectRecruitmentDetailSchema.safeParse({
        contractVersion: recruitmentContractVersion, source: "backend-proposal",
        project: { ...data.project, description: null }, shifts: data.items.map(shiftView),
      });
      if (!detail.success || orderIssue(shiftKeys(detail.data.shifts))) return contractError;
      return { status: "ready", data: { detail: detail.data, page, hasMore: data.hasMore } };
    },
  };
}

/** Offset drift is unsafe: reject the whole append, leaving the previous page
 * untouched. Do not silently deduplicate, re-sort or infer missing records.
 */
export function mergeBackendProjectPages(previous: BackendProjectListPage, next: BackendProjectListPage): PageMergeResult<BackendProjectListPage> {
  let issue: PaginationIssue | null = null;
  if (!previous.hasMore || next.page !== previous.page + 1) issue = "page_sequence";
  else if (next.totalProjects !== previous.totalProjects) issue = "total_changed";
  const items = [...previous.items, ...next.items];
  issue ??= orderIssue(projectKeys(items));
  if (issue) return { status: "error", reason: "pagination_violation", issue };
  if (items.length > next.totalProjects) return { status: "error", reason: "pagination_violation", issue: "total_changed" };
  return { status: "ready", data: { ...next, items } };
}
export function mergeBackendProjectShiftPages(previous: BackendProjectDetailPage, next: BackendProjectDetailPage): PageMergeResult<BackendProjectDetailPage> {
  let issue: PaginationIssue | null = null;
  if (!previous.hasMore || next.page !== previous.page + 1) issue = "page_sequence";
  else if (previous.detail.project.projectId !== next.detail.project.projectId) issue = "project_changed";
  const shifts = [...previous.detail.shifts, ...next.detail.shifts];
  issue ??= orderIssue(shiftKeys(shifts));
  if (issue) return { status: "error", reason: "pagination_violation", issue };
  return { status: "ready", data: { ...next, detail: { ...next.detail, shifts } } };
}
