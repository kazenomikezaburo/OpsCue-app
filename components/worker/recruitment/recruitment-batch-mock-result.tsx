"use client";

import { getRecruitmentBatchMockView, type RecruitmentBatchMockState } from "@/lib/worker/recruitment/recruitment-batch-mock-session";

/** Test-only presentation; existing RecruitmentBatchResult and Demo are unchanged. */
export function RecruitmentBatchMockResult({ state, onRecheck, onClose }: {
  state: RecruitmentBatchMockState;
  onRecheck?: () => void;
  onClose: () => void;
}) {
  if (!state.visible) return null;
  const view = getRecruitmentBatchMockView(state);
  return (
    <section aria-label="一括応募モックの結果" className="min-w-0 space-y-4 rounded-card border border-border bg-surface p-4 sm:p-5">
      <p className="text-xs font-semibold text-info-foreground">モック契約・実応募なし</p>
      <div role={view.alert ? "alert" : "status"} className="space-y-2">
        <h2 className="text-lg font-semibold text-foreground">{view.title}</h2>
        <p className="text-sm leading-6 text-foreground-secondary">{view.description}</p>
      </div>
      {view.rejections.length > 0 && <ul className="space-y-2 text-sm text-foreground-secondary">
        {view.rejections.map(({ shiftId, text }) => <li key={shiftId}><span>{shiftId}</span>：{text}</li>)}
      </ul>}
      <div className="flex flex-wrap gap-3">
        {view.canRecheck && onRecheck && <button type="button" onClick={onRecheck} className="min-h-11 rounded-control border border-border-strong px-4 py-2 text-sm font-semibold text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">同じ応募の結果を再確認</button>}
        <button type="button" onClick={onClose} className="min-h-11 rounded-control px-4 py-2 text-sm font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">閉じる</button>
      </div>
    </section>
  );
}
