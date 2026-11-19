import assert from "node:assert/strict";
import test from "node:test";
import { Children, createElement, isValidElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { RecruitmentBatchMockResult } from "../../components/worker/recruitment/recruitment-batch-mock-result";
import { recruitmentBatchMockRequestSchema, recruitmentBatchRejectionReasonSchema, type RecruitmentBatchMockRequest } from "../../lib/worker/recruitment/recruitment-batch-mock-contract";
import { createRecruitmentBatchMockSession, getRecruitmentBatchMockView, type RecruitmentBatchMockState } from "../../lib/worker/recruitment/recruitment-batch-mock-session";
import { canSubmitRecruitmentSelection } from "../../lib/worker/recruitment/recruitment-selection";

const projectId = "aaaaaaaa-0000-4000-8000-000000000001";
const otherProjectId = "aaaaaaaa-0000-4000-8000-000000000002";
const batchKey = "bbbbbbbb-0000-4000-8000-000000000001";
const nextKey = "bbbbbbbb-0000-4000-8000-000000000002";
const shifts = Array.from({ length: 11 }, (_, i) => `cccccccc-0000-4000-8000-${String(i + 1).padStart(12, "0")}`);
const request = (count = 2): RecruitmentBatchMockRequest => ({ projectId, batchKey, shiftIds: shifts.slice(0, count) });
const applied = (req = request(), newCount = req.shiftIds.length, already = 0, replayed = false) => ({
  ok: true, outcome: "applied", newApplicationCount: newCount, alreadyAppliedCount: already,
  appliedShiftIds: [...req.shiftIds].sort(), replayed,
});
const rejected = (rejections = [{ shiftId: shifts[1]!, reason: "capacity_full" }]) => ({
  ok: false, outcome: "batch_rejected", newApplicationCount: 0, rejections,
});
const completed = (req = request(), result: unknown = applied(req)) => ({
  status: "completed", request: { projectId: req.projectId, shiftIds: req.shiftIds }, result,
});
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}
const lost = async (): Promise<unknown> => { throw new Error("synthetic connection loss; internal details must not render"); };
function html(state: RecruitmentBatchMockState) {
  return renderToStaticMarkup(createElement(RecruitmentBatchMockResult, { state, onClose() {}, onRecheck() {} }));
}
function buttonAction(node: ReactNode, label: string): (() => void) | undefined {
  for (const child of Children.toArray(node)) {
    if (!isValidElement<{ children?: ReactNode; onClick?: () => void }>(child)) continue;
    if (child.type === "button" && child.props.children === label) return child.props.onClick;
    const action = buttonAction(child.props.children, label);
    if (action) return action;
  }
}

/** In-memory expected Backend behavior ONLY. This fixture does not prove SQL
 * locks, actor scoping, transaction isolation, real idempotency or retention.
 */
function receiptFirstFixture({ loseFirstReply = false, gate }: { loseFirstReply?: boolean; gate?: Promise<void> } = {}) {
  type Result = ReturnType<typeof applied>;
  const records = new Map<string, { request: RecruitmentBatchMockRequest; result: Promise<Result> }>();
  const calls: { batchKey: string; projectId: string; shiftIds: readonly string[] }[] = [];
  const applicationRows: string[] = [];
  let closed = false;
  let lostFirst = false;
  const apply = async (input: Parameters<ReturnType<typeof createRecruitmentBatchMockSession>["start"]>[0]) => {
    const req = recruitmentBatchMockRequestSchema.parse(input);
    calls.push(req);
    const old = records.get(req.batchKey);
    if (old) {
      if (old.request.projectId !== req.projectId || old.request.shiftIds.join() !== req.shiftIds.join()) {
        return { ok: false, outcome: "IDEMPOTENCY_CONFLICT", replayed: false };
      }
      return { ...await old.result, replayed: true };
    }
    // This fixture defines saved-result replay only after closure, not fresh-key wire/receipts.
    if (closed) throw new Error("MOCK_CLOSED_NEW_KEY_UNSPECIFIED");
    const result = (async () => {
      if (gate) await gate;
      applicationRows.push(...req.shiftIds);
      return applied(req);
    })();
    records.set(req.batchKey, { request: req, result });
    const value = await result;
    if (loseFirstReply && !lostFirst) { lostFirst = true; throw new Error("lost after mock commit"); }
    return value;
  };
  return {
    apply, calls, applicationRows, closeProject() { closed = true; },
    async lookup(key: string) {
      const record = records.get(key);
      return record ? completed(record.request, await record.result) : { status: "not_found" };
    },
  };
}

