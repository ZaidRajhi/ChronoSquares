-- First-login provider setup for the ChronoSquares delivery workspace.
-- The function is security-definer so the complete setup is atomic while
-- still requiring an authenticated user.

CREATE OR REPLACE FUNCTION public.delivery_create_provider_workspace(
  organization_name TEXT,
  workspace_name TEXT,
  client_name TEXT,
  client_company TEXT DEFAULT NULL,
  client_email TEXT DEFAULT NULL
)
RETURNS TABLE (
  organization_id UUID,
  workspace_id UUID,
  intake_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID := auth.uid();
  new_organization_id UUID;
  new_workspace_id UUID;
  new_client_id UUID;
  new_intake_id UUID;
  organization_slug TEXT;
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'You must be signed in to create a provider workspace';
  END IF;

  IF length(trim(organization_name)) < 2
     OR length(trim(workspace_name)) < 2
     OR length(trim(client_name)) < 2 THEN
    RAISE EXCEPTION 'Organization, workspace, and client names are required';
  END IF;

  organization_slug :=
    trim(both '-' from lower(regexp_replace(trim(organization_name), '[^a-zA-Z0-9]+', '-', 'g')))
    || '-' || substr(replace(gen_random_uuid()::TEXT, '-', ''), 1, 8);

  INSERT INTO public.delivery_organizations (name, slug, owner_id)
  VALUES (trim(organization_name), organization_slug, current_user_id)
  RETURNING id INTO new_organization_id;

  INSERT INTO public.delivery_organization_members (organization_id, user_id, role)
  VALUES (new_organization_id, current_user_id, 'provider');

  INSERT INTO public.delivery_clients (organization_id, name, company, email, status)
  VALUES (
    new_organization_id,
    trim(client_name),
    NULLIF(trim(client_company), ''),
    NULLIF(lower(trim(client_email)), ''),
    'onboarding'
  )
  RETURNING id INTO new_client_id;

  INSERT INTO public.delivery_workspaces (organization_id, client_id, name, status, description)
  VALUES (
    new_organization_id,
    new_client_id,
    trim(workspace_name),
    'onboarding',
    'Your first client-delivery workspace.'
  )
  RETURNING id INTO new_workspace_id;

  INSERT INTO public.delivery_intake_forms (workspace_id, title, description, status, fields)
  VALUES (
    new_workspace_id,
    'Client kickoff intake',
    'A few details will help us make the kickoff productive and keep the first phase moving.',
    'open',
    '[
      {"id": "goals", "label": "What would make this engagement a success?", "type": "textarea"},
      {"id": "audience", "label": "Who are you most focused on reaching?", "type": "text"},
      {"id": "context", "label": "Share useful references, constraints, or context.", "type": "textarea"}
    ]'::JSONB
  )
  RETURNING id INTO new_intake_id;

  RETURN QUERY SELECT new_organization_id, new_workspace_id, new_intake_id;
END;
$$;

REVOKE ALL ON FUNCTION public.delivery_create_provider_workspace(TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delivery_create_provider_workspace(TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;