"use client";

import { useEffect, useState } from "react";

/** Demo async orchestration. Readers return controlled outcomes, never reject.
 * A changed reader or retry immediately hides the preceding response. Cleanup
 * prevents late responses from another project/filter/unmounted view winning.
 */
export function useProjectRecruitmentRead<T>(read: () => Promise<T>) {
  const [attempt, setAttempt] = useState(0);
  const [completed, setCompleted] = useState<{ read: typeof read; attempt: number; result: T } | null>(null);
  useEffect(() => {
    let active = true;
    void read().then((result) => {
      if (active) setCompleted({ read, attempt, result });
    });
    return () => { active = false; };
  }, [read, attempt]);
  return {
    result: completed?.read === read && completed.attempt === attempt ? completed.result : null,
    retry: () => setAttempt((previous) => previous + 1),
  };
}
