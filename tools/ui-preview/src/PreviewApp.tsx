import { PreviewNextShiftCard } from "./components/PreviewNextShiftCard";
import { nextShiftExamples } from "./fixtures/worker-next-shift";
import { PreviewPreShiftStatusBadge } from "./components/PreviewPreShiftStatusBadge";
import { preShift } from "./fixtures/pre-shift";
import { sample } from "./fixtures/sample";
export function PreviewApp() {
  return <main>
    <header><h1>OpsCue UI Preview</h1><p className="notice">Preview only — 架空データ・表示確認専用</p></header>
    <section className="cards" aria-label="サンプルカード">
      <article><h2>架空ステータス</h2><p className="status">{sample.status}</p></article>
      <article><h2>架空の件数</h2><p className="number">{sample.count}<small> 件</small></p></article>
    </section>
    <section className="pre-shift-section" aria-label="前日確認の合成データ">
      <h2>前日確認ステータス</h2><p>合成データ・表示確認専用</p>
      <div className="pre-shift-examples">
        <article><h2>受付前</h2><PreviewPreShiftStatusBadge>{preShift.before}</PreviewPreShiftStatusBadge></article>
        <article><h2>未確認</h2><PreviewPreShiftStatusBadge>{preShift.waiting}</PreviewPreShiftStatusBadge></article>
        <article><h2>確認済み</h2><PreviewPreShiftStatusBadge>{preShift.done}</PreviewPreShiftStatusBadge></article>
      </div>
    </section>
    <section className="next-shift-section" aria-label="次の勤務の合成表示">
      <h2>Worker 次の勤務・独立表示例</h2><p>架空の合成データです。本番の勤務・認可状態を表しません。</p>
      <div className="next-shift-grid">
        <PreviewNextShiftCard>{nextShiftExamples.before}</PreviewNextShiftCard>
        <PreviewNextShiftCard>{nextShiftExamples.pending}</PreviewNextShiftCard>
        <PreviewNextShiftCard>{nextShiftExamples.confirmed}</PreviewNextShiftCard>
        <PreviewNextShiftCard>{nextShiftExamples.empty}</PreviewNextShiftCard>
        <PreviewNextShiftCard>{nextShiftExamples.error}</PreviewNextShiftCard>
        <PreviewNextShiftCard>{nextShiftExamples.long}</PreviewNextShiftCard>
      </div>
    </section>
    <section className="empty"><h2>空状態</h2><p>{sample.emptyMessage}</p></section>
  </main>;
}
