"use client";

import { useId } from "react";
import type { RecruitmentShiftDTO } from "@/lib/worker/recruitment/project-recruitment-types";
import { recruitmentInstantSchema, recruitmentTimeZone } from "@/lib/worker/recruitment/project-recruitment-schema";

/** Temporary UI policy only. Never derive active applications from lifecycle state. */
export function getRecruitmentShiftHoldReason(shift: RecruitmentShiftDTO): string | null {
  if (shift.hasActiveApplication === true) return "有効な既応募があります。";
  if (shift.applicationAvailability === "unavailable") return "現在は選択できません。";
  if (shift.applicationAvailability !== "allowed" || shift.hasActiveApplication !== false) {
    return "応募可否を確認できません。";
  }
  if (!recruitmentInstantSchema.safeParse(shift.startsAt).success
    || !recruitmentInstantSchema.safeParse(shift.endsAt).success
    || Date.parse(shift.endsAt) <= Date.parse(shift.startsAt)) return "勤務日時を確認できません。";
  return null;
}

const dateTime = new Intl.DateTimeFormat("ja-JP", {
  timeZone: recruitmentTimeZone, year: "numeric", month: "numeric", day: "numeric",
  hour: "2-digit", minute: "2-digit", hour12: false,
});
const applicationLabels = {
  none: "未応募", applied: "応募済み", accepted: "採用済み・配置は別途確認",
  rejected: "見送り", withdrawn: "取下げ済み",
};

export type RecruitmentShiftRowProps = {
  shift: RecruitmentShiftDTO;
  selected: boolean;
  additionalHoldReason?: string | null;
  onSelectedChange: (selected: boolean) => void;
};

export function RecruitmentShiftRow({ shift, selected, additionalHoldReason, onSelectedChange }: RecruitmentShiftRowProps) {
  const id = useId();
  const holdReason = getRecruitmentShiftHoldReason(shift) ?? additionalHoldReason ?? null;
  const startValid = recruitmentInstantSchema.safeParse(shift.startsAt).success;
  const endValid = recruitmentInstantSchema.safeParse(shift.endsAt).success;
  const applicationLabel = shift.applicationState !== null
    && Object.hasOwn(applicationLabels, shift.applicationState)
    ? applicationLabels[shift.applicationState] : "応募状態は確認中";
  return (
    <li className={`min-w-0 rounded-control border p-3 ${selected ? "border-info bg-info-subtle" : "border-border bg-surface"}`}>
      <label htmlFor={id} className="flex min-h-11 cursor-pointer items-center gap-3 break-words text-sm font-semibold text-foreground">
        <input id={id} type="checkbox" checked={selected} disabled={!selected && holdReason !== null}
          aria-describedby={`${id}-details${holdReason ? ` ${id}-hold` : ""}`}
          onChange={(event) => onSelectedChange(event.currentTarget.checked)}
          className="size-5 shrink-0 accent-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed" />
        <span className="min-w-0">{shift.jobName}</span>
      </label>
      <div id={`${id}-details`} className="mt-2 space-y-2 break-words text-xs leading-5 text-foreground-secondary">
        <p>{startValid ? dateTime.format(new Date(shift.startsAt)) : "開始日時は確認中"} 〜 {endValid ? dateTime.format(new Date(shift.endsAt)) : "終了日時は確認中"}（日本時間）</p>
        <p>{shift.workplaceName ?? "会場は確認中"}</p>
        <p>{shift.hourlyWage === null ? "時給は確認中" : `時給 ${shift.hourlyWage.toLocaleString("ja-JP")}円`} ・ {shift.remainingCapacity === null ? "残枠は確認中" : `残り${shift.remainingCapacity}名`}</p>
        <p>応募状態：{applicationLabel}</p>
        {shift.safeReasonText !== null && <p>補足情報：{shift.safeReasonText}</p>}
      </div>
      {holdReason && <p id={`${id}-hold`} className="mt-2 text-xs leading-5 text-warning-foreground">{selected ? `確認が必要です。${holdReason} 選択を解除できます。` : holdReason}</p>}
    </li>
  );
}