test("B-01 new applications: two requested IDs, new=2 and already=0", async () => {
  const session = createRecruitmentBatchMockSession({ apply: async () => applied(), lookup: lost });
  const state = await session.start(request());
  assert.equal(state.status, "success");
  assert.deepEqual(state.result, applied());
  assert.match(html(state), /新規 2件・既応募 0件/);
  assert.match(html(state), /採用・配置の確定ではありません/);
  assert.match(html(state), /モック契約・実応募なし/);
});

test("B-02 new=1 plus already-applied=1 is whole-request success", async () => {
  const state = await createRecruitmentBatchMockSession({ apply: async () => applied(request(), 1, 1), lookup: lost }).start(request());
  assert.equal(state.status, "success");
  assert.match(html(state), /新規 1件・既応募 1件/);
  assert.deepEqual(state.result?.outcome === "applied" && state.result.appliedShiftIds, request().shiftIds);
});

test("B-03 one rejection makes the entire batch new=0; passing shift is not a success", async () => {
  const state = await createRecruitmentBatchMockSession({ apply: async () => rejected(), lookup: lost }).start(request());
  assert.equal(state.status, "rejected");
  assert.equal(state.result?.newApplicationCount, 0);
  assert.match(html(state), /募集枠が埋まっています/);
  assert.match(html(state), /理由がないシフトも受付成功にはなりません/);
  assert.ok(!html(state).includes(shifts[0]!));
  assert.doesNotMatch(html(state), /応募を受け付けました/);
});

test("B-04 rejections contain only rejected shifts, sorted, one reason per shift", async () => {
  const reasons = [{ shiftId: shifts[0]!, reason: "not_eligible" }, { shiftId: shifts[2]!, reason: "deadline_passed" }];
  const state = await createRecruitmentBatchMockSession({ apply: async () => rejected(reasons), lookup: lost }).start(request(3));
  assert.equal(state.status, "rejected");
  assert.deepEqual(state.result?.outcome === "batch_rejected" && state.result.rejections, reasons);
  assert.ok(!html(state).includes(shifts[1]!));
  assert.match(html(state), /応募条件を満たしていません/);
  assert.match(html(state), /応募期限を過ぎています/);
});

test("B-05 explicit same-key/same-set retry adopts replayed first result", async () => {
  const source = receiptFirstFixture({ loseFirstReply: true });
  const session = createRecruitmentBatchMockSession(source);
  assert.equal((await session.start({ ...request(), shiftIds: [...request().shiftIds].reverse() })).status, "unknown");
  const retained = session.getState().request;
  assert.equal(source.calls.length, 1);
  const state = await session.retry();
  assert.equal(state.status, "success");
  assert.equal(state.result?.outcome === "applied" && state.result.replayed, true);
  assert.deepEqual(state.request, retained);
  assert.notEqual(state.request, retained);
  assert.deepEqual(source.calls[0], source.calls[1]);
  assert.deepEqual(source.applicationRows, request().shiftIds);
});

test("B-06 same-key/different-content conflict latches: no resubmit, discard or replacement", async () => {
  const source = receiptFirstFixture();
  await source.apply(request());
  const session = createRecruitmentBatchMockSession(source);
  const attempted = { ...request(), shiftIds: [shifts[0]!, shifts[2]!] };
  assert.equal((await session.start(attempted)).status, "conflict");
  const retained = session.getState().request;
  await session.retry();
  await session.start({ ...request(), batchKey: nextKey });
  assert.equal(source.calls.length, 2);
  const mismatched = await session.recheck();
  assert.equal(mismatched.status, "conflict");
  assert.equal(mismatched.issue, "receipt_mismatch");
  assert.deepEqual(mismatched.request, retained);
  assert.equal(getRecruitmentBatchMockView(mismatched).confirmed, false);
  assert.match(html(mismatched), /自動再送・自動破棄は行いません/);
});

