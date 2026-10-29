"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { assignWorkerToShift } from "@/app/actions/assignments";
import type { AssignmentBlockingReason } from "@/lib/admin/shifts/assignment-action-types";

export function AssignmentActionButton({
  shiftId,
  workerId,
  workerName,
}: {
  shiftId: string;
  workerId: string;
  workerName: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [reasons, setReasons] = useState<AssignmentBlockingReason[]>([]);
  // Keep the same key while the result is uncertain, so a retry is idempotent.
  const operationKey = useRef<string | null>(null);

  const assign = () => {
    if (!window.confirm(`${workerName}さんをこのシフトに配置しますか？`)) return;
    setError("");
    setReasons([]);
    if (!operationKey.current) operationKey.current = crypto.randomUUID();
    const key = operationKey.current;
    startTransition(async () => {
      try {
        const result = await assignWorkerToShift(shiftId, workerId, key);
        if (!result.ok) {
          setError(result.message);
          setReasons(result.blockingReasons ?? []);
          if (!result.retryable) operationKey.current = null;
          return;
        }
        operationKey.current = null;
        router.refresh();
      } catch {
        setError("通信結果を確認できませんでした。同じ操作を再度お試しください。");
      }
    });
  };

  return <div className="mt-3 sm:mt-0"><button type="button" disabled={isPending} onClick={assign} className="min-h-10 rounded-md bg-emerald-700 px-4 text-xs font-semibold text-white hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:bg-slate-400">{isPending ? "配置中..." : "配置する"}</button>{error && <div role="alert" className="mt-2 max-w-xs text-sm text-red-700"><p>{error}</p>{reasons.length > 0 && <ul className="mt-1 space-y-0.5 text-xs">{reasons.map((reason) => <li key={reason.code}>・{reason.label}</li>)}</ul>}</div>}</div>;
}
