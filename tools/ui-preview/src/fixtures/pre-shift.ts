import type { PreviewPreShiftState } from "../components/PreviewPreShiftStatusBadge";
export const preShift = {
  before: "not_open",
  waiting: "pending",
  done: "confirmed",
} as const satisfies Record<string, PreviewPreShiftState>;
