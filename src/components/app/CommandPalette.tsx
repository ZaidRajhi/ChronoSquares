import { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, ArrowRight, LayoutDashboard, Sprout, CheckSquare, Target, NotebookPen, Film, Wallet, Clock, Workflow, Store, Settings, Sparkles, Plus } from "lucide-react";
import { useUserPrefs } from "@/lib/userPrefs";

type Action = {
  id: string;
  label: string;
  hint?: string;
  group: "Navigate" | "Create" | "Toggle" | "Settings";
  icon: typeof Search;
  run: () => void;
};

/**
 * Global ⌘K / Ctrl+K command palette. Provides quick navigation
 * across every Square plus app-level toggles (focus mode, theme).
 */
export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const navigate = useNavigate();
  const { focusMode, setFocusMode, theme, setTheme } = useUserPrefs();
  const inputRef = useRef<HTMLInputElement>(null);

  // Open with ⌘K / Ctrl+K, close with Esc
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
        setQuery("");
        setCursor(0);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30);
  }, [open]);

  const actions: Action[] = useMemo(() => [
    { id: "n-dashboard", label: "Dashboard", group: "Navigate", icon: LayoutDashboard, run: () => navigate({ to: "/app/dashboard" }) },
    { id: "n-habits", label: "Habits", group: "Navigate", icon: Sprout, run: () => navigate({ to: "/app/habits" }) },
    { id: "n-tasks", label: "Tasks", group: "Navigate", icon: CheckSquare, run: () => navigate({ to: "/app/tasks" }) },
    { id: "n-goals", label: "Goals", group: "Navigate", icon: Target, run: () => navigate({ to: "/app/goals" }) },
    { id: "n-journal", label: "Journal", group: "Navigate", icon: NotebookPen, run: () => navigate({ to: "/app/journal" }) },
    { id: "n-media", label: "Media", group: "Navigate", icon: Film, run: () => navigate({ to: "/app/media" }) },
    { id: "n-finance", label: "Finance", group: "Navigate", icon: Wallet, run: () => navigate({ to: "/app/finance" }) },
    { id: "n-time", label: "Time", group: "Navigate", icon: Clock, run: () => navigate({ to: "/app/time" }) },
    { id: "n-workflows", label: "Workflows", group: "Navigate", icon: Workflow, run: () => navigate({ to: "/app/workflows" }) },
    { id: "n-marketplace", label: "Marketplace", group: "Navigate", icon: Store, run: () => navigate({ to: "/app/marketplace" }) },
    { id: "n-settings", label: "Settings", group: "Navigate", icon: Settings, run: () => navigate({ to: "/app/settings" }) },
    { id: "c-task", label: "New task", hint: "Tasks", group: "Create", icon: Plus, run: () => navigate({ to: "/app/tasks", /* go */ }) },
    { id: "c-habit", label: "New habit", hint: "Habits", group: "Create", icon: Plus, run: () => navigate({ to: "/app/habits", /* go */ }) },
    { id: "c-goal", label: "New goal", hint: "Goals", group: "Create", icon: Plus, run: () => navigate({ to: "/app/goals", /* go */ }) },
    { id: "c-entry", label: "New journal entry", hint: "Journal", group: "Create", icon: Plus, run: () => navigate({ to: "/app/journal" }) },
    { id: "c-tx", label: "New transaction", hint: "Finance", group: "Create", icon: Plus, run: () => navigate({ to: "/app/finance" }) },
    { id: "t-focus", label: focusMode ? "Exit focus mode" : "Enter focus mode", group: "Toggle", icon: Sparkles, run: () => setFocusMode(!focusMode) },
    { id: "t-theme-dark", label: "Theme: Obsidian (dark)", group: "Toggle", icon: Sparkles, run: () => setTheme("dark") },
    { id: "t-theme-light", label: "Theme: Daylight", group: "Toggle", icon: Sparkles, run: () => setTheme("light") },
    { id: "t-theme-system", label: "Theme: System", group: "Toggle", icon: Sparkles, run: () => setTheme("system") },
    { id: "t-architect-open", label: "Open AI Architect", hint: "⌘J", group: "Toggle", icon: Sparkles, run: () => window.dispatchEvent(new CustomEvent("cs:architect:open")) },
    { id: "t-architect-show", label: "Show AI Architect launcher", group: "Toggle", icon: Sparkles, run: () => window.dispatchEvent(new CustomEvent("cs:architect:show")) },
  ], [navigate, focusMode, setFocusMode, setTheme, theme]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return actions;
    return actions.filter((a) => a.label.toLowerCase().includes(q) || a.group.toLowerCase().includes(q) || (a.hint?.toLowerCase().includes(q) ?? false));
  }, [actions, query]);

  useEffect(() => { setCursor(0); }, [query]);

  const grouped = useMemo(() => {
    const m = new Map<string, Action[]>();
    filtered.forEach((a) => {
      const arr = m.get(a.group) ?? [];
      arr.push(a);
      m.set(a.group, arr);
    });
    return Array.from(m.entries());
  }, [filtered]);

  const flat = filtered;

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setCursor((c) => Math.min(c + 1, flat.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setCursor((c) => Math.max(c - 1, 0)); }
    if (e.key === "Enter") {
      e.preventDefault();
      const a = flat[cursor];
      if (a) { a.run(); setOpen(false); }
    }
  };

  if (!open) return null;

  let runningIndex = -1;
  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[12vh] px-4" onClick={() => setOpen(false)}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative w-full max-w-xl bg-card border border-border rounded-xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <Search size={15} className="text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Type a command or search…"
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
          />
          <kbd className="mono text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">ESC</kbd>
        </div>
        <div className="max-h-[55vh] overflow-y-auto py-1">
          {grouped.length === 0 && <div className="px-4 py-6 text-sm text-muted-foreground text-center">No matches.</div>}
          {grouped.map(([group, items]) => (
            <div key={group} className="py-1">
              <div className="mono text-[10px] uppercase text-muted-foreground px-4 pt-2 pb-1">{group}</div>
              {items.map((a) => {
                runningIndex += 1;
                const active = runningIndex === cursor;
                return (
                  <button
                    key={a.id}
                    onMouseEnter={() => setCursor(flat.indexOf(a))}
                    onClick={() => { a.run(); setOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-4 py-2 text-sm text-left transition-colors ${active ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    <a.icon size={14} className="text-brand shrink-0" />
                    <span className="flex-1">{a.label}</span>
                    {a.hint && <span className="mono text-[10px] text-muted-foreground">{a.hint}</span>}
                    {active && <ArrowRight size={12} />}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        <div className="px-4 py-2 border-t border-border flex items-center justify-between text-[10px] text-muted-foreground mono">
          <span>↑↓ navigate · ↵ run</span>
          <span>⌘K to toggle</span>
        </div>
      </div>
    </div>
  );
}
