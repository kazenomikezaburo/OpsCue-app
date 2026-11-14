import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  createBackendProjectRecruitmentAdapter, mergeBackendProjectPages, mergeBackendProjectShiftPages,
  type BackendPageResult, type BackendProjectRecruitmentSource,
} from "../../lib/worker/recruitment/backend-project-recruitment-adapter";
import {
  BACKEND_PROJECT_PAGE_SIZE, BACKEND_PROJECT_SHIFT_PAGE_SIZE,
  type BackendRecruitmentProjectShift, type BackendRecruitmentProjectSummary,
} from "../../lib/worker/recruitment/backend-project-recruitment-dto";
import { formatProjectHourlyWage, readProjectRecruitmentList } from "../../lib/worker/recruitment/project-recruitment-reader";
import { RecruitmentProjectCard } from "../../components/worker/recruitment/recruitment-project-card";
import { ProjectRecruitmentDetail } from "../../components/worker/recruitment/project-recruitment-detail";
import { getRecruitmentShiftHoldReason } from "../../components/worker/recruitment/recruitment-shift-row";

// Full wire-shaped mocks from Task A's DTO + jsonb_strip_nulls projection.
// These are synthetic identifiers and values, with no DB/Auth dependencies.
const uuid = (prefix: string, n: number) => `${prefix}-0000-0000-0000-${String(n).padStart(12, "0")}`;
const P1 = uuid("b1000000", 1), P2 = uuid("b1000000", 2);
const summary: BackendRecruitmentProjectSummary = {
  projectId: P1, projectName: "同名案件", shiftCount: 100, appliedCount: 7,
  firstStartsAt: "2026-12-01T15:30:00+00:00", lastEndsAt: "2026-12-03T08:00:00Z",
  hourlyWageMin: 1200, hourlyWageMax: 1800,
};
const shift: BackendRecruitmentProjectShift = {
  projectId: P1, shiftId: uuid("b2000000", 1), projectName: "同名案件", jobName: "受付",
  startsAt: "2026-12-01T15:30:00Z", endsAt: "2026-12-01T23:30:00Z",
  applicationDeadline: "2026-11-30T00:00:00Z", workplaceName: "第一会場", workplaceAddress: "合成住所",
  transportType: "none", remainingCapacity: 3, state: "available",
  requirements: [], eligibility: { safeReasons: [] },
};
const list = (items: unknown[] = [summary], hasMore = false, totalProjects = items.length) => ({ ok: true, items, hasMore, totalProjects });
const detail = (items: unknown[] = [shift], hasMore = false, project: unknown = { projectId: P1, projectName: "同名案件" }) => ({ ok: true, project, items, hasMore });
class MockBackendContractError extends Error {}
const source = (listData: unknown = list(), detailData: unknown = detail()): BackendProjectRecruitmentSource => ({
  isContractError(error) { return error instanceof MockBackendContractError; },
  async getWorkerRecruitmentProjects() { return listData; },
  async getWorkerRecruitmentProjectShifts() { return detailData; },
});
const adapter = (listData: unknown = list(), detailData: unknown = detail()) => createBackendProjectRecruitmentAdapter(source(listData, detailData));
function ready<T>(result: BackendPageResult<T> | { status: "not_found" }): T {
  assert.equal(result.status, "ready");
  if (result.status !== "ready") throw new Error("expected ready");
  return result.data;
}
const projects = (start: number, length: number) => Array.from({ length }, (_, i) => ({ ...summary, projectId: uuid("b1000000", start + i) }));
const shifts = (start: number, length: number) => Array.from({ length }, (_, i) => ({ ...shift, shiftId: uuid("b2000000", start + i) }));
const contractError = { status: "error", reason: "contract_violation" };
const noop = () => {};

