import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export type DeliveryRole = "provider" | "client" | "contractor" | "stakeholder";
export type DataSource = "supabase";

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
  client_id: string;
  name: string;
  status: "onboarding" | "active" | "complete" | "paused";
  description: string | null;
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

// The delivery migration is intentionally kept local until Supabase regenerates
// its schema types. This adapter limits the untyped boundary to table queries.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DeliveryDb = { from: (table: string) => any; rpc: (name: string, args?: Record<string, unknown>) => any };
const db = supabase as unknown as DeliveryDb;

interface DeliveryContextValue extends DeliveryState {
  loading: boolean;
  source: DataSource;
  needsSetup: boolean;
  loadError: string | null;
  refresh: () => Promise<void>;
  createProviderWorkspace: (input: {
    organizationName: string;
    workspaceName: string;
    clientName: string;
    clientCompany: string;
    clientEmail: string;
  }) => Promise<void>;
  createInvitation: (email: string, role: Exclude<DeliveryRole, "provider">) => Promise<string>;
  updateTask: (id: string, patch: Partial<DeliveryTask>) => Promise<void>;
  updateApproval: (id: string, status: DeliveryApproval["status"], notes?: string) => Promise<void>;
  addUpdate: (projectId: string, body: string, visibility: DeliveryUpdate["visibility"]) => Promise<void>;
  addFile: (projectId: string, name: string, visibility: DeliveryFile["visibility"], url?: string) => Promise<void>;
  addInvoice: (workspaceId: string, projectId: string | null, number: string, total: number, dueDate: string) => Promise<void>;
  updateIntake: (answers: Record<string, string>) => Promise<void>;
  submitIntake: (answers?: Record<string, string>) => Promise<void>;
  markDocument: (id: string, status: DeliveryDocument["status"]) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
}

const Context = createContext<DeliveryContextValue | null>(null);

