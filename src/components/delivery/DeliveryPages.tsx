import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, CalendarDays, Check, CheckCircle2, ChevronRight, Clock3, DollarSign, FileText, Filter, MessageCircle, Paperclip, Plus, Send, ShieldCheck, Upload, Users, X } from "lucide-react";
import { toast } from "sonner";
import { formatDate, getClientForWorkspace, relativeDate, useDelivery, type DeliveryApproval, type DeliveryFile, type DeliveryProject, type DeliveryRole, type DeliveryTask } from "@/lib/delivery";
import { AccessNote, ActionLink, AlertText, Checkmark, DeliveryPage, EmptyState, ProgressBar, RoleSwitcher, SectionCard, StatCard, StatusPill } from "@/components/delivery/DeliveryShell";

function visibleProjects(projects: DeliveryProject[], role: string) {
  return role === "provider" ? projects : projects.filter((project) => project.client_visible).slice(0, 1);
}

function projectClient(project: DeliveryProject, workspaces: ReturnType<typeof useDelivery>["workspaces"], clients: ReturnType<typeof useDelivery>["clients"]) {
  return getClientForWorkspace(workspaces, clients, project.workspace_id);
}

export function DashboardPage() {
  const delivery = useDelivery();
  const { role, projects, clients, workspaces, tasks, approvals, invoices, notifications } = delivery;
  const provider = role === "provider";
  const scopedProjects = visibleProjects(projects, role);
  const openApprovals = approvals.filter((item) => item.status === "pending" && scopedProjects.some((project) => project.id === item.project_id));
  const outstanding = invoices.filter((invoice) => ["sent", "overdue"].includes(invoice.status) && scopedProjects.some((project) => project.id === invoice.project_id));
  const nextTasks = tasks.filter((task) => task.status !== "done" && (provider || task.visibility === "shared")).filter((task) => scopedProjects.some((project) => project.id === task.project_id)).slice(0, 4);

  return (
    <DeliveryPage eyebrow={provider ? "Provider control room" : "Client workspace"} title={provider ? "Keep every engagement moving." : "A clear view of your work."} description={provider ? "Your clients, projects, decisions, and next actions in one calm operating view." : "Everything your team has shared with you, with the next thing to do always close at hand."} action={<RoleSwitcher />}>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={provider ? "Active clients" : "Active projects"} value={provider ? clients.filter((client) => client.status === "active").length : scopedProjects.length} detail={provider ? `${clients.length} relationships in workspace` : "Visible to your role"} tone="brand" icon={<Users size={16} />} />
        <StatCard label="In flight" value={scopedProjects.filter((project) => project.status !== "complete").length} detail="Projects with work underway" icon={<Clock3 size={16} />} />
        <StatCard label={provider ? "Awaiting approval" : "Your approvals"} value={openApprovals.length} detail={openApprovals.length ? "Needs a decision" : "Nothing waiting"} tone={openApprovals.length ? "warning" : "default"} icon={<CheckCircle2 size={16} />} />
        <StatCard label="Outstanding" value={`£${outstanding.reduce((total, item) => total + Number(item.total), 0).toLocaleString()}`} detail="Open invoice value" icon={<DollarSign size={16} />} />
      </div>

      <div className="grid lg:grid-cols-[1.35fr_0.65fr] gap-4">
        <SectionCard label={provider ? "Active client work" : "Your project"} meta={`${scopedProjects.length} projects`}>
          <div className="space-y-2">
            {scopedProjects.map((project) => {
              const client = projectClient(project, workspaces, clients);
              return <Link key={project.id} to="/app/project" className="block rounded-lg border border-border/70 p-3 hover:border-brand/50 hover:bg-muted/20 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="size-9 rounded-lg bg-brand/10 text-brand flex items-center justify-center shrink-0"><span className="mono text-[10px]">{String(project.progress).padStart(2, "0")}</span></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2"><h3 className="text-sm font-medium truncate">{project.name}</h3><StatusPill status={project.status} /></div>
                    <div className="text-xs text-muted-foreground mt-1">{provider && client ? `${client.company ?? client.name} · ` : ""}Due {formatDate(project.due_date)}</div>
                    <ProgressBar value={project.progress} className="mt-3" />
                  </div>
                  <ChevronRight size={15} className="text-muted-foreground mt-1" />
                </div>
              </Link>;
            })}
          </div>
          {provider && <ActionLink to="/app/project">Open project board</ActionLink>}
        </SectionCard>

        <SectionCard label={provider ? "Next actions" : "Your next steps"} meta={`${nextTasks.length} open`}>
          <div className="space-y-1">
            {nextTasks.length === 0 ? <EmptyState title="All clear" description="There are no open actions in your visible workspace." /> : nextTasks.map((task) => <TaskMini key={task.id} task={task} project={projects.find((item) => item.id === task.project_id)} onToggle={() => delivery.updateTask(task.id, { status: "done" })} />)}
          </div>
          <div className="mt-3"><ActionLink to="/app/project">See all tasks</ActionLink></div>
        </SectionCard>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <SectionCard label={provider ? "Approval queue" : "Waiting for you"} meta={openApprovals.length ? `${openApprovals.length} pending` : "Up to date"}>
          {openApprovals.length === 0 ? <EmptyState title="No decisions waiting" description="Approvals will appear here when a milestone is ready for review." /> : <div className="space-y-3">{openApprovals.map((approval) => <ApprovalMini key={approval.id} approval={approval} project={projects.find((item) => item.id === approval.project_id)} />)}</div>}
        </SectionCard>
        <SectionCard label="Recent activity" meta="Latest">
          <div className="space-y-3">
            {notifications.slice(0, 4).map((notification) => <div key={notification.id} className="flex gap-3"><div className="size-7 rounded-full bg-muted flex items-center justify-center text-brand shrink-0"><MessageCircle size={13} /></div><div className="min-w-0"><div className="text-sm">{notification.title}</div><p className="text-xs text-muted-foreground truncate">{notification.body}</p><span className="mono text-[10px] text-muted-foreground/70">{relativeDate(notification.created_at)}</span></div></div>)}
          </div>
        </SectionCard>
      </div>
    </DeliveryPage>
  );
}

