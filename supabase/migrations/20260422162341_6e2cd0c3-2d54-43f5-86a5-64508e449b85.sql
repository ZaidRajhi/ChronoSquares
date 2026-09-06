
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS nav_hidden_items jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS public.architect_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action_type text NOT NULL,
  description text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  previous_state jsonb,
  reverted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.architect_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own architect actions"
  ON public.architect_actions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_architect_actions_user_created
  ON public.architect_actions(user_id, created_at DESC);
