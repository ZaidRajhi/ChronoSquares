import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { History, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface ArchitectAction {
  id: string;
  action_type: string;
  description: string;
  payload: Record<string, unknown>;
  previous_state: Record<string, unknown> | null;
  reverted: boolean;
  created_at: string;
}

/**
 * Recent Architect actions, with a one-tap revert for the supported types.
 * Renders as a slim panel in the AI Architect drawer.
 */
export function ArchitectHistory({ refreshKey }: { refreshKey: number }) {
  const { user } = useAuth();
  const [actions, setActions] = useState<ArchitectAction[]>([]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("architect_actions" as never)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(15);
      if (!cancelled) setActions((data as unknown as ArchitectAction[]) ?? []);
    })();
    return () => { cancelled = true; };
  }, [user, refreshKey]);

  const revert = async (a: ArchitectAction) => {
    if (!user || a.reverted) return;
    try {
      const prev = a.previous_state ?? {};
      switch (a.action_type) {
        case "set_focus_mode":
          await supabase.from("profiles").update({ focus_mode: Boolean(prev.focus_mode) }).eq("id", user.id);
          break;
        case "set_nav_position":
          if (prev.nav_position) await supabase.from("profiles").update({ nav_position: String(prev.nav_position) }).eq("id", user.id);
          break;
        case "hide_nav_items":
          await supabase.from("profiles").update({ nav_hidden_items: (prev.nav_hidden_items as string[]) ?? [] }).eq("id", user.id);
          break;
        case "toggle_square": {
          const square = (a.payload as { square?: string }).square;
          if (square && prev.previous_enabled !== null && prev.previous_enabled !== undefined) {
            await supabase.from("user_square_settings").update({ is_enabled: Boolean(prev.previous_enabled) }).eq("user_id", user.id).eq("square_name", square);
          }
          break;
        }
        case "add_dashboard_widget": {
          const id = (a.payload as { widget_id?: string }).widget_id;
          if (id) await supabase.from("dashboard_widgets").delete().eq("id", id).eq("user_id", user.id);
          break;
        }
        case "create_habit": {
          const id = (a.payload as { habit_id?: string }).habit_id;
          if (id) await supabase.from("habits").delete().eq("id", id).eq("user_id", user.id);
          break;
        }
        case "create_goal": {
          const id = (a.payload as { goal_id?: string }).goal_id;
          if (id) await supabase.from("goals").delete().eq("id", id).eq("user_id", user.id);
          break;
        }
        case "create_workflow_rule": {
          const id = (a.payload as { rule_id?: string }).rule_id;
          if (id) await supabase.from("workflow_rules").delete().eq("id", id).eq("user_id", user.id);
          break;
        }
        case "apply_overlay": {
          const prevId = prev.previous_overlay_id as string | null;
          if (prevId) {
            await supabase.from("user_overlays").update({ is_applied: false }).eq("user_id", user.id);
            await supabase.from("user_overlays").update({ is_applied: true }).eq("user_id", user.id).eq("overlay_id", prevId);
            const { data: ov } = await supabase.from("overlays").select("palette").eq("id", prevId).maybeSingle();
            if (ov) await supabase.from("profiles").update({ custom_palette: ov.palette }).eq("id", user.id);
          } else {
            await supabase.from("profiles").update({ theme_preference: "dark", custom_palette: null }).eq("id", user.id);
          }
          break;
        }
        default:
          toast.error("This action can't be reverted automatically.");
          return;
      }
      await (supabase.from("architect_actions" as never) as unknown as { update: (v: Record<string, unknown>) => { eq: (col: string, val: string) => Promise<unknown> } }).update({ reverted: true }).eq("id", a.id);
      setActions((prev) => prev.map((x) => (x.id === a.id ? { ...x, reverted: true } : x)));
      toast.success("Reverted. Reload to see changes.");
    } catch (e) {
      toast.error("Revert failed: " + (e as Error).message);
    }
  };

  if (actions.length === 0) {
    return (
      <div className="text-[11px] text-muted-foreground text-center py-6">
        <History size={14} className="mx-auto mb-1 opacity-50" />
        No architect actions yet.
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {actions.map((a) => (
        <div key={a.id} className="flex items-start gap-2 px-2 py-1.5 rounded-lg border border-border bg-background/60">
          <div className="flex-1 min-w-0">
            <div className={`text-[11px] ${a.reverted ? "text-muted-foreground line-through" : "text-foreground"}`}>{a.description}</div>
            <div className="mono text-[9px] uppercase text-muted-foreground tracking-wider">{new Date(a.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
          </div>
          {!a.reverted && (
            <button
              onClick={() => revert(a)}
              className="p-1 rounded text-muted-foreground hover:text-brand"
              title="Revert"
              type="button"
            >
              <RotateCcw size={11} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
