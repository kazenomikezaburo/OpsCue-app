import "server-only";

// Future production entry point. Supply Task A readers only after separate live
// connection approval, with the existing server guard/RLS boundary unchanged.
// This PR supplies no Supabase client and does not wire this into any route.
export { createBackendProjectRecruitmentAdapter } from "./backend-project-recruitment-adapter";
export type { BackendProjectRecruitmentSource } from "./backend-project-recruitment-adapter";
