"use client";

import { useId } from "react";
import { getRecruitmentStartDate } from "@/lib/worker/recruitment/recruitment-selection";

export type RecruitmentDateFilterProps = {
  value: string | null;
  /** YYYY-MM-DD dates, supplied in the desired display order; no automatic today. */
  dates: readonly string[];
  /** Parent owns the date, cursor reset and replacement of stale page results. */
  onDateChange: (date: string | null) => void;
  disabled?: boolean;
};

function isCalendarDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
    && getRecruitmentStartDate(`${value}T00:00:00+09:00`) === value;
}

export function RecruitmentDateFilter({ value, dates, onDateChange, disabled = false }: RecruitmentDateFilterProps) {
  const inputId = useId();
  const hintId = `${inputId}-hint`;
  const invalidValue = value !== null && !isCalendarDate(value);
  const visibleDates = [...new Set(dates.filter(isCalendarDate))];
  const chip = "min-h-11 shrink-0 rounded-control border px-3 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:text-foreground-disabled";
  return (
    <fieldset disabled={disabled} className="min-w-0 space-y-3">
      <legend className="text-sm font-semibold text-foreground">勤務開始日で絞り込む</legend>
      <div className="flex max-w-full gap-2 overflow-x-auto px-1 py-1" role="group" aria-label="日付の候補">
        <button type="button" aria-pressed={value === null} className={`${chip} ${value === null ? "border-info bg-info-subtle text-link" : "border-border bg-surface text-foreground-secondary hover:bg-surface-hover"}`} onClick={() => onDateChange(null)}>すべて</button>
        {visibleDates.map((date) => <button key={date} type="button" aria-label={date} aria-pressed={value === date} className={`${chip} ${value === date ? "border-info bg-info-subtle text-link" : "border-border bg-surface text-foreground-secondary hover:bg-surface-hover"}`} onClick={() => onDateChange(date)}>{Number(date.slice(5, 7))}/{Number(date.slice(8, 10))}</button>)}
      </div>
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <label htmlFor={inputId} className="text-xs text-foreground-secondary">日付選択</label>
        <input
          id={inputId}
          type="date"
          value={invalidValue ? "" : value ?? ""}
          aria-invalid={invalidValue || undefined}
          aria-describedby={hintId}
          onChange={(event) => {
            const next = event.currentTarget.value;
            if (next === "") onDateChange(null);
            else if (isCalendarDate(next)) onDateChange(next);
          }}
          className="min-h-11 min-w-0 max-w-full rounded-control border border-border-strong bg-surface px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:text-foreground-disabled"
        />
      </div>
      <p id={hintId} className={`text-xs ${invalidValue ? "text-danger" : "text-foreground-muted"}`}>
        {invalidValue ? "日付を確認して選び直してください。" : "日本時間（Asia/Tokyo）の勤務開始日が対象です。"}
        {disabled && " 読み込み中は日付を変更できません。"}
      </p>
    </fieldset>
  );
}
