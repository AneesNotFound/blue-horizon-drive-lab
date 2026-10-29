import { createFileRoute } from "@tanstack/react-router";

import { DataSourceBadge, PageHeader } from "@/components/page-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { DEMO_INTERSECTIONS, DEMO_ROUTE } from "@/lib/simulation";
import { useSimulatedTelemetry } from "@/hooks/use-simulated-telemetry";

export const Route = createFileRoute("/traffic-analysis")({
  component: TrafficAnalysis,
  head: () => ({
    meta: [
      { title: "Traffic & Intersection Analysis — Predictive EMS" },
      {
        name: "description",
        content:
          "Mapped intersections along the demo route with simulated stopping likelihood. Live signal phases are unavailable; an explicitly labelled simulated signal mode is provided.",
      },
      { property: "og:title", content: "Traffic & Intersection Analysis — Predictive EMS" },
      { property: "og:description", content: "Demo intersections with simulated stopping likelihood." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const SIGNAL_COLOURS: Record<string, string> = {
  Red: "text-critical",
  Amber: "text-warning",
  Green: "text-success",
};

function TrafficAnalysis() {
  const { latest } = useSimulatedTelemetry();
  const [simulatedSignals, setSimulatedSignals] = useState(false);
  const avgSpeedKph = Math.max(latest.speedKph, 18);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Traffic & Intersection Analysis"
        phase="Phase 1 — demo fixtures"
        description="Intersections along the selected demo route, with stopping-likelihood estimates derived from simulated driving data. Standard map APIs do not expose live traffic-signal phases, so real signal state is always shown as Unavailable; the optional simulated-signal mode is clearly labelled and exists only for testing."
      />

      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="font-display text-base">Simulated traffic-signal mode</CardTitle>
              <CardDescription>
                Generates configurable demo red/amber/green phases for testing. Never to be confused with a real signal.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{simulatedSignals ? "On (simulated)" : "Off"}</span>
              <Switch checked={simulatedSignals} onCheckedChange={setSimulatedSignals} aria-label="Toggle simulated traffic signals" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                  <th className="pb-2 font-medium">Intersection</th>
                  <th className="pb-2 font-medium">Type</th>
                  <th className="pb-2 text-right font-medium">Distance ahead</th>
                  <th className="pb-2 text-right font-medium">ETA (simulated)</th>
                  <th className="pb-2 text-right font-medium">Stopping likelihood</th>
                  <th className="pb-2 text-right font-medium">Signal state</th>
                </tr>
              </thead>
              <tbody>
                {DEMO_INTERSECTIONS.map((ix, i) => {
                  const etaMin = (ix.distanceKm / avgSpeedKph) * 60;
                  const simPhase = ["Green", "Amber", "Red", "Red", "Green"][Math.floor(latest.t / 8 + i * 3) % 5];
                  return (
                    <tr key={ix.id} className="border-b border-border/50 last:border-0">
                      <td className="py-2.5 font-medium text-foreground">{ix.name}</td>
                      <td className="py-2.5 text-muted-foreground">{ix.type}</td>
                      <td className="py-2.5 text-right tabular-nums text-foreground">{ix.distanceKm.toFixed(1)} km</td>
                      <td className="py-2.5 text-right tabular-nums text-muted-foreground">~{etaMin.toFixed(0)} min</td>
                      <td className="py-2.5 text-right">
                        <span className="tabular-nums text-foreground">{Math.round(ix.stoppingLikelihood * 100)}%</span>{" "}
                        <span className="ml-1 text-[10px] uppercase text-muted-foreground">simulated</span>
                      </td>
                      <td className="py-2.5 text-right">
                        {simulatedSignals ? (
                          <span className={`font-medium ${SIGNAL_COLOURS[simPhase]}`}>
                            {simPhase}
                            <span className="ml-1.5 text-[10px] uppercase text-muted-foreground">simulated</span>
                          </span>
                        ) : (
                          <Badge variant="outline" className="border-border bg-muted text-muted-foreground">
                            Unavailable
                          </Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card className="border-border bg-card xl:col-span-6">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="font-display text-base">Upcoming stop-and-go timeline</CardTitle>
              <DataSourceBadge kind="predicted" />
            </div>
            <CardDescription>Predicted slowing or stopping events and their expected demand effect.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {DEMO_INTERSECTIONS.slice(0, 3).map((ix) => (
              <div key={ix.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-background/40 px-3 py-2">
                <span className="text-foreground">{ix.name}</span>
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{ix.distanceKm.toFixed(1)} km ahead</span>
                  <span className="text-warning">P(stop) {Math.round(ix.stoppingLikelihood * 100)}%</span>
                  <span>{ix.stoppingLikelihood > 0.5 ? "Demand dip + regen recovery likely" : "Minor slowdown likely"}</span>
                </span>
              </div>
            ))}
            <p className="pt-1 text-[11px] text-muted-foreground">
              Stopping likelihood combines simulated driving history and demo intersection fixtures; real traffic
              conditions are not used in Phase 1.
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card xl:col-span-6">
          <CardHeader>
            <CardTitle className="font-display text-base">What live data will add (Phase 2+)</CardTitle>
            <CardDescription>Only from sources whose terms permit it.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• Google Maps traffic-aware routing and congestion levels along {DEMO_ROUTE.name}.</p>
            <p>• Mapped intersections and road geometry from real route data.</p>
            <p>• Historical traffic patterns per segment and time of day.</p>
            <p>• Signal-state labelling: any phase not supplied by a legitimate data source stays marked Unavailable.</p>
            <p>• Impact of real stop-and-go events on the prediction feature set.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