test("B-07 transport loss retains the normalized immutable key, project and shifts", async () => {
  let calls = 0;
  const session = createRecruitmentBatchMockSession({ apply: async () => { calls++; return lost(); }, lookup: lost });
  const input = { projectId: projectId.toUpperCase(), batchKey: batchKey.toUpperCase(), shiftIds: request().shiftIds.map((id) => id.toUpperCase()).reverse() };
  const state = await session.start(input);
  assert.equal(state.status, "unknown");
  assert.deepEqual(state.request, request());
  assert.ok(Object.isFrozen(state.request));
  assert.ok(Object.isFrozen(state.request?.shiftIds));
  input.shiftIds.length = 0;
  assert.deepEqual(session.getState().request, request());
  await Promise.resolve();
  assert.equal(calls, 1, "no automatic retry");
  assert.doesNotMatch(html(state), /internal details|synthetic connection loss/);
});

test("B-08 not_found never proves non-execution and never changes the retry key", async () => {
  const sent: unknown[] = [];
  const keys: string[] = [];
  const session = createRecruitmentBatchMockSession({
    apply: async (req) => { sent.push(structuredClone(req)); if (sent.length === 1) return lost(); return applied(); },
    lookup: async (key) => { keys.push(key); return { status: "not_found" }; },
  });
  await session.start(request());
  const state = await session.recheck();
  assert.equal(state.status, "unknown");
  assert.equal(state.issue, "not_found");
  assert.deepEqual(state.request, request());
  assert.deepEqual(keys, [batchKey]);
  assert.deepEqual(sent, [request()], "not_found does not create or send a new request");
  assert.equal((await session.retry()).status, "success");
  assert.deepEqual(sent, [request(), request()], "initial and retry batchKey/projectId/shiftIds are identical");
});

test("B-09 completed receipt matches normalized project and shift SET, not caller order", async () => {
  const receipt = completed();
  receipt.request.projectId = projectId.toUpperCase();
  receipt.request.shiftIds = [...request().shiftIds].reverse().map((id) => id.toUpperCase());
  let keySeen: string | undefined;
  const session = createRecruitmentBatchMockSession({ apply: lost, lookup: async (key) => { keySeen = key; return receipt; } });
  await session.start(request());
  assert.equal((await session.recheck()).status, "success");
  assert.equal(keySeen, batchKey);
});

test("B-10 mismatched or malformed completed receipt never produces a final display", async (t) => {
  const cases: [string, unknown][] = [
    ["other project", completed({ ...request(), projectId: otherProjectId })],
    ["other shift", completed({ ...request(), shiftIds: [shifts[0]!, shifts[2]!] })],
    ["duplicate shift", { ...completed(), request: { projectId, shiftIds: [shifts[0], shifts[0]] } }],
    ["missing request", { status: "completed", result: applied() }],
    ["invalid result", completed(request(), { ok: true, outcome: "applied" })],
  ];
  for (const [name, receipt] of cases) await t.test(name, async () => {
    const session = createRecruitmentBatchMockSession({ apply: lost, lookup: async () => receipt });
    await session.start(request());
    const state = await session.recheck();
    assert.equal(state.status, "unknown");
    assert.deepEqual(state.request, request());
    assert.equal(state.result, null);
    assert.equal(getRecruitmentBatchMockView(state).confirmed, false);
    assert.doesNotMatch(html(state), /モック：応募受付の表示例|モック：全体拒否の表示例/);
  });
});

test("B-11 receipt-first mock replays the saved success after project closes", async () => {
  const source = receiptFirstFixture({ loseFirstReply: true });
  const session = createRecruitmentBatchMockSession(source);
  assert.equal((await session.start(request())).status, "unknown");
  source.closeProject();
  const state = await session.retry();
  assert.equal(state.status, "success");
  assert.deepEqual(state.result, applied(request(), 2, 0, true));
  assert.deepEqual(source.applicationRows, request().shiftIds);
});

