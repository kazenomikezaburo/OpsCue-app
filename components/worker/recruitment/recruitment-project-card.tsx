"use client";

import type { ProjectRecruitmentSummaryDTO } from "@/lib/worker/recruitment/project-recruitment-types";

/** UI-only projection supplied by the parent; not an approved Backend DTO.
 * Counts describe the parent's current date/filter scope, not loaded-page sizes.
 * null preserves unavailable information. No totals or eligibility are inferred.
 */
export type RecruitmentProjectCardItem = {
  project: ProjectRecruitmentSummaryDTO;
  venueText: string | null;
  scheduleText: string | null;
  publishedShiftCount: number | null;
  applyAllowedShiftCount: number | null;
  hourlyWage: number | null;
};

export type RecruitmentProjectCardProps = {
  item: RecruitmentProjectCardItem;
  source: "synthetic" | "backend-proposal";
  onOpenDetail: (projectId: string) => void;
};

export function RecruitmentProjectCard({ item, source, onOpenDetail }: RecruitmentProjectCardProps) {
  return (
    <article className="min-w-0 rounded-card border border-border bg-surface p-4">
      <h3 className="break-words text-base font-semibold leading-6 text-foreground">
        <button
          type="button"
          onClick={() => onOpenDetail(item.project.projectId)}
          className="min-h-11 max-w-full rounded-control text-left hover:text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          aria-label={`${item.project.projectName}の詳細を見る`}
        >
          {item.project.projectName}
        </button>
      </h3>
      <p className="mt-1 break-words text-xs leading-5 text-foreground-muted">{item.venueText ?? "会場は確認中"}</p>
      <p className="mt-1 break-words text-xs leading-5 text-foreground-secondary">{item.scheduleText ?? "勤務日時は確認中"}</p>
      <p className="mt-3 text-sm text-foreground">
        {item.hourlyWage === null ? "時給は確認中" : `時給 ${item.hourlyWage.toLocaleString("ja-JP")}円`}
      </p>
      <dl className="mt-4 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
        <div className="flex flex-wrap gap-x-2"><dt className="text-foreground-secondary">公開シフト</dt><dd className="font-semibold text-foreground">{item.publishedShiftCount === null ? "確認中" : `${item.publishedShiftCount}件`}</dd></div>
        <div className="flex flex-wrap gap-x-2"><dt className="text-foreground-secondary">応募可能</dt><dd className="font-semibold text-link">{item.applyAllowedShiftCount === null ? "確認中" : `${item.applyAllowedShiftCount}件`}</dd></div>
      </dl>
      {source === "synthetic" && <p className="mt-3 text-xs text-foreground-muted">デモ用データ・実応募なし</p>}
    </article>
  );
}