function TaskMini({ task, project, onToggle }: { task: DeliveryTask; project?: DeliveryProject; onToggle: () => void }) {
  return <div className="flex items-center gap-2 py-2"><button onClick={onToggle} aria-label={`Complete ${task.title}`}><Checkmark checked={task.status === "done"} /></button><div className="flex-1 min-w-0"><div className="text-sm truncate">{task.title}</div><div className="text-[10px] text-muted-foreground">{project?.name} · {task.due_date ? formatDate(task.due_date) : "No due date"}</div></div>{task.priority === "urgent" && <span className="mono text-[9px] uppercase text-warning">urgent</span>}</div>;
}

function ApprovalMini({ approval, project }: { approval: DeliveryApproval; project?: DeliveryProject }) {
  return <Link to="/app/communication" className="flex items-start gap-3 p-3 rounded-lg border border-border/70 hover:border-brand/50 transition-colors"><div className="size-8 rounded-lg bg-warning/10 text-warning flex items-center justify-center shrink-0"><CheckCircle2 size={15} /></div><div className="min-w-0 flex-1"><div className="text-sm font-medium truncate">{approval.title}</div><div className="text-xs text-muted-foreground mt-0.5">{project?.name} · requested {relativeDate(approval.created_at)}</div></div><ArrowUpRight size={14} className="text-muted-foreground" /></Link>;
}