test("B-12 invalid local inputs are blocked; real membership is a mock source fact", async (t) => {
  for (const [name, input] of [
    ["zero", request(0)], ["eleven", request(11)],
    ["duplicate", { ...request(), shiftIds: [shifts[0], shifts[0]!.toUpperCase()] }],
    ["bad key", { ...request(), batchKey: "invalid" }],
  ] as const) await t.test(name, async () => {
    let called = 0;
    const session = createRecruitmentBatchMockSession({ apply: async () => { called++; return applied(); }, lookup: lost });
    const state = await session.start(input);
    assert.equal(state.status, "idle");
    assert.equal(state.issue, "invalid_request");
    assert.equal(called, 0);
  });
  await t.test("known mixed-project selection", () => {
    assert.equal(canSubmitRecruitmentSelection([
      { projectId, shiftId: shifts[0]! }, { projectId: otherProjectId, shiftId: shifts[1]! },
    ]), false);
  });
  await t.test("wire IDs cannot prove membership; unavailable stays unresolved", async () => {
    const session = createRecruitmentBatchMockSession({ apply: async () => ({ ok: false, outcome: "unavailable", replayed: false }), lookup: lost });
    const state = await session.start(request());
    assert.equal(state.status, "unknown");
    assert.equal(state.issue, "unavailable_unconfirmed");
    assert.deepEqual(state.request, request());
  });
});

test("B-13 in-flight suppression and same-key replay expectations (mock, NOT DB lock proof)", async (t) => {
  await t.test("one session suppresses duplicate send and concurrent receipt read", async () => {
    const gate = deferred<unknown>();
    let sends = 0, lookups = 0;
    const session = createRecruitmentBatchMockSession({ apply: async () => { sends++; return gate.promise; }, lookup: async () => { lookups++; return completed(); } });
    const first = session.start(request());
    assert.equal((await session.start(request())).status, "pending");
    await session.recheck();
    assert.equal(sends, 1);
    assert.equal(lookups, 0);
    gate.resolve(applied());
    assert.equal((await first).status, "success");
  });
  await t.test("two clients consume the expected single mock commit and replay", async () => {
    const gate = deferred<void>();
    const source = receiptFirstFixture({ gate: gate.promise });
    const first = createRecruitmentBatchMockSession(source).start(request());
    const second = createRecruitmentBatchMockSession(source).start(request());
    gate.resolve();
    const states = await Promise.all([first, second]);
    assert.deepEqual(states.map((state) => state.status), ["success", "success"]);
    assert.deepEqual(states.map((state) => state.result?.outcome === "applied" && state.result.replayed), [false, true]);
    assert.deepEqual(source.applicationRows, request().shiftIds);
  });
});

test("B-14 lock/transport/timeout failures keep the request; no rollback inference", async (t) => {
  for (const code of ["40P01", "40001", "55P03", "57014", "HTTP_5XX", "22023"]) await t.test(code, async () => {
    const seen: unknown[] = [];
    const session = createRecruitmentBatchMockSession({ apply: async (req) => { seen.push(req); throw Object.assign(new Error("private diagnostics"), { code }); }, lookup: lost });
    assert.equal((await session.start(request())).status, "unknown");
    assert.equal(seen.length, 1);
    assert.equal((await session.retry()).status, "unknown");
    assert.deepEqual(seen, [request(), request()]);
    assert.doesNotMatch(html(session.getState()), /private diagnostics|40P01|22023/);
  });
});

test("B-15 closing/reopening the real result view retains unresolved identity", async () => {
  let sends = 0;
  const session = createRecruitmentBatchMockSession({ apply: async () => { sends++; return lost(); }, lookup: async () => ({ status: "not_found" }) });
  await session.start(request());
  const retained = session.getState().request;
  const element = RecruitmentBatchMockResult({ state: session.getState(), onClose: () => { session.close(); }, onRecheck: () => { void session.recheck(); } });
  const close = buttonAction(element, "閉じる");
  assert.ok(close);
  close();
  assert.equal(html(session.getState()), "");
  session.reopen();
  assert.equal(session.getState().status, "unknown");
  assert.deepEqual(session.getState().request, retained);
  assert.match(html(session.getState()), /応募結果は未確定です/);
  await session.start({ ...request(), batchKey: nextKey });
  assert.equal(sends, 1);
  assert.deepEqual(session.getState().request, retained);
});

