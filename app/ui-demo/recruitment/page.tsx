import { notFound } from "next/navigation";

/** UI-only entry. These gates are not authentication or an egress firewall. */
export default async function RecruitmentDemoPage() {
  if (
    process.env.NODE_ENV !== "development"
    || process.env.OPSCUE_PR_UI_01_DEMO_ENABLED !== "1"
    // Fail closed if the dedicated launcher's blank settings are not effective.
    // This check cannot undo any proxy activity that ran before page rendering.
    || process.env.NEXT_PUBLIC_SUPABASE_URL !== ""
    || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY !== ""
  ) {
    notFound();
  }

  const { RecruitmentDemo } = await import("@/components/worker/recruitment/recruitment-demo");
  return <RecruitmentDemo isDemo={true} />;
}