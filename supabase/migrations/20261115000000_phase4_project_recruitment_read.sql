-- Phase 4 / Task A: project-level Worker recruitment read contract.
--
-- Additive only. public.get_own_recruitment_shifts and the Worker Application
-- commands are NOT modified. Two new read-only SECURITY DEFINER functions:
--   public.get_own_recruitment_projects(p_limit, p_offset)
--   public.get_own_recruitment_project_shifts(p_project_id, p_limit, p_offset)
-- The Shift projection of the second function is derived from the effective
-- definition of public.get_own_recruitment_shifts (20260926173032 plus the
-- 20260926173536 and 20260926174808 replacements); the only differences are the Project filter,
-- the added "projectId" key, and the Project header. Authorization, Branch
-- boundary and visibility predicates are identical to the existing function.

create or replace function public.get_own_recruitment_projects(
  p_limit integer default 12,
  p_offset integer default 0
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_worker_id uuid := private.current_worker_id();
  v_limit integer := greatest(1, least(coalesce(p_limit, 12), 48));
  v_offset integer := greatest(coalesce(p_offset, 0), 0);
  v_items jsonb;
  v_has_more boolean;
  v_total integer;
begin
  if (select auth.uid()) is null or v_worker_id is null then
    return jsonb_build_object('ok', true, 'items', '[]'::jsonb, 'hasMore', false, 'totalProjects', 0);
  end if;

  -- Visibility is identical to public.get_own_recruitment_shifts: the Worker's
  -- Branch, recruiting Project, recruiting future Shift, not already assigned.
  with visible as (
    select p.id as project_id, p.name as project_name, ss.starts_at, ss.ends_at,
      coalesce(ss.application_deadline, ss.starts_at) as application_deadline,
      j.hourly_wage, app.status as application_status
    from public.shift_slots ss
    join public.jobs j on j.id = ss.job_id
    join public.projects p on p.id = j.project_id
    join public.workers w on w.id = v_worker_id and w.branch_id = p.branch_id
    left join public.shift_applications app on app.shift_slot_id = ss.id and app.worker_id = v_worker_id
    where p.status = 'recruiting' and ss.status = 'recruiting' and ss.starts_at > now()
      and not exists (
        select 1 from public.assignments own
        where own.shift_slot_id = ss.id and own.worker_id = v_worker_id
          and own.status in ('assigned','confirmed','completed')
      )
  ), grouped as (
    select v.project_id, v.project_name,
      count(*)::integer as shift_count,
      (count(*) filter (where v.application_status in ('applied','accepted')))::integer as applied_count,
      min(v.starts_at) as first_starts_at,
      max(v.ends_at) as last_ends_at,
      min(v.application_deadline) filter (where v.application_deadline > now()) as nearest_deadline,
      min(v.hourly_wage) as wage_min,
      max(v.hourly_wage) as wage_max
    from visible v
    group by v.project_id, v.project_name
  ), ordered as (
    select g.* from grouped g
    order by g.first_starts_at, g.project_id
    limit v_limit + 1 offset v_offset
  )
  select coalesce(jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
      'projectId', r.project_id, 'projectName', r.project_name,
      'shiftCount', r.shift_count, 'appliedCount', r.applied_count,
      'firstStartsAt', r.first_starts_at, 'lastEndsAt', r.last_ends_at,
      'nearestApplicationDeadline', r.nearest_deadline,
      'hourlyWageMin', r.wage_min, 'hourlyWageMax', r.wage_max
    )) order by r.first_starts_at, r.project_id), '[]'::jsonb),
    (select count(*) > v_limit from ordered),
    (select count(*)::integer from (select distinct p2.id
        from public.shift_slots ss2
        join public.jobs j2 on j2.id = ss2.job_id
        join public.projects p2 on p2.id = j2.project_id
        join public.workers w2 on w2.id = v_worker_id and w2.branch_id = p2.branch_id
        where p2.status = 'recruiting' and ss2.status = 'recruiting' and ss2.starts_at > now()
          and not exists (select 1 from public.assignments own2
            where own2.shift_slot_id = ss2.id and own2.worker_id = v_worker_id
              and own2.status in ('assigned','confirmed','completed'))) t)
  into v_items, v_has_more, v_total
  from (select * from ordered order by first_starts_at, project_id limit v_limit) r;

  return jsonb_build_object('ok', true, 'items', v_items, 'hasMore', v_has_more, 'totalProjects', v_total);
