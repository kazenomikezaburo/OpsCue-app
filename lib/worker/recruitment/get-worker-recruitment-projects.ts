import "server-only";

import { createClient } from "@/lib/supabase/server";
import {
  PROJECT_PAGE_SIZE,
  PROJECT_SHIFT_PAGE_SIZE,
  isUuid,
  parseProjectDetail,
  parseProjectList,
  type RecruitmentProjectDetail,
  type RecruitmentProjectList,
} from "./project-recruitment-contract";

/**
 * Project list for the signed-in Worker. A transport/RPC failure throws (retrieval failure);
 * an unauthenticated, unlinked or out-of-scope caller receives an empty list by design.
 */
export async function getWorkerRecruitmentProjects(page = 0): Promise<RecruitmentProjectList> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_own_recruitment_projects", {
    p_limit: PROJECT_PAGE_SIZE,
    p_offset: Math.max(0, page) * PROJECT_PAGE_SIZE,
  });
  if (error) throw error;
  return parseProjectList(data);
}

/**
 * Shifts of one Project. A malformed id is rejected locally (`invalid_request`) without an RPC call.
 * A Project the Worker cannot see (other Branch, closed, nonexistent) is `project: null` with no items.
 */
export async function getWorkerRecruitmentProjectShifts(projectId: string, page = 0): Promise<RecruitmentProjectDetail> {
  if (!isUuid(projectId)) return { ok: false, outcome: "invalid_request", project: null, items: [], hasMore: false };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_own_recruitment_project_shifts", {
    p_project_id: projectId,
    p_limit: PROJECT_SHIFT_PAGE_SIZE,
    p_offset: Math.max(0, page) * PROJECT_SHIFT_PAGE_SIZE,
  });
  if (error) throw error;
  return parseProjectDetail(data);
}