export function OnboardingPage() {
  const delivery = useDelivery();
  const [answers, setAnswers] = useState(delivery.intake.answers);
  const [saving, setSaving] = useState(false);
  if (delivery.needsSetup) return <ProviderSetupPage />;

  const { role, intake, documents, clients, workspaces, projects } = delivery;
  const client = getClientForWorkspace(workspaces, clients, intake.workspace_id);
  const received = documents.filter((document) => document.status !== "requested").length;
  const documentProgress = documents.length ? Math.round((received / documents.length) * 100) : 0;

  const submit = async () => {
    setSaving(true);
    try {
      await delivery.submitIntake(answers);
      toast.success("Intake submitted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "We couldn't submit the intake.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DeliveryPage eyebrow="Square 01 / onboarding" title={role === "provider" ? "Bring every new client in smoothly." : "Let’s get the relationship started."} description={role === "provider" ? "Track the handover from accepted proposal to a ready-to-run workspace." : "A short intake and a few documents are all that stand between you and kickoff."} action={<RoleSwitcher />}>
      <div className="grid sm:grid-cols-4 gap-2">
        {["Proposal", "Agreement", "Initial payment", "Ready for kickoff"].map((label, index) => <div key={label} className={`rounded-lg border p-3 ${index < 3 ? "border-brand/40 bg-brand/5" : "border-border"}`}><div className="flex items-center gap-2"><span className={`size-5 rounded-full flex items-center justify-center text-[10px] ${index < 3 ? "bg-brand text-brand-foreground" : "bg-muted text-muted-foreground"}`}>{index < 3 ? <Check size={12} /> : index + 1}</span><span className="text-xs font-medium">{label}</span></div><div className="text-[10px] text-muted-foreground mt-2">{index < 3 ? "Complete" : "Next step"}</div></div>)}
      </div>

      <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-4">
        <SectionCard label={role === "provider" ? "Client intake" : intake.title} meta={intake.status}>
          {role === "provider" ? <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40"><div className="size-9 rounded-full bg-brand/15 text-brand flex items-center justify-center"><Users size={15} /></div><div className="flex-1"><div className="text-sm font-medium">{client?.company ?? "Fieldwork Labs"}</div><div className="text-xs text-muted-foreground">{client?.email ?? "Client workspace"} · intake request</div></div><StatusPill status={intake.status} /></div>
            {intake.status === "submitted" ? <div className="border border-brand/30 rounded-lg p-4 bg-brand/5"><div className="flex items-center gap-2 text-sm font-medium text-brand"><CheckCircle2 size={16} /> Intake is ready to review</div><p className="text-xs text-muted-foreground mt-1">The client has submitted their answers. Review them before kickoff and move the project forward.</p></div> : <AccessNote>Once the client submits, their answers will appear here and a provider notification will be created.</AccessNote>}
            <div className="space-y-2">{intake.fields.map((field) => <div key={field.id}><div className="text-xs font-medium">{field.label}</div><div className="mt-1 rounded-md border border-border bg-background/50 px-3 py-2 text-sm min-h-9">{intake.answers[field.id] || <span className="text-muted-foreground">Waiting for client</span>}</div></div>)}</div>
          </div> : <div className="space-y-4">
            <div><div className="text-sm font-medium">{intake.description}</div><div className="text-xs text-muted-foreground mt-1">Your answers are only shared with the provider team.</div></div>
            {intake.fields.map((field) => <label key={field.id} className="block"><span className="text-xs font-medium">{field.label}</span>{field.type === "textarea" ? <textarea value={answers[field.id] ?? ""} onChange={(event) => setAnswers((current) => ({ ...current, [field.id]: event.target.value }))} rows={3} className="w-full mt-1 bg-background border border-border rounded-md px-3 py-2 text-sm resize-none" /> : <input value={answers[field.id] ?? ""} onChange={(event) => setAnswers((current) => ({ ...current, [field.id]: event.target.value }))} className="w-full mt-1 bg-background border border-border rounded-md px-3 py-2 text-sm" />}</label>)}
            <button onClick={submit} disabled={saving} className="btn-brand text-xs py-2 px-3"><Send size={13} /> {saving ? "Submitting..." : intake.status === "submitted" ? "Resubmit intake" : "Submit intake"}</button>
          </div>}
        </SectionCard>

        <SectionCard label="Document collection" meta={`${received}/${documents.length} received`}>
           <div className="space-y-2">{documents.length === 0 ? <EmptyState title="No documents requested" description="Documents will appear here when the provider adds them to this workspace." /> : documents.map((document) => <div key={document.id} className="flex items-center gap-3 py-2"><div className={`size-8 rounded-lg flex items-center justify-center ${document.status === "requested" ? "bg-muted text-muted-foreground" : "bg-brand/10 text-brand"}`}><FileText size={14} /></div><div className="flex-1 min-w-0"><div className="text-sm truncate">{document.name}</div><div className="text-[10px] text-muted-foreground">{document.required ? "Required" : "Optional"} · <StatusPill status={document.status} /></div></div>{role === "client" && document.status === "requested" && <button onClick={() => { void delivery.markDocument(document.id, "received"); toast.success("Document marked received"); }} className="p-1.5 text-brand hover:bg-brand/10 rounded"><Upload size={14} /></button>}</div>)}</div>
           <div className="mt-4 pt-3 border-t border-border"><div className="flex items-center justify-between text-xs mb-2"><span>Onboarding readiness</span><span className="mono text-brand">{documentProgress}%</span></div><ProgressBar value={documentProgress} /></div>
          {role === "provider" && <div className="mt-4"><AccessNote>Files are collected into the workspace and stay separate from internal agency documents.</AccessNote></div>}
        </SectionCard>
      </div>

      <SectionCard label="Handover checklist" meta="Provider managed">
        <div className="grid sm:grid-cols-3 gap-3">{["Proposal accepted", "Agreement status recorded", "Initial payment status recorded", "Intake submitted", "Required documents received", "Kickoff ready"].map((item, index) => <div key={item} className="flex items-center gap-2 text-sm"><Checkmark checked={index < 3 || (index === 3 && intake.status === "submitted") || (index === 4 && documents.length > 0 && received === documents.length)} /><span className={index > 4 ? "text-muted-foreground" : ""}>{item}</span></div>)}</div>
      </SectionCard>
      {role === "provider" && <InvitationPanel />}
    </DeliveryPage>
  );
}

function ProviderSetupPage() {
  const { createProviderWorkspace } = useDelivery();
  const [organizationName, setOrganizationName] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientCompany, setClientCompany] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await createProviderWorkspace({ organizationName, workspaceName, clientName, clientCompany, clientEmail });
      toast.success("Your provider workspace is ready.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "We couldn't create your workspace.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DeliveryPage
      eyebrow="Set up your delivery workspace"
      title="Start with a real client relationship."
      description="Create your provider workspace, add the first client relationship, and use the connected Supabase workspace from the first step."
    >
      <div className="max-w-2xl">
        <SectionCard label="Provider setup" meta="Required once">
          <form onSubmit={submit} className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-xs font-medium">Your business or studio</span>
                <input required minLength={2} value={organizationName} onChange={(event) => setOrganizationName(event.target.value)} placeholder="FlowGrid Studio" className="w-full mt-1.5 bg-background border border-border rounded-md px-3 py-2 text-sm" />
              </label>
              <label className="block">
                <span className="text-xs font-medium">First workspace name</span>
                <input required minLength={2} value={workspaceName} onChange={(event) => setWorkspaceName(event.target.value)} placeholder="Website launch" className="w-full mt-1.5 bg-background border border-border rounded-md px-3 py-2 text-sm" />
              </label>
            </div>
            <div className="border-t border-border pt-5">
              <div className="text-sm font-medium">First client relationship</div>
              <p className="text-xs text-muted-foreground mt-1">You can invite more clients, contractors, and stakeholders once the workspace is created.</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-xs font-medium">Client name</span>
                <input required minLength={2} value={clientName} onChange={(event) => setClientName(event.target.value)} placeholder="Client contact name" className="w-full mt-1.5 bg-background border border-border rounded-md px-3 py-2 text-sm" />
              </label>
              <label className="block">
                <span className="text-xs font-medium">Company</span>
                <input value={clientCompany} onChange={(event) => setClientCompany(event.target.value)} placeholder="Client company" className="w-full mt-1.5 bg-background border border-border rounded-md px-3 py-2 text-sm" />
              </label>
            </div>
            <label className="block">
              <span className="text-xs font-medium">Client email <span className="text-muted-foreground font-normal">(optional)</span></span>
              <input type="email" value={clientEmail} onChange={(event) => setClientEmail(event.target.value)} placeholder="client@example.com" className="w-full mt-1.5 bg-background border border-border rounded-md px-3 py-2 text-sm" />
            </label>
            <div className="flex items-center justify-between gap-4 pt-2">
              <p className="text-xs text-muted-foreground">This creates your provider membership, client record, workspace, and kickoff intake together.</p>
              <button type="submit" disabled={saving} className="btn-brand shrink-0">{saving ? "Creating..." : "Create workspace"}</button>
            </div>
          </form>
        </SectionCard>
      </div>
    </DeliveryPage>
  );
}

function InvitationPanel() {
  const { createInvitation } = useDelivery();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Exclude<DeliveryRole, "provider">>("client");
  const [link, setLink] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const invitationLink = await createInvitation(email, role);
      setLink(invitationLink);
      toast.success("Invitation link created.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "We couldn't create the invitation.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SectionCard label="Bring people into the workspace" meta="Provider managed">
      <div className="flex items-start gap-3 mb-4">
        <div className="size-9 rounded-lg bg-brand/10 text-brand flex items-center justify-center shrink-0"><Users size={16} /></div>
        <div>
          <div className="text-sm font-medium">Invite a client, contractor, or stakeholder</div>
          <p className="text-xs text-muted-foreground mt-1">The link only works for the invited email address and expires after seven days.</p>
        </div>
      </div>
      <form onSubmit={submit} className="grid sm:grid-cols-[1fr_auto_auto] gap-2">
        <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="person@example.com" className="bg-background border border-border rounded-md px-3 py-2 text-sm" />
        <select value={role} onChange={(event) => setRole(event.target.value as Exclude<DeliveryRole, "provider">)} className="bg-background border border-border rounded-md px-3 py-2 text-sm">
          <option value="client">Client</option>
          <option value="contractor">Contractor</option>
          <option value="stakeholder">Stakeholder</option>
        </select>
        <button disabled={saving} className="btn-outline-brand">{saving ? "Creating..." : "Create link"}</button>
      </form>
      {link && <div className="mt-4 flex flex-col sm:flex-row gap-2">
        <input readOnly value={link} className="flex-1 min-w-0 bg-muted/30 border border-border rounded-md px-3 py-2 text-xs text-muted-foreground" />
        <button type="button" onClick={() => { void navigator.clipboard.writeText(link); toast.success("Link copied."); }} className="btn-brand shrink-0">Copy link</button>
      </div>}
    </SectionCard>
  );
}

export function ProjectPage() {
  const delivery = useDelivery();
  const { role, projects, tasks, milestones, workspaces, clients } = delivery;
  const scopedProjects = visibleProjects(projects, role);
  const [selectedId, setSelectedId] = useState(scopedProjects[0]?.id ?? "");
  const project = scopedProjects.find((item) => item.id === selectedId) ?? scopedProjects[0];
  const projectMilestones = milestones.filter((item) => item.project_id === project?.id).sort((a, b) => a.position - b.position);
  const projectTasks = tasks.filter((item) => item.project_id === project?.id && (role === "provider" || item.visibility === "shared"));
  const doneTasks = projectTasks.filter((item) => item.status === "done").length;
  const client = project ? projectClient(project, workspaces, clients) : null;

  if (!project) return <DeliveryPage eyebrow="Square 02 / project" title="No project yet" description="Projects shared with your role will appear here." action={<RoleSwitcher />}><EmptyState title="Nothing in view" description="Ask your provider to add you to a project." /></DeliveryPage>;

  return (
    <DeliveryPage eyebrow="Square 02 / project" title={role === "provider" ? "See the work, not just the task list." : project.name} description={role === "provider" ? "Milestones, responsibilities, and progress stay visible without exposing the wrong detail." : `${client?.company ?? "Shared workspace"} · your current delivery view`} action={<RoleSwitcher />}>
      {scopedProjects.length > 1 && <div className="flex flex-wrap gap-2">{scopedProjects.map((item) => <button key={item.id} onClick={() => setSelectedId(item.id)} className={`text-xs px-3 py-2 rounded-md border ${item.id === project.id ? "border-brand text-brand bg-brand/10" : "border-border text-muted-foreground hover:text-foreground"}`}>{item.name}</button>)}</div>}
      <div className="grid sm:grid-cols-3 gap-4"><StatCard label="Progress" value={`${project.progress}%`} detail={`Due ${formatDate(project.due_date)}`} tone="brand" icon={<KanbanIcon />} /><StatCard label="Milestones" value={`${projectMilestones.filter((item) => item.status === "complete").length}/${projectMilestones.length}`} detail="Completed stages" icon={<CheckCircle2 size={16} />} /><StatCard label="Tasks" value={`${doneTasks}/${projectTasks.length}`} detail={role === "provider" ? "Shared + internal" : "Shared with you"} icon={<Check size={16} />} /></div>
      <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-4">
        <SectionCard label="Milestone path" meta={project.status}>
          <div className="relative space-y-5">{projectMilestones.map((milestone, index) => <div key={milestone.id} className="relative flex gap-3">{index < projectMilestones.length - 1 && <span className="absolute left-[9px] top-5 bottom-[-20px] w-px bg-border" />}<span className={`relative size-5 rounded-full border flex items-center justify-center shrink-0 ${milestone.status === "complete" ? "bg-brand border-brand text-brand-foreground" : milestone.status === "active" || milestone.status === "review" ? "border-brand text-brand" : "border-border text-transparent"}`}><Check size={11} /></span><div className="flex-1"><div className="flex items-start justify-between gap-2"><span className="text-sm font-medium">{milestone.name}</span><StatusPill status={milestone.status} /></div><div className="text-[10px] text-muted-foreground mt-1">{milestone.due_date ? `Due ${formatDate(milestone.due_date)}` : "No due date"}</div></div></div>)}</div>
        </SectionCard>
        <SectionCard label="Tasks" meta={`${projectTasks.length} visible`}>
          <div className="space-y-1">{projectTasks.length === 0 ? <EmptyState title="No tasks yet" description="Tasks will appear as the project is planned." /> : projectTasks.map((task) => <div key={task.id} className="flex items-center gap-3 py-2.5 border-b border-border/60 last:border-0"><button onClick={() => void delivery.updateTask(task.id, { status: task.status === "done" ? "todo" : "done" })} aria-label={`Toggle ${task.title}`}><Checkmark checked={task.status === "done"} /></button><div className="flex-1 min-w-0"><div className={`text-sm ${task.status === "done" ? "line-through text-muted-foreground" : ""}`}>{task.title}</div><div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground"><span>{task.due_date ? formatDate(task.due_date) : "No due date"}</span>{role === "provider" && task.visibility === "internal" && <span className="text-brand">Internal</span>}</div></div><StatusPill status={task.status} /></div>)}</div>
          <div className="mt-3 flex items-center justify-between"><span className="text-xs text-muted-foreground">Progress is shared automatically</span><span className="mono text-xs text-brand">{project.progress}%</span></div><ProgressBar value={project.progress} className="mt-2" />
        </SectionCard>
      </div>
    </DeliveryPage>
  );
}

function KanbanIcon() { return <div className="flex gap-0.5"><span className="w-1 h-3 rounded-full bg-current" /><span className="w-1 h-5 rounded-full bg-current" /><span className="w-1 h-4 rounded-full bg-current" /></div>; }

export function CommunicationPage() {
  const delivery = useDelivery();
  const { role, projects, updates, approvals } = delivery;
  const scopedProjects = visibleProjects(projects, role);
  const scopedIds = scopedProjects.map((item) => item.id);
  const visibleUpdates = updates.filter((item) => scopedIds.includes(item.project_id) && (role === "provider" || item.visibility === "shared"));
  const visibleApprovals = approvals.filter((item) => scopedIds.includes(item.project_id));
  const [body, setBody] = useState("");
  const [visibility, setVisibility] = useState<"shared" | "internal">("shared");

  const post = async () => {
    if (!body.trim() || !scopedProjects[0]) return;
    await delivery.addUpdate(scopedProjects[0].id, body, role === "provider" ? visibility : "shared");
    setBody("");
    toast.success("Update posted");
  };

  return (
    <DeliveryPage eyebrow="Square 03 / communication" title="Keep the important conversations attached to the work." description={role === "provider" ? "Share progress, capture decisions, and keep approvals from getting lost in email." : "Updates and decisions from your delivery team, in one shared timeline."} action={<RoleSwitcher />}>
      <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-4">
        <SectionCard label="Project updates" meta={`${visibleUpdates.length} updates`}>
          <div className="space-y-4">{visibleUpdates.length === 0 ? <EmptyState title="No updates yet" description="Post the first project update to start the shared record." /> : visibleUpdates.map((update) => <div key={update.id} className="flex gap-3"><div className="size-8 rounded-full bg-brand/10 text-brand flex items-center justify-center text-xs font-medium shrink-0">{update.author_name.slice(0, 1)}</div><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><span className="text-sm font-medium">{update.author_name}</span><span className="mono text-[10px] text-muted-foreground">{relativeDate(update.created_at)}</span>{update.visibility === "internal" && <StatusPill status="internal" />}</div><p className="text-sm text-muted-foreground mt-1 leading-relaxed">{update.body}</p></div></div>)}</div>
        </SectionCard>
        <div className="space-y-4">
          <SectionCard label="Post an update">
            <textarea value={body} onChange={(event) => setBody(event.target.value)} rows={4} placeholder={role === "provider" ? "Share progress, context, or a decision..." : "Send a message to the provider team..."} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm resize-none" />
            <div className="flex items-center justify-between gap-2 mt-3">{role === "provider" ? <select value={visibility} onChange={(event) => setVisibility(event.target.value as "shared" | "internal")} className="bg-background border border-border rounded-md px-2 py-1.5 text-xs"><option value="shared">Shared with client</option><option value="internal">Internal only</option></select> : <span className="text-xs text-muted-foreground">Shared with your provider</span>}<button onClick={() => void post()} className="btn-brand text-xs py-1.5 px-3"><Send size={13} /> Post update</button></div>
          </SectionCard>
          <SectionCard label="Approvals" meta={`${visibleApprovals.length}`}>
            <div className="space-y-2">{visibleApprovals.length === 0 ? <p className="text-sm text-muted-foreground">No approvals on this project.</p> : visibleApprovals.map((approval) => <ApprovalRow key={approval.id} approval={approval} canRespond={role !== "provider"} />)}</div>
          </SectionCard>
        </div>
      </div>
    </DeliveryPage>
  );
}

function ApprovalRow({ approval, canRespond }: { approval: DeliveryApproval; canRespond: boolean }) {
  const delivery = useDelivery();
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState("");
  const respond = async (status: DeliveryApproval["status"]) => { await delivery.updateApproval(approval.id, status, note); setNoteOpen(false); toast.success(status === "approved" ? "Approval recorded" : "Changes requested"); };
  return <div className="rounded-lg border border-border/70 p-3"><div className="flex items-start gap-2"><div className="flex-1 min-w-0"><div className="text-sm font-medium">{approval.title}</div><div className="text-xs text-muted-foreground mt-1">{approval.notes}</div></div><StatusPill status={approval.status} /></div>{canRespond && approval.status === "pending" && <div className="flex gap-2 mt-3"><button onClick={() => void respond("approved")} className="btn-brand text-xs py-1.5 px-2.5"><Check size={12} /> Approve</button><button onClick={() => setNoteOpen(!noteOpen)} className="btn-outline-brand text-xs py-1.5 px-2.5"><X size={12} /> Request changes</button></div>}{noteOpen && <div className="flex gap-2 mt-2"><input value={note} onChange={(event) => setNote(event.target.value)} placeholder="What should change?" className="flex-1 min-w-0 bg-background border border-border rounded-md px-2 py-1.5 text-xs" /><button onClick={() => void respond("changes_requested")} className="btn-outline-brand text-xs py-1.5 px-2">Send</button></div>}</div>;
}

export function FinancePage() {
  const delivery = useDelivery();
  const { role, invoices, invoiceItems, workspaces, projects } = delivery;
  const scopedProjects = visibleProjects(projects, role);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ number: "", total: "", dueDate: "", workspaceId: workspaces[0]?.id ?? "", projectId: scopedProjects[0]?.id ?? "" });
  const scopedInvoices = invoices.filter((invoice) => role === "provider" || scopedProjects.some((project) => project.id === invoice.project_id));
  const totalOpen = scopedInvoices.filter((invoice) => ["sent", "overdue"].includes(invoice.status)).reduce((total, invoice) => total + Number(invoice.total), 0);
  const paid = scopedInvoices.filter((invoice) => invoice.status === "paid").reduce((total, invoice) => total + Number(invoice.total), 0);

  const add = async () => { await delivery.addInvoice(form.workspaceId, form.projectId || null, form.number, Number(form.total) || 0, form.dueDate); setAdding(false); setForm((current) => ({ ...current, number: "", total: "", dueDate: "" })); toast.success("Invoice added"); };

  return (
    <DeliveryPage eyebrow="Square 04 / finance" title={role === "provider" ? "Financial visibility without accounting overhead." : "Costs you can understand at a glance."} description={role === "provider" ? "Keep agreed costs and invoice status alongside the project, without exposing internal operations." : "See the costs your provider has shared with this workspace. Private agency finances stay private."} action={<div className="flex items-center gap-2"><RoleSwitcher />{role === "provider" && <button onClick={() => setAdding(true)} className="btn-brand text-xs py-1.5 px-3"><Plus size={13} /> New invoice</button>}</div>}>
      <div className="grid sm:grid-cols-3 gap-4"><StatCard label="Open" value={`£${totalOpen.toLocaleString()}`} detail="Sent or overdue" tone={totalOpen ? "warning" : "default"} icon={<Clock3 size={16} />} /><StatCard label="Paid" value={`£${paid.toLocaleString()}`} detail="Recorded in workspace" tone="brand" icon={<CheckCircle2 size={16} />} /><StatCard label="Invoices" value={scopedInvoices.length} detail={role === "provider" ? "Across client workspaces" : "Shared with you"} icon={<FileText size={16} />} /></div>
      <SectionCard label="Invoices" meta={`${scopedInvoices.length} records`}>
        {scopedInvoices.length === 0 ? <EmptyState title="No shared invoices" description="When a provider shares an invoice, it will appear here." /> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border"><th className="py-2 pr-3 font-normal">Invoice</th><th className="py-2 pr-3 font-normal">Line items / project</th><th className="py-2 pr-3 font-normal">Due</th><th className="py-2 pr-3 font-normal">Status</th><th className="py-2 text-right font-normal">Total</th></tr></thead><tbody>{scopedInvoices.map((invoice) => { const items = invoiceItems.filter((item) => item.invoice_id === invoice.id); return <tr key={invoice.id} className="border-b border-border/60 last:border-0"><td className="py-3 pr-3 font-medium">{invoice.number}</td><td className="py-3 pr-3 text-muted-foreground"><div>{projects.find((project) => project.id === invoice.project_id)?.name ?? "Workspace"}</div><div className="text-[10px] mt-0.5">{items.map((item) => `${item.description} × ${item.quantity}`).join(" · ")}</div></td><td className="py-3 pr-3 text-muted-foreground">{formatDate(invoice.due_date)}</td><td className="py-3 pr-3"><StatusPill status={invoice.status} /></td><td className="py-3 text-right font-medium">£{Number(invoice.total).toLocaleString("en-GB", { minimumFractionDigits: 2 })}</td></tr>; })}</tbody></table></div>}
      </SectionCard>
      {role !== "provider" && <AccessNote>Only costs shared with your workspace are visible here. Internal budgets and other client invoices are protected by the project access rules.</AccessNote>}
      {adding && <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setAdding(false)}><div className="module max-w-sm w-full p-5" onClick={(event) => event.stopPropagation()}><h3 className="font-semibold mb-4">New invoice</h3><input value={form.number} onChange={(event) => setForm((current) => ({ ...current, number: event.target.value }))} placeholder="Invoice number" className="w-full mb-3 bg-background border border-border rounded-md px-3 py-2 text-sm" /><input value={form.total} onChange={(event) => setForm((current) => ({ ...current, total: event.target.value }))} placeholder="Total (GBP)" type="number" className="w-full mb-3 bg-background border border-border rounded-md px-3 py-2 text-sm" /><select value={form.projectId} onChange={(event) => setForm((current) => ({ ...current, projectId: event.target.value }))} className="w-full mb-3 bg-background border border-border rounded-md px-3 py-2 text-sm">{scopedProjects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select><input value={form.dueDate} onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))} type="date" className="w-full mb-4 bg-background border border-border rounded-md px-3 py-2 text-sm" /><div className="flex justify-end gap-2"><button onClick={() => setAdding(false)} className="btn-outline-brand text-xs py-1.5 px-3">Cancel</button><button onClick={() => void add()} className="btn-brand text-xs py-1.5 px-3">Add invoice</button></div></div></div>}
    </DeliveryPage>
  );
}

