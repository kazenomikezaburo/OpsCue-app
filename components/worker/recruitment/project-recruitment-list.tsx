"use client";

import { normalizeRecruitmentUuid } from "@/lib/worker/recruitment/project-recruitment-schema";
import { RecruitmentDateFilter, type RecruitmentDateFilterProps } from "./recruitment-date-filter";
import { RecruitmentProjectCard, type RecruitmentProjectCardItem } from "./recruitment-project-card";

export type ProjectRecruitmentListProps = {
  /** Cumulative, already date-filtered items; one data source per list. */
  items: readonly RecruitmentProjectCardItem[];
  source: "synthetic" | "backend-proposal";
  status: "loading" | "ready" | "error";
  dateFilter: RecruitmentDateFilterProps;
  onOpenDetail: (projectId: string) => void;
  onRetry?: () => void;
  /** UI capability only; no cursor shape, sort order or Backend contract. */
  loadMore?: {
    hasMore: boolean;
    pending: boolean;
    error: boolean;
    onLoadMore: () => void;
  };
};

export function ProjectRecruitmentList({ items, source, status, dateFilter, onOpenDetail, onRetry, loadMore }: ProjectRecruitmentListProps) {
  // Last supplied occurrence wins without adding totals or merging by name.
  // Position follows the parent's first occurrence; no client-side ranking.
  const uniqueItems = new Map<string, RecruitmentProjectCardItem>();
  for (const item of items) uniqueItems.set(normalizeRecruitmentUuid(item.project.projectId), item);
  const projects = [...uniqueItems.entries()];
  const actionClass = "min-h-11 rounded-control border border-border-strong bg-surface px-4 py-2 text-sm font-semibold text-foreground hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:text-foreground-disabled";
  return (
    <section aria-label="案件の募集一覧" className="mx-auto w-full min-w-0 max-w-5xl space-y-6 px-4 py-7 sm:px-8 sm:py-10">
      <header>
        <h1 className="text-xl font-semibold leading-7 text-foreground">募集</h1>
        <p className="mt-2 text-xs leading-5 text-foreground-muted">空いている日から仕事を探せます</p>
        {source === "synthetic" && <p className="mt-3 rounded-control bg-info-subtle px-3 py-2 text-sm font-semibold text-info-foreground">デモ用データ・実応募なし</p>}
      </header>
      <RecruitmentDateFilter {...dateFilter} />
      <div aria-busy={status === "loading" || loadMore?.pending === true} className="min-w-0 space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-base font-semibold text-foreground">{dateFilter.value === null ? "募集中の案件" : `${dateFilter.value}開始の募集`}</h2>
          {status === "ready" && <p role="status" className="text-xs text-foreground-muted">表示中 {projects.length}案件</p>}
        </div>
        {status === "loading" ? <p role="status" className="rounded-card bg-surface p-5 text-sm text-foreground-secondary">募集を読み込んでいます…</p>
          : status === "error" ? <div role="alert" className="space-y-3 rounded-card border border-border bg-surface p-5"><p className="font-semibold text-foreground">募集を取得できませんでした。</p><p className="text-sm text-foreground-secondary">時間をおいて再度お試しください。</p>{onRetry && <button type="button" onClick={onRetry} className={actionClass}>再読み込み</button>}</div>
          : projects.length === 0 ? <div className="space-y-3 rounded-card border border-border bg-surface p-5"><p role="status" className="font-semibold text-foreground">{dateFilter.value === null ? "現在表示できる募集はありません。" : "選択した開始日の募集はありません。"}</p><p className="text-sm text-foreground-secondary">{dateFilter.value === null ? "新しい募集が公開されると、ここに表示されます。" : "別の日付を選ぶか、絞り込みを解除してください。"}</p>{dateFilter.value !== null && <button type="button" disabled={dateFilter.disabled} onClick={() => dateFilter.onDateChange(null)} className={actionClass}>日付の絞り込みを解除</button>}</div>
          : <ul className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">{projects.map(([projectId, item]) => <li key={projectId} className="min-w-0"><RecruitmentProjectCard item={item} source={source} onOpenDetail={onOpenDetail} /></li>)}</ul>}
        {status === "ready" && loadMore && <div className="space-y-3 text-center">
          {loadMore.error && <p role="alert" className="text-sm text-danger">追加の募集を取得できませんでした。表示済みの案件は引き続き確認できます。</p>}
          {loadMore.pending && <p role="status" className="text-sm text-foreground-secondary">追加の募集を読み込んでいます…</p>}
          {(loadMore.hasMore || loadMore.error) && <button type="button" disabled={loadMore.pending} onClick={loadMore.onLoadMore} className={actionClass}>{loadMore.pending ? "読み込み中…" : loadMore.error ? "追加読み込みを再試行" : "もっと見る"}</button>}
        </div>}
      </div>
    </section>
  );
}
