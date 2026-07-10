// AI Architect — workspace-aware AI with tool-calling.
// Streams chat completions back to the client. The model can request tool
// invocations (e.g. apply_overlay, toggle_square, set_focus_mode, ...).
// The client executes the tool against Supabase and posts back the result.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are the **AI Architect** inside ChronoSquares — a personal-OS super app. You are NOT a chatbot; you are a full agent with reasoning, research, planning, and execution capability.

IDENTITY
- Name: AI Architect. Persona: calm, sharp, decisive, slightly poetic. Think "Jarvis meets a great product designer."
- You operate continuously across the user's life: workspace, knowledge, schedule, habits, goals, finance, media, communities.

CAPABILITIES
- General-purpose AI: answer ANY question (coding, math, research, life advice, writing, analysis) without restriction.
- Workspace authoring: overlays, dashboards, routines, habits, goals, workflows, navigation, focus mode — execute via tools.
- Research: when asked about live information, use web_search; cite sources inline as [domain].
- Multi-step planning: break complex requests into a chain of tool calls. Don't ask permission for obvious next steps — just do them.
- Memory: your reasoning persists across the conversation; remember what the user told you earlier.

BEHAVIOUR
- ALWAYS think step-by-step before responding. For complex tasks, briefly state your plan, then execute it.
- Decide-and-act. Never just describe what you *could* do — do it.
- Use markdown: **bold**, *italics*, lists, \`code\`, > quotes, links. Render structure when it helps clarity.
- Be tight by default (~150 words) but expand fully when depth is asked for. Never one-word replies.
- After workspace changes: 1–2 line summary + mention the History panel for revert.
- Never delete user data without explicit confirmation.

DESIGN RULES (workspace authoring)
- ChronoSquares look = obsidian, glass, sage/emerald, generous whitespace, no SaaS chrome.
- Max 6 widgets per dashboard; pair small with one hero.
- Workflow rules read like sentences: "WHEN [Square] [trigger] → [action] in [Square]".

PLANS
- Free: 7 Squares, 3 workflow rules, 20 AI msgs/day, no architect tools.
- Personal: full Squares, unlimited rules, full AI, 5 architect builds/mo.
- Business: everything, full architect, team workspace.`;

