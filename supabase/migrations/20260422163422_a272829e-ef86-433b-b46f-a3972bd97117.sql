
-- Add structural shape to overlays (visual tile silhouette: rounded, sharp, cloud, minimal2d)
ALTER TABLE public.overlays ADD COLUMN IF NOT EXISTS shape TEXT NOT NULL DEFAULT 'rounded';

-- Communities: anyone can join, focused on shared goals/topics
CREATE TABLE IF NOT EXISTS public.communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  topic TEXT NOT NULL DEFAULT 'general',
  member_count INT NOT NULL DEFAULT 0,
  is_official BOOLEAN NOT NULL DEFAULT false,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.community_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (community_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

-- Communities are public to read, admin-controlled to create
CREATE POLICY "Communities are viewable by everyone" ON public.communities FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create communities" ON public.communities FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Admins can update communities" ON public.communities FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Members
CREATE POLICY "Memberships are public" ON public.community_members FOR SELECT USING (true);
CREATE POLICY "Users can join" ON public.community_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave" ON public.community_members FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Posts: visible if not hidden; authors can create/delete their own
CREATE POLICY "Posts visible if not hidden" ON public.community_posts FOR SELECT USING (is_hidden = false OR auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Members can post" ON public.community_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Authors can delete their post" ON public.community_posts FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can hide posts" ON public.community_posts FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Maintain member_count on join/leave
CREATE OR REPLACE FUNCTION public.bump_community_count() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.communities SET member_count = member_count + 1 WHERE id = NEW.community_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.communities SET member_count = GREATEST(0, member_count - 1) WHERE id = OLD.community_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS trg_community_member_bump ON public.community_members;
CREATE TRIGGER trg_community_member_bump
AFTER INSERT OR DELETE ON public.community_members
FOR EACH ROW EXECUTE FUNCTION public.bump_community_count();

-- Seed a few starter communities
INSERT INTO public.communities (slug, name, description, topic, is_official) VALUES
  ('early-risers', 'Early Risers', 'Build a 5am habit alongside hundreds of others. Daily check-ins.', 'habits', true),
  ('deep-work', 'Deep Work Guild', 'Share focus blocks, methods, and weekly retros.', 'time', true),
  ('debt-free-2026', 'Debt-Free 2026', 'Group goal: clear consumer debt by year-end. Anonymized milestones.', 'finance', true),
  ('reading-100', 'Reading 100', 'Finish 100 books this year — share reviews and queues.', 'media', true),
  ('builders', 'Builders', 'Founders, indie hackers, and side-project people.', 'goals', true)
ON CONFLICT (slug) DO NOTHING;

-- Backfill shape on existing overlays with 1 of each variant for demo
UPDATE public.overlays SET shape = 'sharp'      WHERE slug = 'cyber-cyan';
UPDATE public.overlays SET shape = 'cloud'      WHERE slug = 'sakura-bloom';
UPDATE public.overlays SET shape = 'minimal2d'  WHERE slug = 'paper-ink';
