import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export type DeliveryRole = "provider" | "client" | "contractor" | "stakeholder";
export type DataSource = "supabase";

/** A plan the admin preview can impersonate. Real billing is unaffected. */
export type PlanId = "free" | "starter" | "pro" | "team";

export interface DeliveryOrganization {
  id: string;
  name: string;
  slug: string;
}

export interface DeliveryClient {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  status: "lead" | "onboarding" | "active" | "complete" | "paused";
}

export interface DeliveryWorkspace {
  id: string;
  client_id: string | null;
  name: string;
  status: "onboarding" | "active" | "complete" | "paused";
  description: string | null;
}

/**
 * One place a person can act. A person can hold different roles in different
 * spaces — provider in their own organisation, client in someone else's.
 */
export interface DeliverySpace {
  workspaceId: string;
  workspaceName: string;
  workspaceStatus: DeliveryWorkspace["status"];
  organizationId: string;
  organizationName: string;
  clientId: string | null;
  role: DeliveryRole;
}

export interface PreviewState {
  role: DeliveryRole;
  plan: PlanId;
  organizationId: string;
  organizationName: string;
  workspaceId: string;
  workspaceName: string;
}

export interface DeliveryProject {
  id: string;
  workspace_id: string;
  name: string;
  status: "planning" | "active" | "review" | "complete" | "paused";
  progress: number;
  start_date: string | null;
  due_date: string | null;
  client_visible: boolean;
}

export interface DeliveryMilestone {
  id: string;
  project_id: string;
  name: string;
  status: "upcoming" | "active" | "review" | "complete";
  due_date: string | null;
  position: number;
}

export interface DeliveryTask {
  id: string;
  project_id: string;
  milestone_id: string | null;
  title: string;
  status: "todo" | "in_progress" | "blocked" | "done";
  priority: "low" | "normal" | "high" | "urgent";
  visibility: "shared" | "internal";
  due_date: string | null;
  assigned_to: string | null;
}

export interface DeliveryUpdate {
  id: string;
  project_id: string;
  author_id: string;
  author_name: string;
  body: string;
  visibility: "shared" | "internal";
  created_at: string;
}

export interface DeliveryApproval {
  id: string;
  project_id: string;
  milestone_id: string | null;
  title: string;
  status: "pending" | "approved" | "changes_requested";
  requested_from: string | null;
  notes: string | null;
  created_at: string;
}

export interface DeliveryFile {
  id: string;
  project_id: string;
  uploaded_by: string;
  name: string;
  url: string | null;
  version: number;
  visibility: "shared" | "internal";
  created_at: string;
}

export interface DeliveryInvoice {
  id: string;
  workspace_id: string;
  project_id: string | null;
  number: string;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  currency: string;
  due_date: string | null;
  total: number;
}

export interface DeliveryInvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_amount: number;
}

export interface DeliveryIntake {
  id: string;
  workspace_id: string;
  title: string;
  description: string | null;
  status: "draft" | "open" | "submitted" | "closed";
  fields: { id: string; label: string; type: "text" | "textarea" }[];
  answers: Record<string, string>;
  submitted_at: string | null;
}

export interface DeliveryDocument {
  id: string;
  name: string;
  status: "requested" | "received" | "approved";
  required: boolean;
}

export interface DeliveryNotification {
  id: string;
  kind: string;
  title: string;
  body: string;
  read_at: string | null;
  created_at: string;
}

export interface DeliveryState {
  organization: DeliveryOrganization;
  role: DeliveryRole;
  clients: DeliveryClient[];
  workspaces: DeliveryWorkspace[];
  projects: DeliveryProject[];
  milestones: DeliveryMilestone[];
  tasks: DeliveryTask[];
  updates: DeliveryUpdate[];
  approvals: DeliveryApproval[];
  files: DeliveryFile[];
  invoices: DeliveryInvoice[];
  invoiceItems: DeliveryInvoiceItem[];
  intake: DeliveryIntake;
  documents: DeliveryDocument[];
  notifications: DeliveryNotification[];
}

