-- Secure role-based invitations for clients, contractors, and stakeholders.

CREATE TABLE IF NOT EXISTS public.delivery_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.delivery_organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('client', 'contractor', 'stakeholder')),
  token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS delivery_invitations_token_idx ON public.delivery_invitations(token);
CREATE INDEX IF NOT EXISTS delivery_invitations_email_idx ON public.delivery_invitations(lower(email));

ALTER TABLE public.delivery_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "delivery providers can view invitations"
  ON public.delivery_invitations
  FOR SELECT
  USING (public.delivery_is_provider(organization_id));

CREATE POLICY "delivery providers can manage invitations"
  ON public.delivery_invitations
  FOR ALL
  USING (public.delivery_is_provider(organization_id))
  WITH CHECK (public.delivery_is_provider(organization_id));

CREATE OR REPLACE FUNCTION public.delivery_create_invitation(
  target_organization UUID,
  invite_email TEXT,
  invite_role TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID := auth.uid();
  new_token UUID;
BEGIN
  IF current_user_id IS NULL OR NOT public.delivery_is_provider(target_organization) THEN
    RAISE EXCEPTION 'Only a provider can create delivery invitations';
  END IF;

  IF invite_role NOT IN ('client', 'contractor', 'stakeholder') THEN
    RAISE EXCEPTION 'That invitation role is not available';
  END IF;

  IF position('@' IN trim(invite_email)) < 2 THEN
    RAISE EXCEPTION 'Enter a valid email address';
  END IF;

  INSERT INTO public.delivery_invitations (organization_id, email, role, invited_by)
  VALUES (target_organization, lower(trim(invite_email)), invite_role, current_user_id)
  RETURNING token INTO new_token;

  RETURN new_token;
END;
$$;

CREATE OR REPLACE FUNCTION public.delivery_accept_invitation(invite_token UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID := auth.uid();
  current_user_email TEXT := lower(auth.email());
  invitation public.delivery_invitations%ROWTYPE;
  membership_id UUID;
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'You must be signed in to accept an invitation';
  END IF;

  SELECT *
  INTO invitation
  FROM public.delivery_invitations
  WHERE token = invite_token
    AND accepted_at IS NULL
    AND expires_at > now()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'This invitation is invalid or has expired';
  END IF;

  IF lower(invitation.email) <> current_user_email THEN
    RAISE EXCEPTION 'Sign in with the invited email address to continue';
  END IF;

  INSERT INTO public.delivery_organization_members (organization_id, user_id, role)
  VALUES (invitation.organization_id, current_user_id, invitation.role)
  ON CONFLICT (organization_id, user_id)
  DO UPDATE SET role = CASE
    WHEN public.delivery_organization_members.role = 'provider'
      THEN public.delivery_organization_members.role
    ELSE EXCLUDED.role
  END
  RETURNING id INTO membership_id;

  UPDATE public.delivery_invitations
  SET accepted_at = now()
  WHERE id = invitation.id;

  RETURN invitation.organization_id;
END;
$$;

REVOKE ALL ON FUNCTION public.delivery_create_invitation(UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delivery_create_invitation(UUID, TEXT, TEXT) TO authenticated;

REVOKE ALL ON FUNCTION public.delivery_accept_invitation(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delivery_accept_invitation(UUID) TO authenticated;