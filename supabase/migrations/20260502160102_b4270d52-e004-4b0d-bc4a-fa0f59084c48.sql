
-- Approval + sub-channels for communities
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS is_approved boolean NOT NULL DEFAULT false;
-- Existing communities (seeded by admin) stay live
UPDATE public.communities SET is_approved = true WHERE is_official = true OR is_approved IS NOT TRUE;

-- Replace public read policy so non-admin users only see approved communities
DROP POLICY IF EXISTS "Communities are viewable by everyone" ON public.communities;
CREATE POLICY "Communities visible if approved or owner/admin"
  ON public.communities FOR SELECT
  USING (
    is_approved = true
    OR auth.uid() = created_by
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE TABLE IF NOT EXISTS public.community_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL,
  slug text NOT NULL,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  position integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (community_id, slug)
);
ALTER TABLE public.community_channels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Channels readable by everyone" ON public.community_channels FOR SELECT USING (true);
CREATE POLICY "Members create channels" ON public.community_channels FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = created_by AND EXISTS (
    SELECT 1 FROM public.community_members m WHERE m.community_id = community_channels.community_id AND m.user_id = auth.uid()
  )
);
CREATE POLICY "Admins manage channels" ON public.community_channels FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE IF NOT EXISTS public.community_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL,
  community_id uuid NOT NULL,
  user_id uuid NOT NULL,
  body text NOT NULL DEFAULT '',
  is_hidden boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.community_messages ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS community_messages_channel_idx ON public.community_messages(channel_id, created_at);
CREATE POLICY "Messages visible if not hidden" ON public.community_messages FOR SELECT USING (
  is_hidden = false OR auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role)
);
CREATE POLICY "Members post messages" ON public.community_messages FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM public.community_members m WHERE m.community_id = community_messages.community_id AND m.user_id = auth.uid()
  )
);
CREATE POLICY "Authors delete own messages" ON public.community_messages FOR DELETE TO authenticated USING (
  auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role)
);
CREATE POLICY "Admins hide messages" ON public.community_messages FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

-- Mailing-list communications log (admin-only)
CREATE TABLE IF NOT EXISTS public.email_communications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_name text NOT NULL DEFAULT 'chronosquares',
  subject text NOT NULL,
  body text NOT NULL DEFAULT '',
  recipient_count integer NOT NULL DEFAULT 0,
  sent_by uuid,
  sent_at timestamptz NOT NULL DEFAULT now(),
  notes text
);
ALTER TABLE public.email_communications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage email comms" ON public.email_communications FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
