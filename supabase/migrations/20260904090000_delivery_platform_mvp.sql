-- ChronoSquares delivery-platform MVP
-- The existing platform-admin tables remain untouched. These tables are
-- scoped to provider organisations and their client workspaces.

CREATE TABLE IF NOT EXISTS public.delivery_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.delivery_organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.delivery_organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('provider', 'client', 'contractor', 'stakeholder')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.delivery_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.delivery_organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  company TEXT,
  email TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('lead', 'onboarding', 'active', 'complete', 'paused')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.delivery_workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.delivery_organizations(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.delivery_clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'onboarding' CHECK (status IN ('onboarding', 'active', 'complete', 'paused')),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.delivery_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.delivery_workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'review', 'complete', 'paused')),
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  start_date DATE,
  due_date DATE,
  client_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.delivery_project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.delivery_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('provider', 'client', 'contractor', 'stakeholder')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.delivery_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.delivery_projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'review', 'complete')),
  due_date DATE,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.delivery_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.delivery_projects(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES public.delivery_milestones(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'blocked', 'done')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  visibility TEXT NOT NULL DEFAULT 'shared' CHECK (visibility IN ('shared', 'internal')),
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.delivery_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.delivery_projects(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'shared' CHECK (visibility IN ('shared', 'internal')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.delivery_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.delivery_projects(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES public.delivery_milestones(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'changes_requested')),
  requested_from UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.delivery_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.delivery_projects(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  visibility TEXT NOT NULL DEFAULT 'shared' CHECK (visibility IN ('shared', 'internal')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.delivery_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.delivery_workspaces(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.delivery_projects(id) ON DELETE SET NULL,
  number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  currency TEXT NOT NULL DEFAULT 'GBP',
  due_date DATE,
  total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.delivery_invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.delivery_invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC(10, 2) NOT NULL DEFAULT 1,
  unit_amount NUMERIC(12, 2) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.delivery_intake_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.delivery_workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('draft', 'open', 'submitted', 'closed')),
  fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.delivery_intake_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES public.delivery_intake_forms(id) ON DELETE CASCADE,
  submitted_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.delivery_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.delivery_organizations(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS delivery_projects_workspace_idx ON public.delivery_projects(workspace_id);
CREATE INDEX IF NOT EXISTS delivery_tasks_project_idx ON public.delivery_tasks(project_id);
CREATE INDEX IF NOT EXISTS delivery_updates_project_idx ON public.delivery_updates(project_id);
CREATE INDEX IF NOT EXISTS delivery_files_project_idx ON public.delivery_files(project_id);
CREATE INDEX IF NOT EXISTS delivery_notifications_user_idx ON public.delivery_notifications(user_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.delivery_is_org_member(target_org UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.delivery_organization_members
    WHERE organization_id = target_org AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.delivery_is_provider(target_org UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.delivery_organization_members
    WHERE organization_id = target_org AND user_id = auth.uid() AND role = 'provider'
  );
$$;

CREATE OR REPLACE FUNCTION public.delivery_can_access_project(target_project UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.delivery_projects p
    JOIN public.delivery_workspaces w ON w.id = p.workspace_id
    JOIN public.delivery_organization_members om ON om.organization_id = w.organization_id
    WHERE p.id = target_project
      AND om.user_id = auth.uid()
      AND (
        om.role = 'provider'
        OR (om.role IN ('client', 'contractor', 'stakeholder') AND p.client_visible = true)
      )
  );
$$;

ALTER TABLE public.delivery_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_intake_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_intake_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "delivery org members can view organisations" ON public.delivery_organizations
  FOR SELECT USING (public.delivery_is_org_member(id));
CREATE POLICY "delivery users can create organisations" ON public.delivery_organizations
  FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "delivery providers can update organisations" ON public.delivery_organizations
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "delivery members can view membership" ON public.delivery_organization_members
  FOR SELECT USING (user_id = auth.uid() OR public.delivery_is_provider(organization_id));
CREATE POLICY "delivery providers can manage membership" ON public.delivery_organization_members
  FOR ALL USING (public.delivery_is_provider(organization_id))
  WITH CHECK (public.delivery_is_provider(organization_id));
CREATE POLICY "delivery users can join their owned organisation" ON public.delivery_organization_members
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.delivery_organizations o
      WHERE o.id = organization_id AND o.owner_id = auth.uid()
    )
  );

CREATE POLICY "delivery providers can manage clients" ON public.delivery_clients
  FOR ALL USING (public.delivery_is_provider(organization_id))
  WITH CHECK (public.delivery_is_provider(organization_id));
CREATE POLICY "delivery clients can view own client record" ON public.delivery_clients
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "delivery members can view workspaces" ON public.delivery_workspaces
  FOR SELECT USING (
    public.delivery_is_org_member(organization_id)
    AND (
      public.delivery_is_provider(organization_id)
      OR EXISTS (
        SELECT 1 FROM public.delivery_clients c
        WHERE c.id = client_id AND c.user_id = auth.uid()
      )
    )
  );
CREATE POLICY "delivery providers can manage workspaces" ON public.delivery_workspaces
  FOR ALL USING (public.delivery_is_provider(organization_id))
  WITH CHECK (public.delivery_is_provider(organization_id));

CREATE POLICY "delivery project members can view projects" ON public.delivery_projects
  FOR SELECT USING (public.delivery_can_access_project(id));
CREATE POLICY "delivery providers can manage projects" ON public.delivery_projects
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.delivery_workspaces w
      WHERE w.id = workspace_id AND public.delivery_is_provider(w.organization_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.delivery_workspaces w
      WHERE w.id = workspace_id AND public.delivery_is_provider(w.organization_id)
    )
  );

CREATE POLICY "delivery members can view project memberships" ON public.delivery_project_members
  FOR SELECT USING (public.delivery_can_access_project(project_id));
CREATE POLICY "delivery providers can manage project memberships" ON public.delivery_project_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.delivery_projects p
      JOIN public.delivery_workspaces w ON w.id = p.workspace_id
      WHERE p.id = project_id AND public.delivery_is_provider(w.organization_id)
    )
  )
  WITH CHECK (true);

CREATE POLICY "delivery project members can view milestones" ON public.delivery_milestones
  FOR SELECT USING (public.delivery_can_access_project(project_id));
CREATE POLICY "delivery providers can manage milestones" ON public.delivery_milestones
  FOR ALL USING (
    public.delivery_can_access_project(project_id)
    AND EXISTS (
      SELECT 1 FROM public.delivery_projects p
      JOIN public.delivery_workspaces w ON w.id = p.workspace_id
      WHERE p.id = project_id AND public.delivery_is_provider(w.organization_id)
    )
  )
  WITH CHECK (true);

CREATE POLICY "delivery members can view scoped tasks" ON public.delivery_tasks
  FOR SELECT USING (
    public.delivery_can_access_project(project_id)
    AND (visibility = 'shared' OR EXISTS (
      SELECT 1 FROM public.delivery_projects p
      JOIN public.delivery_workspaces w ON w.id = p.workspace_id
      WHERE p.id = project_id AND public.delivery_is_provider(w.organization_id)
    ))
  );
CREATE POLICY "delivery providers can manage tasks" ON public.delivery_tasks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.delivery_projects p
      JOIN public.delivery_workspaces w ON w.id = p.workspace_id
      WHERE p.id = project_id AND public.delivery_is_provider(w.organization_id)
    )
  )
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "delivery members can view scoped updates" ON public.delivery_updates
  FOR SELECT USING (
    public.delivery_can_access_project(project_id)
    AND (visibility = 'shared' OR author_id = auth.uid())
  );
CREATE POLICY "delivery members can post updates" ON public.delivery_updates
  FOR INSERT WITH CHECK (author_id = auth.uid() AND public.delivery_can_access_project(project_id));

CREATE POLICY "delivery members can view approvals" ON public.delivery_approvals
  FOR SELECT USING (public.delivery_can_access_project(project_id));
CREATE POLICY "delivery providers can manage approvals" ON public.delivery_approvals
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.delivery_projects p
      JOIN public.delivery_workspaces w ON w.id = p.workspace_id
      WHERE p.id = project_id AND public.delivery_is_provider(w.organization_id)
    )
  )
  WITH CHECK (true);
