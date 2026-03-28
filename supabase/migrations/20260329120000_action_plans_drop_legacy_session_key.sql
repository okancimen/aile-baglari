-- Legacy: some databases kept action_plans.session_key NOT NULL while the app only upserts
-- quiz_session_id (see 20260326120000_relational_action_plans.sql). Inserts then violate 23502.

alter table public.action_plans drop column if exists session_key;
