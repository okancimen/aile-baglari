-- Delayed retry for action_jobs: schedule failed jobs for re-queue after cooldown.

alter table public.action_jobs
  add column if not exists next_retry_at timestamptz null,
  add column if not exists retry_cycle int not null default 0;

comment on column public.action_jobs.next_retry_at is 'When set on failed jobs, worker re-queues to pending after this time (if retry_cycle allows).';
comment on column public.action_jobs.retry_cycle is 'Increments when a failed job is re-queued for an extra processing cycle; max one extra cycle vs initial enqueue.';

create index if not exists idx_action_jobs_failed_next_retry
  on public.action_jobs (status, next_retry_at)
  where status = 'failed';
