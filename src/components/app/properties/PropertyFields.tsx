import type { SquareProperty } from "./types";

interface Props {
  properties: SquareProperty[];
  values: Record<string, string>;
  onChange: (propertyId: string, value: string) => void;
}

/**
 * Renders editable inputs for each custom property of a single record.
 * Multi-select stores comma-separated values for simplicity.
 */
export function PropertyFields({ properties, values, onChange }: Props) {
  if (properties.length === 0) return null;
  return (
    <div className="space-y-3">
      {properties.map((p) => {
        const v = values[p.id] ?? "";
        return (
          <div key={p.id}>
            <label className="mono text-[10px] uppercase text-muted-foreground mb-1 block">{p.property_name}</label>
            {p.property_type === "text" && (
              <input value={v} onChange={(e) => onChange(p.id, e.target.value)} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" />
            )}
            {p.property_type === "number" && (
              <input type="number" value={v} onChange={(e) => onChange(p.id, e.target.value)} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" />
            )}
            {p.property_type === "date" && (
              <input type="date" value={v} onChange={(e) => onChange(p.id, e.target.value)} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" />
            )}
            {p.property_type === "url" && (
              <input type="url" value={v} onChange={(e) => onChange(p.id, e.target.value)} placeholder="https://…" className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" />
            )}
            {p.property_type === "checkbox" && (
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" checked={v === "true"} onChange={(e) => onChange(p.id, e.target.checked ? "true" : "false")} className="accent-brand size-4" />
                <span className="text-muted-foreground">Yes</span>
              </label>
            )}
            {p.property_type === "select" && (
              <div className="flex flex-wrap gap-1.5">
                {p.options.map((o) => {
                  const active = v === o.label;
                  return (
                    <button
                      key={o.label}
                      onClick={() => onChange(p.id, active ? "" : o.label)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${active ? "text-foreground border-foreground/40" : "text-muted-foreground border-border hover:border-foreground/30"}`}
                      style={active && o.colour ? { background: `${o.colour}30`, borderColor: o.colour, color: o.colour } : undefined}
                    >
                      {o.label}
                    </button>
                  );
                })}
              </div>
            )}
            {p.property_type === "multi_select" && (
              <div className="flex flex-wrap gap-1.5">
                {p.options.map((o) => {
                  const arr = v ? v.split(",") : [];
                  const active = arr.includes(o.label);
                  return (
                    <button
                      key={o.label}
                      onClick={() => {
                        const next = active ? arr.filter((x) => x !== o.label) : [...arr, o.label];
                        onChange(p.id, next.join(","));
                      }}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${active ? "text-foreground border-foreground/40" : "text-muted-foreground border-border hover:border-foreground/30"}`}
                      style={active && o.colour ? { background: `${o.colour}30`, borderColor: o.colour, color: o.colour } : undefined}
                    >
                      {o.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}