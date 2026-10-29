-- P0-1: require an active Manager profile for branch-scoped access.
--
-- Before: private.has_branch_access() allowed any user who had a
-- manager_branch_access row, even after the profile was deactivated
-- (profiles.is_active = false) or changed to another account_type.
-- After: System Admin (already checks is_active) or an active profile with
-- account_type = 'manager' that has a manager_branch_access row.
--
-- Name, argument, return type, volatility and security mode are unchanged,
-- so the RLS policies and RPCs that call this helper need no change.
-- CREATE OR REPLACE keeps the existing owner and grants; they are restated
-- below to keep the intended privileges explicit.

create or replace function private.has_branch_access(target_branch_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_system_admin()
    or exists (
      select 1
      from public.manager_branch_access as mba
      join public.profiles as p on p.id = mba.profile_id
      where mba.profile_id = (select auth.uid())
        and mba.branch_id = target_branch_id
        and p.is_active = true
        and p.account_type = 'manager'
    );
$$;

revoke all on function private.has_branch_access(uuid) from public;
revoke all on function private.has_branch_access(uuid) from anon;
grant execute on function private.has_branch_access(uuid) to authenticated;
