-- Async LLM action-plan jobs queue.

create table if not exists public.action_jobs (
  id uuid primary key default extensions.gen_random_uuid(),
  session_key text not null references public.quiz_sessions(session_key) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  attempts int not null default 0,
  max_attempts int not null default 3,
  worker_id text null,
  request_payload jsonb not null default '{}'::jsonb,
  result_payload jsonb null,
  error text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  started_at timestamptz null,
  completed_at timestamptz null
);

create index if not exists idx_action_jobs_status_created
  on public.action_jobs(status, created_at);

create unique index if not exists ux_action_jobs_session_active
  on public.action_jobs(session_key)
  where status in ('pending', 'processing');
