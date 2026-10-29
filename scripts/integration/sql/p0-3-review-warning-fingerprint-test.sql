-- P0-3 follow-up: warning set fingerprint and re-confirmation
-- (run AFTER 20261024090000 and 20261024100000).
-- All checks must be true. One transaction, rolled back. ASCII only.

begin;

select 'guard: no cron schema (isolated DB)', (not exists (select 1 from pg_namespace where nspname = 'cron'))::text;
select 'guard: fixture ids unused', (not exists (select 1 from auth.users where id::text like 'f6000000-%') and not exists (select 1 from public.branches where code like 'PR05F-TEST-%'))::text;

-- Synthetic fixtures (example.invalid addresses, year 2099, no real data)
insert into auth.users (id, aud, role, email) values
  ('f6000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'pr05f-manager@example.invalid');
insert into public.profiles (id, display_name, account_type, is_active) values
  ('f6000000-0000-0000-0000-000000000001', 'PR05F manager', 'manager', true);
insert into public.branches (id, code, name) values
  ('f6b00000-0000-0000-0000-000000000001', 'PR05F-TEST-B1', 'PR05F test branch 1');
insert into public.manager_branch_access (profile_id, branch_id, role) values
  ('f6000000-0000-0000-0000-000000000001', 'f6b00000-0000-0000-0000-000000000001', 'manager');
insert into public.workplaces (id, branch_id, name, address) values
  ('f6d00000-0000-0000-0000-000000000001', 'f6b00000-0000-0000-0000-000000000001', 'PR05F test workplace', 'PR05F test address');
insert into public.projects (id, branch_id, name, status, start_date, end_date) values
  ('f6e00000-0000-0000-0000-000000000001', 'f6b00000-0000-0000-0000-000000000001', 'PR05F test project', 'recruiting', '2099-04-01', '2099-04-30');
insert into public.jobs (id, project_id, workplace_id, name) values
  ('f6f00000-0000-0000-0000-000000000001', 'f6e00000-0000-0000-0000-000000000001', 'f6d00000-0000-0000-0000-000000000001', 'PR05F test job');
-- S1 09-17 is the reviewed Shift. S2 12-20, S3 08-10, S5 16-18 and S6 13-15 all overlap S1.
insert into public.shift_slots (id, job_id, starts_at, ends_at, required_workers, status) values
  ('f6a00000-0000-0000-0000-000000000001', 'f6f00000-0000-0000-0000-000000000001', '2099-04-10 09:00+09', '2099-04-10 17:00+09', 20, 'recruiting'),
  ('f6a00000-0000-0000-0000-000000000002', 'f6f00000-0000-0000-0000-000000000001', '2099-04-10 12:00+09', '2099-04-10 20:00+09', 20, 'recruiting'),
  ('f6a00000-0000-0000-0000-000000000003', 'f6f00000-0000-0000-0000-000000000001', '2099-04-10 08:00+09', '2099-04-10 10:00+09', 20, 'recruiting'),
  ('f6a00000-0000-0000-0000-000000000005', 'f6f00000-0000-0000-0000-000000000001', '2099-04-10 16:00+09', '2099-04-10 18:00+09', 20, 'recruiting'),
  ('f6a00000-0000-0000-0000-000000000006', 'f6f00000-0000-0000-0000-000000000001', '2099-04-10 13:00+09', '2099-04-10 15:00+09', 20, 'recruiting');
insert into public.workers (id, staff_code, branch_id, auth_profile_id, display_name, status)
select ('f6c00000-0000-0000-0000-0000000000' || lpad(n::text, 2, '0'))::uuid, 'PR05F-W' || n, 'f6b00000-0000-0000-0000-000000000001', null, 'PR05F worker ' || n, 'active'
from generate_series(1, 12) as n;
-- Application aN = Worker WN on S1, all applied.
insert into public.shift_applications (id, shift_slot_id, worker_id, status)
select ('f6900000-0000-0000-0000-0000000000' || lpad(n::text, 2, '0'))::uuid, 'f6a00000-0000-0000-0000-000000000001', ('f6c00000-0000-0000-0000-0000000000' || lpad(n::text, 2, '0'))::uuid, 'applied'
from generate_series(1, 12) as n;
-- Existing Assignments that create warnings for the S1 Applications:
--  W1 none (no warning)   W2 S2   W3 S2   W4 S2+S3   W5 S2   W6 S2
--  W7 S6   W8 S2+S3       W9 S2   W10 S2  W11 S2     W12 none
insert into public.assignments (id, shift_slot_id, worker_id, source, status) values
  ('f6800000-0000-0000-0000-000000000002', 'f6a00000-0000-0000-0000-000000000002', 'f6c00000-0000-0000-0000-000000000002', 'manager', 'assigned'),
  ('f6800000-0000-0000-0000-000000000003', 'f6a00000-0000-0000-0000-000000000002', 'f6c00000-0000-0000-0000-000000000003', 'manager', 'assigned'),
  ('f6800000-0000-0000-0000-000000000004', 'f6a00000-0000-0000-0000-000000000002', 'f6c00000-0000-0000-0000-000000000004', 'manager', 'assigned'),
  ('f6800000-0000-0000-0000-000000000014', 'f6a00000-0000-0000-0000-000000000003', 'f6c00000-0000-0000-0000-000000000004', 'manager', 'assigned'),
  ('f6800000-0000-0000-0000-000000000005', 'f6a00000-0000-0000-0000-000000000002', 'f6c00000-0000-0000-0000-000000000005', 'manager', 'assigned'),
  ('f6800000-0000-0000-0000-000000000006', 'f6a00000-0000-0000-0000-000000000002', 'f6c00000-0000-0000-0000-000000000006', 'manager', 'assigned'),
  ('f6800000-0000-0000-0000-000000000007', 'f6a00000-0000-0000-0000-000000000006', 'f6c00000-0000-0000-0000-000000000007', 'manager', 'assigned'),
  ('f6800000-0000-0000-0000-000000000008', 'f6a00000-0000-0000-0000-000000000002', 'f6c00000-0000-0000-0000-000000000008', 'manager', 'assigned'),
  ('f6800000-0000-0000-0000-000000000018', 'f6a00000-0000-0000-0000-000000000003', 'f6c00000-0000-0000-0000-000000000008', 'manager', 'assigned'),
  ('f6800000-0000-0000-0000-000000000009', 'f6a00000-0000-0000-0000-000000000002', 'f6c00000-0000-0000-0000-000000000009', 'manager', 'assigned'),
  ('f6800000-0000-0000-0000-000000000010', 'f6a00000-0000-0000-0000-000000000002', 'f6c00000-0000-0000-0000-000000000010', 'manager', 'assigned'),
  ('f6800000-0000-0000-0000-000000000011', 'f6a00000-0000-0000-0000-000000000002', 'f6c00000-0000-0000-0000-000000000011', 'manager', 'assigned');

set local role authenticated;
set local request.jwt.claims = '{"sub":"f6000000-0000-0000-0000-000000000001","role":"authenticated"}';

-- 1. No warnings: no fingerprint is required
select public.review_shift_application('f6a00000-0000-0000-0000-000000000001', 'f6900000-0000-0000-0000-000000000001', 'accepted', 'f6700000-0000-0000-0000-000000000001') as n1 \gset
select 'no warning: accepted without fingerprint', ((:'n1'::jsonb ->> 'outcome') = 'accepted' and (:'n1'::jsonb -> 'warningsFingerprint') = 'null'::jsonb)::text;
select 'no warning: unrelated well-formed fingerprint is ignored', (public.review_shift_application('f6a00000-0000-0000-0000-000000000001', 'f6900000-0000-0000-0000-000000000012', 'accepted', 'f6700000-0000-0000-0000-000000000002', repeat('ab', 32)) ->> 'outcome' = 'accepted')::text;

-- 2. Warning shown, then confirmed with the returned fingerprint
select public.review_shift_application('f6a00000-0000-0000-0000-000000000001', 'f6900000-0000-0000-0000-000000000002', 'accepted', 'f6700000-0000-0000-0000-000000000003') as c1 \gset
select 'confirm: warning without fingerprint needs confirmation', ((:'c1'::jsonb ->> 'outcome') = 'confirmation_required' and jsonb_array_length(:'c1'::jsonb -> 'warnings') = 1 and (:'c1'::jsonb ->> 'warningsChanged') = 'false')::text;
select 'confirm: fingerprint is 64 lowercase hex', ((:'c1'::jsonb ->> 'warningsFingerprint') ~ '^[0-9a-f]{64}$')::text;
reset role;
select 'confirm: nothing changed and receipt not completed', (sa.status = 'applied' and sa.reviewed_at is null and r.result is null and r.completed_at is null)::text
from public.shift_applications as sa
join private.application_review_receipts as r on r.application_id = sa.id and r.idempotency_key = 'f6700000-0000-0000-0000-000000000003'
where sa.id = 'f6900000-0000-0000-0000-000000000002';
set local role authenticated;
select public.review_shift_application('f6a00000-0000-0000-0000-000000000001', 'f6900000-0000-0000-0000-000000000002', 'accepted', 'f6700000-0000-0000-0000-000000000003', :'c1'::jsonb ->> 'warningsFingerprint') as c2 \gset
select 'confirm: same key with returned fingerprint accepts', ((:'c2'::jsonb ->> 'outcome') = 'accepted' and (:'c2'::jsonb ->> 'warningsFingerprint') = (:'c1'::jsonb ->> 'warningsFingerprint') and jsonb_array_length(:'c2'::jsonb -> 'warnings') = 1)::text;
reset role;
select 'confirm: receipt keeps confirmed warnings, fingerprint, actor and time', (r.result ->> 'warningsFingerprint' = (:'c1'::jsonb ->> 'warningsFingerprint') and jsonb_array_length(r.result -> 'warnings') = 1 and r.actor_profile_id = 'f6000000-0000-0000-0000-000000000001' and r.completed_at is not null)::text
from private.application_review_receipts as r
where r.idempotency_key = 'f6700000-0000-0000-0000-000000000003';
set local role authenticated;
select 'replay: completed key replays without fingerprint', (public.review_shift_application('f6a00000-0000-0000-0000-000000000001', 'f6900000-0000-0000-0000-000000000002', 'accepted', 'f6700000-0000-0000-0000-000000000003') @> '{"outcome":"accepted","replayed":true}')::text;
select 'replay: completed key replays with another fingerprint', (public.review_shift_application('f6a00000-0000-0000-0000-000000000001', 'f6900000-0000-0000-0000-000000000002', 'accepted', 'f6700000-0000-0000-0000-000000000003', repeat('cd', 32)) @> '{"outcome":"accepted","replayed":true}')::text;

-- 3. Warning added after confirmation was shown (W3: S2, then S3 is added)
select public.review_shift_application('f6a00000-0000-0000-0000-000000000001', 'f6900000-0000-0000-0000-000000000003', 'accepted', 'f6700000-0000-0000-0000-000000000004') as i1 \gset
reset role;
insert into public.assignments (id, shift_slot_id, worker_id, source, status) values
  ('f6800000-0000-0000-0000-000000000013', 'f6a00000-0000-0000-0000-000000000003', 'f6c00000-0000-0000-0000-000000000003', 'manager', 'assigned');
set local role authenticated;
select public.review_shift_application('f6a00000-0000-0000-0000-000000000001', 'f6900000-0000-0000-0000-000000000003', 'accepted', 'f6700000-0000-0000-0000-000000000004', :'i1'::jsonb ->> 'warningsFingerprint') as i2 \gset
select 'added: old fingerprint needs re-confirmation', ((:'i2'::jsonb ->> 'outcome') = 'confirmation_required' and (:'i2'::jsonb ->> 'warningsChanged') = 'true')::text;
select 'added: new warnings and new fingerprint returned', (jsonb_array_length(:'i2'::jsonb -> 'warnings') = 2 and (:'i2'::jsonb ->> 'warningsFingerprint') <> (:'i1'::jsonb ->> 'warningsFingerprint'))::text;
reset role;
select 'added: nothing changed and receipt not completed', (sa.status = 'applied' and sa.reviewed_at is null and r.result is null and r.completed_at is null)::text
from public.shift_applications as sa
join private.application_review_receipts as r on r.application_id = sa.id and r.idempotency_key = 'f6700000-0000-0000-0000-000000000004'
where sa.id = 'f6900000-0000-0000-0000-000000000003';
set local role authenticated;
select 'added: open key used for another Application is a conflict', (public.review_shift_application('f6a00000-0000-0000-0000-000000000001', 'f6900000-0000-0000-0000-000000000005', 'accepted', 'f6700000-0000-0000-0000-000000000004') ->> 'outcome' = 'IDEMPOTENCY_CONFLICT')::text;
select 'added: same key with new fingerprint accepts', (public.review_shift_application('f6a00000-0000-0000-0000-000000000001', 'f6900000-0000-0000-0000-000000000003', 'accepted', 'f6700000-0000-0000-0000-000000000004', :'i2'::jsonb ->> 'warningsFingerprint') @> '{"ok":true,"outcome":"accepted"}')::text;

-- 4. Warning removed (W4: S2+S3, then S3 is cancelled)
select public.review_shift_application('f6a00000-0000-0000-0000-000000000001', 'f6900000-0000-0000-0000-000000000004', 'accepted', 'f6700000-0000-0000-0000-000000000005') as d1 \gset
reset role;
update public.assignments set status = 'cancelled_by_company' where id = 'f6800000-0000-0000-0000-000000000014';
set local role authenticated;
select public.review_shift_application('f6a00000-0000-0000-0000-000000000001', 'f6900000-0000-0000-0000-000000000004', 'accepted', 'f6700000-0000-0000-0000-000000000005', :'d1'::jsonb ->> 'warningsFingerprint') as d2 \gset
select 'removed: old fingerprint needs re-confirmation', ((:'d1'::jsonb -> 'warnings') is not null and jsonb_array_length(:'d1'::jsonb -> 'warnings') = 2 and (:'d2'::jsonb ->> 'outcome') = 'confirmation_required' and (:'d2'::jsonb ->> 'warningsChanged') = 'true' and jsonb_array_length(:'d2'::jsonb -> 'warnings') = 1)::text;

-- 5. Warning replaced, same count (W5: S2 cancelled, S5 added)
select public.review_shift_application('f6a00000-0000-0000-0000-000000000001', 'f6900000-0000-0000-0000-000000000005', 'accepted', 'f6700000-0000-0000-0000-000000000006') as x1 \gset
reset role;
update public.assignments set status = 'cancelled_by_company' where id = 'f6800000-0000-0000-0000-000000000005';
insert into public.assignments (id, shift_slot_id, worker_id, source, status) values
  ('f6800000-0000-0000-0000-000000000015', 'f6a00000-0000-0000-0000-000000000005', 'f6c00000-0000-0000-0000-000000000005', 'manager', 'assigned');
set local role authenticated;
select public.review_shift_application('f6a00000-0000-0000-0000-000000000001', 'f6900000-0000-0000-0000-000000000005', 'accepted', 'f6700000-0000-0000-0000-000000000006', :'x1'::jsonb ->> 'warningsFingerprint') as x2 \gset
select 'replaced: same count but different Shift needs re-confirmation', ((:'x2'::jsonb ->> 'outcome') = 'confirmation_required' and (:'x2'::jsonb ->> 'warningsChanged') = 'true' and jsonb_array_length(:'x2'::jsonb -> 'warnings') = 1 and (:'x2'::jsonb -> 'warnings' -> 0 ->> 'shiftId') = 'f6a00000-0000-0000-0000-000000000005')::text;

-- 6. All warnings gone (W6: S2 cancelled) -> no fingerprint needed any more
select public.review_shift_application('f6a00000-0000-0000-0000-000000000001', 'f6900000-0000-0000-0000-000000000006', 'accepted', 'f6700000-0000-0000-0000-000000000007') as g1 \gset
reset role;
update public.assignments set status = 'cancelled_by_company' where id = 'f6800000-0000-0000-0000-000000000006';
set local role authenticated;
select 'gone: accepted once no warning remains', (public.review_shift_application('f6a00000-0000-0000-0000-000000000001', 'f6900000-0000-0000-0000-000000000006', 'accepted', 'f6700000-0000-0000-0000-000000000007', :'g1'::jsonb ->> 'warningsFingerprint') @> '{"ok":true,"outcome":"accepted","warnings":[]}')::text;

-- 7. Time precision: the overlapping Shift moves by 1 microsecond (W7: S6)
select public.review_shift_application('f6a00000-0000-0000-0000-000000000001', 'f6900000-0000-0000-0000-000000000007', 'accepted', 'f6700000-0000-0000-0000-000000000008') as t1 \gset
reset role;
update public.shift_slots set ends_at = ends_at + interval '1 microsecond' where id = 'f6a00000-0000-0000-0000-000000000006';
set local role authenticated;
select 'precision: 1 microsecond change needs re-confirmation', (public.review_shift_application('f6a00000-0000-0000-0000-000000000001', 'f6900000-0000-0000-0000-000000000007', 'accepted', 'f6700000-0000-0000-0000-000000000008', :'t1'::jsonb ->> 'warningsFingerprint') @> '{"outcome":"confirmation_required","warningsChanged":true}')::text;

-- 8. Stability across session TimeZone (W8: two warnings)
set local timezone = 'UTC';
select public.review_shift_application('f6a00000-0000-0000-0000-000000000001', 'f6900000-0000-0000-0000-000000000008', 'accepted', 'f6700000-0000-0000-0000-000000000009') as z1 \gset
set local timezone = 'America/Los_Angeles';
select public.review_shift_application('f6a00000-0000-0000-0000-000000000001', 'f6900000-0000-0000-0000-000000000008', 'accepted', 'f6700000-0000-0000-0000-000000000009') as z2 \gset
set local timezone = 'Asia/Tokyo';
select public.review_shift_application('f6a00000-0000-0000-0000-000000000001', 'f6900000-0000-0000-0000-000000000008', 'accepted', 'f6700000-0000-0000-0000-000000000009') as z3 \gset
select 'timezone: JSON times differ between sessions', ((:'z1'::jsonb -> 'warnings' -> 0 ->> 'startsAt') <> (:'z2'::jsonb -> 'warnings' -> 0 ->> 'startsAt'))::text;
select 'timezone: fingerprint is the same in UTC, Los Angeles and Tokyo', ((:'z1'::jsonb ->> 'warningsFingerprint') = (:'z2'::jsonb ->> 'warningsFingerprint') and (:'z2'::jsonb ->> 'warningsFingerprint') = (:'z3'::jsonb ->> 'warningsFingerprint') and jsonb_array_length(:'z1'::jsonb -> 'warnings') = 2)::text;
select 'timezone: fingerprint from a UTC session accepts in a Tokyo session', (public.review_shift_application('f6a00000-0000-0000-0000-000000000001', 'f6900000-0000-0000-0000-000000000008', 'accepted', 'f6700000-0000-0000-0000-000000000009', :'z1'::jsonb ->> 'warningsFingerprint') @> '{"ok":true,"outcome":"accepted"}')::text;
reset timezone;

-- 9. Order independence and binding to the Application (helper called directly)
reset role;
select 'order: reversed warning array gives the same fingerprint', (private.application_review_warnings_fingerprint('f6900000-0000-0000-0000-000000000008', :'z1'::jsonb -> 'warnings') = private.application_review_warnings_fingerprint('f6900000-0000-0000-0000-000000000008', (select jsonb_agg(e order by ord desc) from jsonb_array_elements(:'z1'::jsonb -> 'warnings') with ordinality as t(e, ord))))::text;
select 'order: other JSON offsets for the same instants give the same fingerprint', (private.application_review_warnings_fingerprint('f6900000-0000-0000-0000-000000000008', :'z1'::jsonb -> 'warnings') = private.application_review_warnings_fingerprint('f6900000-0000-0000-0000-000000000008', :'z3'::jsonb -> 'warnings'))::text;
select 'order: empty warning set has no fingerprint', (private.application_review_warnings_fingerprint('f6900000-0000-0000-0000-000000000008', '[]'::jsonb) is null)::text;
set local role authenticated;
select public.review_shift_application('f6a00000-0000-0000-0000-000000000001', 'f6900000-0000-0000-0000-000000000009', 'accepted', 'f6700000-0000-0000-0000-00000000000a') as b9 \gset
select public.review_shift_application('f6a00000-0000-0000-0000-000000000001', 'f6900000-0000-0000-0000-000000000010', 'accepted', 'f6700000-0000-0000-0000-00000000000b', :'b9'::jsonb ->> 'warningsFingerprint') as b10 \gset
select 'binding: same warnings but another Application needs its own confirmation', ((:'b9'::jsonb -> 'warnings') = (:'b10'::jsonb -> 'warnings') and (:'b10'::jsonb ->> 'outcome') = 'confirmation_required' and (:'b10'::jsonb ->> 'warningsFingerprint') <> (:'b9'::jsonb ->> 'warningsFingerprint'))::text;

-- 10. Reject ignores warnings; malformed fingerprint is an invalid request
select 'reject: Application with warnings is rejected without fingerprint', (public.review_shift_application('f6a00000-0000-0000-0000-000000000001', 'f6900000-0000-0000-0000-000000000011', 'rejected', 'f6700000-0000-0000-0000-00000000000c') @> '{"ok":true,"outcome":"rejected"}')::text;
do $$
begin
  perform public.review_shift_application('f6a00000-0000-0000-0000-000000000001', 'f6900000-0000-0000-0000-000000000009', 'accepted', 'f6700000-0000-0000-0000-00000000000d', 'NOT-A-FINGERPRINT');
  perform set_config('pr05f.malformed', 'no_error', true);
exception when sqlstate '22023' then
  perform set_config('pr05f.malformed', 'rejected', true);
end
$$;
select 'input: malformed fingerprint raises invalid request', (current_setting('pr05f.malformed') = 'rejected')::text;

-- 11. Final state, function definition and privileges
reset role;
select 'state: mismatched calls changed nothing', (count(*) = 4)::text from public.shift_applications where id in ('f6900000-0000-0000-0000-000000000004', 'f6900000-0000-0000-0000-000000000005', 'f6900000-0000-0000-0000-000000000007', 'f6900000-0000-0000-0000-000000000010') and status = 'applied' and reviewed_at is null;
select 'state: open receipts have no stored result', (count(*) = 4)::text from private.application_review_receipts where idempotency_key in ('f6700000-0000-0000-0000-000000000005', 'f6700000-0000-0000-0000-000000000006', 'f6700000-0000-0000-0000-000000000008', 'f6700000-0000-0000-0000-00000000000b') and result is null and completed_at is null;
select 'definition: boolean signature removed', (to_regprocedure('public.review_shift_application(uuid,uuid,text,uuid,boolean)') is null)::text;
select 'definition: exactly one review command', (count(*) = 1)::text from pg_proc where proname = 'review_shift_application' and pronamespace = 'public'::regnamespace;
select 'definition: SECURITY DEFINER, empty search_path, owner postgres', (p.prosecdef and p.proconfig = array['search_path=""'] and pg_get_userbyid(p.proowner) = 'postgres')::text from pg_proc as p where p.oid = 'public.review_shift_application(uuid,uuid,text,uuid,text)'::regprocedure;
select 'privilege: only authenticated can execute review command', (has_function_privilege('authenticated', 'public.review_shift_application(uuid,uuid,text,uuid,text)', 'EXECUTE') and not has_function_privilege('anon', 'public.review_shift_application(uuid,uuid,text,uuid,text)', 'EXECUTE') and not has_function_privilege('service_role', 'public.review_shift_application(uuid,uuid,text,uuid,text)', 'EXECUTE') and not exists (select 1 from pg_proc as p, aclexplode(p.proacl) as acl where p.oid = 'public.review_shift_application(uuid,uuid,text,uuid,text)'::regprocedure and acl.grantee = 0))::text;
select 'privilege: fingerprint helper not executable by API roles', (not has_function_privilege('authenticated', 'private.application_review_warnings_fingerprint(uuid,jsonb)', 'EXECUTE') and not has_function_privilege('anon', 'private.application_review_warnings_fingerprint(uuid,jsonb)', 'EXECUTE') and not has_function_privilege('service_role', 'private.application_review_warnings_fingerprint(uuid,jsonb)', 'EXECUTE'))::text;
select 'privilege: direct writes on shift_applications stay closed', (not has_table_privilege('authenticated', 'public.shift_applications', 'UPDATE') and not has_table_privilege('authenticated', 'public.shift_applications', 'INSERT'))::text;

rollback;
