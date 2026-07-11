import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { WidgetShell } from "@/components/app/widgets/WidgetShell";
import { WidgetBody, getWidgetMeta } from "@/components/app/widgets/widgetRenderers";
import { WidgetCustomizer } from "@/components/app/widgets/WidgetCustomizer";
import { SortableWidget } from "@/components/app/widgets/SortableWidget";
import { WIDGET_REGISTRY, SIZE_CLASS, DEFAULT_LAYOUT, type WidgetType, type WidgetSize, type WidgetAppearance } from "@/lib/widgets";
import { Plus, X, Pencil, Check } from "lucide-react";
import { toast } from "sonner";
import { DndContext, PointerSensor, KeyboardSensor, useSensor, useSensors, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, arrayMove, rectSortingStrategy } from "@dnd-kit/sortable";
import { Module } from "@/components/app/Module";

interface DbWidget {
  id: string;
  widget_type: WidgetType;
  size: WidgetSize;
  position: number;
  config: Record<string, unknown>;
  appearance: WidgetAppearance;
}

/**
 * Widgets ("mini-apps") — self-contained dashboard section. Owns its own
 * data (dashboard_widgets), drag/drop reordering, add/remove, and per-widget
 * customization. Visual "mood" (calm/hud/terminal/…) for the section as a
 * whole comes from the body-level overlay widget-mode class set in
 * Settings → Overlays; individual widgets can still override it via
 * per-widget customization.
 */
