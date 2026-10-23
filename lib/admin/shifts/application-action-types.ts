export type ApplicationReviewWarning = {
  code: "OVERLAPS_OWN_ASSIGNMENT" | "OVERLAPS_OWN_ACCEPTED_APPLICATION" | (string & {});
  shiftId: string;
  startsAt: string;
  endsAt: string;
};

export type ApplicationActionResult =
  | { ok: true; warnings?: ApplicationReviewWarning[] }
  | {
      ok: false;
      message: string;
      retryable?: boolean;
      confirmationRequired?: boolean;
      warnings?: ApplicationReviewWarning[];
    };
