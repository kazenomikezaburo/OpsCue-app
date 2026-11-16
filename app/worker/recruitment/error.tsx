"use client";

import { RecruitmentState } from "@/components/worker/recruitment/recruitment-state";

export default function RecruitmentError({ retry }: { retry: () => void }) {
  return <main className="mx-auto max-w-3xl px-4 py-6"><RecruitmentState state="error" onRetry={retry} /></main>;
}
