-- P0-2 accepted Application placement through ensure_candidate_assignment,
-- and the privilege state of the legacy RPC.
-- Before PR-04: only "legacy RPC closed ..." checks are false (3 items).
-- After PR-04: all true.
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

-- 1. Normal placement and idempotent replay
select public.ensure_candidate_assignment('f3a00000-0000-0000-0000-000000000001', 'f3c00000-0000-0000-0000-00000000000a', 'accepted_application', 'pr03-k1') as r1 \gset
select 'new: accepted Application placed', ((:'r1'::jsonb ->> 'outcome') = 'assignment_created' and (:'r1'::jsonb ->> 'source') = 'application')::text;
select public.ensure_candidate_assignment('f3a00000-0000-0000-0000-000000000001', 'f3c00000-0000-0000-0000-00000000000a', 'accepted_application', 'pr03-k1') as r2 \gset
select 'new: same key replays the same Assignment', ((:'r2'::jsonb ->> 'replayed') = 'true' and (:'r2'::jsonb ->> 'assignmentId') = (:'r1'::jsonb ->> 'assignmentId'))::text;
select 'new: new key returns existing Assignment', (public.ensure_candidate_assignment('f3a00000-0000-0000-0000-000000000001', 'f3c00000-0000-0000-0000-00000000000a', 'accepted_application', 'pr03-k1b') ->> 'outcome' = 'existing_assignment')::text;
select 'new: same key for another Worker is rejected', (public.ensure_candidate_assignment('f3a00000-0000-0000-0000-000000000001', 'f3c00000-0000-0000-0000-00000000000f', 'accepted_application', 'pr03-k1') ->> 'outcome' = 'IDEMPOTENCY_CONFLICT')::text;

-- 2. Checks the legacy RPC does not have
select 'new: overlapping Shift blocked', (public.ensure_candidate_assignment('f3a00000-0000-0000-0000-000000000002', 'f3c00000-0000-0000-0000-00000000000a', 'accepted_application', 'pr03-k2') ->> 'outcome' = 'not_eligible')::text;
select 'new: inactive Worker blocked', (public.ensure_candidate_assignment('f3a00000-0000-0000-0000-000000000001', 'f3c00000-0000-0000-0000-00000000000b', 'accepted_application', 'pr03-k3') ->> 'outcome' = 'not_eligible')::text;
select 'new: cancelled Shift blocked', (public.ensure_candidate_assignment('f3a00000-0000-0000-0000-000000000003', 'f3c00000-0000-0000-0000-00000000000c', 'accepted_application', 'pr03-k4') ->> 'outcome' = 'shift_state_unavailable')::text;

-- 3. Same rules as the legacy RPC
select 'new: capacity 1 filled', (public.ensure_candidate_assignment('f3a00000-0000-0000-0000-000000000004', 'f3c00000-0000-0000-0000-00000000000d', 'accepted_application', 'pr03-k5') ->> 'outcome' = 'assignment_created')::text;
select 'new: capacity reached blocked', (public.ensure_candidate_assignment('f3a00000-0000-0000-0000-000000000004', 'f3c00000-0000-0000-0000-00000000000e', 'accepted_application', 'pr03-k6') ->> 'outcome' = 'capacity_reached')::text;
select 'new: not-yet-accepted Application blocked', (public.ensure_candidate_assignment('f3a00000-0000-0000-0000-000000000001', 'f3c00000-0000-0000-0000-00000000000f', 'accepted_application', 'pr03-k7') ->> 'outcome' = 'application_decision_required')::text;
select 'new: Worker without Application blocked', (public.ensure_candidate_assignment('f3a00000-0000-0000-0000-000000000001', 'f3c00000-0000-0000-0000-000000000010', 'accepted_application', 'pr03-k8') ->> 'outcome' = 'unavailable')::text;

-- 4. Inactive manager (relies on PR-02)
set local request.jwt.claims = '{"sub":"f3000000-0000-0000-0000-000000000002","role":"authenticated"}';
select 'new: inactive manager cannot place', (public.ensure_candidate_assignment('f3a00000-0000-0000-0000-000000000002', 'f3c00000-0000-0000-0000-00000000000d', 'accepted_application', 'pr03-k9') ->> 'outcome' = 'unavailable')::text;

-- 5. Only the intended Assignments exist
reset role;
select 'state: exactly 2 Assignments created', (count(*) = 2)::text from public.assignments where shift_slot_id::text like 'f3a00000-%';

-- 6. Privileges
select 'privilege: authenticated can execute new RPC', has_function_privilege('authenticated', 'public.ensure_candidate_assignment(uuid,uuid,text,text)', 'EXECUTE')::text;
select 'privilege: anon cannot execute new RPC', (not has_function_privilege('anon', 'public.ensure_candidate_assignment(uuid,uuid,text,text)', 'EXECUTE'))::text;
select 'privilege: anon cannot execute legacy RPC', (not has_function_privilege('anon', 'public.create_assignment_from_application(uuid,uuid)', 'EXECUTE'))::text;
select 'legacy RPC closed: authenticated', (not has_function_privilege('authenticated', 'public.create_assignment_from_application(uuid,uuid)', 'EXECUTE'))::text;
select 'legacy RPC closed: service_role', (not has_function_privilege('service_role', 'public.create_assignment_from_application(uuid,uuid)', 'EXECUTE'))::text;
select 'legacy RPC closed: PUBLIC', (not has_function_privilege('public', 'public.create_assignment_from_application(uuid,uuid)', 'EXECUTE'))::text;

rollback;
