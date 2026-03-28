-- Repair: some databases have public.action_plans without quiz_session_id because an older
-- or empty shell table existed before 20260326120000_relational_action_plans.sql ran
-- (CREATE TABLE IF NOT EXISTS skips DDL). PostgREST then returns 42703 on filter quiz_session_id=eq...

alter table public.action_plans
  add column if not exists quiz_session_id uuid references public.quiz_sessions(id) on delete cascade;

-- Detach jobs from orphan plans before deleting plan rows
update public.action_jobs j
set action_plan_id = null
where j.action_plan_id is not null
  and exists (
    select 1 from public.action_plans p
    where p.id = j.action_plan_id and p.quiz_session_id is null
  );

delete from public.action_plan_items i
using public.action_plans p
where i.action_plan_id = p.id
  and p.quiz_session_id is null;

delete from public.action_plans p
where p.quiz_session_id is null;

-- Safe when table is empty or orphans were removed; no-op if column already NOT NULL
alter table public.action_plans alter column quiz_session_id set not null;

create unique index if not exists action_plans_quiz_session_id_uidx
  on public.action_plans (quiz_session_id);