export function FilesPage() {
  const delivery = useDelivery();
  const { role, projects, files } = delivery;
  const scopedProjects = visibleProjects(projects, role);
  const ids = scopedProjects.map((project) => project.id);
  const scopedFiles = files.filter((file) => ids.includes(file.project_id) && (role === "provider" || file.visibility === "shared"));
  const [projectId, setProjectId] = useState(scopedProjects[0]?.id ?? "");
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [visibility, setVisibility] = useState<DeliveryFile["visibility"]>("shared");

  const upload = async () => { if (!name.trim()) return; await delivery.addFile(projectId, name, role === "provider" ? visibility : "shared", url); setName(""); setUrl(""); toast.success("File added to workspace"); };

  return (
    <DeliveryPage eyebrow="Square 05 / files" title="A home for the work everyone can trust." description={role === "provider" ? "Keep client deliverables, working documents, and internal files together with lightweight version history." : "Find the current deliverables and documents your provider has shared with you."} action={<RoleSwitcher />}>
      <div className="grid lg:grid-cols-[1fr_0.72fr] gap-4">
        <SectionCard label="Workspace files" meta={`${scopedFiles.length} visible`}>
          {scopedFiles.length === 0 ? <EmptyState title="No files in view" description="Files shared with this project will appear here." /> : <div className="space-y-2">{scopedFiles.map((file) => <div key={file.id} className="flex items-center gap-3 rounded-lg border border-border/70 p-3"><div className="size-9 rounded-lg bg-brand/10 text-brand flex items-center justify-center"><Paperclip size={15} /></div><div className="flex-1 min-w-0"><div className="text-sm font-medium truncate">{file.name}</div><div className="text-[10px] text-muted-foreground">{projects.find((project) => project.id === file.project_id)?.name} · v{file.version} · {relativeDate(file.created_at)}</div></div>{file.visibility === "internal" && <span className="mono text-[9px] uppercase text-brand">Internal</span>}{file.url && <a href={file.url} target="_blank" rel="noreferrer" className="p-1.5 text-muted-foreground hover:text-brand"><ArrowUpRight size={14} /></a>}</div>)}</div>}
        </SectionCard>
        <SectionCard label={role === "provider" ? "Add a file record" : "Share a file"}>
          <div className="flex items-center gap-2 text-sm font-medium mb-3"><Upload size={15} className="text-brand" /> Add a document or link</div>
          <select value={projectId} onChange={(event) => setProjectId(event.target.value)} className="w-full mb-2 bg-background border border-border rounded-md px-3 py-2 text-sm">{scopedProjects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select>
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="File name" className="w-full mb-2 bg-background border border-border rounded-md px-3 py-2 text-sm" />
          <input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="Optional link (https://...)" className="w-full mb-3 bg-background border border-border rounded-md px-3 py-2 text-sm" />
          {role === "provider" && <select value={visibility} onChange={(event) => setVisibility(event.target.value as DeliveryFile["visibility"])} className="w-full mb-3 bg-background border border-border rounded-md px-3 py-2 text-sm"><option value="shared">Visible to client</option><option value="internal">Internal only</option></select>}
          <button onClick={() => void upload()} className="btn-brand text-xs py-2 px-3 w-full"><Plus size={13} /> Add file</button>
          <p className="text-[10px] text-muted-foreground mt-3">Storage upload can be connected to Supabase Storage without changing the visibility model.</p>
        </SectionCard>
      </div>
      <AccessNote>Every file has an explicit shared or internal visibility. Clients never receive internal-only records through the delivery queries.</AccessNote>
    </DeliveryPage>
  );
}