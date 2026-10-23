-- P0-3 Admin review through review_shift_application (run AFTER the migration).
-- All checks must be true. One transaction, rolled back. ASCII only.

begin;

select 'guard: no cron schema (isolated DB)', (not exists (select 1 from pg_namespace where nspname = 'cron'))::text;
select 'guard: fixture ids unused', (not exists (select 1 from auth.users where id::text like 'f5000000-%') and not exists (select 1 from public.branches where code like 'PR05-TEST-%'))::text;

-- Synthetic fixtures (example.invalid addresses, year 2099, no real data)
insert into auth.users (id, aud, role, email) values
  ('f5000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'pr05-manager@example.invalid'),
  ('f5000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'pr05-inactive-manager@example.invalid'),
  ('f5000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'pr05-other-branch-manager@example.invalid'),
  ('f5000000-0000-0000-0000-000000000004', 'authenticated', 'authenticated', 'pr05-worker@example.invalid');
insert into public.profiles (id, display_name, account_type, is_active) values
  ('f5000000-0000-0000-0000-000000000001', 'PR05 manager', 'manager', true),
  ('f5000000-0000-0000-0000-000000000002', 'PR05 inactive manager', 'manager', false),
  ('f5000000-0000-0000-0000-000000000003', 'PR05 other branch manager', 'manager', true),
  ('f5000000-0000-0000-0000-000000000004', 'PR05 worker', 'worker', true);
insert into public.branches (id, code, name) values
  ('f5b00000-0000-0000-0000-000000000001', 'PR05-TEST-B1', 'PR05 test branch 1'),
  ('f5b00000-0000-0000-0000-000000000002', 'PR05-TEST-B2', 'PR05 test branch 2');
insert into public.manager_branch_access (profile_id, branch_id, role) values
  ('f5000000-0000-0000-0000-000000000001', 'f5b00000-0000-0000-0000-000000000001', 'manager'),
  ('f5000000-0000-0000-0000-000000000002', 'f5b00000-0000-0000-0000-000000000001', 'manager'),
  ('f5000000-0000-0000-0000-000000000003', 'f5b00000-0000-0000-0000-000000000002', 'manager');
insert into public.workplaces (id, branch_id, name, address) values
  ('f5d00000-0000-0000-0000-000000000001', 'f5b00000-0000-0000-0000-000000000001', 'PR05 test workplace', 'PR05 test address');
insert into public.projects (id, branch_id, name, status, start_date, end_date) values
  ('f5e00000-0000-0000-0000-000000000001', 'f5b00000-0000-0000-0000-000000000001', 'PR05 test project', 'recruiting', '2099-03-01', '2099-03-31');
insert into public.jobs (id, project_id, workplace_id, name) values
  ('f5f00000-0000-0000-0000-000000000001', 'f5e00000-0000-0000-0000-000000000001', 'f5d00000-0000-0000-0000-000000000001', 'PR05 test job');
-- S1 09-17. S2 12-20 overlaps S1. S3 cancelled. S4 17-21 is adjacent to S1. S5 another day.
insert into public.shift_slots (id, job_id, starts_at, ends_at, required_workers, status) values
  ('f5a00000-0000-0000-0000-000000000001', 'f5f00000-0000-0000-0000-000000000001', '2099-03-10 09:00+09', '2099-03-10 17:00+09', 5, 'recruiting'),
  ('f5a00000-0000-0000-0000-000000000002', 'f5f00000-0000-0000-0000-000000000001', '2099-03-10 12:00+09', '2099-03-10 20:00+09', 5, 'recruiting'),
  ('f5a00000-0000-0000-0000-000000000003', 'f5f00000-0000-0000-0000-000000000001', '2099-03-11 09:00+09', '2099-03-11 17:00+09', 5, 'cancelled'),
  ('f5a00000-0000-0000-0000-000000000004', 'f5f00000-0000-0000-0000-000000000001', '2099-03-10 17:00+09', '2099-03-10 21:00+09', 5, 'recruiting'),
  ('f5a00000-0000-0000-0000-000000000005', 'f5f00000-0000-0000-0000-000000000001', '2099-03-12 09:00+09', '2099-03-12 17:00+09', 5, 'recruiting');
insert into public.workers (id, staff_code, branch_id, auth_profile_id, display_name, status) values
  ('f5c00000-0000-0000-0000-00000000000a', 'PR05-WA', 'f5b00000-0000-0000-0000-000000000001', null, 'PR05 worker A', 'active'),
  ('f5c00000-0000-0000-0000-00000000000b', 'PR05-WB', 'f5b00000-0000-0000-0000-000000000001', null, 'PR05 worker B', 'active'),
  ('f5c00000-0000-0000-0000-00000000000c', 'PR05-WC', 'f5b00000-0000-0000-0000-000000000001', null, 'PR05 worker C', 'active'),
  ('f5c00000-0000-0000-0000-00000000000d', 'PR05-WD', 'f5b00000-0000-0000-0000-000000000001', null, 'PR05 worker D', 'active'),
  ('f5c00000-0000-0000-0000-00000000000e', 'PR05-WE', 'f5b00000-0000-0000-0000-000000000001', null, 'PR05 worker E', 'active'),
  ('f5c00000-0000-0000-0000-00000000000f', 'PR05-WF', 'f5b00000-0000-0000-0000-000000000001', null, 'PR05 worker F', 'active'),
  ('f5c00000-0000-0000-0000-000000000010', 'PR05-WG', 'f5b00000-0000-0000-0000-000000000001', null, 'PR05 worker G', 'active'),
  ('f5c00000-0000-0000-0000-000000000011', 'PR05-WI', 'f5b00000-0000-0000-0000-000000000001', null, 'PR05 worker inactive', 'inactive'),
  ('f5c00000-0000-0000-0000-000000000012', 'PR05-WR', 'f5b00000-0000-0000-0000-000000000001', 'f5000000-0000-0000-0000-000000000004', 'PR05 worker self', 'active');
-- Applications
--  91 WB-S1 applied (normal accept)      92 WC-S1 applied (reject)
--  93 WD-S5 withdrawn                     94 WA-S1 applied (WA assigned on S2 -> warning)
--  95 WB-S2 applied (WB accepted on S1 after 91 -> warning)
--  96 WE-S1 accepted, 97 WE-S4 applied (adjacent, no warning)
--  98 WF-S3 applied (cancelled shift)     99 WI-S1 applied (inactive worker)
--  9a WG-S5 applied (WG assigned on S5)   9b WR-S1 applied (worker self, withdraw regression)
--  9c WC-S2 rejected
insert into public.shift_applications (id, shift_slot_id, worker_id, status) values
  ('f5900000-0000-0000-0000-000000000091', 'f5a00000-0000-0000-0000-000000000001', 'f5c00000-0000-0000-0000-00000000000b', 'applied'),
  ('f5900000-0000-0000-0000-000000000092', 'f5a00000-0000-0000-0000-000000000001', 'f5c00000-0000-0000-0000-00000000000c', 'applied'),
  ('f5900000-0000-0000-0000-000000000093', 'f5a00000-0000-0000-0000-000000000005', 'f5c00000-0000-0000-0000-00000000000d', 'withdrawn'),
  ('f5900000-0000-0000-0000-000000000094', 'f5a00000-0000-0000-0000-000000000001', 'f5c00000-0000-0000-0000-00000000000a', 'applied'),
  ('f5900000-0000-0000-0000-000000000095', 'f5a00000-0000-0000-0000-000000000002', 'f5c00000-0000-0000-0000-00000000000b', 'applied'),
  ('f5900000-0000-0000-0000-000000000096', 'f5a00000-0000-0000-0000-000000000001', 'f5c00000-0000-0000-0000-00000000000e', 'accepted'),
  ('f5900000-0000-0000-0000-000000000097', 'f5a00000-0000-0000-0000-000000000004', 'f5c00000-0000-0000-0000-00000000000e', 'applied'),
  ('f5900000-0000-0000-0000-000000000098', 'f5a00000-0000-0000-0000-000000000003', 'f5c00000-0000-0000-0000-00000000000f', 'applied'),
  ('f5900000-0000-0000-0000-000000000099', 'f5a00000-0000-0000-0000-000000000001', 'f5c00000-0000-0000-0000-000000000011', 'applied'),
  ('f5900000-0000-0000-0000-00000000009a', 'f5a00000-0000-0000-0000-000000000005', 'f5c00000-0000-0000-0000-000000000010', 'applied'),
  ('f5900000-0000-0000-0000-00000000009b', 'f5a00000-0000-0000-0000-000000000001', 'f5c00000-0000-0000-0000-000000000012', 'applied'),
  ('f5900000-0000-0000-0000-00000000009c', 'f5a00000-0000-0000-0000-000000000002', 'f5c00000-0000-0000-0000-00000000000c', 'rejected');
insert into public.assignments (id, shift_slot_id, worker_id, source, status) values
  ('f5800000-0000-0000-0000-000000000001', 'f5a00000-0000-0000-0000-000000000002', 'f5c00000-0000-0000-0000-00000000000a', 'manager', 'assigned'),
  ('f5800000-0000-0000-0000-000000000002', 'f5a00000-0000-0000-0000-000000000005', 'f5c00000-0000-0000-0000-000000000010', 'manager', 'assigned');

set local role authenticated;
set local request.jwt.claims = '{"sub":"f5000000-0000-0000-0000-000000000001","role":"authenticated"}';

-- 1. Normal accept, replay, idempotency conflict
select public.review_shift_application('f5a00000-0000-0000-0000-000000000001', 'f5900000-0000-0000-0000-000000000091', 'accepted', 'f5700000-0000-0000-0000-000000000001') as r1 \gset
select 'accept: applied Application accepted', ((:'r1'::jsonb ->> 'outcome') = 'accepted' and jsonb_array_length(:'r1'::jsonb -> 'warnings') = 0)::text;
select public.review_shift_application('f5a00000-0000-0000-0000-000000000001', 'f5900000-0000-0000-0000-000000000091', 'accepted', 'f5700000-0000-0000-0000-000000000001') as r2 \gset
select 'accept: same key replays', ((:'r2'::jsonb ->> 'replayed') = 'true' and (:'r2'::jsonb ->> 'outcome') = 'accepted')::text;
select 'accept: same key for another Application is rejected', (public.review_shift_application('f5a00000-0000-0000-0000-000000000001', 'f5900000-0000-0000-0000-000000000092', 'accepted', 'f5700000-0000-0000-0000-000000000001') ->> 'outcome' = 'IDEMPOTENCY_CONFLICT')::text;
select 'accept: same key with another decision is rejected', (public.review_shift_application('f5a00000-0000-0000-0000-000000000001', 'f5900000-0000-0000-0000-000000000091', 'rejected', 'f5700000-0000-0000-0000-000000000001') ->> 'outcome' = 'IDEMPOTENCY_CONFLICT')::text;

-- 2. Reject and lifecycle
select 'reject: applied Application rejected', (public.review_shift_application('f5a00000-0000-0000-0000-000000000001', 'f5900000-0000-0000-0000-000000000092', 'rejected', 'f5700000-0000-0000-0000-000000000002') ->> 'outcome' = 'rejected')::text;
select 'lifecycle: rejected cannot be accepted', (public.review_shift_application('f5a00000-0000-0000-0000-000000000002', 'f5900000-0000-0000-0000-00000000009c', 'accepted', 'f5700000-0000-0000-0000-000000000003') ->> 'outcome' = 'application_already_decided')::text;
select 'lifecycle: withdrawn cannot be accepted', (public.review_shift_application('f5a00000-0000-0000-0000-000000000005', 'f5900000-0000-0000-0000-000000000093', 'accepted', 'f5700000-0000-0000-0000-000000000004') ->> 'outcome' = 'application_already_decided')::text;
select 'lifecycle: accepted cannot be rejected', (public.review_shift_application('f5a00000-0000-0000-0000-000000000001', 'f5900000-0000-0000-0000-000000000096', 'rejected', 'f5700000-0000-0000-0000-000000000005') ->> 'outcome' = 'application_already_decided')::text;
select 'lifecycle: Application of another Shift is unavailable', (public.review_shift_application('f5a00000-0000-0000-0000-000000000002', 'f5900000-0000-0000-0000-000000000092', 'rejected', 'f5700000-0000-0000-0000-000000000006') ->> 'outcome' = 'unavailable')::text;

-- 3. C-02 warnings and two-step confirmation
select public.review_shift_application('f5a00000-0000-0000-0000-000000000001', 'f5900000-0000-0000-0000-000000000094', 'accepted', 'f5700000-0000-0000-0000-000000000007') as w1 \gset
select 'warning: overlap with own Assignment needs confirmation', ((:'w1'::jsonb ->> 'outcome') = 'confirmation_required' and (:'w1'::jsonb -> 'warnings' -> 0 ->> 'code') = 'OVERLAPS_OWN_ASSIGNMENT')::text;
reset role;
select 'warning: nothing changed before confirmation', (status = 'applied')::text from public.shift_applications where id = 'f5900000-0000-0000-0000-000000000094';
set local role authenticated;
select public.review_shift_application('f5a00000-0000-0000-0000-000000000001', 'f5900000-0000-0000-0000-000000000094', 'accepted', 'f5700000-0000-0000-0000-000000000007', true) as w2 \gset
select 'warning: same key with confirmation accepts', ((:'w2'::jsonb ->> 'outcome') = 'accepted' and jsonb_array_length(:'w2'::jsonb -> 'warnings') = 1)::text;
select 'warning: overlap with own accepted Application needs confirmation', (public.review_shift_application('f5a00000-0000-0000-0000-000000000002', 'f5900000-0000-0000-0000-000000000095', 'accepted', 'f5700000-0000-0000-0000-000000000008') -> 'warnings' -> 0 ->> 'code' = 'OVERLAPS_OWN_ACCEPTED_APPLICATION')::text;
select 'warning: adjacent Shift has no warning', (public.review_shift_application('f5a00000-0000-0000-0000-000000000004', 'f5900000-0000-0000-0000-000000000097', 'accepted', 'f5700000-0000-0000-0000-000000000009') ->> 'outcome' = 'accepted')::text;

-- 4. Accept blocks, reject still allowed
select 'block: cancelled Shift cannot be accepted', (public.review_shift_application('f5a00000-0000-0000-0000-000000000003', 'f5900000-0000-0000-0000-000000000098', 'accepted', 'f5700000-0000-0000-0000-00000000000a') ->> 'outcome' = 'shift_state_unavailable')::text;
select 'block: cancelled Shift can be rejected', (public.review_shift_application('f5a00000-0000-0000-0000-000000000003', 'f5900000-0000-0000-0000-000000000098', 'rejected', 'f5700000-0000-0000-0000-00000000000b') ->> 'outcome' = 'rejected')::text;
select 'block: inactive Worker cannot be accepted', (public.review_shift_application('f5a00000-0000-0000-0000-000000000001', 'f5900000-0000-0000-0000-000000000099', 'accepted', 'f5700000-0000-0000-0000-00000000000c') ->> 'outcome' = 'worker_inactive')::text;
select 'block: Worker already assigned on the Shift', (public.review_shift_application('f5a00000-0000-0000-0000-000000000005', 'f5900000-0000-0000-0000-00000000009a', 'accepted', 'f5700000-0000-0000-0000-00000000000d') ->> 'outcome' = 'assignment_exists')::text;

-- 5. Authorization
set local request.jwt.claims = '{"sub":"f5000000-0000-0000-0000-000000000002","role":"authenticated"}';
select 'auth: inactive manager unavailable', (public.review_shift_application('f5a00000-0000-0000-0000-000000000001', 'f5900000-0000-0000-0000-000000000099', 'rejected', 'f5700000-0000-0000-0000-00000000000e') ->> 'outcome' = 'unavailable')::text;
set local request.jwt.claims = '{"sub":"f5000000-0000-0000-0000-000000000003","role":"authenticated"}';
select 'auth: other branch manager unavailable', (public.review_shift_application('f5a00000-0000-0000-0000-000000000001', 'f5900000-0000-0000-0000-000000000099', 'rejected', 'f5700000-0000-0000-0000-00000000000f') ->> 'outcome' = 'unavailable')::text;
set local request.jwt.claims = '{"sub":"f5000000-0000-0000-0000-000000000004","role":"authenticated"}';
select 'auth: Worker unavailable', (public.review_shift_application('f5a00000-0000-0000-0000-000000000001', 'f5900000-0000-0000-0000-000000000099', 'rejected', 'f5700000-0000-0000-0000-000000000010') ->> 'outcome' = 'unavailable')::text;

-- 6. Worker commands still work after closing direct writes (SECURITY DEFINER)
select 'regression: Worker withdraw still works', (public.withdraw_own_shift_application('f5a00000-0000-0000-0000-000000000001', 'f5700000-0000-0000-0000-000000000011') ->> 'outcome' = 'withdrawn')::text;
select 'regression: Worker apply still works', (public.apply_to_own_shift('f5a00000-0000-0000-0000-000000000004', 'f5700000-0000-0000-0000-000000000012') ->> 'outcome' = 'applied')::text;

-- 7. Final state and privileges
reset role;
select 'state: reviewed_by and reviewed_at recorded', (reviewed_by = 'f5000000-0000-0000-0000-000000000001' and reviewed_at is not null and status = 'accepted')::text from public.shift_applications where id = 'f5900000-0000-0000-0000-000000000091';
select 'state: blocked and unauthorized calls changed nothing', (status = 'applied')::text from public.shift_applications where id = 'f5900000-0000-0000-0000-000000000099';
select 'privilege: authenticated cannot UPDATE shift_applications', (not has_table_privilege('authenticated', 'public.shift_applications', 'UPDATE'))::text;
select 'privilege: authenticated cannot INSERT shift_applications', (not has_table_privilege('authenticated', 'public.shift_applications', 'INSERT'))::text;
select 'privilege: no UPDATE policies on shift_applications', (count(*) = 0)::text from pg_policies where schemaname = 'public' and tablename = 'shift_applications' and cmd in ('UPDATE', 'ALL');
select 'privilege: authenticated can execute review command', has_function_privilege('authenticated', 'public.review_shift_application(uuid,uuid,text,uuid,boolean)', 'EXECUTE')::text;
select 'privilege: anon cannot execute review command', (not has_function_privilege('anon', 'public.review_shift_application(uuid,uuid,text,uuid,boolean)', 'EXECUTE'))::text;
select 'privilege: service_role cannot execute review command', (not has_function_privilege('service_role', 'public.review_shift_application(uuid,uuid,text,uuid,boolean)', 'EXECUTE'))::text;
select 'privilege: receipts not readable by authenticated', (not has_table_privilege('authenticated', 'private.application_review_receipts', 'SELECT'))::text;

rollback;