test("malformed terminal outcomes fail closed, retaining the original request", async (t) => {
  const bad: [string, unknown][] = [
    ["count sum", applied(request(), 1, 0)], ["fraction", applied(request(), 1.5, 0.5)],
    ["negative", applied(request(), -1, 3)], ["missing replay", { ...applied(), replayed: undefined }],
    ["wrong IDs", { ...applied(), appliedShiftIds: [shifts[0], shifts[2]] }],
    ["duplicate IDs", { ...applied(), appliedShiftIds: [shifts[0], shifts[0]] }],
    ["unsorted IDs", { ...applied(), appliedShiftIds: [...request().shiftIds].reverse() }],
    ["partial success", { ok: true, outcome: "partial_success" }],
    ["nonzero rejection", { ...rejected(), newApplicationCount: 1 }],
    ["empty reasons", rejected([])],
    ["foreign rejection", rejected([{ shiftId: shifts[2]!, reason: "capacity_full" }])],
    ["unknown reason", rejected([{ shiftId: shifts[1]!, reason: "internal SQL error" }])],
    ["duplicated reasons", rejected([{ shiftId: shifts[1]!, reason: "capacity_full" }, { shiftId: shifts[1]!, reason: "not_eligible" }])],
    ["unsorted reasons", rejected([{ shiftId: shifts[1]!, reason: "capacity_full" }, { shiftId: shifts[0]!, reason: "not_eligible" }])],
    ["eleven reasons", rejected(shifts.map((shiftId) => ({ shiftId, reason: "capacity_full" })))],
  ];
  for (const [name, response] of bad) await t.test(name, async () => {
    const session = createRecruitmentBatchMockSession({ apply: async () => response, lookup: lost });
    const state = await session.start(request());
    assert.equal(state.status, "unknown");
    assert.equal(state.result, null);
    assert.deepEqual(state.request, request());
    assert.equal(getRecruitmentBatchMockView(state).confirmed, false);
  });
});

test("all eight documented rejection codes are validated and safely translated", async () => {
  for (const reason of recruitmentBatchRejectionReasonSchema.options) {
    const state = await createRecruitmentBatchMockSession({ apply: async () => rejected([{ shiftId: shifts[1]!, reason }]), lookup: lost }).start(request());
    assert.equal(state.status, "rejected", reason);
    const view = getRecruitmentBatchMockView(state);
    assert.equal(view.rejections.length, 1);
    assert.ok(view.rejections[0]!.text.length > 0);
    assert.ok(!html(state).includes(reason));
  }
});

test("not_found after conflict does not unlock retry, and completed unavailable stays unknown", async () => {
  let sends = 0;
  const session = createRecruitmentBatchMockSession({
    apply: async () => { sends++; return { ok: false, outcome: "IDEMPOTENCY_CONFLICT", replayed: false }; },
    lookup: async () => ({ status: "not_found" }),
  });
  await session.start(request());
  assert.equal((await session.recheck()).status, "conflict");
  await session.retry();
  assert.equal(sends, 1);
  const unavailable = createRecruitmentBatchMockSession({ apply: lost, lookup: async () => completed(request(), { ok: false, outcome: "unavailable", replayed: false }) });
  await unavailable.start(request());
  assert.equal((await unavailable.recheck()).status, "unknown");
  assert.deepEqual(unavailable.getState().request, request());
});

test("closing during in-flight completion stays closed; explicit new operation needs a fresh key", async () => {
  const gate = deferred<unknown>();
  const seen: unknown[] = [];
  const session = createRecruitmentBatchMockSession({ apply: async (req) => { seen.push(req); return seen.length === 1 ? gate.promise : applied({ ...request(), batchKey: nextKey }); }, lookup: lost });
  const first = session.start(request());
  session.close();
  gate.resolve(applied());
  assert.equal((await first).visible, false);
  session.reopen();
  assert.equal(session.getState().status, "success");
  await session.start(request());
  assert.equal(seen.length, 1);
  assert.equal((await session.start({ ...request(), batchKey: nextKey })).status, "success");
  assert.equal(seen.length, 2);
});

test("valid request edges: one/ten shifts and an entirely already-applied batch", async () => {
  for (const count of [1, 10]) {
    const req = request(count);
    for (const already of [0, count]) {
      const state = await createRecruitmentBatchMockSession({ apply: async () => applied(req, count - already, already), lookup: lost }).start(req);
      assert.equal(state.status, "success");
      assert.equal(state.result?.outcome === "applied" && state.result.appliedShiftIds.length, count);
    }
  }
});

