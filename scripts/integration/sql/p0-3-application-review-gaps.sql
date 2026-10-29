-- P0-3 direct-UPDATE gaps on shift_applications (Admin review).
-- Run BEFORE the PR-05 migration only. "true" means the gap exists:
-- a manager can rewrite application status through the Data API without
-- any lifecycle, Shift-state or Worker-state check.
-- After the migration this file stops with "permission denied" (expected).
-- One transaction, rolled back. ASCII only.

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

with u as (update public.shift_applications set status = 'applied' where id = 'f5900000-0000-0000-0000-000000000093' and status = 'withdrawn' returning 1)
select 'gap: withdrawn Application reverted to applied by direct UPDATE', (count(*) = 1)::text from u;
with u as (update public.shift_applications set status = 'accepted' where id = 'f5900000-0000-0000-0000-00000000009c' and status = 'rejected' returning 1)
select 'gap: rejected Application changed to accepted by direct UPDATE', (count(*) = 1)::text from u;
with u as (update public.shift_applications set status = 'accepted' where id = 'f5900000-0000-0000-0000-000000000098' returning 1)
select 'gap: Application on cancelled Shift accepted by direct UPDATE', (count(*) = 1)::text from u;
with u as (update public.shift_applications set status = 'accepted' where id = 'f5900000-0000-0000-0000-000000000099' returning 1)
select 'gap: inactive Worker accepted by direct UPDATE', (count(*) = 1)::text from u;

rollback;
