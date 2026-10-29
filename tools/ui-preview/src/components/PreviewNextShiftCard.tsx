import { PreviewPreShiftStatusBadge, type PreviewPreShiftState } from "./PreviewPreShiftStatusBadge";

export type PreviewNextShiftModel = {
  projectLabel: string;
  jobLabel: string;
  workplaceLabel: string;
  dateLabel: string;
  timeLabel: string;
  preShift: PreviewPreShiftState;
};
export type PreviewNextShiftView =
  | { kind: "ready"; shift: PreviewNextShiftModel }
  | { kind: "empty" }
  | { kind: "error" };

export function PreviewNextShiftCard({ children: view }: { children: PreviewNextShiftView }) {
  if (view.kind === "empty") return <article className="next-shift-card"><h2>次の勤務</h2><p>勤務予定はありません</p><p>合成データによる空状態です。</p></article>;
  if (view.kind === "error") return <article className="next-shift-card" role="alert"><h2>次の勤務</h2><p>勤務情報を取得できませんでした。</p><p>合成データによるエラー表示です。通信は行っていません。</p></article>;
  if (view.kind === "ready") return <article className="next-shift-card">
    <h2>次の勤務</h2>
    <p className="next-shift-date">{view.shift.dateLabel} ・ {view.shift.timeLabel}</p>
    <p className="next-shift-project">{view.shift.projectLabel}</p>
    <p>{view.shift.jobLabel}</p><p>{view.shift.workplaceLabel}</p>
    <div className="next-shift-confirmation"><p>前日確認</p><PreviewPreShiftStatusBadge>{view.shift.preShift}</PreviewPreShiftStatusBadge></div>
  </article>;
  return <article className="next-shift-card" role="alert"><h2>次の勤務</h2><p>表示状態不明</p></article>;
}
