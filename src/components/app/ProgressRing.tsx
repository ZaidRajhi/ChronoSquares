/**
 * Animated circular progress ring used by Goals (cards + detail view).
 * Pure SVG, theme-aware via CSS vars.
 */
export function ProgressRing({ value, size = 80, stroke = 6 }: { value: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, Math.max(0, value)) / 100) * c;
  return (
    <svg width={size} height={size} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--muted)" strokeWidth={stroke} fill="none" opacity={0.4} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="var(--brand)"
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 400ms ease", transform: `rotate(-90deg)`, transformOrigin: "center" }}
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-foreground"
        style={{ fontSize: size * 0.26, fontWeight: 600 }}
      >
        {Math.round(value)}%
      </text>
    </svg>
  );
}