test("same names keep separate project IDs and map server aggregates without guessing", async () => {
  const data = ready(await adapter(list([summary, { ...summary, projectId: P2 }], false, 200)).readListPage());
  assert.equal(data.items.length, 2);
  assert.equal(data.items[0]!.project.projectName, data.items[1]!.project.projectName);
  assert.notEqual(data.items[0]!.project.projectId, data.items[1]!.project.projectId);
  const card = data.items[0]!;
  assert.deepEqual(card.project, { projectId: P1, projectName: "同名案件", description: null });
  assert.equal(card.publishedShiftCount, 100);
  assert.equal(card.appliedShiftCount, 7);
  assert.equal(card.applyAllowedShiftCount, null);
  assert.equal(card.firstStartsAt, summary.firstStartsAt);
  assert.equal(card.lastEndsAt, summary.lastEndsAt);
  assert.equal(card.scheduleText, "2026-12-02〜2026-12-03");
  assert.equal(card.venueText, null);
  assert.equal(card.hourlyWage, null);
  assert.equal(data.totalProjects, 200);
  assert.equal(data.hasMore, false); // never recomputed from total/loaded count
  assert.deepEqual(data.dates, []); // no fabricated filter/date candidates
});

test("list cards accept the projected view and display a real wage range and applied count", async () => {
  const data = ready(await adapter().readListPage());
  const view = { source: data.source, items: data.items, dates: data.dates };
  const read = await readProjectRecruitmentList({ async readList() { return view; }, async readDetail() { return null; } }, null);
  assert.equal(read.status, "ready");
  const html = renderToStaticMarkup(createElement(RecruitmentProjectCard, { item: data.items[0]!, source: data.source, onOpenDetail: noop }));
  assert.match(html, /時給 1,200〜1,800円/);
  assert.match(html, /応募済み/);
  assert.match(html, /7件/);
  assert.match(html, /応募可能/);
  assert.match(html, /確認中/);
});

test("optional summary fields become null, preserving unknown and a genuine zero wage", async () => {
  const { hourlyWageMin: _min, hourlyWageMax: _max, ...withoutWage } = summary;
  void _min; void _max;
  const card = ready(await adapter(list([withoutWage])).readListPage()).items[0]!;
  assert.equal(card.hourlyWageMin, null);
  assert.equal(card.hourlyWageMax, null);
  assert.equal(card.nearestApplicationDeadline, null);
  assert.equal(formatProjectHourlyWage(card), "時給は確認中");
  assert.equal(formatProjectHourlyWage({ ...card, hourlyWageMin: 0, hourlyWageMax: 0 }), "時給 0円");
  assert.equal(formatProjectHourlyWage({ ...card, hourlyWageMin: 1200 }), "時給 1,200円〜（上限確認中）");
  assert.equal(formatProjectHourlyWage({ ...card, hourlyWageMax: 1800 }), "時給 上限1,800円（下限確認中）");
  const withDeadline = ready(await adapter(list([{ ...summary, nearestApplicationDeadline: shift.applicationDeadline }])).readListPage());
  assert.equal(withDeadline.items[0]!.nearestApplicationDeadline, shift.applicationDeadline);
});

test("detail maps only belonging shifts, their own venues and missing/null SQL fields", async () => {
  const data = ready(await adapter(list(), detail([shift, { ...shift, shiftId: uuid("b2000000", 2), workplaceName: "第二会場", hourlyWage: null, applicationState: "applied" }])).readDetailPage(P1));
  assert.deepEqual(data.detail.project, { projectId: P1, projectName: "同名案件", description: null });
  assert.deepEqual(data.detail.shifts[0], {
    projectId: P1, shiftId: shift.shiftId, jobName: shift.jobName,
    startsAt: shift.startsAt, endsAt: shift.endsAt, applicationDeadline: shift.applicationDeadline,
    workplaceName: "第一会場", hourlyWage: null, remainingCapacity: 3,
    applicationAvailability: null, applicationState: null, hasActiveApplication: null, safeReasonText: null,
  });
  assert.equal(data.detail.shifts[1]!.workplaceName, "第二会場");
  assert.equal(data.detail.shifts[1]!.applicationState, "applied");
  assert.equal(data.detail.shifts[1]!.hasActiveApplication, null);
  assert.equal(data.detail.source, "backend-proposal");
});

