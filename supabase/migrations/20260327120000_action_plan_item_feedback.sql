-- Per micro-action parent feedback (Deneyeceğiz / Şimdilik atlayalım + optional note).

create table if not exists public.action_plan_item_feedback (
  id uuid primary key default extensions.gen_random_uuid(),
  action_plan_item_id uuid not null references public.action_plan_items(id) on delete cascade,
  action_index int not null check (action_index >= 0),
  intent text not null check (intent in ('will_try', 'skip_for_now')),
  note text,
  updated_at timestamptz not null default now(),
  unique (action_plan_item_id, action_index)
);

create index if not exists idx_action_plan_item_feedback_item
  on public.action_plan_item_feedback(action_plan_item_id);
