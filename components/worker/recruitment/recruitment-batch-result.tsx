"use client";

import type { RecruitmentBatchResultDTO } from "@/lib/worker/recruitment/project-recruitment-types";
import { recruitmentBatchResultSchema } from "@/lib/worker/recruitment/project-recruitment-schema";

export type RecruitmentBatchResultProps = {
  result: RecruitmentBatchResultDTO;
  source: "synthetic" | "backend-proposal";
  /** Presentation evidence only, NOT a receipt RPC response or authorization.
   * C-03: future integration must establish evidence for this exact request.
   */
  receiptEvidence: "unconfirmed" | "confirmed";
  /** Recheck this request only; must not submit with a different batchKey. */
  onRecheck?: (request: RecruitmentBatchResultDTO["request"]) => void;
  onClose: () => void;
};

export function RecruitmentBatchResult({ result, source, receiptEvidence, onRecheck, onClose }: RecruitmentBatchResultProps) {
  const parsed = recruitmentBatchResultSchema.safeParse(result);
  const value = parsed.success ? parsed.data : null;
  const synthetic = source === "synthetic";
  const confirmed = receiptEvidence === "confirmed";
  const success = value?.status === "success" && confirmed;
  const rejected = value?.status === "rejected" && confirmed;
  const pending = value?.status === "pending";
  const title = pending ? "受付結果を確認しています"
    : success ? synthetic ? "デモ：応募受付の表示例" : "応募を受け付けました"
    : rejected ? synthetic ? "デモ：全体拒否の表示例" : "今回の応募は受け付けられませんでした"
    : "応募結果は未確定です";
  const description = pending ? "まだ成功・失敗は確定していません。"
    : success ? "応募受付は採用・配置の確定ではありません。"
    : rejected ? "この一括応募による新規応募は0件です。"
    : "受付済みかどうかを確認できません。成功・失敗を断定せず、別のbatchKeyで再送しないでください。";
  return (
    <section aria-label="一括応募の結果" className="min-w-0 space-y-4 rounded-card border border-border bg-surface p-4 sm:p-5">
      <p className="text-xs font-semibold text-info-foreground">{synthetic ? "デモ用データ・実応募なし" : "暫定結果表示・正式receipt契約は未確定"}</p>
      <div role={rejected ? "alert" : "status"} className="space-y-2">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <p className="text-sm leading-6 text-foreground-secondary">{description}</p>
      </div>
      <div className="flex flex-wrap gap-3">
        {!success && !rejected && value && onRecheck && <button type="button" onClick={() => onRecheck(value.request)} className="min-h-11 rounded-control border border-border-strong px-4 py-2 text-sm font-semibold text-foreground hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">同じ応募の結果を再確認</button>}
        <button type="button" onClick={onClose} className="min-h-11 rounded-control px-4 py-2 text-sm font-semibold text-link hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">閉じる</button>
      </div>
    </section>
  );
}
