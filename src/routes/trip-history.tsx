import { createFileRoute } from "@tanstack/react-router";
import { Download } from "lucide-react";

import { DataSourceBadge, PageHeader } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DEMO_TRIPS } from "@/lib/simulation";

export const Route = createFileRoute("/trip-history")({
  component: TripHistory,
  head: () => ({
    meta: [
      { title: "Trip History — Predictive EMS" },
      {
        name: "description",
        content:
          "Completed simulation runs with route, scenario, strategy and energy outputs, exportable as CSV. Current records are clearly labelled demo data.",
      },
      { property: "og:title", content: "Trip History — Predictive EMS" },
      { property: "og:description", content: "Simulation run history with CSV export (demo records)." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function exportCsv() {
  const header = "run_id,route,scenario,distance_km,energy_kwh_per_km,strategy,peak_battery_kw,data_label";
  const rows = DEMO_TRIPS.map((t) =>
    [t.id, t.route, t.scenario, t.distanceKm, t.energyKwhPerKm, t.strategy, t.peakBatteryKw, "Demo/simulated"].join(","),
  );
  const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "predictive-ems-demo-trips.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function TripHistory() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Trip History"
        phase="Phase 1 — demo records"
        description="Completed simulation runs with their route, driving scenario, prediction results, energy-management strategy and outputs. Records shown here are sample demo runs; persistent storage and real run capture arrive with the backend phases. No credentials or secrets are ever stored in trip records."
        actions={
          <Button onClick={exportCsv} variant="outline" className="border-border bg-card hover:bg-accent">
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        }
      />

      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="font-display text-base">Simulation runs</CardTitle>
            <DataSourceBadge kind="demo" label="Demo records" />
          </div>
          <CardDescription>Three sample runs of the same demo route under different strategies.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                  <th className="pb-2 font-medium">Run</th>
                  <th className="pb-2 font-medium">Scenario</th>
                  <th className="pb-2 text-right font-medium">Distance</th>
                  <th className="pb-2 text-right font-medium">Energy</th>
                  <th className="pb-2 text-right font-medium">Peak battery</th>
                  <th className="pb-2 text-right font-medium">Strategy</th>
                  <th className="pb-2 text-right font-medium">Model version</th>
                </tr>
              </thead>
              <tbody>
                {DEMO_TRIPS.map((t) => (
                  <tr key={t.id} className="border-b border-border/50 last:border-0">
                    <td className="py-2.5 font-mono text-xs text-muted-foreground">{t.id}</td>
                    <td className="py-2.5 font-medium text-foreground">{t.scenario}</td>
                    <td className="py-2.5 text-right tabular-nums text-foreground">{t.distanceKm.toFixed(1)} km</td>
                    <td className="py-2.5 text-right tabular-nums text-foreground">{t.energyKwhPerKm.toFixed(3)} kWh/km</td>
                    <td className="py-2.5 text-right tabular-nums text-foreground">{t.peakBatteryKw.toFixed(1)} kW</td>
                    <td className="py-2.5 text-right text-foreground">{t.strategy}</td>
                    <td className="py-2.5 text-right text-xs text-muted-foreground">demo-heuristic v0.1</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Prediction results and evaluation status columns will populate once trained-model runs are recorded.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