const EMPTY_ORGANIZATION: DeliveryOrganization = { id: "", name: "", slug: "" };
const EMPTY_INTAKE: DeliveryIntake = {
  id: "",
  workspace_id: "",
  title: "",
  description: null,
  status: "draft",
  fields: [],
  answers: {},
  submitted_at: null,
};
const EMPTY_STATE: DeliveryState = {
  organization: EMPTY_ORGANIZATION,
  role: "provider",
  clients: [],
  workspaces: [],
  projects: [],
  milestones: [],
  tasks: [],
  updates: [],
  approvals: [],
  files: [],
  invoices: [],
  invoiceItems: [],
  intake: EMPTY_INTAKE,
  documents: [],
  notifications: [],
};

const ACTIVE_SPACE_KEY = "chronosquares-active-space";
const PREVIEW_KEY = "chronosquares-admin-preview";

// The delivery migration is intentionally kept local until Supabase regenerates
// its schema types. This adapter limits the untyped boundary to table queries.
/* eslint-disable @typescript-eslint/no-explicit-any */
type DeliveryDb = {
  from: (table: string) => any;
  rpc: (name: string, args?: Record<string, unknown>) => any;
};
/* eslint-enable @typescript-eslint/no-explicit-any */
const db = supabase as unknown as DeliveryDb;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const EMPTY_RESULT = Promise.resolve({ data: [] as any[], error: null });

interface DeliveryContextValue extends DeliveryState {
  loading: boolean;
  source: DataSource;
  needsSetup: boolean;
  loadError: string | null;
  /** Every workspace the signed-in person can act in, across organisations. */
  spaces: DeliverySpace[];
  activeSpace: DeliverySpace | null;
  setActiveSpace: (workspaceId: string) => void;
  /** Effective plan — the previewed plan while an admin preview is running. */
  plan: PlanId;
  /** Admin preview: read-only projection of another workspace / role / plan. */
  preview: PreviewState | null;
  isPreview: boolean;
  startPreview: (state: PreviewState) => void;
  stopPreview: () => void;
  refresh: () => Promise<void>;
  createProviderWorkspace: (input: {
    organizationName: string;
    workspaceName: string;
    clientName: string;
    clientCompany: string;
    clientEmail: string;
  }) => Promise<void>;
  addWorkspace: (input: {
    organizationId: string;
    workspaceName: string;
    clientName: string;
    clientCompany: string;
    clientEmail: string;
  }) => Promise<string>;
  createInvitation: (email: string, role: Exclude<DeliveryRole, "provider">) => Promise<string>;
  updateTask: (id: string, patch: Partial<DeliveryTask>) => Promise<void>;
  updateApproval: (id: string, status: DeliveryApproval["status"], notes?: string) => Promise<void>;
  addUpdate: (
    projectId: string,
    body: string,
    visibility: DeliveryUpdate["visibility"],
  ) => Promise<void>;
  addFile: (
    projectId: string,
    name: string,
    visibility: DeliveryFile["visibility"],
    url?: string,
  ) => Promise<void>;
  addInvoice: (
    workspaceId: string,
    projectId: string | null,
    number: string,
    total: number,
    dueDate: string,
  ) => Promise<void>;
  updateIntake: (answers: Record<string, string>) => Promise<void>;
  submitIntake: (answers?: Record<string, string>) => Promise<void>;
  markDocument: (id: string, status: DeliveryDocument["status"]) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
}

const Context = createContext<DeliveryContextValue | null>(null);

function newId() {
  return (
    globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
}

function readStoredPreview(): PreviewState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PREVIEW_KEY);
    return raw ? (JSON.parse(raw) as PreviewState) : null;
  } catch {
    return null;
  }
}

