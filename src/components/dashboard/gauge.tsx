/** Semicircular probability gauge (demo heuristic values, 0–1). */
export function ProbabilityGauge({
  value,
  caption,
}: {
  value: number; // 0..1
  caption?: string;
}) {
  const pct = Math.max(0, Math.min(100, Math.round(value * 100)));
  const r = 78;
  const cx = 100;
  const cy = 100;
  const arc = (from: number, to: number) => {
    const a0 = Math.PI * (1 - from / 100);
    const a1 = Math.PI * (1 - to / 100);
    const x0 = cx + r * Math.cos(a0);
    const y0 = cy - r * Math.sin(a0);
    const x1 = cx + r * Math.cos(a1);
    const y1 = cy - r * Math.sin(a1);
    const large = Math.abs(to - from) > 50 ? 1 : 0;
    return `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`;
  };
  const color =
    pct >= 50 ? "var(--color-critical)" : pct >= 30 ? "var(--color-warning)" : "var(--color-success)";

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 112" className="w-56 max-w-full" role="img" aria-label={`High-load probability gauge: ${pct} percent`}>
        <path d={arc(0, 100)} fill="none" stroke="var(--color-border)" strokeWidth={14} strokeLinecap="round" />
        {pct > 1 ? <path d={arc(0, pct)} fill="none" stroke={color} strokeWidth={14} strokeLinecap="round" /> : null}
        <text x={cx} y={82} textAnchor="middle" fontSize={30} fontWeight={700} fill="var(--color-foreground)">
          {pct}%
        </text>
        <text x={cx} y={100} textAnchor="middle" fontSize={10} fill="var(--color-muted-foreground)">
          high-load probability
        </text>
      </svg>
      {caption ? <p className="mt-1 text-center text-xs text-muted-foreground">{caption}</p> : null}
    </div>
  );
}