test("replayed and receipt-completed rejections remain whole-batch new=0", async () => {
  let sends = 0;
  const seen: unknown[] = [];
  const replay = createRecruitmentBatchMockSession({
    apply: async (req) => { seen.push(req); if (++sends === 1) return lost(); return { ...rejected(), replayed: true }; }, lookup: lost,
  });
  await replay.start(request());
  const replayed = await replay.retry();
  assert.equal(replayed.status, "rejected");
  assert.equal(replayed.result?.newApplicationCount, 0);
  assert.deepEqual(seen, [request(), request()]);
  const receipt = createRecruitmentBatchMockSession({ apply: lost, lookup: async () => completed(request(), rejected()) });
  await receipt.start(request());
  const state = await receipt.recheck();
  assert.equal(state.status, "rejected");
  assert.equal(state.result?.outcome === "batch_rejected" && "replayed" in state.result, false, "unspecified initial replay flag is not fabricated");
  assert.doesNotMatch(html(state), /応募を受け付けました/);
});

test("conflict survives receipt transport failure and closing; an exact completed receipt resolves it", async () => {
  let sends = 0, checks = 0;
  const session = createRecruitmentBatchMockSession({
    apply: async () => { sends++; return { ok: false, outcome: "IDEMPOTENCY_CONFLICT", replayed: false }; },
    lookup: async () => { if (++checks === 1) return lost(); return completed(); },
  });
  await session.start(request());
  assert.equal((await session.recheck()).status, "conflict");
  session.close(); session.reopen();
  await session.retry();
  assert.equal(sends, 1);
  assert.equal((await session.recheck()).status, "success");
  assert.equal(session.getState().request?.batchKey, batchKey);
});

test("review P0-1 public snapshots cannot erase retained requests or bypass the next-key guard", async (t) => {
  for (const method of ["start", "getState", "retry", "recheck", "close", "reopen"] as const) await t.test(method, async () => {
    const sent: unknown[] = [];
    const session = createRecruitmentBatchMockSession({
      apply: async (req) => { sent.push(structuredClone(req)); return lost(); },
      lookup: async () => ({ status: "not_found" }),
    });
    const first = await session.start(request());
    const exposed = method === "start" ? first : await session[method]();
    const before = sent.length;
    // Bypass TypeScript deliberately: this reproduced loss of the actual request.
    Reflect.set(exposed, "request", null);
    Reflect.set(exposed, "status", "success");
    await session.start({ ...request(), batchKey: nextKey });
    assert.equal(sent.length, before, "public mutation must not permit another apply");
    assert.deepEqual(session.getState().request, request());
    assert.notEqual(session.getState(), session.getState(), "each public snapshot is detached");
  });
});

test("review P0-2 every conflict indication blocks resend while malformed shapes stay contract violations", async (t) => {
  const cases: [string, unknown, string][] = [
    ["normal", { ok: false, outcome: "IDEMPOTENCY_CONFLICT", replayed: false }, "idempotency_conflict"],
    ["missing replayed", { ok: false, outcome: "IDEMPOTENCY_CONFLICT" }, "invalid_conflict_response"],
    ["wrong replayed value", { ok: false, outcome: "IDEMPOTENCY_CONFLICT", replayed: true }, "invalid_conflict_response"],
    ["wrong replayed type", { ok: false, outcome: "IDEMPOTENCY_CONFLICT", replayed: "false" }, "invalid_conflict_response"],
    ["wrong ok", { ok: true, outcome: "IDEMPOTENCY_CONFLICT", replayed: false }, "invalid_conflict_response"],
    ["missing ok", { outcome: "IDEMPOTENCY_CONFLICT", replayed: false }, "invalid_conflict_response"],
  ];
  for (const [name, response, issue] of cases) await t.test(name, async () => {
    const sent: unknown[] = [];
    const queried: string[] = [];
    const session = createRecruitmentBatchMockSession({
      apply: async (req) => { sent.push(structuredClone(req)); return response; },
      lookup: async (key) => { queried.push(key); return { status: "not_found" }; },
    });
    const first = await session.start(request());
    await Promise.resolve();
    assert.equal(sent.length, 1, "no automatic resend");
    await session.retry();
    await session.start({ ...request(), batchKey: nextKey });
    const checked = await session.recheck();
    assert.equal(sent.length, 1, "manual resend and replacement must remain blocked");
    assert.equal(first.status, "conflict");
    assert.equal(first.issue, issue);
    assert.equal(first.result, null);
    assert.equal(checked.status, "conflict");
    assert.deepEqual(checked.request, request());
    assert.deepEqual(queried, [batchKey], "receipt lookup is still available");
    assert.equal(getRecruitmentBatchMockView(first).confirmed, false);
  });
});

