"use client";

import { useState } from "react";
import type { ProjectRecruitmentDetailDTO, RecruitmentSelection, RecruitmentSelectionError, RecruitmentShiftDTO } from "@/lib/worker/recruitment/project-recruitment-types";
import { normalizeRecruitmentUuid } from "@/lib/worker/recruitment/project-recruitment-schema";
import { addRecruitmentShift, removeRecruitmentShift, canSubmitRecruitmentSelection, getRecruitmentStartDate, MAX_RECRUITMENT_SELECTION } from "@/lib/worker/recruitment/recruitment-selection";
import { RecruitmentShiftRow, getRecruitmentShiftHoldReason } from "./recruitment-shift-row";
import { RecruitmentSelectionBar } from "./recruitment-selection-bar";

export type ProjectRecruitmentDetailProps = {
  detail: ProjectRecruitmentDetailDTO | null;
  status: "loading" | "ready" | "error" | "not_found";
  selection: RecruitmentSelection;
  onSelectionChange: (selection: RecruitmentSelection) => void;
  onBack: () => void;
  onConfirm: () => void;
  onRetry?: () => void;
};

const selectionMessages: Record<RecruitmentSelectionError, string> = {
  invalid_identity: "シフト情報を確認できません。", mixed_projects: "同じ案件のシフトだけを選択してください。",
  duplicate_shift: "同じシフトを重複して選択できません。", limit_exceeded: "選択できるのは10件までです。",
};

export function ProjectRecruitmentDetail({ detail, status, selection, onSelectionChange, onBack, onConfirm, onRetry }: ProjectRecruitmentDetailProps) {
  const [operationError, setOperationError] = useState<string | null>(null);
  const groups = new Map<string, RecruitmentShiftDTO[]>();
  for (const shift of detail?.shifts ?? []) {
    const day = getRecruitmentStartDate(shift.startsAt) ?? "勤務開始日は確認中";
    groups.set(day, [...(groups.get(day) ?? []), shift]);
  }
  const projectId = detail ? normalizeRecruitmentUuid(detail.project.projectId) : null;
  const selectedShifts = selection.map((reference) => detail?.shifts.find((shift) =>
    normalizeRecruitmentUuid(shift.projectId) === normalizeRecruitmentUuid(reference.projectId)
    && normalizeRecruitmentUuid(shift.shiftId) === normalizeRecruitmentUuid(reference.shiftId)));
  const foreignSelection = selection.some((reference) => normalizeRecruitmentUuid(reference.projectId) !== projectId);
  const invalidDetail = detail !== null && (
    detail.shifts.some((shift) => normalizeRecruitmentUuid(shift.projectId) !== projectId)
    || new Set(detail.shifts.map((shift) => normalizeRecruitmentUuid(shift.shiftId))).size !== detail.shifts.length
  );
  const holdReason = status !== "ready" || detail === null ? "案件情報を確認できません。"
    : invalidDetail ? "案件に不整合なシフト情報が含まれています。"
    : foreignSelection ? "別案件の選択が残っています。親画面で選択を見直してください。"
    : selectedShifts.some((shift) => shift === undefined) ? "選択したシフトを確認できません。選択を見直してください。"
    : selectedShifts.some((shift) => shift && getRecruitmentShiftHoldReason(shift) !== null) ? "選択したシフトの応募可否を確認してください。" : null;

  function changeSelection(shift: RecruitmentShiftDTO, selected: boolean) {
    if (!selected) {
      setOperationError(null);
      onSelectionChange(removeRecruitmentShift(selection, shift));
      return;
    }
    const reason = getRecruitmentShiftHoldReason(shift);
    if (status !== "ready" || invalidDetail || reason !== null) {
      setOperationError(reason ?? "案件情報を確認できません。");
      return;
    }
    const result = addRecruitmentShift(selection, shift);
    if (!result.ok) { setOperationError(selectionMessages[result.reason]); return; }
    setOperationError(null);
    onSelectionChange(result.selection);
  }

  const buttonClass = "min-h-11 rounded-control px-3 text-sm font-semibold text-link hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring";
  return (
    <section aria-label="案件の募集詳細" aria-busy={status === "loading"} className="mx-auto w-full min-w-0 max-w-3xl px-4 py-6 sm:px-8">
      <button type="button" onClick={onBack} className={buttonClass}>‹ 募集一覧</button>
      <p className="mt-3 rounded-control bg-info-subtle px-3 py-2 text-sm font-semibold text-info-foreground">{detail?.source === "synthetic" ? "デモ用データ・実応募なし" : "UI確認用・実応募なし"}</p>
      {status === "loading" ? <p role="status" className="mt-6 text-sm text-foreground-secondary">案件情報を読み込んでいます…</p>
        : status === "not_found" ? <div className="mt-6 space-y-3"><h1 className="text-xl font-semibold">404：案件を表示できません</h1><p role="status" className="text-sm text-foreground-secondary">案件が見つからないか、現在表示できません。募集一覧から選び直してください。</p></div>
        : status === "error" || detail === null ? <div role="alert" className="mt-6 space-y-3"><p>案件情報を取得できませんでした。</p>{onRetry && <button type="button" onClick={onRetry} className={buttonClass}>再読み込み</button>}</div>
        : <>
          <header className="mt-4 space-y-3"><h1 className="break-words text-xl font-semibold leading-7 text-foreground">{detail.project.projectName}</h1>{detail.project.description !== null && <p className="whitespace-pre-wrap break-words text-sm text-foreground-secondary">{detail.project.description}</p>}</header>
          <div className="mt-6 space-y-4">
            <h2 className="text-base font-semibold text-foreground">応募するシフト</h2>
            <p className="text-xs text-foreground-secondary">同じ案件から1〜10件選択してください。日時は日本時間です。</p>
            {invalidDetail ? <p role="alert" className="text-sm text-danger">案件のシフト情報を確認できません。</p>
              : detail.shifts.length === 0 ? <p role="status" className="rounded-card border border-border bg-surface p-4 text-sm text-foreground-secondary">現在表示できる公開シフトはありません。</p>
              : [...groups].map(([day, shifts]) => <fieldset key={day} className="min-w-0 rounded-card border border-border bg-surface p-3 sm:p-4"><legend className="px-1 text-base font-semibold text-foreground">{day}</legend><ul className="space-y-3">{shifts.map((shift) => {
                const selected = selection.some((item) => normalizeRecruitmentUuid(item.projectId) === normalizeRecruitmentUuid(shift.projectId) && normalizeRecruitmentUuid(item.shiftId) === normalizeRecruitmentUuid(shift.shiftId));
                return <RecruitmentShiftRow key={normalizeRecruitmentUuid(shift.shiftId)} shift={shift} selected={selected}
                  additionalHoldReason={foreignSelection ? "別案件の選択を見直してください。" : !selected && selection.length >= MAX_RECRUITMENT_SELECTION ? "選択できるのは10件までです。" : null}
                  onSelectedChange={(value) => changeSelection(shift, value)} />;
              })}</ul></fieldset>)}
          </div>
        </>}
      {operationError && <p role="alert" className="mt-4 text-sm text-danger">{operationError}</p>}
      <RecruitmentSelectionBar selection={selection} holdReason={holdReason} onConfirm={() => {
        if (holdReason === null && canSubmitRecruitmentSelection(selection)) onConfirm();
      }} />
    </section>
  );
}
