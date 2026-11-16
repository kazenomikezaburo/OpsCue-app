import assert from "node:assert/strict";
import test from "node:test";
import {
  addRecruitmentShift,
  canSubmitRecruitmentSelection,
  checkRecruitmentBatchApplications,
  filterRecruitmentShiftsByStartDate,
  getRecruitmentStartDate,
  removeRecruitmentShift,
} from "../../lib/worker/recruitment/recruitment-selection";
import {
  projectRecruitmentDetailSchema,
  projectRecruitmentListSchema,
  recruitmentBatchRequestSchema,
  recruitmentBatchResultSchema,
  recruitmentInstantSchema,
} from "../../lib/worker/recruitment/project-recruitment-schema";
import {
  syntheticBatchRequest,
  syntheticBatchResults,
  syntheticRecruitmentDetail,
  syntheticRecruitmentList,
  syntheticRecruitmentShifts,
} from "../../lib/worker/recruitment/__fixtures__/project-recruitment.fixture";
import type { RecruitmentShiftReference } from "../../lib/worker/recruitment/project-recruitment-types";

// Synthetic IDs deliberately contain letters to exercise case normalization.
const projectId = "aaaaaaaa-0000-4000-8000-000000000001";
const shiftId = "bbbbbbbb-0000-4000-8000-000000000001";
const first: RecruitmentShiftReference = { projectId, shiftId };
const second: RecruitmentShiftReference = { projectId, shiftId: "bbbbbbbb-0000-4000-8000-000000000002" };
const uppercase = (shift: RecruitmentShiftReference): RecruitmentShiftReference => ({
  projectId: shift.projectId.toUpperCase(), shiftId: shift.shiftId.toUpperCase(),
});

test("same shift UUID with different case is rejected, including legacy selections", () => {
  for (const [existing, candidate] of [[first, uppercase(first)], [uppercase(first), first]]) {
    const result = addRecruitmentShift([existing], candidate);
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.reason, "duplicate_shift");
    assert.equal(canSubmitRecruitmentSelection([existing, candidate]), false);
  }
});

test("same project UUID with different case matches and successful output is lowercase", () => {
  const result = addRecruitmentShift([uppercase(first)], second);
  assert.deepEqual(result, { ok: true, selection: [first, second] });
});

test("deselection matches both UUIDs regardless of case", () => {
  assert.deepEqual(removeRecruitmentShift([uppercase(first), uppercase(second)], first), [second]);
  assert.deepEqual(removeRecruitmentShift([first, second], uppercase(first)), [second]);
  assert.deepEqual(removeRecruitmentShift([first], first), []);
});

test("zero cannot submit, one and ten can submit, eleven cannot submit or be added", () => {
  assert.equal(canSubmitRecruitmentSelection([]), false);
  assert.deepEqual(addRecruitmentShift([], first), { ok: true, selection: [first] });
  assert.equal(canSubmitRecruitmentSelection([first]), true);
  const ten = syntheticRecruitmentShifts.slice(0, 10);
  const eleven = syntheticRecruitmentShifts.slice(0, 11);
  const last = eleven[10];
  assert.ok(last);
  assert.equal(canSubmitRecruitmentSelection(ten), true);
  assert.equal(canSubmitRecruitmentSelection(eleven), false);
  const result = addRecruitmentShift(ten, last);
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.reason, "limit_exceeded");
});

test("another project cannot be mixed into the selection", () => {
  const foreign = { ...second, projectId: "cccccccc-0000-4000-8000-000000000001" };
  const result = addRecruitmentShift([first], foreign);
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.reason, "mixed_projects");
  assert.equal(canSubmitRecruitmentSelection([first, foreign]), false);
});

test("add, rejected add, and remove do not mutate caller arrays or references", () => {
  const selection = Object.freeze([Object.freeze(uppercase(first))]);
  const snapshot = selection.map((shift) => ({ ...shift }));
  addRecruitmentShift(selection, Object.freeze(second));
  addRecruitmentShift(selection, first);
  removeRecruitmentShift(selection, first);
  assert.deepEqual(selection, snapshot);
});

test("overlapping unconfirmed applications are not a selection rejection rule", () => {
  const a = syntheticRecruitmentShifts[0];
  const b = syntheticRecruitmentShifts[1];
  assert.ok(a && b);
  const pendingA = { ...a, applicationState: "applied" as const };
  const pendingB = { ...b, applicationState: "applied" as const };
  assert.equal(pendingA.startsAt, pendingB.startsAt);
  assert.equal(pendingA.endsAt, pendingB.endsAt);
  assert.equal(addRecruitmentShift([pendingA], pendingB).ok, true);
  // Selection permission is not submission permission; no active-state mapping is assumed.
});

test("explicit active application rejects the entire batch with zero new applications", () => {
  for (const states of [[false, true], [true, false], [null, true]]) {
    assert.deepEqual(checkRecruitmentBatchApplications(states.map((hasActiveApplication) => ({ hasActiveApplication }))), {
      status: "rejected", newApplicationCount: 0,
    });
  }
});

