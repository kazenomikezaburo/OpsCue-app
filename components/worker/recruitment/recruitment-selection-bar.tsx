"use client";

import { useId } from "react";
import type { RecruitmentSelection } from "@/lib/worker/recruitment/project-recruitment-types";
import { canSubmitRecruitmentSelection, MAX_RECRUITMENT_SELECTION } from "@/lib/worker/recruitment/recruitment-selection";

export type RecruitmentSelectionBarProps = {
  selection: RecruitmentSelection;
  holdReason: string | null;
  onConfirm: () => void;
};

export function RecruitmentSelectionBar({ selection, holdReason, onConfirm }: RecruitmentSelectionBarProps) {
  const id = useId();
  const structuralReason = selection.length === 0 ? "シフトを1件以上選択してください。"
    : selection.length > MAX_RECRUITMENT_SELECTION ? "選択できるのは10件までです。"
    : !canSubmitRecruitmentSelection(selection) ? "選択に重複・別案件・不正なIDが含まれています。" : null;
  const reason = holdReason ?? structuralReason;
  return (
    // In normal flow: cannot cover the existing fixed Worker navigation or rows.
    <section aria-label="選択内容の確認" className="mt-6 space-y-3 rounded-card border border-border bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p role="status" className="text-sm text-foreground-secondary">{selection.length}シフト選択中（最大10件）</p>
        <button type="button" disabled={reason !== null} aria-describedby={id}
          onClick={() => { if (reason === null) onConfirm(); }}
          className="min-h-12 rounded-control bg-link px-5 py-3 text-sm font-semibold text-foreground-inverse hover:bg-link-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-foreground-disabled">
          応募内容を確認
        </button>
      </div>
      <p id={id} className={`text-xs leading-5 ${reason ? "text-warning-foreground" : "text-foreground-muted"}`}>{reason ?? "次の画面で内容を確認します。この操作では応募は送信されません。"}</p>
    </section>
  );
}
