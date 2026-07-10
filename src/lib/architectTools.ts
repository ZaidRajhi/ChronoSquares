import { supabase } from "@/integrations/supabase/client";

/**
 * Runs an AI-Architect tool call against the user's workspace.
 * Each tool returns a short human-readable summary string and records
 * itself in `architect_actions` so the user can audit / revert later.
 */
export interface ToolCall {
  name: string;
  arguments: Record<string, unknown>;
}

interface RunResult {
  ok: boolean;
  summary: string;
  error?: string;
}

async function recordAction(
  userId: string,
  actionType: string,
  description: string,
  payload: Record<string, unknown>,
  previousState?: Record<string, unknown>,
) {
  // architect_actions was added in a recent migration; types may not include it yet.
  await (supabase.from("architect_actions" as never) as unknown as { insert: (row: Record<string, unknown>) => Promise<unknown> }).insert({
    user_id: userId,
    action_type: actionType,
    description,
    payload,
    previous_state: previousState ?? null,
  });
}

export async function runArchitectTool(call: ToolCall, userId: string): Promise<RunResult> {
  const args = call.arguments ?? {};
  try {
    switch (call.name) {
      case "apply_overlay": {
        const slug = String(args.overlay_slug ?? "");
        const { data: overlay, error } = await supabase.from("overlays").select("*").eq("slug", slug).maybeSingle();
        if (error || !overlay) return { ok: false, summary: `Overlay '${slug}' not found.`, error: error?.message };
        const { data: prevApplied } = await supabase.from("user_overlays").select("overlay_id").eq("user_id", userId).eq("is_applied", true).maybeSingle();
        await supabase.from("user_overlays").update({ is_applied: false }).eq("user_id", userId);
        // Ensure ownership row exists
        const { data: existing } = await supabase.from("user_overlays").select("id").eq("user_id", userId).eq("overlay_id", overlay.id).maybeSingle();
        if (existing) {
          await supabase.from("user_overlays").update({ is_applied: true }).eq("id", existing.id);
        } else {
          await supabase.from("user_overlays").insert({ user_id: userId, overlay_id: overlay.id, is_applied: true });
        }
        // Apply palette
        const palette = (overlay.palette as Record<string, string>) ?? {};
        await supabase.from("profiles").update({ theme_preference: "custom", custom_palette: palette }).eq("id", userId);
        // Apply structural shape (rounded / sharp / cloud / minimal2d)
        const shape = (overlay as { shape?: string }).shape ?? "rounded";
        if (typeof document !== "undefined") {
          document.body.classList.remove("shape-rounded", "shape-sharp", "shape-cloud", "shape-minimal2d", "shape-obelisk", "shape-orbital", "shape-rune");
          document.body.classList.add(`shape-${shape}`);
          try {
            localStorage.setItem("cs_overlay_shape", shape);
            localStorage.setItem("cs_widget_mode", ((overlay as { widget_mode?: string }).widget_mode ?? "calm"));
          } catch { /* noop */ }
        }
        await recordAction(userId, "apply_overlay", `Applied overlay "${overlay.name}".`, { overlay_id: overlay.id, slug }, { previous_overlay_id: prevApplied?.overlay_id ?? null });
        return { ok: true, summary: `Applied "${overlay.name}".` };
      }
      case "web_search": {
        const query = String(args.query ?? "").trim();
        if (!query) return { ok: false, summary: "Empty search query.", error: "empty_query" };
        try {
          const res = await fetch(`https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
            headers: { "User-Agent": "Mozilla/5.0 ChronoSquares-Architect" },
          });
          const html = await res.text();
          // Pull the first ~6 result blocks (title + url + snippet)
          const results: { title: string; url: string; snippet: string }[] = [];
          const re = /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>[\s\S]{0,400}?<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
          let m: RegExpExecArray | null;
          while ((m = re.exec(html)) && results.length < 6) {
            const url = m[1].replace(/^.*uddg=([^&]+).*$/, (_s, u) => decodeURIComponent(u)) || m[1];
            const title = m[2].replace(/<[^>]+>/g, "").trim();
            const snippet = m[3].replace(/<[^>]+>/g, "").trim();
            results.push({ title, url, snippet });
          }
          if (results.length === 0) return { ok: true, summary: `No results for "${query}".` };
          const summary = results.map((r, i) => `${i + 1}. ${r.title}\n   ${r.url}\n   ${r.snippet}`).join("\n\n");
          return { ok: true, summary };
        } catch (e) {
          return { ok: false, summary: `Search failed: ${(e as Error).message}`, error: (e as Error).message };
        }
      }
      case "toggle_square": {
        const square = String(args.square ?? "");
        const enabled = Boolean(args.enabled);
        const { data: existing } = await supabase.from("user_square_settings").select("id, is_enabled").eq("user_id", userId).eq("square_name", square).maybeSingle();
        if (existing) {
          await supabase.from("user_square_settings").update({ is_enabled: enabled }).eq("id", existing.id);
        } else {
          await supabase.from("user_square_settings").insert({ user_id: userId, square_name: square, is_enabled: enabled });
        }
        await recordAction(userId, "toggle_square", `${enabled ? "Enabled" : "Disabled"} ${square} Square.`, { square, enabled }, { previous_enabled: existing?.is_enabled ?? null });
        return { ok: true, summary: `${enabled ? "Enabled" : "Disabled"} the ${square} Square.` };
      }
      case "set_focus_mode": {
        const enabled = Boolean(args.enabled);
        const { data: prev } = await supabase.from("profiles").select("focus_mode").eq("id", userId).maybeSingle();
        await supabase.from("profiles").update({ focus_mode: enabled }).eq("id", userId);
        await recordAction(userId, "set_focus_mode", `Focus mode ${enabled ? "on" : "off"}.`, { enabled }, { focus_mode: prev?.focus_mode });
        return { ok: true, summary: `Focus mode ${enabled ? "on" : "off"}.` };
      }
      case "set_nav_position": {
        const position = String(args.position ?? "top") as "top" | "sidebar" | "bottom";
        const { data: prev } = await supabase.from("profiles").select("nav_position").eq("id", userId).maybeSingle();
        await supabase.from("profiles").update({ nav_position: position }).eq("id", userId);
        await recordAction(userId, "set_nav_position", `Nav moved to ${position}.`, { position }, { nav_position: prev?.nav_position });
        return { ok: true, summary: `Nav moved to ${position}.` };
      }
      case "hide_nav_items": {
        const items = Array.isArray(args.items) ? (args.items as string[]) : [];
        const { data: prev } = await supabase.from("profiles").select("nav_hidden_items").eq("id", userId).maybeSingle();
        const current = Array.isArray(prev?.nav_hidden_items) ? (prev?.nav_hidden_items as string[]) : [];
        const next = Array.from(new Set([...current, ...items]));
        await supabase.from("profiles").update({ nav_hidden_items: next }).eq("id", userId);
        await recordAction(userId, "hide_nav_items", `Hid ${items.length} nav item(s).`, { items }, { nav_hidden_items: current });
        return { ok: true, summary: `Hid ${items.length} item(s) from your nav.` };
      }
      case "add_dashboard_widget": {
        const widget_type = String(args.widget_type ?? "stats");
        const size = String(args.size ?? "md");
        const { data: positionData } = await supabase.from("dashboard_widgets").select("position").eq("user_id", userId).order("position", { ascending: false }).limit(1).maybeSingle();
        const nextPosition = (positionData?.position ?? -1) + 1;
        const appearance = args.appearance && typeof args.appearance === "object" ? args.appearance as Record<string, unknown> : {};
        const config = args.config && typeof args.config === "object" ? args.config as Record<string, unknown> : {};
        const { data: created } = await supabase.from("dashboard_widgets").insert({ user_id: userId, widget_type, size, position: nextPosition, config, appearance } as never).select().single();
        await recordAction(userId, "add_dashboard_widget", `Added ${widget_type} widget.`, { widget_type, size, widget_id: created?.id });
        return { ok: true, summary: `Added a ${widget_type} widget to your dashboard.` };
      }
      case "create_mini_app": {
        const label = String(args.label ?? "Custom Square");
        const glyph = String(args.glyph ?? "✦");
        const purpose = String(args.purpose ?? "A custom mini-app shell.");
        const route = String(args.route ?? "/app/workflows");
        const { data: positionData } = await supabase.from("dashboard_widgets").select("position").eq("user_id", userId).order("position", { ascending: false }).limit(1).maybeSingle();
        const { data: created } = await supabase.from("dashboard_widgets").insert({
          user_id: userId,
          widget_type: "square_launcher",
          size: "md",
          position: (positionData?.position ?? -1) + 1,
          config: { label, glyph, purpose, route },
          appearance: { visualMode: "artifact", shape: "organic", accent: "emerald" },
        } as never).select().single();
        await recordAction(userId, "create_mini_app", `Created mini-app shell "${label}".`, { widget_id: created?.id, label, route });
        return { ok: true, summary: `Created a mini-app shell: ${label}.` };
      }
      case "create_custom_app": {
        const { title, subtitle, emoji, layout, accent, body, stats, actions, visualMode, shape } = args as Record<string, unknown>;
        const size = String(args.size ?? "lg");
        const { data: positionData } = await supabase.from("dashboard_widgets").select("position").eq("user_id", userId).order("position", { ascending: false }).limit(1).maybeSingle();
        const config = { title, subtitle, emoji, layout, accent, body, stats, actions };
        const appearance = {
          surface: "glass",
          shape: (shape as string) ?? "rounded",
          accent: (accent as string) ?? "brand",
          visualMode: (visualMode as string) ?? "calm",
        };
        const { data: created } = await supabase.from("dashboard_widgets").insert({
          user_id: userId,
          widget_type: "custom_app",
          size,
          position: (positionData?.position ?? -1) + 1,
          config,
          appearance,
        } as never).select().single();
        await recordAction(userId, "create_custom_app", `Built custom mini-app "${title}".`, { widget_id: created?.id, title, layout });
        return { ok: true, summary: `Built custom mini-app: ${title}.` };
      }
      case "create_workflow_rule": {
        const { name, source_square, trigger_event, target_square, action } = args as Record<string, string>;
        const { data: created } = await supabase.from("workflow_rules").insert({
          user_id: userId,
          name,
          source_square,
          trigger_event,
          target_square,
          action,
        }).select().single();
        await recordAction(userId, "create_workflow_rule", `Created workflow rule "${name}".`, { rule_id: created?.id, name });
        return { ok: true, summary: `Workflow installed: ${name}.` };
      }
      case "create_habit": {
        const name = String(args.name ?? "Habit");
        const frequency = String(args.frequency ?? "daily");
        const icon = String(args.icon ?? "✨");
        const { data: created } = await supabase.from("habits").insert({ user_id: userId, name, frequency, icon }).select().single();
        await recordAction(userId, "create_habit", `Created habit "${name}".`, { habit_id: created?.id, name });
        return { ok: true, summary: `Created habit: ${name}.` };
      }
      case "create_goal": {
        const title = String(args.title ?? "Goal");
        const description = args.description ? String(args.description) : null;
        const milestones = Array.isArray(args.milestones) ? (args.milestones as { name: string; at_progress: number }[]) : [];
        const { data: goal } = await supabase.from("goals").insert({ user_id: userId, title, description }).select().single();
        if (goal && milestones.length > 0) {
          await supabase.from("goal_milestones").insert(milestones.map((m) => ({ user_id: userId, goal_id: goal.id, name: m.name, at_progress: m.at_progress })));
        }
        await recordAction(userId, "create_goal", `Created goal "${title}".`, { goal_id: goal?.id, milestones: milestones.length });
        return { ok: true, summary: `Goal created: ${title}${milestones.length > 0 ? ` (${milestones.length} milestones)` : ""}.` };
      }
      default:
        return { ok: false, summary: `Unknown tool: ${call.name}.`, error: "unknown_tool" };
    }
  } catch (e) {
    return { ok: false, summary: `Failed to run ${call.name}.`, error: (e as Error).message };
  }
}
