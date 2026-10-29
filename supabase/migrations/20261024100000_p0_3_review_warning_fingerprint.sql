-- P0-3 follow-up (M-03 / SH-03 / PM-02): re-confirm when the warning set
-- changes between confirmation and accept.
--
-- Before: review_shift_application(..., p_acknowledge_warnings boolean) accepted
-- with any current warnings once the flag was true, even if the warnings had
-- changed after the Admin saw them.
--
-- After:
-- * confirmation_required returns the warnings and a fingerprint (SHA-256 over
--   the application id and the normalised warning set). The Admin confirms by
--   sending that fingerprint back with the same idempotency key.
-- * On accept the command recomputes the warning set after locking Shift and
--   Worker and compares fingerprints. A mismatch returns confirmation_required
--   with the new warnings, the new fingerprint and warningsChanged = true.
--   Nothing changes and the receipt stays open (no stored result).
-- * No warnings: no fingerprint is required (any or no value is accepted).
-- * Normalisation: each warning is code | shiftId | startsAt | endsAt, with the
--   times as integer microseconds since the Unix epoch (independent of the
--   session TimeZone and of the JSON offset), lines sorted and de-duplicated, so
--   input order does not matter.
-- * Replays of a completed key return the stored result (fingerprint ignored),
--   as before. A different application or decision on the same key is still
--   IDEMPOTENCY_CONFLICT.
-- * The boolean signature is dropped; the only caller is the Admin review
--   Server Action, changed in the same commit.
--
-- Rollback (restores the boolean flag of 20261024090000):
--   drop function public.review_shift_application(uuid, uuid, text, uuid, text);
--   drop function private.application_review_warnings_fingerprint(uuid, jsonb);
--   then re-run the "create function public.review_shift_application" block of
--   20261024090000_p0_3_review_shift_application_command.sql with its
--   "alter function ... owner to postgres", "revoke all ..." and
--   "grant execute ... to authenticated" statements, and revert the Server
--   Action and button changes of this commit.

create function private.application_review_warnings_fingerprint(
  p_application_id uuid,
  p_warnings jsonb
)
returns text
language sql
stable
set search_path = ''
as $$
  select case
    when p_warnings is null or jsonb_array_length(p_warnings) = 0 then null
    else encode(
      sha256(
        convert_to(
          'opscue.application-review-warnings.v1' || chr(10)
            || p_application_id::text || chr(10)
            || (
              select string_agg(normalised.line, chr(10) order by normalised.line)
              from (
                select distinct
                  (warning ->> 'code')
                    || '|' || ((warning ->> 'shiftId')::uuid)::text
                    || '|' || trunc(extract(epoch from (warning ->> 'startsAt')::timestamptz) * 1000000)::bigint::text
                    || '|' || trunc(extract(epoch from (warning ->> 'endsAt')::timestamptz) * 1000000)::bigint::text
                    as line
                from jsonb_array_elements(p_warnings) as warning
              ) as normalised
            ),
          'UTF8'
        )
      ),
      'hex'
    )
  end
$$;

comment on function private.application_review_warnings_fingerprint(uuid, jsonb) is
  'Order- and TimeZone-independent SHA-256 fingerprint of an application review warning set.';

alter function private.application_review_warnings_fingerprint(uuid, jsonb)
  owner to postgres;
revoke all on function private.application_review_warnings_fingerprint(uuid, jsonb)
  from public, anon, authenticated, service_role;

drop function public.review_shift_application(uuid, uuid, text, uuid, boolean);

