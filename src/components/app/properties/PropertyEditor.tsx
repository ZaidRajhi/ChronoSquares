import { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import type { SquareProperty, PropertyType } from "./types";
import { PROPERTY_TYPE_LABELS, SELECT_COLOURS } from "./types";

interface Props {
  open: boolean;
  onClose: () => void;
  squareLabel: string;
  properties: SquareProperty[];
  onAdd: (input: { property_name: string; property_type: PropertyType; options?: { label: string; colour?: string }[] }) => Promise<void>;
  onUpdate: (id: string, patch: Partial<Pick<SquareProperty, "property_name" | "options">>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

/**
 * Slide-over panel listing the user's custom properties for a Square,
 * with inline create/edit/delete.
 */
export function PropertyEditor({ open, onClose, squareLabel, properties, onAdd, onUpdate, onDelete }: Props) {
  const [name, setName] = useState("");
  const [type, setType] = useState<PropertyType>("text");
  const [options, setOptions] = useState<{ label: string; colour: string }[]>([]);
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const reset = () => { setName(""); setType("text"); setOptions([]); };

  const submit = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await onAdd({
        property_name: name.trim(),
        property_type: type,
        options: type === "select" || type === "multi_select" ? options.filter((o) => o.label.trim()) : [],
      });
      reset();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end" onClick={onClose}>
      <div
        className="w-full max-w-md h-full bg-card border-l border-border overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-card z-10">
          <div>
            <div className="mono text-[10px] uppercase text-muted-foreground">{squareLabel} · properties</div>
            <h3 className="font-semibold mt-0.5">Custom fields</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-muted text-muted-foreground"><X size={16} /></button>
        </div>

        <div className="p-5 space-y-6">
          {/* Existing */}
          <section>
            <div className="mono text-[10px] uppercase text-muted-foreground mb-2">Current</div>
            {properties.length === 0 ? (
              <p className="text-sm text-muted-foreground">No custom fields yet. Add one below.</p>
            ) : (
              <ul className="space-y-2">
                {properties.map((p) => (
                  <PropertyRow key={p.id} property={p} onRename={(n) => onUpdate(p.id, { property_name: n })} onDelete={() => onDelete(p.id)} />
                ))}
              </ul>
            )}
          </section>

          {/* Add */}
          <section className="border-t border-border pt-5">
            <div className="mono text-[10px] uppercase text-muted-foreground mb-2">Add new</div>
            <label className="block text-xs text-muted-foreground mb-1">Field name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Energy level" className="w-full mb-3 bg-background border border-border rounded-md px-3 py-2 text-sm" />
            <label className="block text-xs text-muted-foreground mb-1">Type</label>
            <div className="grid grid-cols-2 gap-1.5 mb-3">
              {(Object.keys(PROPERTY_TYPE_LABELS) as PropertyType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`text-left text-xs px-3 py-1.5 rounded-md border transition-colors ${type === t ? "border-brand text-brand bg-brand/10" : "border-border text-muted-foreground hover:text-foreground"}`}
                >
                  {PROPERTY_TYPE_LABELS[t]}
                </button>
              ))}
            </div>

            {(type === "select" || type === "multi_select") && (
              <div className="mb-3 space-y-2">
                <div className="text-xs text-muted-foreground">Choices</div>
                {options.map((o, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <input
                      value={o.label}
                      onChange={(e) => setOptions((cur) => cur.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
                      placeholder={`Choice ${i + 1}`}
                      className="flex-1 bg-background border border-border rounded-md px-2 py-1.5 text-sm"
                    />
                    <div className="flex gap-1">
                      {SELECT_COLOURS.slice(0, 4).map((c) => (
                        <button
                          key={c}
                          onClick={() => setOptions((cur) => cur.map((x, j) => (j === i ? { ...x, colour: c } : x)))}
                          className={`size-5 rounded ${o.colour === c ? "ring-2 ring-foreground/40" : ""}`}
                          style={{ background: c }}
                          aria-label={c}
                        />
                      ))}
                    </div>
                    <button onClick={() => setOptions((cur) => cur.filter((_, j) => j !== i))} className="p-1 text-muted-foreground hover:text-destructive"><Trash2 size={13} /></button>
                  </div>
                ))}
                <button onClick={() => setOptions((cur) => [...cur, { label: "", colour: SELECT_COLOURS[cur.length % SELECT_COLOURS.length] }])} className="text-xs text-brand hover:underline inline-flex items-center gap-1">
                  <Plus size={12} /> Add choice
                </button>
              </div>
            )}

            <button onClick={submit} disabled={busy || !name.trim()} className="btn-brand text-xs py-1.5 px-3 w-full disabled:opacity-50">
              <Plus size={13} /> Add field
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}

function PropertyRow({ property, onRename, onDelete }: { property: SquareProperty; onRename: (n: string) => void; onDelete: () => void }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(property.property_name);
  return (
    <li className="flex items-center gap-2 p-2 border border-border rounded-md bg-background/40">
      {editing ? (
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => { setEditing(false); if (name && name !== property.property_name) onRename(name); }}
          autoFocus
          className="flex-1 bg-background border border-border rounded px-2 py-1 text-sm"
        />
      ) : (
        <button onClick={() => setEditing(true)} className="flex-1 text-left text-sm">{property.property_name}</button>
      )}
      <span className="mono text-[10px] uppercase text-muted-foreground">{PROPERTY_TYPE_LABELS[property.property_type]}</span>
      <button onClick={onDelete} className="p-1 text-muted-foreground hover:text-destructive"><Trash2 size={13} /></button>
    </li>
  );
}