function newId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function DeliveryProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [state, setState] = useState<DeliveryState>(EMPTY_STATE);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) {
      setState(EMPTY_STATE);
      setNeedsSetup(false);
      setLoadError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError(null);
    const membership = await db.from("delivery_organization_members")
      .select("organization_id, role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (membership.error) {
      setState(EMPTY_STATE);
      setNeedsSetup(false);
      setLoadError(membership.error.message);
      setLoading(false);
      return;
    }

    if (!membership.data) {
      setState({ ...EMPTY_STATE, role: "provider" });
      setNeedsSetup(true);
      setLoading(false);
      return;
    }

    const orgId = membership.data.organization_id as string;
    const [
      organizationResult,
      clientsResult,
      workspacesResult,
      projectsResult,
      milestonesResult,
      tasksResult,
      updatesResult,
      approvalsResult,
      filesResult,
      invoicesResult,
      intakeResult,
      notificationsResult,
    ] = await Promise.all([
      db.from("delivery_organizations").select("id,name,slug").eq("id", orgId).single(),
      db.from("delivery_clients").select("id,name,company,email,status").eq("organization_id", orgId),
      db.from("delivery_workspaces").select("id,client_id,name,status,description").eq("organization_id", orgId),
      db.from("delivery_projects").select("id,workspace_id,name,status,progress,start_date,due_date,client_visible"),
      db.from("delivery_milestones").select("id,project_id,name,status,due_date,position"),
      db.from("delivery_tasks").select("id,project_id,milestone_id,title,status,priority,visibility,due_date,assigned_to"),
      db.from("delivery_updates").select("id,project_id,author_id,body,visibility,created_at"),
      db.from("delivery_approvals").select("id,project_id,milestone_id,title,status,requested_from,notes,created_at"),
      db.from("delivery_files").select("id,project_id,uploaded_by,name,url,version,visibility,created_at"),
      db.from("delivery_invoices").select("id,workspace_id,project_id,number,status,currency,due_date,total"),
      db.from("delivery_intake_forms").select("id,workspace_id,title,description,status,fields").limit(1).maybeSingle(),
      db.from("delivery_notifications").select("id,kind,title,body,read_at,created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);

    const firstError = [
      organizationResult,
      clientsResult,
      workspacesResult,
      projectsResult,
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
      setState(EMPTY_STATE);
      setNeedsSetup(false);
      setLoadError(firstError.error.message);
      setLoading(false);
      return;
    }

    const remoteIntake = intakeResult.data;
    const remoteState: DeliveryState = {
      organization: organizationResult.data,
      role: membership.data.role,
      clients: clientsResult.data ?? [],
      workspaces: workspacesResult.data ?? [],
      projects: projectsResult.data ?? [],
      milestones: milestonesResult.data ?? [],
      tasks: tasksResult.data ?? [],
      updates: (updatesResult.data ?? []).map((item: DeliveryUpdate) => ({ ...item, author_name: item.author_id === user.id ? "You" : "Team member" })),
      approvals: approvalsResult.data ?? [],
      files: filesResult.data ?? [],
      invoices: invoicesResult.data ?? [],
      invoiceItems: [],
      intake: remoteIntake ? { ...remoteIntake, answers: {}, submitted_at: null } : EMPTY_INTAKE,
      documents: [],
      notifications: notificationsResult.data ?? [],
    };
    setState(remoteState);
    setNeedsSetup(false);
    setLoading(false);
  }, [user]);

  useEffect(() => { void load(); }, [load]);

  const createProviderWorkspace = async (input: {
    organizationName: string;
    workspaceName: string;
    clientName: string;
    clientCompany: string;
    clientEmail: string;
  }) => {
    const { error } = await db.rpc("delivery_create_provider_workspace", {
      organization_name: input.organizationName.trim(),
      workspace_name: input.workspaceName.trim(),
      client_name: input.clientName.trim(),
      client_company: input.clientCompany.trim() || null,
      client_email: input.clientEmail.trim().toLowerCase() || null,
    });
    if (error) throw error;
    await load();
  };

  const createInvitation = async (email: string, role: Exclude<DeliveryRole, "provider">) => {
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
    let nextProgress: number | null = null;
    let nextProjectId: string | null = null;
    mutate((current) => {
      const nextTasks = current.tasks.map((task) => task.id === id ? { ...task, ...patch } : task);
      const changedTask = nextTasks.find((task) => task.id === id);
      nextProjectId = changedTask?.project_id ?? null;
      if (nextProjectId) {
        const sharedTasks = nextTasks.filter((task) => task.project_id === nextProjectId && task.visibility === "shared");
        nextProgress = sharedTasks.length ? Math.round((sharedTasks.filter((task) => task.status === "done").length / sharedTasks.length) * 100) : 0;
      }
      return {
        ...current,
        tasks: nextTasks,
        projects: nextProjectId && nextProgress !== null
          ? current.projects.map((project) => project.id === nextProjectId ? { ...project, progress: nextProgress ?? project.progress } : project)
          : current.projects,
      };
    });
    const { error } = await db.from("delivery_tasks").update(patch).eq("id", id);
    if (error) throw error;
    if (nextProjectId && nextProgress !== null) {
      const { error: progressError } = await db.from("delivery_projects").update({ progress: nextProgress }).eq("id", nextProjectId);
      if (progressError) throw progressError;
    }
  };

  const updateApproval = async (id: string, status: DeliveryApproval["status"], notes?: string) => {
    const patch = { status, notes: notes ?? null, responded_at: new Date().toISOString() };
    mutate((current) => ({ ...current, approvals: current.approvals.map((approval) => approval.id === id ? { ...approval, status, notes: notes ?? approval.notes } : approval) }));
    const { error } = await db.from("delivery_approvals").update(patch).eq("id", id);
    if (error) throw error;
  };

  const addUpdate = async (projectId: string, body: string, visibility: DeliveryUpdate["visibility"]) => {
    if (!body.trim() || !user) return;
    const item: DeliveryUpdate = { id: newId(), project_id: projectId, author_id: user.id, author_name: "You", body: body.trim(), visibility, created_at: new Date().toISOString() };
    const { error } = await db.from("delivery_updates").insert({ project_id: projectId, author_id: user.id, body: body.trim(), visibility });
    if (error) throw error;
    mutate((current) => ({ ...current, updates: [item, ...current.updates] }));
  };

  const addFile = async (projectId: string, name: string, visibility: DeliveryFile["visibility"], url?: string) => {
    if (!name.trim() || !user) return;
    const existingVersions = state.files.filter((file) => file.project_id === projectId && file.name.trim().toLowerCase() === name.trim().toLowerCase()).map((file) => file.version);
    const item: DeliveryFile = { id: newId(), project_id: projectId, uploaded_by: user.id, name: name.trim(), url: url?.trim() || null, version: Math.max(0, ...existingVersions) + 1, visibility, created_at: new Date().toISOString() };
    const { error } = await db.from("delivery_files").insert({ project_id: projectId, uploaded_by: user.id, name: item.name, url: item.url, visibility });
    if (error) throw error;
    mutate((current) => ({ ...current, files: [item, ...current.files] }));
  };

  const addInvoice = async (workspaceId: string, projectId: string | null, number: string, total: number, dueDate: string) => {
    if (!number.trim()) return;
    const { error } = await db.from("delivery_invoices").insert({ workspace_id: workspaceId, project_id: projectId, number: number.trim(), due_date: dueDate || null, total, status: "draft" });
    if (error) throw error;
    await load();
  };

  const updateIntake = async (answers: Record<string, string>) => {
    mutate((current) => ({ ...current, intake: { ...current.intake, answers } }));
  };

  const submitIntake = async (answersOverride?: Record<string, string>) => {
    if (!user || !state.intake.id) return;
    const submittedAnswers = answersOverride ?? state.intake.answers;
    const { error } = await db.from("delivery_intake_submissions").insert({ form_id: state.intake.id, submitted_by: user.id, answers: submittedAnswers });
    if (error) throw error;
    mutate((current) => ({ ...current, intake: { ...current.intake, answers: submittedAnswers, status: "submitted", submitted_at: new Date().toISOString() } }));
  };

  const markDocument = async (id: string, status: DeliveryDocument["status"]) => {
    mutate((current) => ({ ...current, documents: current.documents.map((doc) => doc.id === id ? { ...doc, status } : doc) }));
  };

  const markNotificationRead = async (id: string) => {
    const { error } = await db.from("delivery_notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
    if (error) throw error;
    mutate((current) => ({ ...current, notifications: current.notifications.map((item) => item.id === id ? { ...item, read_at: new Date().toISOString() } : item) }));
  };

  const value: DeliveryContextValue = {
    ...state,
    loading,
    source: "supabase",
    needsSetup,
    loadError,
    refresh: load,
    createProviderWorkspace,
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

export function getClientForWorkspace(workspaces: DeliveryWorkspace[], clients: DeliveryClient[], workspaceId: string) {
  const workspace = workspaces.find((item) => item.id === workspaceId);
  return clients.find((client) => client.id === workspace?.client_id);
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "No date";
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${value.slice(0, 10)}T12:00:00`));
}

export function relativeDate(value: string) {
  const difference = Date.now() - new Date(value).getTime();
  const minutes = Math.round(difference / 60000);
  if (minutes < 60) return `${Math.max(1, minutes)}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}