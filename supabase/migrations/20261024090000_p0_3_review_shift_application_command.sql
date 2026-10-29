-- P0-3: Admin review (accept / reject) of shift applications through a single
-- command, and close direct UPDATE / INSERT on public.shift_applications.
--
-- Before: the Admin review Server Action updated shift_applications directly.
-- The RLS UPDATE policies only checked branch access, so any status transition
-- (for example withdrawn -> applied, rejected -> accepted) was possible through
-- the Data API, there was no lock shared with apply / withdraw / placement, no
-- overlap warning (contract C-02), and no idempotency.
--
-- After:
-- * public.review_shift_application() is the only Admin write path.
--   Lock order: Shift, Worker, Application, then the actor-scoped receipt
--   (same prefix as apply_to_own_shift, withdraw_own_shift_application and
--   ensure_candidate_assignment).
-- * Only 'applied' applications can be decided.
-- * Accept is blocked for unavailable Shift states, inactive Workers and when
--   the Worker already has an active Assignment on the Shift. Reject is allowed
--   for any 'applied' application.
-- * Accept returns overlap warnings (C-02). When warnings exist and are not
--   acknowledged, nothing changes and 'confirmation_required' is returned; the
--   same idempotency key can then be reused with p_acknowledge_warnings = true.
-- * authenticated loses UPDATE and INSERT on public.shift_applications.
--   Worker apply / withdraw are SECURITY DEFINER commands and are unaffected.
--
-- Rollback (restores the previous direct-write behaviour):
--   grant insert, update on table public.shift_applications to authenticated;
--   create policy "Managers can update branch shift applications"
--     on public.shift_applications for update to authenticated
--     using (private.has_shift_slot_branch_access(shift_slot_id))
--     with check (private.has_shift_slot_branch_access(shift_slot_id));
--   create policy "System admins can update shift applications"
--     on public.shift_applications for update to authenticated
--     using (private.is_system_admin())
--     with check (private.is_system_admin());
-- The command and the receipt table can stay in place.

create table private.application_review_receipts (
  actor_profile_id uuid not null,
  idempotency_key uuid not null,
  application_id uuid not null,
  decision text not null,
  result jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  primary key (actor_profile_id, idempotency_key),
  constraint application_review_receipts_actor_fkey
    foreign key (actor_profile_id) references public.profiles(id) on delete restrict,
  constraint application_review_receipts_application_fkey
    foreign key (application_id) references public.shift_applications(id) on delete restrict,
  constraint application_review_receipts_decision_check
    check (decision in ('accepted', 'rejected')),
  constraint application_review_receipts_completion_check
    check (
      (result is null and completed_at is null)
      or (result is not null and completed_at is not null)
    )
);

comment on table private.application_review_receipts is
  'Actor-scoped idempotency and audit receipts for Admin application review.';

revoke all on table private.application_review_receipts
  from public, anon, authenticated, service_role;

create function public.review_shift_application(
  p_shift_id uuid,
  p_application_id uuid,
  p_decision text,
  p_idempotency_key uuid,
  p_acknowledge_warnings boolean default false
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
  v_result jsonb;
begin
  if p_shift_id is null
    or p_application_id is null
    or p_idempotency_key is null
    or p_decision is null
    or p_decision not in ('accepted', 'rejected') then
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

      if jsonb_array_length(v_warnings) > 0
        and not coalesce(p_acknowledge_warnings, false) then
        -- Nothing changes and the receipt stays open, so the same key can be
        -- reused once the Admin has confirmed the warnings.
        return jsonb_build_object(
          'ok', false, 'outcome', 'confirmation_required',
          'applicationState', v_application_status,
          'warnings', v_warnings, 'replayed', false
        );
      end if;
    end if;

    update public.shift_applications as sa
    set status = p_decision,
        reviewed_at = now(),
        reviewed_by = v_actor_id
    where sa.id = p_application_id
      and sa.status = 'applied';

    v_result := jsonb_build_object(
      'ok', true, 'outcome', p_decision,
      'applicationState', p_decision,
      'warnings', v_warnings, 'replayed', false
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

alter function public.review_shift_application(uuid, uuid, text, uuid, boolean)
  owner to postgres;

revoke all on function public.review_shift_application(uuid, uuid, text, uuid, boolean)
  from public, anon, authenticated, service_role;
grant execute on function public.review_shift_application(uuid, uuid, text, uuid, boolean)
  to authenticated;

-- Close the direct write paths.
drop policy "Managers can update branch shift applications"
  on public.shift_applications;
drop policy "System admins can update shift applications"
  on public.shift_applications;

revoke insert, update on table public.shift_applications from authenticated;