test("empty list, header with zero shifts, unavailable and invalid_request stay distinct", async () => {
  assert.deepEqual(ready(await adapter(list([])).readListPage()).items, []);
  const empty = ready(await adapter(list(), detail([])).readDetailPage(P1));
  assert.equal(empty.detail.project.projectId, P1);
  assert.deepEqual(empty.detail.shifts, []);
  assert.deepEqual(await adapter(list(), detail([], false, null)).readDetailPage(P1), { status: "not_found" });
  assert.deepEqual(await adapter(list(), { ok: false, outcome: "invalid_request", project: null, items: [], hasMore: false }).readDetailPage(P1), { status: "invalid_request" });
});

test("invalid page/id never invokes the source and UUID case is normalized", async () => {
  const calls: unknown[][] = [];
  const read = createBackendProjectRecruitmentAdapter({
    ...source(),
    async getWorkerRecruitmentProjects(page) { calls.push([page]); return list(); },
    async getWorkerRecruitmentProjectShifts(id, page) { calls.push([id, page]); return detail(); },
  });
  for (const page of [-1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER]) {
    assert.deepEqual(await read.readListPage(page), { status: "invalid_request" });
    assert.deepEqual(await read.readDetailPage(P1, page), { status: "invalid_request" });
  }
  for (const id of ["", "同名案件", "not-a-uuid"]) assert.deepEqual(await read.readDetailPage(id), { status: "invalid_request" });
  assert.deepEqual(calls, []);
  ready(await read.readDetailPage(P1.toUpperCase(), 2));
  ready(await read.readListPage(3));
  assert.deepEqual(calls, [[P1, 2], [3]]);
});

test("DB/transport failures yield safe errors, never empty/unavailable or diagnostic text", async () => {
  const read = createBackendProjectRecruitmentAdapter({
    ...source(),
    async getWorkerRecruitmentProjects() { throw new Error("private SQL diagnostic"); },
    async getWorkerRecruitmentProjectShifts() { throw { message: "private credential diagnostic" }; },
  });
  const expected = { status: "error", reason: "retrieval_failed" };
  assert.deepEqual(await read.readListPage(), expected);
  assert.deepEqual(await read.readDetailPage(P1), expected);
  assert.equal((await adapter().readListPage()).status, "ready");
});

const malformedSummaries: [string, Record<string, unknown>][] = [
  ["invalid identity", { projectId: "name" }], ["negative count", { shiftCount: -1 }],
  ["fractional count", { appliedCount: 0.1 }], ["infinite count", { shiftCount: Infinity }],
  ["too many applied", { appliedCount: 101 }], ["invalid calendar date", { firstStartsAt: "2026-02-30T00:00:00Z" }],
  ["reversed time", { lastEndsAt: summary.firstStartsAt }], ["reversed wage", { hourlyWageMax: 1000 }],
  ["negative wage", { hourlyWageMin: -1 }], ["null optional summary", { hourlyWageMin: null }],
  ["malformed optional deadline", { nearestApplicationDeadline: "tomorrow" }],
];
for (const [name, patch] of malformedSummaries) test(`reject malformed summary: ${name}`, async () => {
  assert.deepEqual(await adapter(list([{ ...summary, ...patch }])).readListPage(), contractError);
});
for (const [name, raw] of [
  ["missing envelope", null], ["missing total", { ok: true, items: [], hasMore: false }],
  ["nonboolean hasMore", { ...list(), hasMore: "false" }], ["negative total", { ...list(), totalProjects: -1 }],
  ["wrong ok", { ...list(), ok: false }], ["page overflow", list(projects(1, 13))],
  ["nonprogressing page", list([], true, 20)], ["short nonfinal page", list([summary], true, 20)],
  ["duplicate IDs", list([summary, summary])],
  ["wrong order", list([{ ...summary, projectId: P2 }, summary])],
  ["timestamp order", list([{ ...summary, firstStartsAt: "2026-12-02T00:00:00Z" }, { ...summary, projectId: P2 }])],
] as const) test(`reject malformed list: ${name}`, async () => {
  assert.deepEqual(await adapter(raw).readListPage(), contractError);
});

