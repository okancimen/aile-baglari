-- Move action data to relational tables; remove legacy JSON payload columns.

alter table public.action_jobs
  drop column if exists result_payload;

alter table public.quiz_sessions
  drop column if exists action_insights;

drop function if exists public.get_quiz_session_by_key(text);

create or replace function public.get_quiz_session_by_key(p_session_key text)
returns table (
  id uuid,
  email text,
  parent_scores jsonb,
  child_scores jsonb,
  child_name text,
  child_gender text,
  child_age smallint,
  completed boolean,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    qs.id,
    qs.email,
    qs.parent_scores,
    qs.child_scores,
    qs.child_name,
    qs.child_gender,
    qs.child_age,
    qs.completed,
    qs.expires_at
  from public.quiz_sessions qs
  where qs.session_key = p_session_key
    and qs.expires_at > now()
  limit 1;
end;
$$;

grant execute on function public.get_quiz_session_by_key(text) to anon, authenticated;
