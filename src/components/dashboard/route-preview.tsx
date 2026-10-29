import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DEMO_HIGH_LOAD_THRESHOLD_KW, DEMO_INTERSECTIONS, DEMO_ROUTE } from "@/lib/simulation";

/**
 * Phase 1 route preview: a stylised schematic of the demo route. Google Maps
 * integration is a later phase — this panel must never look like live map data.
 */
export function RoutePreviewCard() {
  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="font-display text-base">Route preview</CardTitle>
          <span className="rounded-md border border-border bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Demo schematic — Google Maps in Phase 2
          </span>
        </div>
        <CardDescription>
          {DEMO_ROUTE.name} · {DEMO_ROUTE.lengthKm} km · {DEMO_ROUTE.origin} → {DEMO_ROUTE.destination}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative overflow-hidden rounded-lg border border-border bg-background/60">
          <svg viewBox="0 0 600 220" className="h-44 w-full md:h-52" role="img" aria-label="Schematic preview of the demo route">
            <defs>
              <linearGradient id="routeGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="var(--color-primary)" />
                <stop offset="100%" stopColor="var(--color-glow)" />
              </linearGradient>
            </defs>
            {/* faint grid */}
            {Array.from({ length: 11 }, (_, i) => (
              <line key={`v${i}`} x1={i * 60} y1={0} x2={i * 60} y2={220} stroke="var(--color-border)" strokeOpacity={0.35} />
            ))}
            {Array.from({ length: 5 }, (_, i) => (
              <line key={`h${i}`} x1={0} y1={i * 55} x2={600} y2={i * 55} stroke="var(--color-border)" strokeOpacity={0.35} />
            ))}
            {/* route polyline */}
            <path
              d="M 30 180 C 110 170, 140 120, 205 118 S 320 150, 375 110 S 480 60, 570 45"
              fill="none"
              stroke="url(#routeGrad)"
              strokeWidth={5}
              strokeLinecap="round"
            />
            {/* intersections */}
            {DEMO_INTERSECTIONS.map((ix) => {
              const pts: [number, number][] = [
                [110, 168],
                [230, 121],
                [360, 122],
                [500, 62],
              ];
              const [x, y] = pts[Number(ix.id.split("-")[1]) - 1] ?? [0, 0];
              return (
                <g key={ix.id}>
                  <circle cx={x} cy={y} r={7} fill="var(--color-background)" stroke="var(--color-warning)" strokeWidth={2} />
                  <text x={x} y={y - 13} textAnchor="middle" fontSize={9} fill="var(--color-muted-foreground)">
                    {ix.name}
                  </text>
                </g>
              );
            })}
            {/* current simulated vehicle position */}
            <g>
              <circle cx={78} cy={176} r={11} fill="var(--color-primary)" fillOpacity={0.25} />
              <circle cx={78} cy={176} r={5.5} fill="var(--color-primary)" stroke="var(--color-foreground)" strokeWidth={1.5} />
              <text x={78} y={200} textAnchor="middle" fontSize={9} fill="var(--color-muted-foreground)">
                Simulated position
              </text>
            </g>
            {/* destination */}
            <circle cx={570} cy={45} r={6} fill="var(--color-success)" />
            <text x={570} y={32} textAnchor="middle" fontSize={9} fill="var(--color-muted-foreground)">
              Destination
            </text>
          </svg>
        </div>
        <p className="mt-3 text-[11px] leading-snug text-muted-foreground">
          Schematic only — not map imagery. Intersections are demo fixtures with simulated stopping-likelihood values.
          Distance remaining and journey energy are simulated from the software drive cycle.
        </p>
      </CardContent>
    </Card>
  );
}

/** Horizontal 60-second predicted high-load window timeline. */
export function HighLoadTimeline({
  forecast,
}: {
  forecast: { tSec: number; predictedKw: number; probability: number }[];
}) {
  const windows: { start: number; end: number; peakProbability: number }[] = [];
  let open: { start: number; end: number; peakProbability: number } | null = null;
  for (const f of forecast) {
    if (f.probability >= 0.5) {
      if (!open) open = { start: f.tSec - 2.5, end: f.tSec + 2.5, peakProbability: f.probability };
      else {
        open.end = f.tSec + 2.5;
        open.peakProbability = Math.max(open.peakProbability, f.probability);
      }
    } else if (open) {
      windows.push(open);
      open = null;
    }
  }
  if (open) windows.push(open);

  return (
    <div className="space-y-3">
      <div className="relative h-14 overflow-hidden rounded-lg border border-border bg-background/60">
        <div className="absolute inset-0 flex">
          {forecast.map((f) => (
            <div
              key={f.tSec}
              className="flex-1 border-r border-border/50"
              style={{
                background:
                  f.probability >= 0.5
                    ? "color-mix(in oklab, var(--color-critical) 28%, transparent)"
                    : f.probability >= 0.3
                      ? "color-mix(in oklab, var(--color-warning) 16%, transparent)"
                      : "transparent",
              }}
            />
          ))}
        </div>
        <div className="relative flex h-full items-center justify-between px-3 text-[10px] text-muted-foreground">
          <span>Now (simulated)</span>
          <span>+30 s</span>
          <span>+60 s</span>
        </div>
      </div>
      {windows.length === 0 ? (
        <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          No predicted high-load window in the next 60 s (demo heuristic, threshold {DEMO_HIGH_LOAD_THRESHOLD_KW} kW).
        </p>
      ) : (
        <ul className="space-y-1.5">
          {windows.map((w) => (
            <li key={w.start} className="flex items-center justify-between rounded-md border border-critical/30 bg-critical/10 px-3 py-2 text-xs">
              <span className="text-foreground">
                Predicted high-load window · +{w.start} s → +{w.end} s
              </span>
              <span className="font-medium text-critical">{Math.round(w.peakProbability * 100)}% probability</span>
            </li>
          ))}
        </ul>
      )}
      <p className="text-[11px] leading-snug text-muted-foreground">
        Predicted values from the Phase 1 demo heuristic, not a trained model. A 60-second horizon will not identify
        every event; uncertainty is shown until a validated model is connected.
      </p>
    </div>
  );
}