const TOOLS = [
  {
    type: "function",
    function: {
      name: "web_search",
      description: "Search the live web for current information. Use for news, prices, dates, libraries, anything you wouldn't already know with certainty. Returns top results with snippets.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query, plain language." },
          recency: { type: "string", enum: ["any", "day", "week", "month", "year"], description: "Bias to recent results." },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "apply_overlay",
      description: "Switch the user's active visual overlay (skin) by slug. The skin only changes appearance, not data.",
      parameters: {
        type: "object",
        properties: { overlay_slug: { type: "string", description: "Slug of an overlay the user owns (e.g. 'obsidian-forest', 'cyber-cyan')." } },
        required: ["overlay_slug"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "toggle_square",
      description: "Enable or disable one of the 7 core Squares or an add-on Square in the user's workspace.",
      parameters: {
        type: "object",
        properties: {
          square: { type: "string", enum: ["habits", "tasks", "goals", "journal", "media", "finance", "time", "gamification"] },
          enabled: { type: "boolean" },
        },
        required: ["square", "enabled"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "set_focus_mode",
      description: "Turn focus mode on or off. Focus mode hides all navigation chrome.",
      parameters: { type: "object", properties: { enabled: { type: "boolean" } }, required: ["enabled"] },
    },
  },
  {
    type: "function",
    function: {
      name: "set_nav_position",
      description: "Change the layout of the main navigation bar.",
      parameters: { type: "object", properties: { position: { type: "string", enum: ["top", "sidebar", "bottom"] } }, required: ["position"] },
    },
  },
  {
    type: "function",
    function: {
      name: "hide_nav_items",
      description: "Hide one or more navigation items from the main nav. Use this to declutter for a user.",
      parameters: {
        type: "object",
        properties: { items: { type: "array", items: { type: "string" }, description: "Routes to hide, e.g. ['/app/marketplace','/app/workflows']" } },
        required: ["items"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_dashboard_widget",
      description: "Add a widget to the user's dashboard. For fully bespoke mini-apps use create_custom_app instead.",
      parameters: {
        type: "object",
        properties: {
          widget_type: { type: "string", enum: ["today_focus","habits_today","tasks_today","stats","ai_prompt","square_launcher","dungeon_quests","community_feed","quick_capture","quote","image","note","calendar_mini","goal_progress","pomodoro","shortcut","journal_prompt","iframe","custom_app"] },
          size: { type: "string", enum: ["sm", "md", "lg", "xl"], description: "Default md." },
          config: { type: "object", description: "Widget-specific configuration JSON." },
          appearance: { type: "object", description: "Visual overrides: surface, shape, accent, tintHex, visualMode." },
        },
        required: ["widget_type"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_custom_app",
      description: "Author a fully bespoke mini-app widget for the user's dashboard. You design title, layout, stats, actions, body copy — purely declarative, no code execution. Use this when the user asks for a custom dashboard tool, tracker, or unique workspace element that doesn't match an existing widget type.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          subtitle: { type: "string" },
          emoji: { type: "string", description: "A single emoji or symbol." },
          layout: { type: "string", enum: ["hero","split","stats","actions"], description: "hero=big icon+title row, split=2-col, stats=stat grid, actions=action chips." },
          accent: { type: "string", enum: ["brand","violet","amber","rose","cyan","emerald"] },
          body: { type: "string", description: "Short paragraph or instructions (optional)." },
          stats: { type: "array", items: { type: "object", properties: { label: {type:"string"}, value: {type:"string"} }, required: ["label","value"] } },
          actions: { type: "array", items: { type: "object", properties: { label: {type:"string"}, href: {type:"string"}, emoji: {type:"string"} }, required: ["label"] } },
          size: { type: "string", enum: ["sm","md","lg","xl"], description: "Default lg." },
          visualMode: { type: "string", enum: ["calm","hud","terminal","poster","artifact"] },
          shape: { type: "string", enum: ["rounded","sharp","pill","organic"] },
        },
        required: ["title", "layout"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_workflow_rule",
      description: "Install an automation rule that connects two Squares.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          source_square: { type: "string" },
          trigger_event: { type: "string", description: "e.g. 'task_completed', 'habit_logged', 'goal_progress'" },
          target_square: { type: "string" },
          action: { type: "string", description: "e.g. 'create_journal_entry', 'increment_goal', 'log_time_block'" },
        },
        required: ["name", "source_square", "trigger_event", "target_square", "action"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_habit",
      description: "Create a habit for the user.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          frequency: { type: "string", enum: ["daily", "weekly"] },
          icon: { type: "string", description: "Single emoji" },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_goal",
      description: "Create a goal with optional milestones.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          milestones: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                at_progress: { type: "number", description: "0-100" },
              },
              required: ["name", "at_progress"],
            },
          },
        },
        required: ["title"],
      },
    },
  },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, allow_tools = true } = await req.json();
    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages must be an array" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "OPENAI_API_KEY not configured. Add it as a Supabase secret: supabase secrets set OPENAI_API_KEY=sk-..." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body: Record<string, unknown> = {
      model: "gpt-4o",
      stream: true,
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
    };
    if (allow_tools) {
      body.tools = TOOLS;
      body.tool_choice = "auto";
    }

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit reached. Try again shortly." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (res.status === 402) {
      return new Response(JSON.stringify({ error: "OpenAI credits exhausted. Check your usage at platform.openai.com." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!res.ok || !res.body) {
      const text = await res.text();
      return new Response(JSON.stringify({ error: text || "OpenAI API error" }), { status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(res.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