for (const [name, raw] of [
  ["missing header", { ok: true, items: [], hasMore: false }],
  ["missing shift fields", detail([{ projectId: P1, shiftId: shift.shiftId }])],
  ["foreign project", detail([{ ...shift, projectId: P2 }])],
  ["wrong header", detail([], false, { projectId: P2, projectName: "同名案件" })],
  ["invalid time", detail([{ ...shift, startsAt: "yesterday" }])],
  ["invalid capacity", detail([{ ...shift, remainingCapacity: -1 }])],
  ["invalid state", detail([{ ...shift, state: "allowed" }])],
  ["invalid application state", detail([{ ...shift, applicationState: "none" }])],
  ["malformed optional wage", detail([{ ...shift, hourlyWage: "1200" }])],
  ["unavailable with items", detail([shift], false, null)],
  ["unavailable with more", detail([], true, null)],
  ["malformed failure", { ok: false, outcome: "invalid_request" }],
  ["unknown failure", { ok: false, outcome: "db_failure", project: null, items: [], hasMore: false }],
  ["duplicate shifts", detail([shift, shift])],
  ["wrong order", detail(shifts(1, 2).reverse())],
  ["page overflow", detail(shifts(1, 25))], ["nonprogressing page", detail([], true)],
] as const) test(`reject malformed detail: ${name}`, async () => {
  assert.deepEqual(await adapter(list(), raw).readDetailPage(P1), contractError);
});

test("12-project offset pages combine sequentially and retain backend hasMore/total", async () => {
  assert.equal(BACKEND_PROJECT_PAGE_SIZE, 12);
  const calls: number[] = [];
  const read = createBackendProjectRecruitmentAdapter({ ...source(), async getWorkerRecruitmentProjects(page) {
    calls.push(page); return page === 0 ? list(projects(1, 12), true, 14) : list(projects(13, 2), false, 14);
  } });
  const first = ready(await read.readListPage()), next = ready(await read.readListPage(1));
  const combined = mergeBackendProjectPages(first, next);
  assert.equal(combined.status, "ready");
  if (combined.status !== "ready") return;
  assert.equal(combined.data.items.length, 14);
  assert.equal(combined.data.totalProjects, 14);
  assert.equal(combined.data.hasMore, false);
  assert.equal(first.items.length, 12);
  assert.deepEqual(calls, [0, 1]);
  assert.equal(mergeBackendProjectPages(combined.data, next).status, "error");
});

test("24-shift offset pages preserve belonging IDs/venues and do not derive summary totals", async () => {
  assert.equal(BACKEND_PROJECT_SHIFT_PAGE_SIZE, 24);
  const first = ready(await adapter(list(), detail(shifts(1, 24), true)).readDetailPage(P1));
  const next = ready(await adapter(list(), detail([{ ...shift, shiftId: uuid("b2000000", 25), workplaceName: "別会場" }])).readDetailPage(P1, 1));
  const combined = mergeBackendProjectShiftPages(first, next);
  assert.equal(combined.status, "ready");
  if (combined.status !== "ready") return;
  assert.equal(combined.data.detail.shifts.length, 25);
  assert.equal(combined.data.hasMore, false);
  assert.equal(combined.data.detail.shifts[24]!.workplaceName, "別会場");
  assert.equal(first.detail.shifts.length, 24);
  assert.equal("totalShifts" in combined.data, false);
  assert.equal("applyAllowedShiftCount" in combined.data, false);
});

test("project append rejects duplicate IDs, order drift, skipped pages and changing totals", async () => {
  const first = ready(await adapter(list(projects(1, 12), true, 40)).readListPage());
  const cases = [
    { raw: list(projects(12, 1), false, 40), page: 1, issue: "duplicate_id" },
    { raw: list(projects(0, 1), false, 40), page: 1, issue: "out_of_order" },
    { raw: list(projects(13, 1), false, 40), page: 2, issue: "page_sequence" },
    { raw: list(projects(13, 1), false, 41), page: 1, issue: "total_changed" },
  ];
  for (const item of cases) {
    const next = ready(await adapter(item.raw).readListPage(item.page));
    assert.deepEqual(mergeBackendProjectPages(first, next), { status: "error", reason: "pagination_violation", issue: item.issue });
    assert.equal(first.items.length, 12); // no duplicate is ever appended
  }
});

