export type PreviewPreShiftState = "not_open" | "pending" | "confirmed";

export function PreviewPreShiftStatusBadge({ children: state }: { children: PreviewPreShiftState }) {
  if (state === "not_open") return <span className="pre-shift-badge pre-shift-badge--not-open">受付前</span>;
  if (state === "pending") return <span className="pre-shift-badge pre-shift-badge--pending">未確認</span>;
  if (state === "confirmed") return <span className="pre-shift-badge pre-shift-badge--confirmed">確認済み</span>;
  return <span className="pre-shift-badge pre-shift-badge--unknown">状態不明</span>;
}
