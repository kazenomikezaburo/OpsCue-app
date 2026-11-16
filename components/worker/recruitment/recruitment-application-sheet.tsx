"use client";

import { useEffect, useId, useRef } from "react";
import type { ProjectRecruitmentDetailDTO, RecruitmentSelection } from "@/lib/worker/recruitment/project-recruitment-types";
import { normalizeRecruitmentUuid, projectRecruitmentDetailSchema, recruitmentTimeZone } from "@/lib/worker/recruitment/project-recruitment-schema";
import { canSubmitRecruitmentSelection } from "@/lib/worker/recruitment/recruitment-selection";
import { DialogFocusGuard, trapDialogFocus } from "@/components/admin/dialog-focus";
import { getRecruitmentShiftHoldReason } from "./recruitment-shift-row";
import { RecruitmentState } from "./recruitment-state";

export type RecruitmentApplicationSheetProps = {
  open: boolean;
  detail: ProjectRecruitmentDetailDTO | null;
  selection: RecruitmentSelection;
  onClose: () => void;
  onBack: () => void;
  /** UI confirmation only. Must not submit an application or imply receipt. */
  onConfirm: (selection: RecruitmentSelection) => void;
  /** Runs after the native dialog close event, following focus restoration. */
  onAfterClose?: () => void;
};

const dateTime = new Intl.DateTimeFormat("ja-JP", {
  timeZone: recruitmentTimeZone, year: "numeric", month: "numeric", day: "numeric",
  hour: "2-digit", minute: "2-digit", hour12: false,
});

export function RecruitmentApplicationSheet({ open, detail, selection, onClose, onBack, onConfirm, onAfterClose }: RecruitmentApplicationSheetProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const id = useId();
  const parsed = projectRecruitmentDetailSchema.safeParse(detail);
  const data = parsed.success ? parsed.data : null;
  const selected = selection.map((reference) => data?.shifts.find((shift) =>
    shift.projectId === normalizeRecruitmentUuid(reference.projectId)
    && shift.shiftId === normalizeRecruitmentUuid(reference.shiftId)));
  const holdReason = !canSubmitRecruitmentSelection(selection) ? "同じ案件のシフトを重複なく1〜10件選択してください。"
    : data === null || data.project.projectName.trim() === "" ? "案件情報を確認できません。"
    : selected.some((shift) => shift === undefined || shift.jobName.trim() === "") ? "選択したシフトの情報を確認できません。"
    : selected.some((shift) => shift && getRecruitmentShiftHoldReason(shift) !== null) ? "選択したシフトの応募可否を確認してください。" : null;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !open) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (!dialog.open) dialog.showModal();
    headingRef.current?.focus();
    return () => {
      if (dialog.open) dialog.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [open]);

  const secondary = "min-h-12 rounded-control border border-border-strong px-4 py-3 text-sm font-semibold text-link hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring";
  return (
    <dialog ref={dialogRef} aria-labelledby={`${id}-title`} aria-describedby={`${id}-notice`}
      onCancel={(event) => { event.preventDefault(); onClose(); }} onClose={onAfterClose} onKeyDown={trapDialogFocus}
      className="fixed inset-x-0 bottom-0 top-auto m-0 mx-auto max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-t-panel border border-border bg-surface p-0 text-foreground shadow-ds-overlay backdrop:bg-[var(--surface-overlay)] sm:inset-y-0 sm:my-auto sm:rounded-panel">
      <DialogFocusGuard edge="start" />
      <header className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-border bg-surface p-4 sm:p-5">
        <h2 id={`${id}-title`} ref={headingRef} tabIndex={-1} className="min-w-0 text-xl font-semibold leading-7 focus-visible:outline-2 focus-visible:outline-focus-ring">応募内容を確認</h2>
        <button type="button" onClick={onClose} className={secondary}>閉じる</button>
      </header>
      <div className="space-y-4 p-4 sm:p-5">
        <p id={`${id}-notice`} className="rounded-control bg-info-subtle px-3 py-2 text-sm font-semibold text-info-foreground">{data?.source === "synthetic" ? "デモ用データ・実応募なし" : "UI確認用・実応募なし"}</p>
        <p className="text-sm text-foreground-secondary">{selection.length}シフトの選択内容です。まだ応募は受け付けられていません。</p>
        {data === null ? <RecruitmentState state="error" /> : <>
          <h3 className="break-words rounded-card border border-border p-3 text-base font-semibold">{data.project.projectName}</h3>
          <ul className="space-y-3">{selected.map((shift, index) => shift ? <li key={index} className="space-y-2 rounded-card border border-border p-3 text-sm">
            <p className="break-words font-semibold">{shift.jobName}</p>
            <p className="text-xs leading-5 text-foreground-secondary">{dateTime.format(new Date(shift.startsAt))} 〜 {dateTime.format(new Date(shift.endsAt))}（日本時間）</p>
            <p className="break-words text-xs text-foreground-secondary">{shift.workplaceName ?? "会場は確認中"}</p>
            <p className="text-xs text-foreground-secondary">{shift.hourlyWage === null ? "時給は確認中" : `時給 ${shift.hourlyWage.toLocaleString("ja-JP")}円`}</p>
            {shift.safeReasonText !== null && <p className="break-words text-xs text-foreground-secondary">補足情報：{shift.safeReasonText}</p>}
          </li> : <li key={index} className="text-sm text-warning-foreground">シフト情報は確認中です。</li>)}</ul>
        </>}
        {holdReason && <p id={`${id}-hold`} role="alert" className="text-sm text-warning-foreground">{holdReason}</p>}
        <p className="text-xs leading-5 text-foreground-muted">この確認操作は実応募を送信しません。応募受付・採用・配置の確定を意味しません。</p>
      </div>
      <footer className="sticky bottom-0 flex flex-wrap justify-between gap-3 border-t border-border bg-surface p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-5">
        <button type="button" onClick={onBack} className={secondary}>戻る</button>
        <button type="button" disabled={holdReason !== null} aria-describedby={holdReason ? `${id}-hold` : `${id}-notice`}
          onClick={() => { if (holdReason === null) onConfirm(selection.map((shift) => ({ projectId: normalizeRecruitmentUuid(shift.projectId), shiftId: normalizeRecruitmentUuid(shift.shiftId) }))); }}
          className="min-h-12 rounded-control bg-link px-4 py-3 text-sm font-semibold text-foreground-inverse hover:bg-link-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-foreground-disabled">内容を確認（送信なし）</button>
      </footer>
      <DialogFocusGuard edge="end" />
    </dialog>
  );
}
