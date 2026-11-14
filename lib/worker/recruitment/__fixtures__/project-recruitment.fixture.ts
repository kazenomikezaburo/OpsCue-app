import type {
  ProjectRecruitmentDetailDTO,
  ProjectRecruitmentListDTO,
  RecruitmentBatchRequestDTO,
  RecruitmentBatchResultDTO,
  RecruitmentShiftDTO,
} from "../project-recruitment-types";

// Entirely synthetic. No live IDs, Worker data, addresses, URLs or Backend calls.
const projectId = "00000000-0000-4000-8000-000000000001";
const otherProjectId = "00000000-0000-4000-8000-000000000002";
const project = { projectId, projectName: "合成案件：展示サポート", description: "UI検討専用の架空データです。" };

export const syntheticRecruitmentShifts: RecruitmentShiftDTO[] = Array.from({ length: 11 }, (_, index) => ({
  projectId,
  shiftId: `00000000-0000-4000-8000-${String(index + 101).padStart(12, "0")}`,
  jobName: `合成業務 ${index + 1}`,
  // Deliberate overlap: pending applications must not be rejected for overlap.
  startsAt: "2026-11-01T15:30:00Z", // 11/2 00:30 Asia/Tokyo
  endsAt: "2026-11-01T18:30:00Z",
  workplaceName: "架空会場A",
  hourlyWage: null,
  remainingCapacity: null,
  applicationDeadline: null,
  applicationAvailability: null,
  applicationState: null,
  hasActiveApplication: null,
  safeReasonText: null,
}));

export const syntheticRecruitmentList: ProjectRecruitmentListDTO = {
  contractVersion: "v1.0-RC", source: "synthetic", paginationContract: "unconfirmed",
  items: [project, { projectId: otherProjectId, projectName: "合成案件：別案件", description: null }],
};
export const syntheticRecruitmentDetail: ProjectRecruitmentDetailDTO = {
  contractVersion: "v1.0-RC", source: "synthetic", project, shifts: syntheticRecruitmentShifts,
};
export const syntheticOtherProjectDetail: ProjectRecruitmentDetailDTO = {
  contractVersion: "v1.0-RC", source: "synthetic",
  project: { projectId: otherProjectId, projectName: "合成案件：別案件", description: null },
  shifts: [{ ...syntheticRecruitmentShifts[0]!, projectId: otherProjectId, shiftId: "00000000-0000-4000-8000-000000000201" }],
};

// Active=true is an explicit synthetic fact, not an application-state mapping.
export const syntheticActiveApplicationShift: RecruitmentShiftDTO = {
  ...syntheticRecruitmentShifts[0]!, hasActiveApplication: true,
};
export const syntheticNoActiveApplicationShift: RecruitmentShiftDTO = {
  ...syntheticRecruitmentShifts[0]!, hasActiveApplication: false,
};
export const syntheticBatchRequest: RecruitmentBatchRequestDTO = {
  contractVersion: "v1.0-RC", projectId,
  batchKey: "00000000-0000-4000-8000-000000000301",
  shiftIds: syntheticRecruitmentShifts.slice(0, 2).map((shift) => shift.shiftId),
};
// Alternative scenarios for one request, not a simulated real operation/history.
export const syntheticBatchResults: RecruitmentBatchResultDTO[] = [
  { request: syntheticBatchRequest, status: "pending" },
  { request: syntheticBatchRequest, status: "success", meaning: "application_received" },
  { request: syntheticBatchRequest, status: "rejected", newApplicationCount: 0, safeReasonText: "合成例：有効な既応募を含むため全体を受け付けませんでした。" },
  { request: syntheticBatchRequest, status: "unknown", recovery: "retain_same_batch_key" },
];

// Additional UI-only demo scenarios. Original null/unknown examples above stay intact.
const demoSelectableShifts: RecruitmentShiftDTO[] = syntheticRecruitmentShifts.map((shift, index) => ({
  ...shift,
  // First two overlap deliberately; subsequent shifts span two JST start dates.
  startsAt: index < 6 ? "2026-11-01T15:30:00Z" : "2026-11-03T00:00:00Z",
  endsAt: index < 6 ? "2026-11-01T18:30:00Z" : "2026-11-03T08:00:00Z",
  applicationAvailability: "allowed",
  hasActiveApplication: false,
  applicationState: "none",
}));

export const syntheticDemoDetails: readonly ProjectRecruitmentDetailDTO[] = [
  {
    ...syntheticRecruitmentDetail,
    shifts: [
      ...demoSelectableShifts,
      { ...syntheticRecruitmentShifts[0]!, shiftId: "00000000-0000-4000-8000-000000000112", jobName: "合成業務：応募可否不明" },
      { ...demoSelectableShifts[0]!, shiftId: "00000000-0000-4000-8000-000000000113", jobName: "合成業務：既応募あり", hasActiveApplication: true, applicationState: "applied" },
    ],
  },
  {
    ...syntheticOtherProjectDetail,
    // Same name, different identity: must never be merged by name.
    project: { ...syntheticOtherProjectDetail.project, projectName: project.projectName },
    shifts: syntheticOtherProjectDetail.shifts.map((shift) => ({
      ...shift, startsAt: "2026-11-02T00:00:00Z", endsAt: "2026-11-02T08:00:00Z",
      applicationAvailability: "allowed", hasActiveApplication: false, applicationState: "none",
    })),
  },
];

/** Demo-local identity only; not an approved Backend idempotency algorithm. */
export function createSyntheticDemoRequest(
  selectedProjectId: string,
  shiftIds: readonly string[],
  sequence: number,
): RecruitmentBatchRequestDTO {
  return {
    contractVersion: "v1.0-RC", projectId: selectedProjectId,
    batchKey: `00000000-0000-4000-9000-${String(sequence).padStart(12, "0")}`,
    shiftIds: [...shiftIds],
  };
}

/** Alternatives chosen manually by the demonstrator, never Backend evidence. */
export function createSyntheticDemoResult(
  request: RecruitmentBatchRequestDTO,
  status: RecruitmentBatchResultDTO["status"],
): RecruitmentBatchResultDTO {
  switch (status) {
    case "pending": return { request, status };
    case "success": return { request, status, meaning: "application_received" };
    case "rejected": return { request, status, newApplicationCount: 0, safeReasonText: null };
    case "unknown": return { request, status, recovery: "retain_same_batch_key" };
  }
}

export const syntheticDemoPageSize = 1;
