"use client";

export type RecruitmentStateProps = {
  state: "loading" | "empty" | "error";
  onRetry?: () => void;
};

/** Fixed public copy only: never render exception messages or backend errors. */
export function RecruitmentState({ state, onRetry }: RecruitmentStateProps) {
  const title = state === "loading" ? "募集情報を確認しています…"
    : state === "empty" ? "表示できる募集情報はありません。" : "募集情報を確認できませんでした。";
  return (
    <div role={state === "error" ? "alert" : "status"} className="space-y-3 rounded-card border border-border bg-surface p-4 text-sm sm:p-5">
      <p className="font-semibold text-foreground">{title}</p>
      {state !== "loading" && <p className="text-foreground-secondary">{state === "empty" ? "日付や選択内容を見直してください。" : "時間をおいて再度お試しください。"}</p>}
      {state === "error" && onRetry && <button type="button" onClick={onRetry} className="min-h-11 rounded-control border border-border-strong px-4 py-2 font-semibold text-foreground hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">再確認</button>}
    </div>
  );
}
