import { notFound } from "next/navigation";
import { WorkerRecruitmentDetail } from "@/components/worker/recruitment/worker-recruitment";
import { getWorkerRecruitmentShift } from "@/lib/worker/recruitment/get-worker-recruitment";
import { uuidSchema } from "@/lib/utils/uuid-schema";

export default async function WorkerRecruitmentDetailPage({ params }: { params: Promise<{ shiftId: string }> }) {
  const { shiftId } = await params;
  const parsed = uuidSchema.safeParse(shiftId);
  if (!parsed.success) notFound();

  const item = await getWorkerRecruitmentShift(parsed.data);
  if (!item) notFound();

  return <WorkerRecruitmentDetail item={item} />;
}
