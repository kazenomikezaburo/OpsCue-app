"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  applyToOwnShift,
  withdrawOwnShiftApplication,
  type WorkerApplicationActionResult,
} from "@/app/actions/worker-shift-applications";
import type { RecruitmentShift } from "@/lib/worker/recruitment/get-worker-recruitment";

type ApplicationRequest = {
  shiftId: string;
  operation: "apply" | "withdraw";
  idempotencyKey: string;
  phase: "pending" | "unknown";
};

const initialState: WorkerApplicationActionResult = {
  ok: false,
  outcome: "idle",
  message: "",
  retryable: false,
  applicationState: null,
  replayed: false,
};

const unknownResult: WorkerApplicationActionResult = {
  ...initialState,
  outcome: "unknown",
  message: "操作の結果は未確定です。自動再送は行いません。再試行する場合も、同じ勤務・操作・操作情報を使用します。",
  retryable: true,
};

// These outcomes are produced by the existing RPC decision, not its auth guard.
const businessRejections = new Set([
  "not_eligible",
  "deadline_passed",
  "capacity_full",
  "not_recruiting",
  "already_assigned",
  "application_accepted",
  "application_rejected",
  "application_withdrawn",
]);

function canResolveRequest(request: ApplicationRequest, response: WorkerApplicationActionResult) {
  if (!response || response.retryable !== false || response.outcome === "unknown") return false;

  if (response.ok === true) {
    const applying = request.operation === "apply";
    const outcomes = applying ? ["applied", "existing_applied"] : ["withdrawn", "already_withdrawn"];
    return outcomes.includes(response.outcome) && response.applicationState === (applying ? "applied" : "withdrawn");
  }
  if (response.ok !== false) return false;

  const businessRejection = businessRejections.has(response.outcome);
  // A completed receipt is replayed only after its operation and shift match.
  if (response.replayed === true) return businessRejection || response.outcome === "unavailable";

  // Without a replay, a refusal cannot settle a previously uncertain attempt.
  // "unavailable" may also come from auth before the RPC, even on the first call.
  return request.phase === "pending" && businessRejection;
}

export function WorkerRecruitmentApplicationControls({
  shiftId,
  state,
}: {
  shiftId: string;
  state: RecruitmentShift["state"];
}) {
  const router = useRouter();
  const requestRef = useRef<ApplicationRequest | null>(null);
  const inFlight = useRef(false);
  const restoreFocus = useRef(false);
  const [request, setRequest] = useState<ApplicationRequest | null>(null);
  const [result, setResult] = useState(initialState);
  const [pending, startTransition] = useTransition();
  const canStart = ["available", "available_with_warning", "applied"].includes(state);
  const differentShift = request !== null && request.shiftId !== shiftId;
  const operation = request?.operation ?? (state === "applied" ? "withdraw" : "apply");
  const withdrawing = operation === "withdraw";
  const unknown = request?.phase === "unknown";

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // The ref closes the gap before React renders the disabled button.
    if (inFlight.current || pending) return;

    const retained = requestRef.current;
    if ((retained && retained.shiftId !== shiftId) || (!retained && !canStart)) return;
    const current = retained ?? {
      shiftId,
      operation: state === "applied" ? "withdraw" as const : "apply" as const,
      idempotencyKey: crypto.randomUUID(),
      phase: "pending" as const,
    };
    requestRef.current = current;
    restoreFocus.current = event.currentTarget?.contains(document.activeElement) ?? false;
    inFlight.current = true;
    setRequest(current);
    setResult(initialState);

    startTransition(async () => {
      try {
        let response: WorkerApplicationActionResult;
        try {
          const command = current.operation === "withdraw" ? withdrawOwnShiftApplication : applyToOwnShift;
          response = await command({ shiftId: current.shiftId, idempotencyKey: current.idempotencyKey });
        } catch {
          response = unknownResult;
        }

        if (!canResolveRequest(current, response)) {
          // Keep uncertainty with the exact command, independently of new props.
          const unresolved: ApplicationRequest = { ...current, phase: "unknown" };
          requestRef.current = unresolved;
          setRequest(unresolved);
          setResult(unknownResult);
          return;
        }

        requestRef.current = null;
        setRequest(null);
        setResult(response);
        router.refresh();
      } finally {
        inFlight.current = false;
      }
    });
  }

  function focusAfterSubmit(element: HTMLElement | null) {
    if (element && restoreFocus.current && !pending && document.activeElement === document.body) {
      element.focus({ preventScroll: true });
    }
  }

  if (!request && !canStart) {
    return result.message ? (
      <p ref={focusAfterSubmit} tabIndex={-1} className={`mt-3 text-sm ${result.ok ? "text-emerald-700" : "text-red-700"}`} role={result.ok ? "status" : "alert"}>
        {result.message}
      </p>
    ) : null;
  }

  return (
    <form onSubmit={submit} aria-busy={pending} className="mt-5">
      <button
        ref={focusAfterSubmit}
        type="submit"
        disabled={pending || differentShift}
        className={withdrawing
          ? "min-h-11 rounded-lg border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-900 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
          : "min-h-11 rounded-lg bg-blue-700 px-5 text-sm font-semibold text-white hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:bg-slate-400"}
      >
        {pending
          ? (withdrawing ? "取下げ中..." : "応募中...")
          : unknown
            ? (withdrawing ? "同じ取下げを再試行する" : "同じ応募を再試行する")
            : (withdrawing ? "応募を取り下げる" : "応募する")}
      </button>
      {differentShift ? (
        <p className="mt-3 text-sm text-red-700" role="alert">
          前の勤務への操作結果が未確定です。この画面では別の操作を送信できません。元の勤務で結果を確認してください。
        </p>
      ) : result.message && (
        <p className={`mt-3 text-sm ${result.ok ? "text-emerald-700" : "text-red-700"}`} role={result.ok ? "status" : "alert"}>
          {result.message}
        </p>
      )}
    </form>
  );
}