export function WidgetsSection({ gap = "gap-4" }: { gap?: string }) {
  const { user } = useAuth();
  const [widgets, setWidgets] = useState<DbWidget[]>([]);
  const [editing, setEditing] = useState(false);
  const [picking, setPicking] = useState(false);
  const [customizing, setCustomizing] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: w } = await supabase.from("dashboard_widgets").select("*").eq("user_id", user.id).order("position");
      const list = ((w ?? []) as unknown as DbWidget[]).map((x) => ({ ...x, appearance: x.appearance ?? {} }));
      if (list.length === 0) {
        const seeded = await Promise.all(DEFAULT_LAYOUT.map((wd, i) =>
          supabase.from("dashboard_widgets").insert({ user_id: user.id, widget_type: wd.type, size: wd.size, position: i, config: {}, appearance: {} }).select().single()
        ));
        setWidgets(seeded.map((s) => ({ ...(s.data as unknown as DbWidget), appearance: {} })).filter(Boolean));
      } else {
        setWidgets(list);
      }
    })();
  }, [user]);

  const addWidget = async (type: WidgetType) => {
    if (!user) return;
    const meta = WIDGET_REGISTRY.find((w) => w.type === type);
    const { data, error } = await supabase.from("dashboard_widgets").insert({
      user_id: user.id, widget_type: type, size: meta?.defaultSize ?? "md", position: widgets.length, config: {}, appearance: {},
    }).select().single();
    if (error) return toast.error(error.message);
    setWidgets((c) => [...c, { ...(data as unknown as DbWidget), appearance: {} }]);
    setPicking(false);
  };

  const removeWidget = async (id: string) => {
    setWidgets((c) => c.filter((w) => w.id !== id));
    await supabase.from("dashboard_widgets").delete().eq("id", id);
  };

  const cycleSize = async (w: DbWidget) => {
    const order: WidgetSize[] = ["sm", "md", "lg", "xl"];
    const next = order[(order.indexOf(w.size) + 1) % order.length];
    setWidgets((c) => c.map((x) => (x.id === w.id ? { ...x, size: next } : x)));
    await supabase.from("dashboard_widgets").update({ size: next }).eq("id", w.id);
  };

  const updateConfig = async (id: string, config: Record<string, unknown>) => {
    setWidgets((c) => c.map((x) => (x.id === id ? { ...x, config } : x)));
    await supabase.from("dashboard_widgets").update({ config: config as never }).eq("id", id);
  };

  const updateAppearance = async (id: string, appearance: WidgetAppearance) => {
    setWidgets((c) => c.map((x) => (x.id === id ? { ...x, appearance } : x)));
    await supabase.from("dashboard_widgets").update({ appearance: appearance as never }).eq("id", id);
  };

  const onDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = widgets.findIndex((w) => w.id === active.id);
    const newIdx = widgets.findIndex((w) => w.id === over.id);
    if (oldIdx < 0 || newIdx < 0) return;
    const reordered = arrayMove(widgets, oldIdx, newIdx);
    setWidgets(reordered);
    await Promise.all(reordered.map((w, i) => supabase.from("dashboard_widgets").update({ position: i }).eq("id", w.id)));
  };

  const customizingWidget = useMemo(() => widgets.find((w) => w.id === customizing), [widgets, customizing]);

  return (
    <div>
      <div className="flex items-center justify-between mb-3 px-1 flex-wrap gap-2">
        <div className="mono text-[10px] uppercase tracking-wider text-muted-foreground">Mini-apps · {widgets.length}</div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <button onClick={() => setEditing((e) => !e)} className="mono text-[10px] uppercase text-muted-foreground hover:text-brand inline-flex items-center gap-1">
            {editing ? <><Check size={11} /> Done</> : <><Pencil size={11} /> Edit</>}
          </button>
          {editing && (
            <button onClick={() => setPicking(true)} className="btn-brand text-[10px] py-1 px-2 inline-flex items-center gap-1">
              <Plus size={11} /> Add
            </button>
          )}
        </div>
      </div>

      {widgets.length === 0 ? (
        <Module label="Empty">
          <p className="text-sm text-muted-foreground">No mini-apps pinned. Click <em>Edit</em> → <em>Add</em>.</p>
        </Module>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={widgets.map((w) => w.id)} strategy={rectSortingStrategy}>
            <div className={`grid grid-cols-12 ${gap}`}>
              {widgets.map((w) => {
                const meta = getWidgetMeta(w.widget_type);
                return (
                  <SortableWidget key={w.id} id={w.id} className={SIZE_CLASS[w.size]}>
                    {(dragProps) => (
                      <WidgetShell
                        title={meta.title}
                        icon={meta.icon}
                        appearance={w.appearance}
                        editing={editing}
                        onRemove={() => removeWidget(w.id)}
                        onResize={() => cycleSize(w)}
                        onCustomize={() => setCustomizing(w.id)}
                        dragHandleProps={dragProps}
                      >
                        <WidgetBody type={w.widget_type} config={w.config} onConfigChange={(next) => updateConfig(w.id, next)} />
                      </WidgetShell>
                    )}
                  </SortableWidget>
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {picking && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setPicking(false)}>
          <div className="module max-w-3xl w-full p-5 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Add a mini-app</h3>
              <button onClick={() => setPicking(false)} className="p-1.5 rounded hover:bg-muted text-muted-foreground"><X size={14} /></button>
            </div>
            {(["core", "productivity", "creative", "lifestyle"] as const).map((cat) => (
              <div key={cat} className="mb-4">
                <div className="mono text-[10px] uppercase text-muted-foreground mb-2">{cat}</div>
                <div className="grid sm:grid-cols-2 gap-2">
                  {WIDGET_REGISTRY.filter((w) => w.category === cat).map((w) => {
                    const meta = getWidgetMeta(w.type);
                    return (
                      <button key={w.type} onClick={() => addWidget(w.type)} className="text-left p-3 rounded-xl border border-border/60 hover:border-brand/50 hover:bg-brand/5 transition-colors">
                        <div className="flex items-center gap-2 mono text-[10px] uppercase text-brand mb-1">{meta.icon}<span>{w.name}</span></div>
                        <p className="text-xs text-muted-foreground">{w.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {customizingWidget && (
        <WidgetCustomizer
          appearance={customizingWidget.appearance ?? {}}
          onChange={(next) => updateAppearance(customizingWidget.id, next)}
          onClose={() => setCustomizing(null)}
        />
      )}
    </div>
  );
}
