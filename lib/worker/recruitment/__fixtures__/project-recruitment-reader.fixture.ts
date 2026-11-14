import { filterRecruitmentShiftsByStartDate, getRecruitmentStartDate } from "../recruitment-selection";
import { normalizeRecruitmentUuid, projectRecruitmentDetailSchema } from "../project-recruitment-schema";
import type { ProjectRecruitmentListView, ProjectRecruitmentReader } from "../project-recruitment-reader";
import { syntheticDemoDetails } from "./project-recruitment.fixture";

export type SyntheticRecruitmentScenario = "ready" | "empty" | "error" | "not_found";

/** Complete synthetic data only: aggregates here MUST NOT be reused over live
 * shift pages. No network, Auth, Actions, persistence or Backend implementation.
 */
export function createSyntheticProjectRecruitmentReader(scenario: SyntheticRecruitmentScenario = "ready"): ProjectRecruitmentReader {
  return {
    async readList(startDate) {
      if (scenario === "error") throw new Error("Synthetic read failure");
      const dates = [...new Set(syntheticDemoDetails.flatMap((item) => item.shifts.flatMap((shift) => {
        const day = getRecruitmentStartDate(shift.startsAt);
        return day === null ? [] : [day];
      })))];
      const items: ProjectRecruitmentListView["items"] = scenario === "empty" ? [] : syntheticDemoDetails.flatMap((item) => {
        const shifts = filterRecruitmentShiftsByStartDate(item.shifts, startDate);
        if (shifts.length === 0) return [];
        const venues = [...new Set(shifts.map((shift) => shift.workplaceName))];
        const days = [...new Set(shifts.map((shift) => getRecruitmentStartDate(shift.startsAt)))];
        const wages = [...new Set(shifts.map((shift) => shift.hourlyWage))];
        const availabilityKnown = shifts.every((shift) => shift.applicationAvailability !== null && shift.hasActiveApplication !== null);
        return [{
          project: item.project,
          venueText: venues.some((venue) => venue === null) ? null : venues.join("・"),
          scheduleText: days.some((day) => day === null) ? null : days.join("・"),
          publishedShiftCount: shifts.length,
          applyAllowedShiftCount: availabilityKnown ? shifts.filter((shift) => shift.applicationAvailability === "allowed" && shift.hasActiveApplication === false).length : null,
          hourlyWage: wages.length === 1 ? wages[0] ?? null : null,
        }];
      });
      return { source: "synthetic", items, dates } satisfies ProjectRecruitmentListView;
    },
    async readDetail(projectId) {
      if (scenario === "error") throw new Error("Synthetic read failure");
      if (scenario === "not_found") return null;
      const detail = syntheticDemoDetails.find((item) => normalizeRecruitmentUuid(item.project.projectId) === normalizeRecruitmentUuid(projectId));
      if (!detail) return null;
      // Return independent, validated objects so selections never mutate fixtures.
      return projectRecruitmentDetailSchema.parse(scenario === "empty" ? { ...detail, shifts: [] } : detail);
    },
  };
}
