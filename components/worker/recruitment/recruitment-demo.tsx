"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import type { RecruitmentBatchResultDTO, RecruitmentSelection } from "@/lib/worker/recruitment/project-recruitment-types";
import { normalizeRecruitmentUuid, recruitmentBatchRequestSchema } from "@/lib/worker/recruitment/project-recruitment-schema";
import { canSubmitRecruitmentSelection } from "@/lib/worker/recruitment/recruitment-selection";
import { createSyntheticDemoRequest, createSyntheticDemoResult, syntheticDemoPageSize } from "@/lib/worker/recruitment/__fixtures__/project-recruitment.fixture";
import { createSyntheticProjectRecruitmentReader } from "@/lib/worker/recruitment/__fixtures__/project-recruitment-reader.fixture";
import { readProjectRecruitmentDetail, readProjectRecruitmentList } from "@/lib/worker/recruitment/project-recruitment-reader";
import { useProjectRecruitmentRead } from "./use-project-recruitment-read";
import { ProjectRecruitmentList } from "./project-recruitment-list";
import { ProjectRecruitmentDetail } from "./project-recruitment-detail";
import { getRecruitmentShiftHoldReason } from "./recruitment-shift-row";
import { RecruitmentApplicationSheet } from "./recruitment-application-sheet";
import { RecruitmentBatchResult } from "./recruitment-batch-result";
import { RecruitmentState } from "./recruitment-state";

export type RecruitmentDemoProps = { isDemo: true };
type DemoDisplay = "ready" | "loading" | "empty" | "error" | "not_found";
const firstPage = { page: 0, cursor: syntheticDemoPageSize, loadedPages: [0] };

