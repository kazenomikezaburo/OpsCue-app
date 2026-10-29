import type { PreviewNextShiftView } from "../components/PreviewNextShiftCard";
export const nextShiftExamples = {
  before: { kind: "ready", shift: { projectLabel: "架空プロジェクトA", jobLabel: "架空の展示準備", workplaceLabel: "架空会場A", dateLabel: "架空日程 11月1日", timeLabel: "09:00–17:00", preShift: "not_open" } },
  pending: { kind: "ready", shift: { projectLabel: "架空プロジェクトB", jobLabel: "架空の受付補助", workplaceLabel: "架空会場B", dateLabel: "架空日程 11月2日", timeLabel: "10:00–16:00", preShift: "pending" } },
  confirmed: { kind: "ready", shift: { projectLabel: "架空プロジェクトC", jobLabel: "架空の会場案内", workplaceLabel: "架空会場C", dateLabel: "架空日程 11月3日", timeLabel: "08:00–15:00", preShift: "confirmed" } },
  empty: { kind: "empty" },
  error: { kind: "error" },
  long: { kind: "ready", shift: { projectLabel: "架空のとても長いプロジェクト名・独立プレビューの文字折返し構造を確認するための合成表示例", jobLabel: "架空の展示準備および来場案内補助", workplaceLabel: "架空の非常に長い会場ラベル・建物や実住所を表さない表示確認専用の文字列", dateLabel: "架空日程 11月4日", timeLabel: "09:00–17:00", preShift: "pending" } },
} as const satisfies Record<string, PreviewNextShiftView>;
