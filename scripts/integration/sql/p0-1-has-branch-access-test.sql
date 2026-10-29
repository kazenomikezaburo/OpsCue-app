-- P0-1 has_branch_access test for the isolated DB (opscue-app-dev) only.
-- Everything runs in one transaction and is rolled back: no data is kept.
-- Output: one "check name|true/false" line per check. All must be true
-- after the migration. Before the migration, the "inactive" and
-- "role changed" checks are expected to be false (bug reproduced).
-- ASCII only (PowerShell 5.1 pipes native input as ASCII).

begin;

select 'guard: no cron schema (isolated 46-migration DB)', (not exists (select 1 from pg_namespace where nspname = 'cron'))::text;
select 'guard: fixture ids unused', (not exists (select 1 from auth.users where id::text like 'f2000000-%') and not exists (select 1 from public.branches where code like 'PR02-TEST-%'))::text;
select 'migration applied: helper checks is_active and account_type', (pg_get_functiondef('private.has_branch_access(uuid)'::regprocedure) like '%is_active%' and pg_get_functiondef('private.has_branch_access(uuid)'::regprocedure) like '%account_type%')::text;

-- Synthetic fixtures (example.invalid addresses, no real data)
insert into auth.users (id, aud, role, email) values
  ('f2000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'pr02-active-manager@example.invalid'),
  ('f2000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'pr02-inactive-manager@example.invalid'),
  ('f2000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'pr02-role-changed@example.invalid'),
  ('f2000000-0000-0000-0000-000000000004', 'authenticated', 'authenticated', 'pr02-branch-manager@example.invalid'),
  ('f2000000-0000-0000-0000-000000000005', 'authenticated', 'authenticated', 'pr02-active-admin@example.invalid'),
  ('f2000000-0000-0000-0000-000000000006', 'authenticated', 'authenticated', 'pr02-inactive-admin@example.invalid'),
  ('f2000000-0000-0000-0000-000000000007', 'authenticated', 'authenticated', 'pr02-worker@example.invalid');

insert into public.profiles (id, display_name, account_type, is_active) values
  ('f2000000-0000-0000-0000-000000000001', 'PR02 active manager', 'manager', true),
  ('f2000000-0000-0000-0000-000000000002', 'PR02 inactive manager', 'manager', false),
  ('f2000000-0000-0000-0000-000000000003', 'PR02 role changed to worker', 'worker', true),
  ('f2000000-0000-0000-0000-000000000004', 'PR02 branch manager', 'manager', true),
  ('f2000000-0000-0000-0000-000000000005', 'PR02 active admin', 'system_admin', true),
  ('f2000000-0000-0000-0000-000000000006', 'PR02 inactive admin', 'system_admin', false),
  ('f2000000-0000-0000-0000-000000000007', 'PR02 worker', 'worker', true);

insert into public.branches (id, code, name) values
  ('f2b00000-0000-0000-0000-000000000001', 'PR02-TEST-B1', 'PR02 test branch 1'),
  ('f2b00000-0000-0000-0000-000000000002', 'PR02-TEST-B2', 'PR02 test branch 2');

-- Branch access rows are left in place for the inactive / role-changed users on purpose.
insert into public.manager_branch_access (profile_id, branch_id, role) values
  ('f2000000-0000-0000-0000-000000000001', 'f2b00000-0000-0000-0000-000000000001', 'manager'),
  ('f2000000-0000-0000-0000-000000000002', 'f2b00000-0000-0000-0000-000000000001', 'manager'),
  ('f2000000-0000-0000-0000-000000000003', 'f2b00000-0000-0000-0000-000000000001', 'manager'),
  ('f2000000-0000-0000-0000-000000000004', 'f2b00000-0000-0000-0000-000000000001', 'branch_manager'),
  ('f2000000-0000-0000-0000-000000000006', 'f2b00000-0000-0000-0000-000000000001', 'manager');

insert into public.clients (id, branch_id, name) values
  ('f2c00000-0000-0000-0000-000000000001', 'f2b00000-0000-0000-0000-000000000001', 'PR02 test client B1'),
  ('f2c00000-0000-0000-0000-000000000002', 'f2b00000-0000-0000-0000-000000000002', 'PR02 test client B2');

set local role authenticated;

-- 1. Active manager (regression: unchanged)
set local request.jwt.claims = '{"sub":"f2000000-0000-0000-0000-000000000001","role":"authenticated"}';
select 'active manager: own branch allowed', private.has_branch_access('f2b00000-0000-0000-0000-000000000001')::text;
select 'active manager: other branch denied', (not private.has_branch_access('f2b00000-0000-0000-0000-000000000002'))::text;
select 'active manager: own client visible', (count(*) = 1)::text from public.clients where id = 'f2c00000-0000-0000-0000-000000000001';
with u as (update public.clients set name = name where id = 'f2c00000-0000-0000-0000-000000000001' returning 1)
select 'active manager: own client UPDATE allowed', (count(*) = 1)::text from u;
with u as (update public.clients set name = name where id = 'f2c00000-0000-0000-0000-000000000002' returning 1)
select 'active manager: other branch client UPDATE denied', (count(*) = 0)::text from u;

-- 2. Inactive manager, branch access row kept (the fix)
set local request.jwt.claims = '{"sub":"f2000000-0000-0000-0000-000000000002","role":"authenticated"}';
select 'inactive manager: branch access denied', (not private.has_branch_access('f2b00000-0000-0000-0000-000000000001'))::text;
select 'inactive manager: client hidden', (count(*) = 0)::text from public.clients where id = 'f2c00000-0000-0000-0000-000000000001';
with u as (update public.clients set name = name where id = 'f2c00000-0000-0000-0000-000000000001' returning 1)
select 'inactive manager: client UPDATE denied', (count(*) = 0)::text from u;

-- 3. Role changed to worker, branch access row kept (the fix)
set local request.jwt.claims = '{"sub":"f2000000-0000-0000-0000-000000000003","role":"authenticated"}';
select 'role changed: branch access denied', (not private.has_branch_access('f2b00000-0000-0000-0000-000000000001'))::text;
select 'role changed: client hidden', (count(*) = 0)::text from public.clients where id = 'f2c00000-0000-0000-0000-000000000001';
with u as (update public.clients set name = name where id = 'f2c00000-0000-0000-0000-000000000001' returning 1)
select 'role changed: client UPDATE denied', (count(*) = 0)::text from u;

-- 4. Active manager with role branch_manager (regression: unchanged)
set local request.jwt.claims = '{"sub":"f2000000-0000-0000-0000-000000000004","role":"authenticated"}';
select 'branch_manager role: own branch allowed', private.has_branch_access('f2b00000-0000-0000-0000-000000000001')::text;
select 'branch_manager role: other branch denied', (not private.has_branch_access('f2b00000-0000-0000-0000-000000000002'))::text;

-- 5. Active System Admin (regression: unchanged)
set local request.jwt.claims = '{"sub":"f2000000-0000-0000-0000-000000000005","role":"authenticated"}';
select 'active admin: both branches allowed', (private.has_branch_access('f2b00000-0000-0000-0000-000000000001') and private.has_branch_access('f2b00000-0000-0000-0000-000000000002'))::text;
with u as (update public.clients set name = name where id in ('f2c00000-0000-0000-0000-000000000001', 'f2c00000-0000-0000-0000-000000000002') returning 1)
select 'active admin: both clients UPDATE allowed', (count(*) = 2)::text from u;

-- 6. Inactive System Admin with a leftover branch access row (the fix)
set local request.jwt.claims = '{"sub":"f2000000-0000-0000-0000-000000000006","role":"authenticated"}';
select 'inactive admin: branch access denied', (not private.has_branch_access('f2b00000-0000-0000-0000-000000000001'))::text;
with u as (update public.clients set name = name where id = 'f2c00000-0000-0000-0000-000000000001' returning 1)
select 'inactive admin: client UPDATE denied', (count(*) = 0)::text from u;

-- 7. Worker without branch access (regression: unchanged)
set local request.jwt.claims = '{"sub":"f2000000-0000-0000-0000-000000000007","role":"authenticated"}';
select 'worker: branch access denied', (not private.has_branch_access('f2b00000-0000-0000-0000-000000000001'))::text;

-- 8. anon cannot call the helper
reset role;
select 'anon: no EXECUTE on helper', (not has_function_privilege('anon', 'private.has_branch_access(uuid)', 'EXECUTE'))::text;
select 'authenticated: EXECUTE on helper kept', has_function_privilege('authenticated', 'private.has_branch_access(uuid)', 'EXECUTE')::text;

rollback;
