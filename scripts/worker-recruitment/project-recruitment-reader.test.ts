import assert from "node:assert/strict";
import test from "node:test";
import { readProjectRecruitmentDetail, readProjectRecruitmentList, type ProjectRecruitmentReader } from "../../lib/worker/recruitment/project-recruitment-reader";
import { createSyntheticProjectRecruitmentReader } from "../../lib/worker/recruitment/__fixtures__/project-recruitment-reader.fixture";
import { syntheticDemoDetails } from "../../lib/worker/recruitment/__fixtures__/project-recruitment.fixture";

const first = syntheticDemoDetails[0]!;
const second = syntheticDemoDetails[1]!;
const reader = createSyntheticProjectRecruitmentReader();
const stub = (list: unknown, detail: unknown): ProjectRecruitmentReader => ({
  async readList() { return list; }, async readDetail() { return detail; },
});

test("same-name projects retain independent IDs, details and all belonging shifts", async () => {
  const list = await readProjectRecruitmentList(reader, null);
  assert.equal(list.status, "ready");
  if (list.status !== "ready") return;
  assert.equal(list.data.items.length, 2);
  assert.equal(list.data.items[0]!.project.projectName, list.data.items[1]!.project.projectName);
  assert.notEqual(list.data.items[0]!.project.projectId, list.data.items[1]!.project.projectId);
  for (const item of list.data.items) {
    const detail = await readProjectRecruitmentDetail(reader, item.project.projectId);
    assert.equal(detail.status, "ready");
    if (detail.status !== "ready") continue;
    assert.equal(detail.data.project.projectId, item.project.projectId);
    assert.ok(detail.data.shifts.every((shift) => shift.projectId === item.project.projectId));
    assert.equal(detail.data.shifts.length, item.publishedShiftCount);
  }
});

test("synthetic date filtering uses JST and preserves unknown aggregates", async () => {
  const list = await readProjectRecruitmentList(reader, "2026-11-02");
  assert.equal(list.status, "ready");
  if (list.status !== "ready") return;
  assert.equal(list.data.items.length, 2);
  assert.equal(list.data.items[0]!.publishedShiftCount, 8);
  assert.equal(list.data.items[0]!.applyAllowedShiftCount, null);
  assert.equal(list.data.items[0]!.hourlyWage, null);
  assert.equal(list.data.items[1]!.applyAllowedShiftCount, 1);
  const otherDate = await readProjectRecruitmentList(reader, "2026-11-03");
  assert.equal(otherDate.status, "ready");
  if (otherDate.status === "ready") assert.equal(otherDate.data.items[0]!.publishedShiftCount, 5);
});

test("a zero-result date is a successful empty list, not a failed read", async () => {
  const result = await readProjectRecruitmentList(reader, "2026-12-01");
  assert.equal(result.status, "ready");
  if (result.status === "ready") assert.deepEqual(result.data.items, []);
});

test("empty list, empty project shifts and unavailable project remain distinct", async () => {
  const empty = createSyntheticProjectRecruitmentReader("empty");
  const list = await readProjectRecruitmentList(empty, null);
  assert.equal(list.status, "ready");
  if (list.status === "ready") assert.deepEqual(list.data.items, []);
  const detail = await readProjectRecruitmentDetail(empty, first.project.projectId);
  assert.equal(detail.status, "ready");
  if (detail.status === "ready") assert.deepEqual(detail.data.shifts, []);
  assert.deepEqual(await readProjectRecruitmentDetail(reader, "00000000-0000-4000-8000-000000000999"), { status: "not_found" });
  assert.deepEqual(await readProjectRecruitmentDetail(createSyntheticProjectRecruitmentReader("not_found"), first.project.projectId), { status: "not_found" });
});

test("project names and malformed IDs are rejected without calling the reader", async () => {
  let calls = 0;
  const never: ProjectRecruitmentReader = {
    async readList() { calls++; throw new Error("must not run"); },
    async readDetail() { calls++; throw new Error("must not run"); },
  };
  for (const id of [first.project.projectName, "", "not-a-uuid"]) {
    assert.deepEqual(await readProjectRecruitmentDetail(never, id), { status: "not_found" });
  }
  assert.deepEqual(await readProjectRecruitmentList(never, "2026-02-30"), { status: "error" });
  assert.equal(calls, 0);
});

test("throwing reads become safe errors and can be retried through the same boundary", async () => {
  const failed = createSyntheticProjectRecruitmentReader("error");
  assert.deepEqual(await readProjectRecruitmentList(failed, null), { status: "error" });
  assert.deepEqual(await readProjectRecruitmentDetail(failed, first.project.projectId), { status: "error" });
  assert.equal((await readProjectRecruitmentList(reader, null)).status, "ready");
  assert.equal((await readProjectRecruitmentDetail(reader, first.project.projectId)).status, "ready");
});

test("malformed payloads do not become empty or 404", async () => {
  for (const invalid of [undefined, {}, [], { message: "private diagnostic" }]) {
    assert.deepEqual(await readProjectRecruitmentList(stub(invalid, invalid), null), { status: "error" });
    assert.deepEqual(await readProjectRecruitmentDetail(stub(invalid, invalid), first.project.projectId), { status: "error" });
  }
});

test("a mismatched project or foreign/duplicate shifts fails closed", async () => {
  for (const invalid of [second, { ...first, shifts: [...first.shifts, ...second.shifts] }, { ...first, shifts: [first.shifts[0], first.shifts[0]] }]) {
    assert.deepEqual(await readProjectRecruitmentDetail(stub(null, invalid), first.project.projectId), { status: "error" });
  }
});

test("duplicate list identities and negative aggregates are rejected", async () => {
  const valid = await reader.readList(null) as { source: string; items: unknown[]; dates: string[] };
  assert.deepEqual(await readProjectRecruitmentList(stub({ ...valid, items: [valid.items[0], valid.items[0]] }, null), null), { status: "error" });
  const invalid = { ...valid, items: [{ project: first.project, venueText: null, scheduleText: null, publishedShiftCount: -1, applyAllowedShiftCount: null, hourlyWage: null }] };
  assert.deepEqual(await readProjectRecruitmentList(stub(invalid, null), null), { status: "error" });
});

test("detail requests and returned identities are normalized before comparison", async () => {
  const projectId = "aaaaaaaa-0000-4000-8000-000000000001";
  const detail = { ...first, project: { ...first.project, projectId: projectId.toUpperCase() }, shifts: first.shifts.map((shift) => ({ ...shift, projectId: projectId.toUpperCase() })) };
  let requested = "";
  const result = await readProjectRecruitmentDetail({ ...reader, async readDetail(id) { requested = id; return detail; } }, projectId.toUpperCase());
  assert.equal(requested, projectId);
  assert.equal(result.status, "ready");
  if (result.status === "ready") assert.equal(result.data.project.projectId, projectId);
});