CREATE POLICY "delivery requested users can respond" ON public.delivery_approvals
  FOR UPDATE USING (requested_from = auth.uid())
  WITH CHECK (requested_from = auth.uid());

CREATE POLICY "delivery members can view scoped files" ON public.delivery_files
  FOR SELECT USING (
    public.delivery_can_access_project(project_id)
    AND (visibility = 'shared' OR uploaded_by = auth.uid())
  );
CREATE POLICY "delivery members can upload files" ON public.delivery_files
  FOR INSERT WITH CHECK (uploaded_by = auth.uid() AND public.delivery_can_access_project(project_id));

CREATE POLICY "delivery providers can manage invoices" ON public.delivery_invoices
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.delivery_workspaces w
      WHERE w.id = workspace_id AND public.delivery_is_provider(w.organization_id)
    )
  )
  WITH CHECK (true);
CREATE POLICY "delivery clients can view invoices" ON public.delivery_invoices
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.delivery_workspaces w
      JOIN public.delivery_clients c ON c.id = w.client_id
      WHERE w.id = workspace_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "delivery invoice members can view items" ON public.delivery_invoice_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.delivery_invoices i
      WHERE i.id = invoice_id
      AND (
        EXISTS (SELECT 1 FROM public.delivery_workspaces w WHERE w.id = i.workspace_id AND public.delivery_is_provider(w.organization_id))
        OR EXISTS (SELECT 1 FROM public.delivery_workspaces w JOIN public.delivery_clients c ON c.id = w.client_id WHERE w.id = i.workspace_id AND c.user_id = auth.uid())
      )
    )
  );