end;
$$;

alter function public.get_own_recruitment_projects(integer, integer) owner to postgres;
revoke all on function public.get_own_recruitment_projects(integer, integer) from public, anon, service_role;
grant execute on function public.get_own_recruitment_projects(integer, integer) to authenticated;

create or replace function public.get_own_recruitment_project_shifts(
  p_project_id uuid,
  p_limit integer default 24,
  p_offset integer default 0
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_worker_id uuid := private.current_worker_id();
  v_limit integer := greatest(1, least(coalesce(p_limit, 24), 48));
  v_offset integer := greatest(coalesce(p_offset, 0), 0);
  v_items jsonb;
  v_has_more boolean;
  v_project jsonb;
begin
  if p_project_id is null then
    return jsonb_build_object('ok', false, 'outcome', 'invalid_request', 'project', null, 'items', '[]'::jsonb, 'hasMore', false);
  end if;

  if (select auth.uid()) is null or v_worker_id is null then
    return jsonb_build_object('ok', true, 'project', null, 'items', '[]'::jsonb, 'hasMore', false);
  end if;

  -- Header only for a Project the Worker may see: same Branch, still recruiting.
  select jsonb_build_object('projectId', p.id, 'projectName', p.name)
  into v_project
  from public.projects p
  join public.workers w on w.id = v_worker_id and w.branch_id = p.branch_id
  where p.id = p_project_id and p.status = 'recruiting';

  if v_project is null then
    return jsonb_build_object('ok', true, 'project', null, 'items', '[]'::jsonb, 'hasMore', false);
  end if;

  with candidate as (
    select ss.id, ss.label, ss.starts_at, ss.ends_at, ss.meeting_at, ss.required_workers,
      coalesce(ss.application_deadline, ss.starts_at) as application_deadline,
      j.id as job_id, j.name as job_name, j.description, j.clothing_note, j.belongings_note,
      j.access_note, j.meeting_note, j.transport_type, j.transport_amount, j.transport_max_amount,
      j.hourly_wage, j.transportation_fee_cap, j.dress_code, j.requirements, j.meal_notes,
      j.recruitment_notes, j.manual_url, p.id as project_id, p.name as project_name,
      wp.name as workplace_name, wp.address as workplace_address, wp.access_note as workplace_access_note,
      wp.meeting_note as workplace_meeting_note, wp.map_url
    from public.shift_slots ss
    join public.jobs j on j.id = ss.job_id
    join public.projects p on p.id = j.project_id
    join public.workplaces wp on wp.id = j.workplace_id
    join public.workers w on w.id = v_worker_id and w.branch_id = p.branch_id
    where p.status = 'recruiting' and ss.status = 'recruiting' and ss.starts_at > now()
      and p.id = p_project_id
      and not exists (select 1 from public.assignments own where own.shift_slot_id = ss.id and own.worker_id = v_worker_id and own.status in ('assigned','confirmed','completed'))
    order by ss.starts_at, ss.id
    limit v_limit + 1 offset v_offset
  ), shaped as (
    select c.*, coalesce(cap.count, 0)::integer as active_assignments,
      app.status as application_status,
      public.get_worker_shift_availability_facts(v_worker_id, c.id) as availability,
      coalesce((select jsonb_agg(jsonb_build_object('kind','skill','name',s.name) order by s.name)
        from public.job_skill_requirements r join public.skills s on s.id=r.skill_id where r.job_id=c.job_id), '[]'::jsonb) as required_skills,
      coalesce((select jsonb_agg(jsonb_build_object('kind','qualification','name',q.name) order by q.name)
        from public.job_qualification_requirements r join public.qualifications q on q.id=r.qualification_id where r.job_id=c.job_id), '[]'::jsonb) as required_qualifications,
      exists (select 1 from public.job_skill_requirements r join public.skills s on s.id=r.skill_id left join public.worker_skills ws on ws.worker_id=v_worker_id and ws.skill_id=r.skill_id and ws.is_active where r.job_id=c.job_id and (not s.is_active or ws.worker_id is null))
        or exists (select 1 from public.job_qualification_requirements r join public.qualifications q on q.id=r.qualification_id left join public.worker_qualifications wq on wq.worker_id=v_worker_id and wq.qualification_id=r.qualification_id where r.job_id=c.job_id and (not q.is_active or wq.worker_id is null or wq.revoked_at is not null or (wq.valid_from is not null and wq.valid_from > (c.starts_at at time zone 'Asia/Tokyo')::date) or (wq.expires_on is not null and wq.expires_on < (c.starts_at at time zone 'Asia/Tokyo')::date))) as requirement_blocked
    from candidate c
    left join lateral (select count(*) from public.assignments a where a.shift_slot_id=c.id and a.status in ('assigned','confirmed','completed')) cap on true
    left join public.shift_applications app on app.shift_slot_id=c.id and app.worker_id=v_worker_id
  ), rendered as (
    select s.*, greatest(s.required_workers - s.active_assignments, 0) as remaining_capacity,
      case
        when s.application_status='applied' then 'applied'
        when s.application_status='accepted' then 'accepted_waiting_assignment'
        when s.application_status='rejected' then 'rejected'
        when s.application_status='withdrawn' then 'withdrawn'
        when s.application_deadline <= now() then 'deadline_passed'
        when s.active_assignments >= s.required_workers then 'capacity_full'
        when s.requirement_blocked or coalesce((s.availability->>'workerStatusEligible')::boolean, false)=false or coalesce((s.availability->>'availabilityEligible')::boolean, false)=false or coalesce((s.availability->>'overlapEligible')::boolean, false)=false then 'not_eligible'
        when s.availability->>'availabilityState' in ('unknown','partially_available','consultation_required')
          or s.availability->'preferenceMatches'->>'preferredSchedule' in ('partially_matched','not_matched') then 'available_with_warning'
        else 'available' end as state
    from shaped s
  )
  select coalesce(jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
    'shiftId', id, 'projectId', project_id, 'projectName', project_name, 'jobName', job_name, 'label', label,
    'startsAt', starts_at, 'endsAt', ends_at, 'meetingAt', meeting_at, 'applicationDeadline', application_deadline,
    'workplaceName', workplace_name, 'workplaceAddress', workplace_address, 'accessNote', coalesce(access_note, workplace_access_note),
    'meetingNote', coalesce(meeting_note, workplace_meeting_note), 'description', description,
    'clothingNote', coalesce(dress_code, clothing_note), 'belongingsNote', belongings_note, 'mealNotes', meal_notes,
    'hourlyWage', hourly_wage, 'transportationFeeCap', transportation_fee_cap, 'transportType', transport_type,
    'transportAmount', transport_amount, 'transportMaxAmount', transport_max_amount, 'recruitmentNotes', recruitment_notes,
    'manualUrl', manual_url, 'mapUrl', map_url, 'requirementsText', requirements,
    'requirements', required_skills || required_qualifications, 'remainingCapacity', remaining_capacity,
    'applicationState', application_status, 'state', state,
    'eligibility', jsonb_build_object('availabilityState', availability->>'availabilityState', 'safeReasons', case when requirement_blocked then jsonb_build_array('required_conditions_not_met') when coalesce((availability->>'overlapEligible')::boolean, true)=false then jsonb_build_array('other_scheduled_shift_overlaps') when coalesce((availability->>'availabilityEligible')::boolean, true)=false then jsonb_build_array('availability_unavailable') when availability->>'availabilityState' in ('unknown','partially_available','consultation_required') then jsonb_build_array('availability_needs_confirmation') when availability->'preferenceMatches'->>'preferredSchedule' in ('partially_matched','not_matched') then jsonb_build_array('preference_not_matched') else '[]'::jsonb end)
  )) order by starts_at, id), '[]'::jsonb),
    (select count(*) > v_limit from candidate)
  into v_items, v_has_more
  from (select * from rendered order by starts_at, id limit v_limit) r;

  return jsonb_build_object('ok', true, 'project', v_project, 'items', v_items, 'hasMore', v_has_more);
end;
$$;

alter function public.get_own_recruitment_project_shifts(uuid, integer, integer) owner to postgres;
revoke all on function public.get_own_recruitment_project_shifts(uuid, integer, integer) from public, anon, service_role;
grant execute on function public.get_own_recruitment_project_shifts(uuid, integer, integer) to authenticated;
