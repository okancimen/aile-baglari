-- Repair: legacy action_plans shells may lack timestamp columns required by eduentry-api
-- (upsert sends generated_at, updated_at). PostgREST returns PGRST204 if column missing from cache.

alter table public.action_plans
  add column if not exists generated_at timestamptz,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

update public.action_plans
set
  generated_at = coalesce(generated_at, now()),
  created_at = coalesce(created_at, now()),
  updated_at = coalesce(updated_at, now())
where generated_at is null
   or created_at is null
   or updated_at is null;

alter table public.action_plans alter column generated_at set not null;
alter table public.action_plans alter column created_at set not null;
alter table public.action_plans alter column updated_at set not null;
