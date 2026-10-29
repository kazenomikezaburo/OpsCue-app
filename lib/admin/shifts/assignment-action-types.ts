export type AssignmentBlockingReason = { code: string; label: string };

export type AssignmentActionResult =
  | { ok: true }
  | { ok: false; message: string; retryable?: boolean; blockingReasons?: AssignmentBlockingReason[] };
