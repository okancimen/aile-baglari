-- Persist LLM micro-actions per quiz session; optional child age on create.

alter table public.quiz_sessions
  add column if not exists action_insights jsonb null,
  add column if not exists child_age smallint null;

-- Replace create_quiz_session (add p_child_age)
drop function if exists public.create_quiz_session(jsonb, text, text, text, jsonb, boolean);

create or replace function public.create_quiz_session(
  p_parent_scores jsonb,
  p_email text default null,
  p_child_name text default null,
  p_child_gender text default null,
  p_child_scores jsonb default null,
  p_completed boolean default false,
  p_child_age smallint default null
)
returns table (
  id uuid,
  session_key text,
  email text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  insert into public.quiz_sessions (
    parent_scores,
    email,
    child_name,
    child_gender,
    child_age,
    child_scores,
    completed,
    completed_at
  )
  values (
    coalesce(p_parent_scores, '{}'::jsonb),
    p_email,
    p_child_name,
    p_child_gender,
    p_child_age,
    p_child_scores,
    p_completed,
    case when p_completed then now() else null end
  )
  returning quiz_sessions.id, quiz_sessions.session_key, quiz_sessions.email;
end;
$$;

grant execute on function public.create_quiz_session(jsonb, text, text, text, jsonb, boolean, smallint) to anon, authenticated;

-- Extend get_quiz_session_by_key for clients (ContinueQuiz)
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
  expires_at timestamptz,
  action_insights jsonb
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
    qs.expires_at,
    qs.action_insights
  from public.quiz_sessions qs
  where qs.session_key = p_session_key
    and qs.expires_at > now()
  limit 1;
end;
$$;
