
-- 1. community_members: restrict SELECT
DROP POLICY IF EXISTS "Memberships are public" ON public.community_members;

CREATE POLICY "Members view co-memberships"
ON public.community_members
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.community_members m
    WHERE m.community_id = community_members.community_id
      AND m.user_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- 2. community_posts: require membership to INSERT
DROP POLICY IF EXISTS "Members can post" ON public.community_posts;

CREATE POLICY "Members can post"
ON public.community_posts
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.community_members m
    WHERE m.community_id = community_posts.community_id
      AND m.user_id = auth.uid()
  )
);

-- 3. user_roles: explicit deny for non-admin INSERT/UPDATE/DELETE
CREATE POLICY "Only admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
