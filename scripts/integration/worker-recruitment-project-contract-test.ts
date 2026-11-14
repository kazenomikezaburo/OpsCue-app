import assert from "node:assert/strict";
// @ts-expect-error Node native TypeScript test execution requires the suffix.
import { RecruitmentContractError, isUuid, parseProjectDetail, parseProjectList } from "../../lib/worker/recruitment/project-recruitment-contract.ts";

const P1 = "b1000000-0000-0000-0000-000000000001";
const P2 = "b1000000-0000-0000-0000-000000000002";
const S1 = "b2000000-0000-0000-0000-000000000001";
let passed = 0;
function pass(name: string, condition: unknown) { assert.ok(condition, name); passed += 1; console.log(`PASS ${name}`); }
function throwsContract(name: string, fn: () => unknown) { assert.throws(fn, (e: unknown) => e instanceof RecruitmentContractError, name); passed += 1; console.log(`PASS ${name}`); }

const item = { projectId: P1, projectName: "Same Name", shiftCount: 3, appliedCount: 1, firstStartsAt: "2026-12-01T00:00:00Z", lastEndsAt: "2026-12-03T00:00:00Z" };
const list = parseProjectList({ ok: true, items: [item, { ...item, projectId: P2, nearestApplicationDeadline: "2026-11-30T00:00:00Z", hourlyWageMin: 1200, hourlyWageMax: 1500 }], hasMore: false, totalProjects: 2 });
pass("list keeps both same-name projects distinguished by projectId", list.items.length === 2 && list.items[0].projectId !== list.items[1].projectId && list.items[0].projectName === list.items[1].projectName);
pass("optional keys are absent, not null", !("nearestApplicationDeadline" in list.items[0]) && list.items[1].hourlyWageMax === 1500);
throwsContract("list: missing totalProjects is a contract violation", () => parseProjectList({ ok: true, items: [], hasMore: false }));
throwsContract("list: non-uuid projectId is a contract violation", () => parseProjectList({ ok: true, items: [{ ...item, projectId: "x" }], hasMore: false, totalProjects: 1 }));
throwsContract("list: ok:false is not accepted as a list", () => parseProjectList({ ok: false }));

const shift = { shiftId: S1, projectId: P1, projectName: "Same Name", jobName: "j", startsAt: "2026-12-01T00:00:00Z", endsAt: "2026-12-01T08:00:00Z", state: "available", applicationState: "applied" };
const detail = parseProjectDetail({ ok: true, project: { projectId: P1, projectName: "Same Name" }, items: [shift], hasMore: false });
pass("detail returns header and shifts with projectId", detail.ok && detail.project?.projectId === P1 && detail.items[0].projectId === P1);
const hidden = parseProjectDetail({ ok: true, project: null, items: [], hasMore: false });
pass("not visible project is project:null with no items", hidden.ok && hidden.project === null && hidden.items.length === 0);
const invalid = parseProjectDetail({ ok: false, outcome: "invalid_request", project: null, items: [], hasMore: false });
pass("invalid_request is surfaced as a distinct state", !invalid.ok && invalid.outcome === "invalid_request");
throwsContract("detail: shift of another project is a contract violation", () => parseProjectDetail({ ok: true, project: { projectId: P1, projectName: "x" }, items: [{ ...shift, projectId: P2 }], hasMore: false }));
throwsContract("detail: items without a visible project is a contract violation", () => parseProjectDetail({ ok: true, project: null, items: [shift], hasMore: false }));
throwsContract("detail: unknown failure outcome is a contract violation", () => parseProjectDetail({ ok: false, outcome: "other" }));
pass("isUuid accepts uuid and rejects names", isUuid(P1) && !isUuid("Same Name") && !isUuid(undefined));
console.log(`${passed} contract checks passed`);