create function public.review_shift_application(
  p_shift_id uuid,
  p_application_id uuid,
  p_decision text,
  p_idempotency_key uuid,
  p_acknowledged_warnings_fingerprint text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := (select auth.uid());
  v_shift_branch_id uuid;
  v_shift_status text;
  v_starts_at timestamptz;
  v_ends_at timestamptz;
  v_worker_id uuid;
  v_worker_status text;
  v_application_status text;
  v_receipt_application_id uuid;
  v_receipt_decision text;
  v_receipt_result jsonb;
  v_warnings jsonb := '[]'::jsonb;
  v_warnings_fingerprint text;
  v_result jsonb;
begin
  if p_shift_id is null
    or p_application_id is null
    or p_idempotency_key is null
    or p_decision is null
    or p_decision not in ('accepted', 'rejected')
    or (
      p_acknowledged_warnings_fingerprint is not null
      and p_acknowledged_warnings_fingerprint !~ '^[0-9a-f]{64}$'
    ) then
    raise exception using
      errcode = '22023',
      message = 'invalid_application_review_request';
  end if;

  if v_actor_id is null or not private.is_active_admin() then
    return jsonb_build_object(
      'ok', false, 'outcome', 'unavailable', 'applicationState', null,
      'warnings', '[]'::jsonb, 'replayed', false
    );
  end if;

  -- Canonical lock order: Shift, Worker, Application, then receipt.
  select p.branch_id, ss.status, ss.starts_at, ss.ends_at
  into v_shift_branch_id, v_shift_status, v_starts_at, v_ends_at
  from public.shift_slots as ss
  join public.jobs as j on j.id = ss.job_id
  join public.projects as p on p.id = j.project_id
  where ss.id = p_shift_id
  for update of ss;

  if not found or not private.has_branch_access(v_shift_branch_id) then
    return jsonb_build_object(
      'ok', false, 'outcome', 'unavailable', 'applicationState', null,
      'warnings', '[]'::jsonb, 'replayed', false
    );
  end if;

  select sa.worker_id
  into v_worker_id
  from public.shift_applications as sa
  where sa.id = p_application_id
    and sa.shift_slot_id = p_shift_id;

  if not found then
    return jsonb_build_object(
      'ok', false, 'outcome', 'unavailable', 'applicationState', null,
      'warnings', '[]'::jsonb, 'replayed', false
    );
  end if;

  select w.status
  into v_worker_status
  from public.workers as w
  where w.id = v_worker_id
  for update;

  select sa.status
  into v_application_status
  from public.shift_applications as sa
  where sa.id = p_application_id
    and sa.shift_slot_id = p_shift_id
    and sa.worker_id = v_worker_id
  for update;

  if not found then
    return jsonb_build_object(
      'ok', false, 'outcome', 'unavailable', 'applicationState', null,
      'warnings', '[]'::jsonb, 'replayed', false
    );
  end if;

  insert into private.application_review_receipts (
    actor_profile_id, idempotency_key, application_id, decision
  ) values (
    v_actor_id, p_idempotency_key, p_application_id, p_decision
  ) on conflict (actor_profile_id, idempotency_key) do nothing;

  select receipt.application_id, receipt.decision, receipt.result
  into v_receipt_application_id, v_receipt_decision, v_receipt_result
  from private.application_review_receipts as receipt
  where receipt.actor_profile_id = v_actor_id
    and receipt.idempotency_key = p_idempotency_key
  for update;

  if v_receipt_application_id <> p_application_id
    or v_receipt_decision <> p_decision then
    return jsonb_build_object(
      'ok', false, 'outcome', 'IDEMPOTENCY_CONFLICT', 'applicationState', null,
      'warnings', '[]'::jsonb, 'replayed', false
    );
  end if;

  if v_receipt_result is not null then
    return jsonb_set(v_receipt_result, '{replayed}', 'true'::jsonb, true);
  end if;

  <<decision>>
  begin
    if v_application_status <> 'applied' then
      v_result := jsonb_build_object(
        'ok', false, 'outcome', 'application_already_decided',
        'applicationState', v_application_status,
        'warnings', '[]'::jsonb, 'replayed', false
      );
      exit decision;
    end if;

    if exists (
      select 1
      from public.assignments as a
      where a.shift_slot_id = p_shift_id
        and a.worker_id = v_worker_id
        and a.status in ('assigned', 'confirmed', 'completed')
    ) then
      v_result := jsonb_build_object(
        'ok', false, 'outcome', 'assignment_exists',
        'applicationState', v_application_status,
        'warnings', '[]'::jsonb, 'replayed', false
      );
      exit decision;
    end if;

    if p_decision = 'accepted' then
      if v_shift_status not in ('recruiting', 'closed', 'confirmed', 'in_progress') then
        v_result := jsonb_build_object(
          'ok', false, 'outcome', 'shift_state_unavailable',
          'applicationState', v_application_status,
          'warnings', '[]'::jsonb, 'replayed', false
        );
        exit decision;
      end if;

      if v_worker_status is distinct from 'active' then
        v_result := jsonb_build_object(
          'ok', false, 'outcome', 'worker_inactive',
          'applicationState', v_application_status,
          'warnings', '[]'::jsonb, 'replayed', false
        );
        exit decision;
      end if;

      -- C-02: overlap with the same Worker's other active Assignments or
      -- accepted Applications is a warning on accept, not a block.
      select coalesce(
        jsonb_agg(
          jsonb_build_object(
            'code', conflict.code,
            'shiftId', conflict.shift_id,
            'startsAt', conflict.starts_at,
            'endsAt', conflict.ends_at
          )
          order by conflict.starts_at, conflict.code, conflict.shift_id
        ),
        '[]'::jsonb
      )
      into v_warnings
      from (
        select
          'OVERLAPS_OWN_ASSIGNMENT'::text as code,
          other.id as shift_id,
          other.starts_at,
          other.ends_at
        from public.assignments as a
        join public.shift_slots as other on other.id = a.shift_slot_id
        where a.worker_id = v_worker_id
          and a.shift_slot_id <> p_shift_id
          and a.status in ('assigned', 'confirmed', 'completed')
          and tstzrange(other.starts_at, other.ends_at, '[)')
            && tstzrange(v_starts_at, v_ends_at, '[)')
        union all
        select
          'OVERLAPS_OWN_ACCEPTED_APPLICATION'::text,
          other.id,
          other.starts_at,
          other.ends_at
        from public.shift_applications as sa
        join public.shift_slots as other on other.id = sa.shift_slot_id
        where sa.worker_id = v_worker_id
          and sa.shift_slot_id <> p_shift_id
          and sa.status = 'accepted'
          and tstzrange(other.starts_at, other.ends_at, '[)')
            && tstzrange(v_starts_at, v_ends_at, '[)')
      ) as conflict;

      -- The warning set is computed here, after the Shift and Worker locks,
      -- and compared with the fingerprint the Admin confirmed. Any difference
      -- (added, removed, replaced or re-timed warnings) means the Admin has not
      -- seen the current set: nothing changes, the receipt stays open and the
      -- same key can be reused with the new fingerprint. No warnings means no
      -- fingerprint is required.
      v_warnings_fingerprint := private.application_review_warnings_fingerprint(
        p_application_id, v_warnings
      );

      if v_warnings_fingerprint is not null
        and p_acknowledged_warnings_fingerprint is distinct from v_warnings_fingerprint then
        return jsonb_build_object(
          'ok', false, 'outcome', 'confirmation_required',
          'applicationState', v_application_status,
          'warnings', v_warnings,
          'warningsFingerprint', v_warnings_fingerprint,
          'warningsChanged', p_acknowledged_warnings_fingerprint is not null,
          'replayed', false
        );
      end if;
    end if;

    update public.shift_applications as sa
    set status = p_decision,
        reviewed_at = now(),
        reviewed_by = v_actor_id
    where sa.id = p_application_id
      and sa.status = 'applied';

    -- The receipt keeps the confirmed warnings and their fingerprint; the
    -- receipt's actor_profile_id and completed_at record who confirmed and when.
    v_result := jsonb_build_object(
      'ok', true, 'outcome', p_decision,
      'applicationState', p_decision,
      'warnings', v_warnings,
      'warningsFingerprint', v_warnings_fingerprint,
      'replayed', false
    );
  end decision;

  update private.application_review_receipts as receipt
  set result = v_result,
      completed_at = now()
  where receipt.actor_profile_id = v_actor_id
    and receipt.idempotency_key = p_idempotency_key;

  return v_result;
end;
$$;

alter function public.review_shift_application(uuid, uuid, text, uuid, text)
  owner to postgres;

revoke all on function public.review_shift_application(uuid, uuid, text, uuid, text)
  from public, anon, authenticated, service_role;
grant execute on function public.review_shift_application(uuid, uuid, text, uuid, text)
  to authenticated;