/** UI-only demo composition. Reads go through a synthetic lib adapter. */
export function RecruitmentDemo({ isDemo }: RecruitmentDemoProps) {
  const [screen, setScreen] = useState<"list" | "detail" | "result">("list");
  const [projectId, setProjectId] = useState<string | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [pages, setPages] = useState(firstPage);
  const [display, setDisplay] = useState<DemoDisplay>("ready");
  const [selection, setSelection] = useState<RecruitmentSelection>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [result, setResult] = useState<RecruitmentBatchResultDTO | null>(null);
  const [queuedResult, setQueuedResult] = useState<RecruitmentBatchResultDTO | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const sequence = useRef(0);
  const focusTarget = useRef<HTMLHeadingElement>(null);
  const id = useId();
  const reader = useMemo(() => createSyntheticProjectRecruitmentReader(display === "loading" ? "ready" : display), [display]);
  const readList = useCallback(() => readProjectRecruitmentList(reader, date), [reader, date]);
  const readDetail = useCallback(() => readProjectRecruitmentDetail(reader, projectId ?? ""), [reader, projectId]);
  const listRead = useProjectRecruitmentRead(readList);
  const detailRead = useProjectRecruitmentRead(readDetail);
  const listStatus = display === "loading" || listRead.result === null ? "loading" : listRead.result.status;
  const detailStatus = display === "loading" || detailRead.result === null ? "loading" : detailRead.result.status;
  const list = listRead.result?.status === "ready" ? listRead.result.data : null;
  const detail = detailStatus === "ready" && detailRead.result?.status === "ready" ? detailRead.result.data : null;
  const unresolved = result?.status === "unknown" || result?.status === "pending";

  // The native close event follows the Sheet's focus/scroll cleanup.
  // Advance from that event so the result heading receives focus last.
  function showQueuedResult() {
    if (!queuedResult) return;
    setResult(queuedResult);
    setQueuedResult(null);
    setScreen("result");
  }
  useEffect(() => { focusTarget.current?.focus(); }, [screen, projectId]);

  const cards = list?.items ?? [];

  function openDetail(nextProjectId: string) {
    const normalizedId = normalizeRecruitmentUuid(nextProjectId);
    if (projectId !== normalizedId) setSelection([]);
    setProjectId(normalizedId);
    setDisplay("ready");
    setNotice(null);
    setScreen("detail");
  }

  function openSheet() {
    if (unresolved) {
      setNotice("未確定の模擬結果を保持しています。新しいbatchKeyは作らず、同じ結果を表示します。");
      setScreen("result");
      return;
    }
    if (detail && canSubmitRecruitmentSelection(selection)) setSheetOpen(true);
  }

  function confirmDemo(nextSelection: RecruitmentSelection) {
    if (unresolved || queuedResult || !detail || !canSubmitRecruitmentSelection(nextSelection)) return;
    const chosen = nextSelection.map((reference) => detail.shifts.find((shift) =>
      normalizeRecruitmentUuid(shift.projectId) === normalizeRecruitmentUuid(reference.projectId)
      && normalizeRecruitmentUuid(shift.shiftId) === normalizeRecruitmentUuid(reference.shiftId)));
    if (chosen.some((shift) => !shift || getRecruitmentShiftHoldReason(shift) !== null)) return;
    const parsed = recruitmentBatchRequestSchema.safeParse(createSyntheticDemoRequest(detail.project.projectId, nextSelection.map((shift) => normalizeRecruitmentUuid(shift.shiftId)), sequence.current + 1));
    if (!parsed.success) { setNotice("模擬リクエストを構成できませんでした。"); return; }
    sequence.current += 1;
    setNotice(null);
    setQueuedResult(createSyntheticDemoResult(parsed.data, "unknown"));
    setSheetOpen(false);
  }

  const control = "min-h-11 rounded-control border border-border-strong bg-surface px-3 py-2 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring";
  if (isDemo !== true) return null;
  return (
    <div className="min-w-0 bg-background text-foreground">
      <header className="mx-auto max-w-5xl space-y-3 px-4 pt-5 sm:px-8">
        <h1 ref={focusTarget} tabIndex={-1} className="text-lg font-semibold focus-visible:outline-2 focus-visible:outline-focus-ring">Worker募集UIデモ</h1>
        <p className="rounded-control bg-info-subtle p-3 text-sm font-semibold text-info-foreground">デモ用データ・実応募なし</p>
        <p className="text-xs text-foreground-secondary">すべて合成データです。結果は手動の表示例で、Backendによる受付確認ではありません。</p>
        {screen !== "result" && <div className="flex flex-wrap items-center gap-2"><label htmlFor={`${id}-display`} className="text-sm">表示例</label><select id={`${id}-display`} value={display} onChange={(event) => {
          const value = event.currentTarget.value;
          if (value === "ready" || value === "loading" || value === "empty" || value === "error" || value === "not_found") setDisplay(value);
        }} className={control}><option value="ready">通常</option><option value="loading">読み込み中</option><option value="empty">空</option><option value="error">取得エラー</option><option value="not_found" disabled={screen !== "detail"}>404：案件を表示できない</option></select></div>}
        {notice && <p role="status" className="text-sm text-warning-foreground">{notice}</p>}
        {unresolved && screen !== "result" && <button type="button" className={control} onClick={() => setScreen("result")}>保持中の模擬結果を再表示</button>}
      </header>
      {screen === "list" ? <>
        <ProjectRecruitmentList items={cards.slice(0, pages.cursor)} source="synthetic"
          status={listStatus}
          dateFilter={{ value: date, dates: list?.dates ?? [], onDateChange: (next) => { setDate(next); setPages(firstPage); setNotice(null); } }}
          onOpenDetail={openDetail} onRetry={() => { setDisplay("ready"); listRead.retry(); }}
          loadMore={{ hasMore: display !== "empty" && pages.cursor < cards.length, pending: false, error: false, onLoadMore: () => setPages((previous) => ({ page: previous.page + 1, cursor: previous.cursor + syntheticDemoPageSize, loadedPages: [...previous.loadedPages, previous.page + 1] })) }} />
        <p className="mx-auto max-w-5xl px-4 pb-4 text-xs text-foreground-muted">デモ内ページ {pages.page + 1}・読み込み済み {pages.loadedPages.length}ページ（正式cursor契約ではありません）</p>
      </> : screen === "detail" ? <>
        <ProjectRecruitmentDetail key={projectId} detail={detail}
          status={detailStatus} selection={selection}
          onSelectionChange={setSelection} onBack={() => { setScreen("list"); setDisplay("ready"); }}
          onConfirm={openSheet} onRetry={() => { setDisplay("ready"); detailRead.retry(); }} />
      </> : result ? <div className="mx-auto max-w-3xl space-y-4 p-4 sm:p-8">
        <fieldset className="flex flex-wrap gap-2"><legend className="mb-2 text-sm font-semibold">手動の模擬結果切り替え（同じリクエスト）</legend>
          {(["pending", "success", "rejected", "unknown"] as const).map((status) => <button key={status} type="button" aria-pressed={result.status === status} className={control} onClick={() => { setNotice(null); setResult(createSyntheticDemoResult(result.request, status)); }}>{status}</button>)}
        </fieldset>
        <RecruitmentBatchResult result={result} source="synthetic" receiptEvidence={result.status === "success" || result.status === "rejected" ? "confirmed" : "unconfirmed"}
          onRecheck={() => setNotice("同じbatchKeyと選択内容を保持しています。通信・再送・自動的な結果変更は行いません。")}
          onClose={() => { setScreen(projectId ? "detail" : "list"); setDisplay("ready"); }} />
      </div> : <div className="p-4"><RecruitmentState state="error" onRetry={() => setScreen("list")} /></div>}
      <RecruitmentApplicationSheet open={sheetOpen} detail={detail} selection={selection}
        onClose={() => setSheetOpen(false)} onBack={() => setSheetOpen(false)} onConfirm={confirmDemo} onAfterClose={showQueuedResult} />
    </div>
  );
}
