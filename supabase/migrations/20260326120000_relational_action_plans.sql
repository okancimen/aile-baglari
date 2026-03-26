-- Relational storage for generated micro-actions.

create table if not exists public.categories (
  key text primary key,
  label text not null,
  sort_order int not null unique
);

insert into public.categories (key, label, sort_order) values
  ('duzen_ve_rutin', 'Düzen ve Rutin', 1),
  ('sosyallik', 'Sosyallik', 2),
  ('sebat_ve_azim', 'Sebat ve Azim', 3),
  ('duyusal_hassasiyet', 'Duyusal Hassasiyet', 4),
  ('uyum_saglama', 'Uyum Sağlama', 5),
  ('duygusal_tepki', 'Duygusal Tepki', 6),
  ('bagimsizlik', 'Bağımsızlık', 7),
  ('fiziksel_aktivite', 'Fiziksel Aktivite', 8),
  ('merak_ve_kesif', 'Merak ve Keşif', 9),
  ('odaklanma', 'Odaklanma', 10)
on conflict (key) do update
set
  label = excluded.label,
  sort_order = excluded.sort_order;

create table if not exists public.action_plans (
  id uuid primary key default extensions.gen_random_uuid(),
  quiz_session_id uuid not null unique references public.quiz_sessions(id) on delete cascade,
  generated_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.action_plan_items (
  id uuid primary key default extensions.gen_random_uuid(),
  action_plan_id uuid not null references public.action_plans(id) on delete cascade,
  category_key text not null references public.categories(key),
  summary text not null default '',
  actions text[] not null default '{}'::text[],
  item_order int not null,
  unique (action_plan_id, category_key),
  unique (action_plan_id, item_order)
);

create index if not exists idx_action_plan_items_plan_order
  on public.action_plan_items(action_plan_id, item_order);

alter table public.action_jobs
  add column if not exists action_plan_id uuid null references public.action_plans(id) on delete set null;

create index if not exists idx_action_jobs_action_plan_id
  on public.action_jobs(action_plan_id);
