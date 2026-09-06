-- ChronoSquares workspace model v2
--
-- Goals:
--   * A provider can set up an organisation + first workspace WITHOUT a client.
--   * A provider can run several workspaces inside one organisation, and a
--     person can be a provider in one organisation and a client in another
--     (already allowed by RLS; the app just needs to stop assuming one row).
--   * Platform admins get read-only visibility across every delivery workspace
--     so the admin panel can preview the provider and client experience.
--   * Remove the throwaway "Demo" organisation created during earlier testing.

-- 1. Client-less workspaces --------------------------------------------------
ALTER TABLE public.delivery_workspaces ALTER COLUMN client_id DROP NOT NULL;

-- 2. Platform admin helper -------------------------------------------------
CREATE OR REPLACE FUNCTION public.delivery_is_platform_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin'::public.app_role);
$$;

-- 3. First-run provider setup: client details are now optional ------------
CREATE OR REPLACE FUNCTION public.delivery_create_provider_workspace(
  organization_name TEXT,
  workspace_name TEXT,
  client_name TEXT DEFAULT NULL,
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

  IF length(trim(coalesce(organization_name, ''))) < 2
     OR length(trim(coalesce(workspace_name, ''))) < 2 THEN
    RAISE EXCEPTION 'An organisation name and a workspace name are required';
  END IF;

  organization_slug :=
    trim(both '-' from lower(regexp_replace(trim(organization_name), '[^a-zA-Z0-9]+', '-', 'g')))
    || '-' || substr(replace(gen_random_uuid()::TEXT, '-', ''), 1, 8);

  INSERT INTO public.delivery_organizations (name, slug, owner_id)
  VALUES (trim(organization_name), organization_slug, current_user_id)
  RETURNING id INTO new_organization_id;

  INSERT INTO public.delivery_organization_members (organization_id, user_id, role)
  VALUES (new_organization_id, current_user_id, 'provider');

  IF client_name IS NOT NULL AND length(trim(client_name)) >= 2 THEN
    INSERT INTO public.delivery_clients (organization_id, name, company, email, status)
    VALUES (
      new_organization_id,
      trim(client_name),
      NULLIF(trim(client_company), ''),
      NULLIF(lower(trim(client_email)), ''),
      'onboarding'
    )
    RETURNING id INTO new_client_id;
  END IF;

  INSERT INTO public.delivery_workspaces (organization_id, client_id, name, status, description)
  VALUES (
    new_organization_id,
    new_client_id,
    trim(workspace_name),
    'onboarding',
    NULL
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

-- 4. Add further workspaces to an existing organisation ------------------
CREATE OR REPLACE FUNCTION public.delivery_add_workspace(
  target_organization UUID,
  workspace_name TEXT,
  client_name TEXT DEFAULT NULL,
  client_company TEXT DEFAULT NULL,
  client_email TEXT DEFAULT NULL
)
RETURNS TABLE (
  workspace_id UUID,
  intake_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_client_id UUID;
  new_workspace_id UUID;
  new_intake_id UUID;
BEGIN
  IF auth.uid() IS NULL OR NOT public.delivery_is_provider(target_organization) THEN
    RAISE EXCEPTION 'Only a provider can add a workspace to this organisation';
  END IF;

  IF length(trim(coalesce(workspace_name, ''))) < 2 THEN
    RAISE EXCEPTION 'A workspace name is required';
  END IF;

  IF client_name IS NOT NULL AND length(trim(client_name)) >= 2 THEN
    INSERT INTO public.delivery_clients (organization_id, name, company, email, status)
    VALUES (
      target_organization,
      trim(client_name),
      NULLIF(trim(client_company), ''),
      NULLIF(lower(trim(client_email)), ''),
      'onboarding'
    )
    RETURNING id INTO new_client_id;
  END IF;

  INSERT INTO public.delivery_workspaces (organization_id, client_id, name, status, description)
  VALUES (target_organization, new_client_id, trim(workspace_name), 'onboarding', NULL)
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

  RETURN QUERY SELECT new_workspace_id, new_intake_id;
END;
$$;

REVOKE ALL ON FUNCTION public.delivery_add_workspace(UUID, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delivery_add_workspace(UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- 5. Platform-admin read-only visibility for admin previews -------------
-- Permissive SELECT policies OR together with the member policies, so this
-- only widens read access for admins and never affects writes.
CREATE POLICY "delivery admin can read organisations" ON public.delivery_organizations
  FOR SELECT USING (public.delivery_is_platform_admin());
CREATE POLICY "delivery admin can read members" ON public.delivery_organization_members
  FOR SELECT USING (public.delivery_is_platform_admin());
CREATE POLICY "delivery admin can read clients" ON public.delivery_clients
  FOR SELECT USING (public.delivery_is_platform_admin());
CREATE POLICY "delivery admin can read workspaces" ON public.delivery_workspaces
  FOR SELECT USING (public.delivery_is_platform_admin());
CREATE POLICY "delivery admin can read projects" ON public.delivery_projects
  FOR SELECT USING (public.delivery_is_platform_admin());
CREATE POLICY "delivery admin can read project members" ON public.delivery_project_members
  FOR SELECT USING (public.delivery_is_platform_admin());
CREATE POLICY "delivery admin can read milestones" ON public.delivery_milestones
  FOR SELECT USING (public.delivery_is_platform_admin());
CREATE POLICY "delivery admin can read tasks" ON public.delivery_tasks
  FOR SELECT USING (public.delivery_is_platform_admin());
CREATE POLICY "delivery admin can read updates" ON public.delivery_updates
  FOR SELECT USING (public.delivery_is_platform_admin());
CREATE POLICY "delivery admin can read approvals" ON public.delivery_approvals
  FOR SELECT USING (public.delivery_is_platform_admin());
CREATE POLICY "delivery admin can read files" ON public.delivery_files
  FOR SELECT USING (public.delivery_is_platform_admin());
CREATE POLICY "delivery admin can read invoices" ON public.delivery_invoices
  FOR SELECT USING (public.delivery_is_platform_admin());
CREATE POLICY "delivery admin can read invoice items" ON public.delivery_invoice_items
  FOR SELECT USING (public.delivery_is_platform_admin());
CREATE POLICY "delivery admin can read intake forms" ON public.delivery_intake_forms
  FOR SELECT USING (public.delivery_is_platform_admin());
CREATE POLICY "delivery admin can read intake submissions" ON public.delivery_intake_submissions
  FOR SELECT USING (public.delivery_is_platform_admin());

-- 6. Remove the throwaway "Demo" organisation from earlier testing ------
DELETE FROM public.delivery_organizations
WHERE name = 'Demo'
  AND owner_id = '02f23a07-bf7f-43f5-8146-3c4b2beec3b8';
