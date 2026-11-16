import type { z } from "zod";
import type {
  projectRecruitmentDetailSchema,
  projectRecruitmentListSchema,
  projectRecruitmentSummarySchema,
  recruitmentBatchRequestSchema,
  recruitmentBatchResultSchema,
  recruitmentShiftSchema,
} from "./project-recruitment-schema";

/** v1.0-RC UI proposal, not a Backend contract or application authorization. */
export type RecruitmentShiftDTO = z.infer<typeof recruitmentShiftSchema>;
export type ProjectRecruitmentSummaryDTO = z.infer<typeof projectRecruitmentSummarySchema>;
export type ProjectRecruitmentListDTO = z.infer<typeof projectRecruitmentListSchema>;
export type ProjectRecruitmentDetailDTO = z.infer<typeof projectRecruitmentDetailSchema>;
export type RecruitmentBatchRequestDTO = z.infer<typeof recruitmentBatchRequestSchema>;
export type RecruitmentBatchResultDTO = z.infer<typeof recruitmentBatchResultSchema>;

export type RecruitmentShiftReference = Readonly<{ projectId: string; shiftId: string }>;
export type RecruitmentSelection = readonly RecruitmentShiftReference[];
export type RecruitmentSelectionError = "invalid_identity" | "mixed_projects" | "duplicate_shift" | "limit_exceeded";
export type RecruitmentSelectionResult =
  | { ok: true; selection: RecruitmentSelection }
  | { ok: false; reason: RecruitmentSelectionError; selection: RecruitmentSelection };