CREATE POLICY "delivery providers can manage invoice items" ON public.delivery_invoice_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.delivery_invoices i
      JOIN public.delivery_workspaces w ON w.id = i.workspace_id
      WHERE i.id = invoice_id AND public.delivery_is_provider(w.organization_id)
    )
  )
  WITH CHECK (true);

CREATE POLICY "delivery members can view intake forms" ON public.delivery_intake_forms
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.delivery_workspaces w
      WHERE w.id = workspace_id
      AND (
        public.delivery_is_provider(w.organization_id)
        OR EXISTS (SELECT 1 FROM public.delivery_clients c WHERE c.id = w.client_id AND c.user_id = auth.uid())
      )
   ));
CREATE POLICY "delivery providers can manage intake forms" ON public.delivery_intake_forms
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.delivery_workspaces w WHERE w.id = workspace_id AND public.delivery_is_provider(w.organization_id))
  )
  WITH CHECK (true);

CREATE POLICY "delivery submitters and providers can view submissions" ON public.delivery_intake_submissions
  FOR SELECT USING (
    submitted_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.delivery_intake_forms f
      JOIN public.delivery_workspaces w ON w.id = f.workspace_id
      WHERE f.id = form_id AND public.delivery_is_provider(w.organization_id)
    )
  );
CREATE POLICY "delivery clients can submit intake" ON public.delivery_intake_submissions
  FOR INSERT WITH CHECK (submitted_by = auth.uid());

CREATE POLICY "delivery users can view notifications" ON public.delivery_notifications
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "delivery users can mark notifications" ON public.delivery_notifications
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- MVP handovers: an intake submission alerts provider members, while a
-- milestone reaching review/complete alerts the client on that workspace.
CREATE OR REPLACE FUNCTION public.delivery_notify_intake_submission()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  workspace_org UUID;
BEGIN
  SELECT w.organization_id INTO workspace_org
  FROM public.delivery_intake_forms f
  JOIN public.delivery_workspaces w ON w.id = f.workspace_id
  WHERE f.id = NEW.form_id;

  INSERT INTO public.delivery_notifications (user_id, organization_id, kind, title, body)
  SELECT om.user_id, workspace_org, 'intake', 'Intake submitted',
    'A client has submitted an onboarding intake and it is ready to review.'
  FROM public.delivery_organization_members om
  WHERE om.organization_id = workspace_org AND om.role = 'provider';
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS delivery_intake_submission_notification ON public.delivery_intake_submissions;
CREATE TRIGGER delivery_intake_submission_notification
  AFTER INSERT ON public.delivery_intake_submissions
  FOR EACH ROW EXECUTE FUNCTION public.delivery_notify_intake_submission();

CREATE OR REPLACE FUNCTION public.delivery_notify_milestone_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  client_user UUID;
  workspace_org UUID;
  project_name TEXT;
BEGIN
  IF NEW.status NOT IN ('review', 'complete')
     OR (TG_OP = 'UPDATE' AND OLD.status IS NOT DISTINCT FROM NEW.status) THEN
    RETURN NEW;
  END IF;

  SELECT c.user_id, w.organization_id, p.name
    INTO client_user, workspace_org, project_name
  FROM public.delivery_projects p
  JOIN public.delivery_workspaces w ON w.id = p.workspace_id
  JOIN public.delivery_clients c ON c.id = w.client_id
  WHERE p.id = NEW.project_id;

  IF client_user IS NOT NULL THEN
    INSERT INTO public.delivery_notifications (user_id, organization_id, kind, title, body)
    VALUES (
      client_user,
      workspace_org,
      'approval',
      'Milestone ready for review',
      project_name || ' has reached ' || NEW.status || ' and may need your approval.'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS delivery_milestone_notification ON public.delivery_milestones;
CREATE TRIGGER delivery_milestone_notification
  AFTER INSERT OR UPDATE OF status ON public.delivery_milestones
  FOR EACH ROW EXECUTE FUNCTION public.delivery_notify_milestone_change();