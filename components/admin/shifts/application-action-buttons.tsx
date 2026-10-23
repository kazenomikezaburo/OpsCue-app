"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  acceptShiftApplication,
  rejectShiftApplication,
} from "@/app/actions/shift-applications";
import type { ApplicationReviewWarning } from "@/lib/admin/shifts/application-action-types";

const warningLabels: Record<string, string> = {
  OVERLAPS_OWN_ASSIGNMENT: "時間が重なる別の勤務に配置済みです",
  OVERLAPS_OWN_ACCEPTED_APPLICATION: "時間が重なる別の勤務の応募を承認済みです",
};

const timeRange = new Intl.DateTimeFormat("ja-JP", {
  timeZone: "Asia/Tokyo",
  month: "numeric",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export function ApplicationActionButtons({
  shiftId,
  applicationId,
  workerName,
}: {
  shiftId: string;
  applicationId: string;
  workerName: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [warnings, setWarnings] = useState<ApplicationReviewWarning[]>([]);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  // One key per decision. It is kept while the result is uncertain or while a
  // warning confirmation is pending, so the retry is idempotent.
  const keys = useRef<{ accept: string | null; reject: string | null }>({ accept: null, reject: null });

  const run = (decision: "accept" | "reject", acknowledgeWarnings = false) => {
    if (decision === "reject" && !window.confirm(`${workerName}さんを不採用にしますか？`)) return;
    setError("");
    if (!keys.current[decision]) keys.current[decision] = crypto.randomUUID();
    const key = keys.current[decision]!;
    startTransition(async () => {
      try {
        const result = decision === "accept"
          ? await acceptShiftApplication(shiftId, applicationId, key, acknowledgeWarnings)
          : await rejectShiftApplication(shiftId, applicationId, key);
        if (!result.ok) {
          setError(result.message);
          setWarnings(result.warnings ?? []);
          setNeedsConfirmation(result.confirmationRequired === true);
          if (!result.retryable && !result.confirmationRequired) keys.current[decision] = null;
          return;
        }
        keys.current[decision] = null;
        setWarnings([]);
        setNeedsConfirmation(false);
        router.refresh();
      } catch {
        setError("通信結果を確認できませんでした。同じ操作を再度お試しください。");
      }
    });
  };

  return <div className="mt-3 sm:mt-0"><div className="flex flex-wrap gap-2"><button type="button" disabled={isPending} onClick={() => run("accept")} className="min-h-10 rounded-md bg-blue-700 px-4 text-xs font-semibold text-white hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:bg-slate-400">{isPending ? "処理中..." : "承認"}</button><button type="button" disabled={isPending} onClick={() => run("reject")} className="min-h-10 rounded-md border border-red-300 px-4 text-xs font-semibold text-red-700 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400">{isPending ? "処理中..." : "不採用"}</button></div>{error && <div role="alert" className="mt-2 max-w-xs text-sm text-red-700"><p>{error}</p>{warnings.length > 0 && <ul className="mt-1 space-y-0.5 text-xs">{warnings.map((warning) => <li key={`${warning.code}:${warning.shiftId}`}>・{warningLabels[warning.code] ?? "確認が必要な勤務があります"}（{timeRange.format(new Date(warning.startsAt))}〜{timeRange.format(new Date(warning.endsAt))}）</li>)}</ul>}{needsConfirmation && <button type="button" disabled={isPending} onClick={() => run("accept", true)} className="mt-2 min-h-10 rounded-md border border-blue-300 px-4 text-xs font-semibold text-blue-800 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:text-slate-400">内容を確認して承認する</button>}</div>}</div>;
}
