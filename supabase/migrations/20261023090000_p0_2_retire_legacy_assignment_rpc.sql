-- P0-2b: close the legacy placement RPC.
--
-- public.create_assignment_from_application(uuid, uuid) does not check Worker
-- status, Worker branch, requirements, availability, overlap with other
-- Assignments or Shift state, and locks only the Shift row. The app now places
-- accepted Applications through public.ensure_candidate_assignment
-- (accepted_application path), so the legacy RPC is no longer called.
--
-- The function is kept (not dropped) so this can be rolled back with:
--   grant execute on function public.create_assignment_from_application(uuid, uuid) to authenticated;
-- Apply only after the app change that stops calling it is deployed.

revoke all on function public.create_assignment_from_application(uuid, uuid)
  from public, anon, authenticated, service_role;
