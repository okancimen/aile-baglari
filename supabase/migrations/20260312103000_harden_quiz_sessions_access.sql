alter table public.quiz_sessions
  alter column session_key set default encode(gen_random_bytes(16), 'hex');

alter table public.quiz_sessions
  add column if not exists expires_at timestamptz not null default (now() + interval '7 days'),
  add column if not exists completed_at timestamptz;

drop policy if exists "Anyone can create a quiz session" on public.quiz_sessions;
drop policy if exists "Anyone can read their session by key" on public.quiz_sessions;
drop policy if exists "Anyone can update a session" on public.quiz_sessions;

create or replace function public.create_quiz_session(
  p_parent_scores jsonb,
  p_email text default null,
  p_child_name text default null,
  p_child_gender text default null,
  p_child_scores jsonb default null,
  p_completed boolean default false
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
    child_scores,
    completed,
    completed_at
  )
  values (
    coalesce(p_parent_scores, '{}'::jsonb),
    p_email,
    p_child_name,
    p_child_gender,
    p_child_scores,
    p_completed,
    case when p_completed then now() else null end
  )
  returning quiz_sessions.id, quiz_sessions.session_key, quiz_sessions.email;
end;
$$;

create or replace function public.get_quiz_session_by_key(p_session_key text)
returns table (
  id uuid,
  email text,
  parent_scores jsonb,
  child_scores jsonb,
  child_name text,
  child_gender text,
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
    qs.completed,
    qs.expires_at
  from public.quiz_sessions qs
  where qs.session_key = p_session_key
    and qs.expires_at > now()
  limit 1;
end;
$$;

create or replace function public.complete_quiz_session_by_key(
  p_session_key text,
  p_child_scores jsonb
)
returns table (
  id uuid,
  email text,
  session_key text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  update public.quiz_sessions qs
  set
    child_scores = p_child_scores,
    completed = true,
    completed_at = now()
  where qs.session_key = p_session_key
    and qs.completed = false
    and qs.expires_at > now()
  returning qs.id, qs.email, qs.session_key;
end;
$$;

revoke all on public.quiz_sessions from anon, authenticated;

grant execute on function public.create_quiz_session(jsonb, text, text, text, jsonb, boolean) to anon, authenticated;
grant execute on function public.get_quiz_session_by_key(text) to anon, authenticated;
grant execute on function public.complete_quiz_session_by_key(text, jsonb) to anon, authenticated;