test("unknown active-application facts stay unknown rather than allowed or rejected", () => {
  assert.deepEqual(checkRecruitmentBatchApplications([{ hasActiveApplication: null }]), { status: "unknown" });
  assert.deepEqual(checkRecruitmentBatchApplications([{ hasActiveApplication: false }, { hasActiveApplication: null }]), { status: "unknown" });
  assert.deepEqual(checkRecruitmentBatchApplications([]), { status: "unknown" });
  assert.deepEqual(checkRecruitmentBatchApplications([{ hasActiveApplication: false }]), { status: "no_known_active_application" });
});

test("valid calendar dates and explicit timezone offsets have matching schema/helper acceptance", () => {
  for (const [instant, day] of [
    ["2026-02-28T00:00:00Z", "2026-02-28"],
    ["2028-02-29T00:00:00Z", "2028-02-29"],
    ["2026-02-28T00:30:00+09:00", "2026-02-28"],
  ]) {
    assert.equal(recruitmentInstantSchema.safeParse(instant).success, true);
    assert.equal(getRecruitmentStartDate(instant), day);
  }
});

test("nonexistent dates and unqualified/malformed timestamps are not normalized", () => {
  for (const instant of ["2026-02-30T00:00:00Z", "2026-02-29T00:00:00Z", "2100-02-29T00:00:00Z", "2026-04-31T00:00:00Z", "2026-02-28T24:00:00Z", "2026-02-28T00:00:00", "not-a-date"]) {
    assert.equal(recruitmentInstantSchema.safeParse(instant).success, false, instant);
    assert.equal(getRecruitmentStartDate(instant), null, instant);
  }
});

test("JST changes day at UTC 15:00 and filtering uses start day, not end day", () => {
  const base = syntheticRecruitmentShifts[0];
  assert.ok(base);
  const before = { ...base, startsAt: "2026-11-01T14:59:59Z", endsAt: "2026-11-01T18:00:00Z" };
  const after = { ...base, shiftId: second.shiftId, startsAt: "2026-11-01T15:00:00Z", endsAt: "2026-11-01T18:00:00Z" };
  assert.equal(getRecruitmentStartDate(before.startsAt), "2026-11-01");
  assert.equal(getRecruitmentStartDate(after.startsAt), "2026-11-02");
  assert.deepEqual(filterRecruitmentShiftsByStartDate([before, after], "2026-11-01"), [before]);
  assert.deepEqual(filterRecruitmentShiftsByStartDate([before, after], "2026-11-02"), [after]);
  assert.deepEqual(filterRecruitmentShiftsByStartDate([before, after], null), [before, after]);
});

test("request parsing normalizes UUIDs before rejecting case-variant duplicates", () => {
  const parsed = recruitmentBatchRequestSchema.parse({ ...syntheticBatchRequest, projectId: projectId.toUpperCase(), shiftIds: [shiftId.toUpperCase()] });
  assert.equal(parsed.projectId, projectId);
  assert.deepEqual(parsed.shiftIds, [shiftId]);
  assert.equal(recruitmentBatchRequestSchema.safeParse({ ...syntheticBatchRequest, shiftIds: [shiftId, shiftId.toUpperCase()] }).success, false);
});

test("synthetic DTOs parse and retain unknown fields as null", () => {
  assert.deepEqual(projectRecruitmentListSchema.parse(syntheticRecruitmentList), syntheticRecruitmentList);
  const detail = projectRecruitmentDetailSchema.parse(syntheticRecruitmentDetail);
  const shift = detail.shifts[0];
  assert.ok(shift);
  assert.equal(shift.remainingCapacity, null);
  assert.equal(shift.applicationAvailability, null);
  assert.equal(shift.applicationState, null);
  assert.equal(shift.hasActiveApplication, null);
});

test("batch results distinguish pending, receipt success, total rejection and unknown", () => {
  const results = syntheticBatchResults.map((result) => recruitmentBatchResultSchema.parse(result));
  assert.deepEqual(results.map((result) => result.status), ["pending", "success", "rejected", "unknown"]);
  for (const result of results) {
    assert.deepEqual(result.request, syntheticBatchRequest);
    if (result.status === "success") assert.equal(result.meaning, "application_received");
    if (result.status === "rejected") assert.equal(result.newApplicationCount, 0);
    if (result.status === "unknown") {
      assert.equal(result.recovery, "retain_same_batch_key");
      assert.equal("newApplicationCount" in result, false);
    }
  }
  assert.equal(recruitmentBatchResultSchema.safeParse({ request: syntheticBatchRequest, status: "partial_success" }).success, false);
  assert.equal(recruitmentBatchResultSchema.safeParse({ request: syntheticBatchRequest, status: "rejected", newApplicationCount: 1, safeReasonText: null }).success, false);
});
