import { RecruitmentState } from "@/components/worker/recruitment/recruitment-state";

export default function Loading() {
  return <main className="mx-auto max-w-3xl px-4 py-6"><RecruitmentState state="loading" /></main>;
}