export function DeliveryProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [state, setState] = useState<DeliveryState>(EMPTY_STATE);
  const [spaces, setSpaces] = useState<DeliverySpace[]>([]);
  const [activeSpaceId, setActiveSpaceId] = useState<string | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [plan, setPlan] = useState<PlanId>("free");
  const [preview, setPreview] = useState<PreviewState | null>(() => readStoredPreview());
  const [isAdmin, setIsAdmin] = useState(false);

  // Resolve whether the current user may run admin previews at all.
  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      return;
    }
    let cancelled = false;
    void supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setIsAdmin(!!data);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  // A stale preview (non-admin, or cleared session) must never take effect.
  const activePreview = useMemo(() => (isAdmin ? preview : null), [isAdmin, preview]);

  const buildIntake = useCallback((row: Record<string, unknown> | null): DeliveryIntake => {
    if (!row) return EMPTY_INTAKE;
    return {
      id: row.id as string,
      workspace_id: row.workspace_id as string,
      title: row.title as string,
      description: (row.description as string) ?? null,
      status: (row.status as DeliveryIntake["status"]) ?? "open",
      fields: (row.fields as DeliveryIntake["fields"]) ?? [],
      answers: {},
      submitted_at: null,
    };
  }, []);

  const loadWorkspaceData = useCallback(
    async (space: DeliverySpace, opts: { asPreview: boolean }) => {
      if (!user) return;
      const { organizationId, workspaceId } = space;

      const projectsResult = await db
        .from("delivery_projects")
        .select("id,workspace_id,name,status,progress,start_date,due_date,client_visible")
        .eq("workspace_id", workspaceId);

      if (projectsResult.error) {
        setLoadError(projectsResult.error.message);
        setLoading(false);
        return;
      }

      const projects: DeliveryProject[] = projectsResult.data ?? [];
      const projectIds = projects.map((project) => project.id);
      const scopedByProject = (table: string, columns: string) =>
        projectIds.length
          ? db.from(table).select(columns).in("project_id", projectIds)
          : EMPTY_RESULT;

      const [
        clientsResult,
        workspacesResult,
        milestonesResult,
        tasksResult,
        updatesResult,
        approvalsResult,
        filesResult,
        invoicesResult,
        intakeResult,
        notificationsResult,
      ] = await Promise.all([
        db
          .from("delivery_clients")
          .select("id,name,company,email,status")
          .eq("organization_id", organizationId),
        db
          .from("delivery_workspaces")
          .select("id,client_id,name,status,description")
          .eq("organization_id", organizationId),
        scopedByProject("delivery_milestones", "id,project_id,name,status,due_date,position"),
        scopedByProject(
          "delivery_tasks",
          "id,project_id,milestone_id,title,status,priority,visibility,due_date,assigned_to",
        ),
        scopedByProject("delivery_updates", "id,project_id,author_id,body,visibility,created_at"),
        scopedByProject(
          "delivery_approvals",
          "id,project_id,milestone_id,title,status,requested_from,notes,created_at",
        ),
        scopedByProject(
          "delivery_files",
          "id,project_id,uploaded_by,name,url,version,visibility,created_at",
        ),
        db
          .from("delivery_invoices")
          .select("id,workspace_id,project_id,number,status,currency,due_date,total")
          .eq("workspace_id", workspaceId),
        db
          .from("delivery_intake_forms")
          .select("id,workspace_id,title,description,status,fields")
          .eq("workspace_id", workspaceId)
          .limit(1)
          .maybeSingle(),
        opts.asPreview
          ? EMPTY_RESULT
          : db
              .from("delivery_notifications")
              .select("id,kind,title,body,read_at,created_at")
              .eq("user_id", user.id)
              .order("created_at", { ascending: false }),
      ]);

      const firstError = [
        clientsResult,
        workspacesResult,
        milestonesResult,
        tasksResult,
        updatesResult,
        approvalsResult,
        filesResult,
        invoicesResult,
        intakeResult,
        notificationsResult,
      ].find((result) => result.error);

      if (firstError?.error) {
        setLoadError(firstError.error.message);
        setLoading(false);
        return;
      }

      setState({
        organization: { id: organizationId, name: space.organizationName, slug: "" },
        role: space.role,
        clients: clientsResult.data ?? [],
        workspaces: workspacesResult.data ?? [],
        projects,
        milestones: milestonesResult.data ?? [],
        tasks: tasksResult.data ?? [],
        updates: (updatesResult.data ?? []).map((item: DeliveryUpdate) => ({
          ...item,
          author_name: item.author_id === user.id ? "You" : "Team member",
        })),
        approvals: approvalsResult.data ?? [],
        files: filesResult.data ?? [],
        invoices: invoicesResult.data ?? [],
        invoiceItems: [],
        intake: buildIntake(intakeResult.data),
        documents: [],
        notifications: notificationsResult.data ?? [],
      });
      setLoadError(null);
      setLoading(false);
    },
    [user, buildIntake],
  );

  const load = useCallback(async () => {
    if (!user) {
      setState(EMPTY_STATE);
      setSpaces([]);
      setActiveSpaceId(null);
      setNeedsSetup(false);
      setLoadError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError(null);

    // --- Admin preview: read-only projection of a chosen workspace ---------
    if (activePreview) {
      const [orgResult, workspaceResult] = await Promise.all([
        db
          .from("delivery_organizations")
          .select("id,name,slug")
          .eq("id", activePreview.organizationId)
          .maybeSingle(),
        db
          .from("delivery_workspaces")
          .select("id,organization_id,client_id,name,status,description")
          .eq("id", activePreview.workspaceId)
          .maybeSingle(),
      ]);

      if (orgResult.error || workspaceResult.error || !workspaceResult.data) {
        setLoadError(
          orgResult.error?.message ??
            workspaceResult.error?.message ??
            "That preview workspace is no longer available.",
        );
        setNeedsSetup(false);
        setLoading(false);
        return;
      }

      const previewSpace: DeliverySpace = {
        workspaceId: workspaceResult.data.id,
        workspaceName: workspaceResult.data.name,
        workspaceStatus: workspaceResult.data.status,
        organizationId: activePreview.organizationId,
        organizationName: orgResult.data?.name ?? activePreview.organizationName,
        clientId: workspaceResult.data.client_id ?? null,
        role: activePreview.role,
      };
      setNeedsSetup(false);
      setActiveSpaceId(previewSpace.workspaceId);
      await loadWorkspaceData(previewSpace, { asPreview: true });
      return;
    }

    // --- Normal path: discover every space this person can act in ----------
    const [membersResult, clientLinksResult] = await Promise.all([
      db
        .from("delivery_organization_members")
        .select("organization_id, role")
        .eq("user_id", user.id),
      db.from("delivery_clients").select("id, organization_id").eq("user_id", user.id),
    ]);

    if (membersResult.error) {
      setState(EMPTY_STATE);
      setSpaces([]);
      setNeedsSetup(false);
      setLoadError(membersResult.error.message);
      setLoading(false);
      return;
    }

    const members: { organization_id: string; role: DeliveryRole }[] = membersResult.data ?? [];
    const clientLinks: { id: string; organization_id: string }[] = clientLinksResult.data ?? [];
    const orgIds = Array.from(
      new Set([
        ...members.map((m) => m.organization_id),
        ...clientLinks.map((c) => c.organization_id),
      ]),
    );

    if (orgIds.length === 0) {
      setState({ ...EMPTY_STATE, role: "provider" });
      setSpaces([]);
      setActiveSpaceId(null);
      setNeedsSetup(true);
      setLoading(false);
      return;
    }

    const [orgsResult, workspacesResult] = await Promise.all([
      db.from("delivery_organizations").select("id,name,slug").in("id", orgIds),
      db
        .from("delivery_workspaces")
        .select("id,organization_id,client_id,name,status,description")
        .in("organization_id", orgIds),
    ]);

    if (orgsResult.error || workspacesResult.error) {
      setState(EMPTY_STATE);
      setSpaces([]);
      setNeedsSetup(false);
      setLoadError(
        orgsResult.error?.message ??
          workspacesResult.error?.message ??
          "We couldn't load your workspaces.",
      );
      setLoading(false);
      return;
    }

    const orgNameById = new Map<string, string>(
      (orgsResult.data ?? []).map((o: DeliveryOrganization) => [o.id, o.name]),
    );
    const clientIdsForUser = new Set(clientLinks.map((c) => c.id));

    const workspaceRows = (workspacesResult.data ?? []) as (DeliveryWorkspace & {
      organization_id: string;
    })[];
    const builtSpaces: DeliverySpace[] = workspaceRows
      .map((workspace): DeliverySpace | null => {
        const membership = members.find((m) => m.organization_id === workspace.organization_id);
        const isClientHere =
          workspace.client_id != null && clientIdsForUser.has(workspace.client_id);
        const role: DeliveryRole | null = isClientHere ? "client" : (membership?.role ?? null);
        if (!role) return null;
        return {
          workspaceId: workspace.id,
          workspaceName: workspace.name,
          workspaceStatus: workspace.status,
          organizationId: workspace.organization_id,
          organizationName: orgNameById.get(workspace.organization_id) ?? "Workspace",
          clientId: workspace.client_id ?? null,
          role,
        };
      })
      .filter((space): space is DeliverySpace => space !== null)
      .sort(
        (a, b) =>
          a.organizationName.localeCompare(b.organizationName) ||
          a.workspaceName.localeCompare(b.workspaceName),
      );

    if (builtSpaces.length === 0) {
      // Provider account with an organisation but no visible workspace yet.
      setState({
        ...EMPTY_STATE,
        role: members.some((m) => m.role === "provider") ? "provider" : "client",
      });
      setSpaces([]);
      setActiveSpaceId(null);
      setNeedsSetup(true);
      setLoading(false);
      return;
    }

    setSpaces(builtSpaces);
    setNeedsSetup(false);

    const stored =
      typeof window !== "undefined" ? window.localStorage.getItem(ACTIVE_SPACE_KEY) : null;
    const active =
      builtSpaces.find((s) => s.workspaceId === stored) ??
      builtSpaces.find((s) => s.workspaceId === activeSpaceId) ??
      builtSpaces[0];
    setActiveSpaceId(active.workspaceId);
    if (typeof window !== "undefined")
      window.localStorage.setItem(ACTIVE_SPACE_KEY, active.workspaceId);

    await loadWorkspaceData(active, { asPreview: false });
  }, [user, activePreview, activeSpaceId, loadWorkspaceData]);

  useEffect(() => {
    void load();
  }, [load]);

  // Effective plan: previewed plan while previewing, otherwise the profile plan.
  useEffect(() => {
    if (activePreview) {
      setPlan(activePreview.plan);
      return;
    }
    if (!user) {
      setPlan("free");
      return;
    }
    let cancelled = false;
    void supabase
      .from("profiles")
      .select("plan, testing_plan")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        const raw = (data?.testing_plan || data?.plan || "free") as string;
        const valid: PlanId[] = ["free", "starter", "pro", "team"];
        setPlan(valid.includes(raw as PlanId) ? (raw as PlanId) : "free");
      });
    return () => {
      cancelled = true;
    };
  }, [user, activePreview]);

  const setActiveSpace = useCallback((workspaceId: string) => {
    if (typeof window !== "undefined") window.localStorage.setItem(ACTIVE_SPACE_KEY, workspaceId);
    setActiveSpaceId(workspaceId);
  }, []);

  const startPreview = useCallback((next: PreviewState) => {
    if (typeof window !== "undefined")
      window.localStorage.setItem(PREVIEW_KEY, JSON.stringify(next));
    setPreview(next);
  }, []);

  const stopPreview = useCallback(() => {
    if (typeof window !== "undefined") window.localStorage.removeItem(PREVIEW_KEY);
    setPreview(null);
  }, []);

  const assertWritable = useCallback(() => {
    if (activePreview)
      throw new Error("This is a read-only admin preview. Exit the preview to make changes.");
  }, [activePreview]);

  const activeSpace = useMemo(
    () => spaces.find((s) => s.workspaceId === activeSpaceId) ?? null,
    [spaces, activeSpaceId],
  );

  const createProviderWorkspace = async (input: {
    organizationName: string;
    workspaceName: string;
    clientName: string;
    clientCompany: string;
    clientEmail: string;
  }) => {
    assertWritable();
    const { error } = await db.rpc("delivery_create_provider_workspace", {
      organization_name: input.organizationName.trim(),
      workspace_name: input.workspaceName.trim(),
      client_name: input.clientName.trim() || null,
      client_company: input.clientCompany.trim() || null,
      client_email: input.clientEmail.trim().toLowerCase() || null,
    });
    if (error) throw error;
    await load();
  };

  const addWorkspace = async (input: {
    organizationId: string;
    workspaceName: string;
    clientName: string;
    clientCompany: string;
    clientEmail: string;
  }) => {
    assertWritable();
    const { data, error } = await db.rpc("delivery_add_workspace", {
      target_organization: input.organizationId,
      workspace_name: input.workspaceName.trim(),
      client_name: input.clientName.trim() || null,
      client_company: input.clientCompany.trim() || null,
      client_email: input.clientEmail.trim().toLowerCase() || null,
    });
    if (error) throw error;
    const newWorkspaceId = Array.isArray(data) ? data[0]?.workspace_id : data?.workspace_id;
    if (newWorkspaceId) setActiveSpace(newWorkspaceId);
    await load();
    return newWorkspaceId ?? "";
  };

  const createInvitation = async (email: string, role: Exclude<DeliveryRole, "provider">) => {
    assertWritable();
    if (!state.organization.id) throw new Error("Create your provider workspace first");
    const { data, error } = await db.rpc("delivery_create_invitation", {
      target_organization: state.organization.id,
      invite_email: email.trim().toLowerCase(),
      invite_role: role,
    });
    if (error) throw error;
    if (!data) throw new Error("No invitation link was returned");
    return `${window.location.origin}/join/${data}`;
  };

  const mutate = useCallback((updater: (current: DeliveryState) => DeliveryState) => {
    setState(updater);
  }, []);

  const updateTask = async (id: string, patch: Partial<DeliveryTask>) => {
    assertWritable();
    let nextProgress: number | null = null;
    let nextProjectId: string | null = null;
    mutate((current) => {
      const nextTasks = current.tasks.map((task) =>
        task.id === id ? { ...task, ...patch } : task,
      );
      const changedTask = nextTasks.find((task) => task.id === id);
      nextProjectId = changedTask?.project_id ?? null;
      if (nextProjectId) {
        const sharedTasks = nextTasks.filter(
          (task) => task.project_id === nextProjectId && task.visibility === "shared",
        );
        nextProgress = sharedTasks.length
          ? Math.round(
              (sharedTasks.filter((task) => task.status === "done").length / sharedTasks.length) *
                100,
            )
          : 0;
      }
      return {
        ...current,
        tasks: nextTasks,
        projects:
          nextProjectId && nextProgress !== null
            ? current.projects.map((project) =>
                project.id === nextProjectId
                  ? { ...project, progress: nextProgress ?? project.progress }
                  : project,
              )
            : current.projects,
      };
    });
    const { error } = await db.from("delivery_tasks").update(patch).eq("id", id);
    if (error) throw error;
    if (nextProjectId && nextProgress !== null) {
      const { error: progressError } = await db
        .from("delivery_projects")
        .update({ progress: nextProgress })
        .eq("id", nextProjectId);
      if (progressError) throw progressError;
    }
  };

  const updateApproval = async (id: string, status: DeliveryApproval["status"], notes?: string) => {
    assertWritable();
    const patch = { status, notes: notes ?? null, responded_at: new Date().toISOString() };
    mutate((current) => ({
      ...current,
      approvals: current.approvals.map((approval) =>
        approval.id === id ? { ...approval, status, notes: notes ?? approval.notes } : approval,
      ),
    }));
    const { error } = await db.from("delivery_approvals").update(patch).eq("id", id);
    if (error) throw error;
  };

  const addUpdate = async (
    projectId: string,
    body: string,
    visibility: DeliveryUpdate["visibility"],
  ) => {
    assertWritable();
    if (!body.trim() || !user) return;
    const item: DeliveryUpdate = {
      id: newId(),
      project_id: projectId,
      author_id: user.id,
      author_name: "You",
      body: body.trim(),
      visibility,
      created_at: new Date().toISOString(),
    };
    const { error } = await db
      .from("delivery_updates")
      .insert({ project_id: projectId, author_id: user.id, body: body.trim(), visibility });
    if (error) throw error;
    mutate((current) => ({ ...current, updates: [item, ...current.updates] }));
  };

  const addFile = async (
    projectId: string,
    name: string,
    visibility: DeliveryFile["visibility"],
    url?: string,
  ) => {
    assertWritable();
    if (!name.trim() || !user) return;
    const existingVersions = state.files
      .filter(
        (file) =>
          file.project_id === projectId &&
          file.name.trim().toLowerCase() === name.trim().toLowerCase(),
      )
      .map((file) => file.version);
    const item: DeliveryFile = {
      id: newId(),
      project_id: projectId,
      uploaded_by: user.id,
      name: name.trim(),
      url: url?.trim() || null,
      version: Math.max(0, ...existingVersions) + 1,
      visibility,
      created_at: new Date().toISOString(),
    };
    const { error } = await db.from("delivery_files").insert({
      project_id: projectId,
      uploaded_by: user.id,
      name: item.name,
      url: item.url,
      visibility,
    });
    if (error) throw error;
    mutate((current) => ({ ...current, files: [item, ...current.files] }));
  };

  const addInvoice = async (
    workspaceId: string,
    projectId: string | null,
    number: string,
    total: number,
    dueDate: string,
  ) => {
    assertWritable();
    if (!number.trim()) return;
    const { error } = await db.from("delivery_invoices").insert({
      workspace_id: workspaceId,
      project_id: projectId,
      number: number.trim(),
      due_date: dueDate || null,
      total,
      status: "draft",
    });
    if (error) throw error;
    await load();
  };

  const updateIntake = async (answers: Record<string, string>) => {
    mutate((current) => ({ ...current, intake: { ...current.intake, answers } }));
  };

  const submitIntake = async (answersOverride?: Record<string, string>) => {
    assertWritable();
    if (!user || !state.intake.id) return;
    const submittedAnswers = answersOverride ?? state.intake.answers;
    const { error } = await db
      .from("delivery_intake_submissions")
      .insert({ form_id: state.intake.id, submitted_by: user.id, answers: submittedAnswers });
    if (error) throw error;
    mutate((current) => ({
      ...current,
      intake: {
        ...current.intake,
        answers: submittedAnswers,
        status: "submitted",
        submitted_at: new Date().toISOString(),
      },
    }));
  };

  const markDocument = async (id: string, status: DeliveryDocument["status"]) => {
    assertWritable();
    mutate((current) => ({
      ...current,
      documents: current.documents.map((doc) => (doc.id === id ? { ...doc, status } : doc)),
    }));
  };

  const markNotificationRead = async (id: string) => {
    assertWritable();
    const { error } = await db
      .from("delivery_notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
    mutate((current) => ({
      ...current,
      notifications: current.notifications.map((item) =>
        item.id === id ? { ...item, read_at: new Date().toISOString() } : item,
      ),
    }));
  };

  const value: DeliveryContextValue = {
    ...state,
    loading,
    source: "supabase",
    needsSetup,
    loadError,
    spaces,
    activeSpace,
    setActiveSpace,
    plan,
    preview: activePreview,
    isPreview: !!activePreview,
    startPreview,
    stopPreview,
    refresh: load,
    createProviderWorkspace,
    addWorkspace,
    createInvitation,
    updateTask,
    updateApproval,
    addUpdate,
    addFile,
    addInvoice,
    updateIntake,
    submitIntake,
    markDocument,
    markNotificationRead,
  };

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useDelivery() {
  const context = useContext(Context);
  if (!context) throw new Error("useDelivery must be used inside DeliveryProvider");
  return context;
}

export function getClientForWorkspace(
  workspaces: DeliveryWorkspace[],
  clients: DeliveryClient[],
  workspaceId: string,
) {
  const workspace = workspaces.find((item) => item.id === workspaceId);
  return clients.find((client) => client.id === workspace?.client_id);
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "No date";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value.slice(0, 10)}T12:00:00`));
}

export function relativeDate(value: string) {
  const difference = Date.now() - new Date(value).getTime();
  const minutes = Math.round(difference / 60000);
  if (minutes < 60) return `${Math.max(1, minutes)}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}
