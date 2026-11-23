import {
  inspectRecruitmentBatchMockReceipt, inspectRecruitmentBatchMockReply, recruitmentBatchMockRequestSchema,
  type RecruitmentBatchMockIssue, type RecruitmentBatchMockObservation,
  type RecruitmentBatchMockRequest, type RecruitmentBatchMockResult,
} from "./recruitment-batch-mock-contract";

type RetainedRequest = Readonly<Omit<RecruitmentBatchMockRequest, "shiftIds"> & { shiftIds: readonly string[] }>;
type Common = Readonly<{ visible: boolean }>;
type InternalState = Common & (
  | { status: "idle"; request: null; result: null; issue: "invalid_request" | null }
  | { status: "pending" | "unknown" | "conflict"; request: RetainedRequest; result: null; issue: RecruitmentBatchMockIssue | null }
  | { status: "success"; request: RetainedRequest; result: Extract<RecruitmentBatchMockResult, { outcome: "applied" }>; issue: null }
  | { status: "rejected"; request: RetainedRequest; result: Extract<RecruitmentBatchMockResult, { outcome: "batch_rejected" }>; issue: null }
);
// Public snapshots are detached data, deeply readonly in TypeScript and at runtime.
type ReadonlySnapshot<T> = T extends object ? { readonly [K in keyof T]: ReadonlySnapshot<T[K]> } : T;
export type RecruitmentBatchMockState = ReadonlySnapshot<InternalState>;
export type RecruitmentBatchMockSource = Readonly<{
  apply: (request: RetainedRequest) => Promise<unknown>;
  lookup: (batchKey: string) => Promise<unknown>;
}>;

/** Memory-only mock harness. Nothing binds this to Actions/RPCs or a route.
 * The session must outlive its result view. Reload persistence is BLOCKED.
 */
export function createRecruitmentBatchMockSession(source: RecruitmentBatchMockSource) {
  let state: InternalState = { status: "idle", request: null, result: null, visible: false, issue: null };
  let busy = false;
  let conflict = false;
  const usedKeys = new Set<string>();
  function snapshot(): RecruitmentBatchMockState {
    const copy = structuredClone(state);
    if (copy.request) {
      Object.freeze(copy.request.shiftIds);
      Object.freeze(copy.request);
    }
    if (copy.result) {
      if (copy.result.outcome === "applied") Object.freeze(copy.result.appliedShiftIds);
      else {
        copy.result.rejections.forEach((rejection) => Object.freeze(rejection));
        Object.freeze(copy.result.rejections);
      }
      Object.freeze(copy.result);
    }
    return Object.freeze(copy);
  }
  const terminal = () => state.status === "success" || state.status === "rejected";
  function unresolved(issue: RecruitmentBatchMockIssue) {
    if (!state.request) return;
    if (issue === "idempotency_conflict" || issue === "invalid_conflict_response") conflict = true;
    state = { status: conflict ? "conflict" : "unknown", request: state.request, result: null, visible: state.visible, issue };
  }
  function accept(observation: RecruitmentBatchMockObservation) {
    if (observation.status === "unresolved") { unresolved(observation.issue); return; }
    if (!state.request) return;
    const common = { request: state.request, visible: state.visible, issue: null };
    state = observation.result.outcome === "applied"
      ? { ...common, status: "success", result: observation.result }
      : { ...common, status: "rejected", result: observation.result };
    conflict = false;
  }
  async function perform(kind: "apply" | "lookup") {
    if (!state.request || busy || terminal() || (kind === "apply" && conflict)) return snapshot();
    const retained = state.request;
    const request = { ...retained, shiftIds: [...retained.shiftIds] };
    busy = true;
    state = { status: "pending", request: retained, result: null, visible: state.visible, issue: null };
    try {
      const response = kind === "apply" ? await source.apply(retained) : await source.lookup(retained.batchKey);
      accept(kind === "apply" ? inspectRecruitmentBatchMockReply(request, response) : inspectRecruitmentBatchMockReceipt(request, response));
    } catch {
      // No exception message, SQLSTATE, or retryable flag proves non-execution.
      unresolved("transport_unknown");
    } finally { busy = false; }
    return snapshot();
  }
  return {
    getState: snapshot,
    async start(input: unknown) {
      if (busy || (state.request && !terminal())) return snapshot();
      const parsed = recruitmentBatchMockRequestSchema.safeParse(input);
      if (!parsed.success) {
        // A bad new input cannot erase the previously displayed completed result.
        if (!state.request) state = { status: "idle", request: null, result: null, visible: true, issue: "invalid_request" };
        return snapshot();
      }
      // No key generation here, and no completed key can be reused for a new operation.
      if (usedKeys.has(parsed.data.batchKey)) return snapshot();
      usedKeys.add(parsed.data.batchKey);
      const request = Object.freeze({ ...parsed.data, shiftIds: Object.freeze([...parsed.data.shiftIds]) });
      conflict = false;
      state = { status: "pending", request, result: null, visible: true, issue: null };
      return perform("apply");
    },
    /** Explicit user action only; never scheduled automatically. */
    retry: () => perform("apply"),
    recheck: () => perform("lookup"),
    close() { state = { ...state, visible: false }; return snapshot(); },
    reopen() { state = { ...state, visible: true }; return snapshot(); },
  };
}

const reasonText = {
  not_eligible: "応募条件を満たしていません。", deadline_passed: "応募期限を過ぎています。",
  capacity_full: "募集枠が埋まっています。", not_recruiting: "現在は募集していません。",
  already_assigned: "この勤務にはすでに割り当てられています。", application_accepted: "すでに採用済みです。",
  application_rejected: "この応募は不採用になっています。", application_withdrawn: "この応募は取り下げ済みです。",
} as const;

/** Display model for mock-only UI. Validation and recovery stay outside React. */
export function getRecruitmentBatchMockView(state: RecruitmentBatchMockState) {
  const result = state.result;
  const confirmed = state.status === "success" || state.status === "rejected";
  const title = state.status === "success" ? "モック：応募受付の表示例"
    : state.status === "rejected" ? "モック：全体拒否の表示例"
    : state.status === "conflict" ? "応募キーと内容の照合が必要です"
    : state.status === "pending" ? "受付結果を確認しています" : "応募結果は未確定です";
  const description = result?.outcome === "applied"
    ? `新規 ${result.newApplicationCount}件・既応募 ${result.alreadyAppliedCount}件。応募受付は採用・配置の確定ではありません。`
    : result?.outcome === "batch_rejected"
      ? "この一括応募による新規応募は0件です。理由がないシフトも受付成功にはなりません。"
      : state.status === "conflict"
        ? "同じキーと要求内容を保持しています。自動再送・自動破棄は行いません。結果を照会してください。"
        : "成功・失敗を断定せず、同じbatchKey・案件・選択を保持してください。";
  return {
    title, description, confirmed,
    canRecheck: !confirmed && state.status !== "idle" && state.status !== "pending",
    alert: state.status === "rejected" || state.status === "conflict",
    rejections: result?.outcome === "batch_rejected"
      ? result.rejections.map(({ shiftId, reason }) => ({ shiftId, text: reasonText[reason] })) : [],
  };
}
