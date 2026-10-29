import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataSourceBadge } from "@/components/page-shell";
import { DEMO_TRIPS, strategyComparison, type TelemetryPoint } from "@/lib/simulation";

export function StrategyComparisonCard({ latest }: { latest: TelemetryPoint }) {
  const { batteryOnly, hybrid } = strategyComparison(latest);
  const rows: { label: string; batteryOnly: string; hybrid: string }[] = [
    { label: "Peak battery power", batteryOnly: `${batteryOnly.peakBatteryPowerKw.toFixed(1)} kW`, hybrid: `${hybrid.peakBatteryPowerKw.toFixed(1)} kW` },
    { label: "SOC used (last 60 s)", batteryOnly: `${batteryOnly.socUsedLast60sPct.toFixed(2)} %`, hybrid: `${hybrid.socUsedLast60sPct.toFixed(2)} %` },
    { label: "Energy consumption", batteryOnly: `${batteryOnly.energyKwhPerKm.toFixed(3)} kWh/km`, hybrid: `${hybrid.energyKwhPerKm.toFixed(3)} kWh/km` },
    { label: "Battery-stress index (modelled)", batteryOnly: batteryOnly.stressIndex.toFixed(2), hybrid: hybrid.stressIndex.toFixed(2) },
  ];

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="font-display text-base">Battery-only vs hybrid strategy</CardTitle>
          <DataSourceBadge kind="simulated" />
        </div>
        <CardDescription>
          Same simulated drive cycle applied to both strategies. The battery-stress index is a modelled indicator, not
          measured battery-life extension.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              <th className="pb-2 font-medium">Metric</th>
              <th className="pb-2 text-right font-medium">Battery-only</th>
              <th className="pb-2 text-right font-medium">Hybrid (simulated)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-b border-border/50 last:border-0">
                <td className="py-2 text-muted-foreground">{r.label}</td>
                <td className="py-2 text-right tabular-nums text-foreground">{r.batteryOnly}</td>
                <td className="py-2 text-right tabular-nums text-glow">{r.hybrid}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

export function RecentTripsCard() {
  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="font-display text-base">Recent trip summary</CardTitle>
          <DataSourceBadge kind="demo" label="Demo records" />
        </div>
        <CardDescription>Sample simulation runs — not real journeys. Full history on the Trip History page.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {DEMO_TRIPS.map((trip) => (
          <div key={trip.id} className="rounded-lg border border-border bg-background/40 px-3 py-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-medium text-foreground">{trip.scenario}</span>
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{trip.strategy}</span>
            </div>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
              <span>{trip.distanceKm.toFixed(1)} km</span>
              <span>{trip.energyKwhPerKm.toFixed(3)} kWh/km</span>
              <span>Peak battery {trip.peakBatteryKw.toFixed(1)} kW</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