test("review P0-1 nested request and completed-result snapshots are isolated and frozen", async (t) => {
  for (const response of [applied(), rejected()]) await t.test(response.outcome, async () => {
    const session = createRecruitmentBatchMockSession({ apply: async () => response, lookup: lost });
    const first = await session.start(request());
    const expected = structuredClone(first);
    const exposed = session.getState();
    const retained = exposed.request;
    const result = exposed.result;
    assert.ok(retained && result);
    Reflect.set(exposed, "request", null);
    Reflect.set(exposed, "visible", false);
    Reflect.set(retained, "batchKey", nextKey);
    Reflect.set(retained.shiftIds, "0", shifts[2]);
    Reflect.set(result, "newApplicationCount", 999);
    if (result.outcome === "applied") {
      Reflect.set(result.appliedShiftIds, "0", shifts[2]);
      assert.ok(Object.isFrozen(result.appliedShiftIds));
    } else {
      Reflect.set(result.rejections[0]!, "reason", "internal diagnostics");
      Reflect.set(result.rejections, "0", { shiftId: shifts[2], reason: "not_eligible" });
      assert.ok(Object.isFrozen(result.rejections));
      assert.ok(Object.isFrozen(result.rejections[0]));
    }
    assert.deepEqual(session.getState(), expected);
    assert.ok(Object.isFrozen(exposed));
    assert.ok(Object.isFrozen(result));
    assert.notEqual(first.request, exposed.request);
    assert.notEqual(first.result, exposed.result);
  });
});

test("review P0-1 pending and blocked-start snapshots cannot alter the in-flight request", async () => {
  const gate = deferred<unknown>();
  let sends = 0;
  const session = createRecruitmentBatchMockSession({ apply: async () => { sends++; return gate.promise; }, lookup: lost });
  const first = session.start(request());
  const pending = session.getState();
  const blocked = await session.start({ ...request(), batchKey: nextKey });
  assert.notEqual(pending, blocked);
  Reflect.set(pending, "status", "success");
  Reflect.set(blocked, "request", null);
  assert.equal(session.getState().status, "pending");
  assert.deepEqual(session.getState().request, request());
  gate.resolve(applied());
  const completedState = await first;
  assert.equal(completedState.status, "success");
  assert.deepEqual(completedState.request, request());
  assert.equal(sends, 1);
});

test("review P0-2 malformed receipt conflict indicators also preserve the resend latch", async (t) => {
  const conflict = { ok: false, outcome: "IDEMPOTENCY_CONFLICT" };
  for (const [name, response] of [
    ["receipt envelope", conflict], ["completed result", completed(request(), conflict)],
    ["missing receipt request", { status: "completed", result: conflict }],
    ["mismatched receipt request", completed({ ...request(), projectId: otherProjectId }, conflict)],
  ] as const) await t.test(name, async () => {
    let sends = 0, lookups = 0;
    const session = createRecruitmentBatchMockSession({
      apply: async () => { sends++; return lost(); },
      lookup: async () => ++lookups === 1 ? response : completed(),
    });
    await session.start(request());
    const checked = await session.recheck();
    assert.equal(checked.status, "conflict");
    assert.equal(checked.issue, "invalid_conflict_response");
    assert.equal(checked.result, null);
    assert.deepEqual(checked.request, request());
    await session.retry();
    assert.equal(sends, 1);
    assert.equal((await session.recheck()).status, "success", "matching completed receipt can still resolve the request");
  });
});

test("review P2 closed fixture guarantees saved-success replay only; fresh-key wire is unspecified", async () => {
  const source = receiptFirstFixture();
  await source.apply(request());
  source.closeProject();
  await assert.rejects(source.apply({ ...request(), batchKey: nextKey }), /MOCK_CLOSED_NEW_KEY_UNSPECIFIED/);
  assert.deepEqual(await source.apply(request()), applied(request(), 2, 0, true));
  assert.deepEqual(source.applicationRows, request().shiftIds);
});
