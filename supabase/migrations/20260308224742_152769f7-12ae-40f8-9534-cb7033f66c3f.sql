-- gen_random_bytes() için (session_key varsayılanı)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE public.quiz_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_key TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex'),
  parent_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
  email TEXT,
  child_scores JSONB,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.quiz_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create a quiz session"
ON public.quiz_sessions FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Anyone can read their session by key"
ON public.quiz_sessions FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Anyone can update a session"
ON public.quiz_sessions FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);
