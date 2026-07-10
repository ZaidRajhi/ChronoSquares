import { useState, useRef, useEffect } from "react";
import { Sparkles, X, Send, Loader2, RotateCcw, History as HistoryIcon, MessageSquare, Wrench, CheckCircle2, AlertCircle, EyeOff, Pin } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { runArchitectTool, type ToolCall } from "@/lib/architectTools";
import { ArchitectHistory } from "@/components/app/ArchitectHistory";
import { toast } from "sonner";

interface ToolEvent {
  name: string;
  status: "running" | "ok" | "error";
  summary: string;
}

interface Msg {
  role: "user" | "assistant" | "tool";
  content: string;
  tool_calls?: ToolCall[];
  tool_events?: ToolEvent[];
  tool_call_id?: string;
}

const SUGGESTIONS = [
  "Set up a clean morning routine: 3 habits + a focus block",
  "Apply the Cyber Cyan overlay and turn off Marketplace",
  "Build a 90-day fitness goal with 4 milestones",
  "Declutter my nav — hide what I don't use",
];

/**
 * AI Architect — workspace-aware assistant with tool-calling.
 * Streams replies, parses tool_calls from the model, executes them
 * against Supabase, and posts results back into the conversation.
 */
export function AIArchitect() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"chat" | "history">("chat");
  const [hidden, setHidden] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("cs_architect_hidden") === "1";
  });
  const persistHidden = (v: boolean) => {
    setHidden(v);
    try { localStorage.setItem("cs_architect_hidden", v ? "1" : "0"); } catch { /* noop */ }
  };
  const initial: Msg[] = [
    { role: "assistant", content: "Hi — I'm your AI Architect. I can chat, design routines, *and actually edit your workspace*. Ask me to apply an overlay, build a goal, declutter your nav, or just talk about what you're working on." },
  ];
  const [messages, setMessages] = useState<Msg[]>(initial);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [historyKey, setHistoryKey] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { scrollRef.current?.scrollTo({ top: 1e9, behavior: "smooth" }); }, [messages, streaming]);

  // Global summon shortcut: ⌘J / Ctrl+J always reopens the Architect,
  // even when the launcher is hidden. Esc closes the panel.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    // Allow other surfaces (command palette, settings) to summon via event
    const onSummon = () => setOpen(true);
    const onUnhide = () => persistHidden(false);
    window.addEventListener("cs:architect:open", onSummon);
    window.addEventListener("cs:architect:show", onUnhide);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("cs:architect:open", onSummon);
      window.removeEventListener("cs:architect:show", onUnhide);
    };
  }, [open]);

  // Strip transient UI fields before sending to the model
  const wireMessages = (msgs: Msg[]) => msgs.map((m) => {
    if (m.role === "tool") return { role: "tool", tool_call_id: m.tool_call_id, content: m.content };
    if (m.role === "assistant" && m.tool_calls) {
      return { role: "assistant", content: m.content, tool_calls: m.tool_calls.map((tc, i) => ({ id: `call_${i}`, type: "function", function: { name: tc.name, arguments: JSON.stringify(tc.arguments) } })) };
    }
    return { role: m.role, content: m.content };
  });

  const streamOnce = async (history: Msg[]): Promise<{ content: string; tool_calls: ToolCall[]; ids: string[] }> => {
    const { data: { session } } = await supabase.auth.getSession();
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-architect`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
      body: JSON.stringify({ messages: wireMessages(history), allow_tools: !!user }),
    });
    if (res.status === 429) { toast.error("Rate limited. Try again in a moment."); throw new Error("429"); }
    if (res.status === 402) { toast.error("AI credits exhausted."); throw new Error("402"); }
    if (!res.ok || !res.body) { throw new Error(`AI error: ${res.statusText}`); }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let content = "";
    const toolBuf: Record<number, { name: string; argsStr: string; id: string }> = {};

    // Stream tokens — append to the *last* assistant message live
    setMessages((m) => [...m, { role: "assistant", content: "" }]);

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let nl: number;
      while ((nl = buffer.indexOf("\n")) !== -1) {
        let line = buffer.slice(0, nl);
        buffer = buffer.slice(nl + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (payload === "[DONE]") break;
        try {
          const json = JSON.parse(payload);
          const delta = json.choices?.[0]?.delta;
          if (delta?.content) {
            content += delta.content;
            setMessages((m) => { const c = [...m]; c[c.length - 1] = { ...c[c.length - 1], content }; return c; });
          }
          if (Array.isArray(delta?.tool_calls)) {
            for (const tc of delta.tool_calls) {
              const idx = tc.index ?? 0;
              if (!toolBuf[idx]) toolBuf[idx] = { name: "", argsStr: "", id: tc.id ?? `call_${idx}` };
              if (tc.id) toolBuf[idx].id = tc.id;
              if (tc.function?.name) toolBuf[idx].name += tc.function.name;
              if (tc.function?.arguments) toolBuf[idx].argsStr += tc.function.arguments;
            }
          }
        } catch { /* partial json, continue */ }
      }
    }

    const tool_calls: ToolCall[] = [];
    const ids: string[] = [];
    for (const k of Object.keys(toolBuf).sort((a, b) => Number(a) - Number(b))) {
      const t = toolBuf[Number(k)];
      let parsed: Record<string, unknown> = {};
      try { parsed = JSON.parse(t.argsStr || "{}"); } catch { parsed = {}; }
      tool_calls.push({ name: t.name, arguments: parsed });
      ids.push(t.id);
    }
    return { content, tool_calls, ids };
  };

  const send = async (override?: string) => {
    const text = (override ?? input).trim();
    if (!text || streaming) return;
    setInput("");
    setStreaming(true);
    let working: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(working);

    try {
      // Up to 6 turns of tool-calling — enables genuine agentic chains
      for (let turn = 0; turn < 6; turn++) {
        const { content, tool_calls, ids } = await streamOnce(working);
        // Replace the placeholder we appended in streamOnce with the real assistant message
        const assistantMsg: Msg = { role: "assistant", content, tool_calls: tool_calls.length > 0 ? tool_calls : undefined };
        working = [...working, assistantMsg];
        // The streamOnce already appended a placeholder — remove it
        setMessages((m) => {
          const copy = [...m];
          if (copy.length > 0 && copy[copy.length - 1].role === "assistant" && !copy[copy.length - 1].tool_calls) {
            copy[copy.length - 1] = assistantMsg;
          } else {
            copy.push(assistantMsg);
          }
          return copy;
        });
        if (tool_calls.length === 0) break;
        if (!user) {
          setMessages((m) => [...m, { role: "assistant", content: "Sign in to let me actually edit your workspace." }]);
          break;
        }
        // Execute tools and post results
        const events: ToolEvent[] = tool_calls.map((tc) => ({ name: tc.name, status: "running", summary: "" }));
        setMessages((m) => [...m, { role: "assistant", content: "", tool_events: events }]);
        const newToolMsgs: Msg[] = [];
        for (let i = 0; i < tool_calls.length; i++) {
          const r = await runArchitectTool(tool_calls[i], user.id);
          events[i] = { name: tool_calls[i].name, status: r.ok ? "ok" : "error", summary: r.summary };
          setMessages((m) => { const c = [...m]; c[c.length - 1] = { ...c[c.length - 1], tool_events: [...events] }; return c; });
          newToolMsgs.push({ role: "tool", tool_call_id: ids[i], content: r.ok ? r.summary : `ERROR: ${r.error ?? r.summary}` });
        }
        working = [...working, ...newToolMsgs];
        setHistoryKey((k) => k + 1);
        // Loop continues so the model can summarise / chain
      }
    } catch (err) {
      const msg = (err as Error).message;
      setMessages((m) => [...m, { role: "assistant", content: `⚠️ ${msg}` }]);
    } finally {
      setStreaming(false);
    }
  };

  const reset = () => { setMessages(initial); setInput(""); };

  return (
    <>
      {!hidden && (
        <div className="fixed bottom-5 right-5 z-40 flex items-center gap-1.5 group">
          <button
            onClick={() => persistHidden(true)}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full bg-card/80 border border-border text-muted-foreground hover:text-brand backdrop-blur-sm"
            aria-label="Hide AI Architect (⌘J to summon)"
            title="Hide launcher · ⌘J to summon"
            type="button"
          >
            <EyeOff size={11} />
          </button>
          <button
            onClick={() => setOpen(true)}
            className="relative"
            aria-label="AI Architect"
            type="button"
          >
            <span className="absolute inset-0 rounded-full bg-brand/40 blur-xl group-hover:bg-brand/60 transition-colors" />
            <span className="relative flex items-center gap-2 px-4 py-2.5 rounded-full bg-card border border-brand/40 shadow-[var(--shadow-glow)] text-sm text-foreground hover:border-brand transition-colors">
              <Sparkles size={14} className="text-brand" /> AI Architect
              <kbd className="hidden sm:inline-block ml-1 px-1.5 py-0.5 rounded bg-muted text-[9px] text-muted-foreground border border-border">⌘J</kbd>
            </span>
          </button>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative w-full max-w-md h-full bg-card border-l border-border flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-brand/15 text-brand flex items-center justify-center"><Sparkles size={14} /></div>
                <div>
                  <div className="text-sm font-semibold">AI Architect</div>
                  <div className="text-[10px] text-muted-foreground">Personal-OS architect · AI Architect</div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={reset} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground" title="Reset chat" type="button"><RotateCcw size={13} /></button>
                <button
                  onClick={() => persistHidden(!hidden)}
                  className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"
                  title={hidden ? "Pin launcher back" : "Hide launcher (⌘J to summon)"}
                  type="button"
                >
                  {hidden ? <Pin size={13} /> : <EyeOff size={13} />}
                </button>
                <button onClick={() => setOpen(false)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground" type="button"><X size={15} /></button>
              </div>
            </div>

            <div className="flex border-b border-border text-xs">
              <button onClick={() => setTab("chat")} className={`flex-1 flex items-center justify-center gap-1.5 py-2 ${tab === "chat" ? "text-brand border-b-2 border-brand" : "text-muted-foreground"}`} type="button">
                <MessageSquare size={12} /> Chat
              </button>
              <button onClick={() => setTab("history")} className={`flex-1 flex items-center justify-center gap-1.5 py-2 ${tab === "history" ? "text-brand border-b-2 border-brand" : "text-muted-foreground"}`} type="button">
                <HistoryIcon size={12} /> History
              </button>
            </div>

            {tab === "chat" ? (
              <>
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map((m, i) => {
                    if (m.tool_events) {
                      return (
                        <div key={i} className="space-y-1.5">
                          {m.tool_events.map((ev, j) => (
                            <div key={j} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/40 border border-border text-[11px]">
                              {ev.status === "running" && <Loader2 size={11} className="animate-spin text-brand" />}
                              {ev.status === "ok" && <CheckCircle2 size={11} className="text-brand" />}
                              {ev.status === "error" && <AlertCircle size={11} className="text-destructive" />}
                              <Wrench size={10} className="text-muted-foreground" />
                              <span className="mono text-[10px] uppercase text-muted-foreground">{ev.name}</span>
                              <span className="flex-1 truncate">{ev.summary || "…"}</span>
                            </div>
                          ))}
                        </div>
                      );
                    }
                    if (m.role === "tool") return null;
                    return (
                      <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${m.role === "user" ? "bg-brand text-brand-foreground whitespace-pre-wrap" : "bg-muted text-foreground architect-md"}`}>
                          {m.role === "assistant" && m.content ? (
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                          ) : (
                            m.content || (streaming && i === messages.length - 1 ? <Loader2 size={12} className="animate-spin" /> : null)
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {messages.length === 1 && !streaming && (
                    <div className="pt-2 space-y-1.5">
                      <div className="mono text-[10px] uppercase text-muted-foreground px-1">Try</div>
                      {SUGGESTIONS.map((s) => (
                        <button
                          key={s}
                          onClick={() => send(s)}
                          className="w-full text-left text-xs px-3 py-2 rounded-lg border border-border hover:border-brand/60 hover:bg-muted/40 transition-colors"
                          type="button"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="p-3 border-t border-border">
                  <div className="flex gap-2">
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                      placeholder={user ? "Tell me what to build, change, or chat about…" : "Sign in to let me edit your workspace…"}
                      className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:border-brand outline-none"
                    />
                    <button onClick={() => send()} disabled={!input.trim() || streaming} className="btn-brand px-3 py-2 text-xs disabled:opacity-50" type="button">
                      {streaming ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 overflow-y-auto p-4">
                <ArchitectHistory refreshKey={historyKey} />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