test("shift append rejects overlap, reverse order, page replay and foreign project", async () => {
  const first = ready(await adapter(list(), detail(shifts(1, 24), true)).readDetailPage(P1));
  for (const [id, page, issue] of [[24, 1, "duplicate_id"], [0, 1, "out_of_order"], [25, 0, "page_sequence"]] as const) {
    const next = ready(await adapter(list(), detail(shifts(id, 1))).readDetailPage(P1, page));
    assert.deepEqual(mergeBackendProjectShiftPages(first, next), { status: "error", reason: "pagination_violation", issue });
  }
  const foreign = ready(await adapter(list(), detail([{ ...shift, projectId: P2 }], false, { projectId: P2, projectName: "同名案件" })).readDetailPage(P2, 1));
  assert.deepEqual(mergeBackendProjectShiftPages(first, foreign), { status: "error", reason: "pagination_violation", issue: "project_changed" });
  assert.equal(first.detail.shifts.length, 24);
});

test("unknown eligibility suppresses selection and confirmation for every backend state", async () => {
  for (const state of ["available", "available_with_warning", "not_eligible", "applied", "accepted_waiting_assignment", "rejected", "withdrawn", "capacity_full", "deadline_passed"] as const) {
    // Even unsolicited future-looking keys cannot authorize application.
    const data = ready(await adapter(list(), detail([{ ...shift, state, applicationAvailability: "allowed", hasActiveApplication: false }])).readDetailPage(P1));
    assert.equal(data.detail.shifts[0]!.applicationAvailability, null);
    assert.equal(data.detail.shifts[0]!.hasActiveApplication, null);
    assert.notEqual(getRecruitmentShiftHoldReason(data.detail.shifts[0]!), null);
    for (const selected of [false, true]) {
      const html = renderToStaticMarkup(createElement(ProjectRecruitmentDetail, {
        detail: data.detail, status: "ready", selection: selected ? [{ projectId: P1, shiftId: shift.shiftId }] : [],
        onSelectionChange: noop, onConfirm: noop, onBack: noop,
      }));
      assert.match(html, /応募可否/);
      if (!selected) assert.match(html, /<input[^>]*disabled=""/);
      assert.match(html, /<button[^>]*disabled=""[^>]*>応募内容を確認/);
    }
  }
});

test("UUID normalization detects mixed-case duplicate project and shift identities", async () => {
  assert.deepEqual(await adapter(list([summary, { ...summary, projectId: P1.toUpperCase() }])).readListPage(), contractError);
  assert.deepEqual(await adapter(list(), detail([shift, { ...shift, shiftId: shift.shiftId.toUpperCase() }])).readDetailPage(P1), contractError);
  const data = ready(await adapter(list([{ ...summary, projectId: P1.toUpperCase() }])).readListPage());
  assert.equal(data.items[0]!.project.projectId, P1);
});

test("Task A parser exceptions remain contract errors and are not identified by text", async () => {
  const read = createBackendProjectRecruitmentAdapter({ ...source(),
    async getWorkerRecruitmentProjects() { throw new MockBackendContractError("private parser diagnostic"); },
    async getWorkerRecruitmentProjectShifts() { throw new MockBackendContractError("private parser diagnostic"); },
  });
  assert.deepEqual(await read.readListPage(), contractError);
  assert.deepEqual(await read.readDetailPage(P1), contractError);
  const untyped = createBackendProjectRecruitmentAdapter({ ...source(),
    async getWorkerRecruitmentProjects() { throw new Error("recruitment_contract_violation: private diagnostic"); },
  });
  assert.deepEqual(await untyped.readListPage(), { status: "error", reason: "retrieval_failed" });
});
