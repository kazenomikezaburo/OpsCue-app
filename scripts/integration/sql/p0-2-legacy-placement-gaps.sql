-- P0-2 legacy placement RPC gaps (create_assignment_from_application).
-- Run BEFORE PR-04 only. Documents what the legacy RPC lets through.
-- "true" means the gap exists (the legacy RPC created an Assignment it should not).
-- After PR-04 this file stops with "permission denied" (expected: the RPC is closed).
-- One transaction, rolled back. ASCII only.

begin;

select 'guard: no cron schema (isolated 46-migration DB)', (not exists (select 1 from pg_namespace where nspname = 'cron'))::text;
select 'guard: fixture ids unused', (not exists (select 1 from auth.users where id::text like 'f3000000-%') and not exists (select 1 from public.branches where code like 'PR03-TEST-%'))::text;

-- Synthetic fixtures (example.invalid addresses, year 2099, no real data)
insert into auth.users (id, aud, role, email) values
  ('f3000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'pr03-manager@example.invalid'),
  ('f3000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'pr03-inactive-manager@example.invalid');
insert into public.profiles (id, display_name, account_type, is_active) values
  ('f3000000-0000-0000-0000-000000000001', 'PR03 manager', 'manager', true),
  ('f3000000-0000-0000-0000-000000000002', 'PR03 inactive manager', 'manager', false);
insert into public.branches (id, code, name) values
  ('f3b00000-0000-0000-0000-000000000001', 'PR03-TEST-B1', 'PR03 test branch');
insert into public.manager_branch_access (profile_id, branch_id, role) values
  ('f3000000-0000-0000-0000-000000000001', 'f3b00000-0000-0000-0000-000000000001', 'manager'),
  ('f3000000-0000-0000-0000-000000000002', 'f3b00000-0000-0000-0000-000000000001', 'manager');
insert into public.workplaces (id, branch_id, name, address) values
  ('f3d00000-0000-0000-0000-000000000001', 'f3b00000-0000-0000-0000-000000000001', 'PR03 test workplace', 'PR03 test address');
insert into public.projects (id, branch_id, name, status, start_date, end_date) values
  ('f3e00000-0000-0000-0000-000000000001', 'f3b00000-0000-0000-0000-000000000001', 'PR03 test project', 'recruiting', '2099-03-01', '2099-03-31');
insert into public.jobs (id, project_id, workplace_id, name) values
  ('f3f00000-0000-0000-0000-000000000001', 'f3e00000-0000-0000-0000-000000000001', 'f3d00000-0000-0000-0000-000000000001', 'PR03 test job');
-- S1 and S2 overlap. S3 is cancelled. S4 needs only 1 worker.
insert into public.shift_slots (id, job_id, starts_at, ends_at, required_workers, status) values
  ('f3a00000-0000-0000-0000-000000000001', 'f3f00000-0000-0000-0000-000000000001', '2099-03-10 09:00+09', '2099-03-10 17:00+09', 3, 'recruiting'),
  ('f3a00000-0000-0000-0000-000000000002', 'f3f00000-0000-0000-0000-000000000001', '2099-03-10 12:00+09', '2099-03-10 20:00+09', 3, 'recruiting'),
  ('f3a00000-0000-0000-0000-000000000003', 'f3f00000-0000-0000-0000-000000000001', '2099-03-11 09:00+09', '2099-03-11 17:00+09', 3, 'cancelled'),
  ('f3a00000-0000-0000-0000-000000000004', 'f3f00000-0000-0000-0000-000000000001', '2099-03-12 09:00+09', '2099-03-12 17:00+09', 1, 'recruiting');
insert into public.workers (id, staff_code, branch_id, display_name, status) values
  ('f3c00000-0000-0000-0000-00000000000a', 'PR03-WA', 'f3b00000-0000-0000-0000-000000000001', 'PR03 worker A', 'active'),
  ('f3c00000-0000-0000-0000-00000000000b', 'PR03-WI', 'f3b00000-0000-0000-0000-000000000001', 'PR03 worker inactive', 'inactive'),
  ('f3c00000-0000-0000-0000-00000000000c', 'PR03-WC', 'f3b00000-0000-0000-0000-000000000001', 'PR03 worker C', 'active'),
  ('f3c00000-0000-0000-0000-00000000000d', 'PR03-WD', 'f3b00000-0000-0000-0000-000000000001', 'PR03 worker D', 'active'),
  ('f3c00000-0000-0000-0000-00000000000e', 'PR03-WE', 'f3b00000-0000-0000-0000-000000000001', 'PR03 worker E', 'active'),
  ('f3c00000-0000-0000-0000-00000000000f', 'PR03-WF', 'f3b00000-0000-0000-0000-000000000001', 'PR03 worker F', 'active'),
  ('f3c00000-0000-0000-0000-000000000010', 'PR03-WG', 'f3b00000-0000-0000-0000-000000000001', 'PR03 worker G', 'active');
insert into public.shift_applications (id, shift_slot_id, worker_id, status) values
  ('f3900000-0000-0000-0000-000000000001', 'f3a00000-0000-0000-0000-000000000001', 'f3c00000-0000-0000-0000-00000000000a', 'accepted'),
  ('f3900000-0000-0000-0000-000000000002', 'f3a00000-0000-0000-0000-000000000002', 'f3c00000-0000-0000-0000-00000000000a', 'accepted'),
  ('f3900000-0000-0000-0000-000000000003', 'f3a00000-0000-0000-0000-000000000001', 'f3c00000-0000-0000-0000-00000000000b', 'accepted'),
  ('f3900000-0000-0000-0000-000000000004', 'f3a00000-0000-0000-0000-000000000003', 'f3c00000-0000-0000-0000-00000000000c', 'accepted'),
  ('f3900000-0000-0000-0000-000000000005', 'f3a00000-0000-0000-0000-000000000004', 'f3c00000-0000-0000-0000-00000000000d', 'accepted'),
  ('f3900000-0000-0000-0000-000000000006', 'f3a00000-0000-0000-0000-000000000004', 'f3c00000-0000-0000-0000-00000000000e', 'accepted'),
  ('f3900000-0000-0000-0000-000000000007', 'f3a00000-0000-0000-0000-000000000001', 'f3c00000-0000-0000-0000-00000000000f', 'applied');

set local role authenticated;
set local request.jwt.claims = '{"sub":"f3000000-0000-0000-0000-000000000001","role":"authenticated"}';

select 'legacy: accepted Application placed (baseline)', (public.create_assignment_from_application('f3a00000-0000-0000-0000-000000000001', 'f3900000-0000-0000-0000-000000000001') is not null)::text;
select 'legacy gap: overlapping Shift placed for same Worker', (public.create_assignment_from_application('f3a00000-0000-0000-0000-000000000002', 'f3900000-0000-0000-0000-000000000002') is not null)::text;
select 'legacy gap: inactive Worker placed', (public.create_assignment_from_application('f3a00000-0000-0000-0000-000000000001', 'f3900000-0000-0000-0000-000000000003') is not null)::text;
select 'legacy gap: cancelled Shift placed', (public.create_assignment_from_application('f3a00000-0000-0000-0000-000000000003', 'f3900000-0000-0000-0000-000000000004') is not null)::text;

rollback;
