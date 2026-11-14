import { z } from "zod";
import { projectRecruitmentDetailSchema, projectRecruitmentSummarySchema, recruitmentUuidSchema } from "./project-recruitment-schema";
import type { ProjectRecruitmentDetailDTO } from "./project-recruitment-types";

/** Frontend view models only. These do not specify Backend DTOs or RPCs. */
const projectCardSchema = z.object({
  project: projectRecruitmentSummarySchema,
  venueText: z.string().nullable(),
  scheduleText: z.string().nullable(),
  publishedShiftCount: z.number().int().nonnegative().nullable(),
  applyAllowedShiftCount: z.number().int().nonnegative().nullable(),
  hourlyWage: z.number().nonnegative().nullable(),
}).strict();
const listViewSchema = z.object({
  source: z.enum(["synthetic", "backend-proposal"]),
  items: z.array(projectCardSchema),
  dates: z.array(z.iso.date()),
}).strict().refine(
  (list) => new Set(list.items.map((item) => item.project.projectId)).size === list.items.length,
  "案件IDが重複しています。",
);

export type RecruitmentProjectCardItem = z.infer<typeof projectCardSchema>;
export type ProjectRecruitmentListView = z.infer<typeof listViewSchema>;
export type ProjectRecruitmentReadResult<T> = { status: "ready"; data: T } | { status: "error" };
export type ProjectRecruitmentDetailReadResult = ProjectRecruitmentReadResult<ProjectRecruitmentDetailDTO> | { status: "not_found" };

/** Adapter output is untrusted until validated below. No pagination or write API.
 * Future live reads belong in a server-only lib adapter, behind existing guards.
 * Never pass a server reader function through a Server/Client props boundary.
 */
export interface ProjectRecruitmentReader {
  readList(startDate: string | null): Promise<unknown>;
  readDetail(projectId: string): Promise<unknown>;
}

export async function readProjectRecruitmentList(
  reader: ProjectRecruitmentReader, startDate: string | null,
): Promise<ProjectRecruitmentReadResult<ProjectRecruitmentListView>> {
  if (startDate !== null && !z.iso.date().safeParse(startDate).success) return { status: "error" };
  try {
    const parsed = listViewSchema.safeParse(await reader.readList(startDate));
    return parsed.success ? { status: "ready", data: parsed.data } : { status: "error" };
  } catch {
    // Do not expose transport errors, raw responses or authorization internals.
    return { status: "error" };
  }
}

export async function readProjectRecruitmentDetail(
  reader: ProjectRecruitmentReader, projectId: string,
): Promise<ProjectRecruitmentDetailReadResult> {
  const id = recruitmentUuidSchema.safeParse(projectId);
  if (!id.success) return { status: "not_found" };
  try {
    const raw = await reader.readDetail(id.data);
    // Only an explicit unavailable result maps to 404; failures stay errors.
    if (raw === null) return { status: "not_found" };
    const parsed = projectRecruitmentDetailSchema.safeParse(raw);
    if (!parsed.success || parsed.data.project.projectId !== id.data) return { status: "error" };
    return { status: "ready", data: parsed.data };
  } catch {
    return { status: "error" };
  }
}
