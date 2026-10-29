import { createFileRoute } from "@tanstack/react-router";

import { ContributionChart, DemandForecastChart, PowerHistoryChart } from "@/components/dashboard/charts";
import { MetricCard } from "@/components/dashboard/metric-card";
import { RecentTripsCard, StrategyComparisonCard } from "@/components/dashboard/panels";
import { HighLoadTimeline, RoutePreviewCard } from "@/components/dashboard/route-preview";
import { PageHeader } from "@/components/page-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSimulatedForecast, useSimulatedTelemetry } from "@/hooks/use-simulated-telemetry";
import {
  DEMO_HIGH_LOAD_THRESHOLD_KW,
  supercapStoredEnergyKwh,
} from "@/lib/simulation";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Overview Dashboard — Predictive EMS" },
      {
        name: "description",
        content:
          "Live simulated overview of the hybrid battery–supercapacitor EV: power demand, high-load prediction and energy strategy comparison.",
      },
      { property: "og:title", content: "Overview Dashboard — Predictive EMS" },
      {
        property: "og:description",
        content: "Simulated overview dashboard for the hybrid EV energy management system.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function Index() {
  const { latest, history } = useSimulatedTelemetry();
  const forecast = useSimulatedForecast(latest);
  const nextPredictedKw = forecast[2]?.predictedKw ?? latest.powerKw;
  const supercapEnergyKwh = supercapStoredEnergyKwh(latest.supercapSocPct);
  const probPct = Math.round(latest.highLoadProbability * 100);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Overview Dashboard"
        phase="Phase 1 — active"
        description="Live view of the software-simulated hybrid battery–supercapacitor vehicle. Every value is labelled with its source; nothing here is real vehicle telemetry and no trained model is connected yet."
      />

      {/* Metric strip */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
        <MetricCard
          label="Vehicle speed"
          value={latest.speedKph.toFixed(1)}
          unit="km/h"
          source="simulated"
          hint="From the demo drive cycle"
        />
        <MetricCard
          label="Battery SOC"
          value={latest.batterySocPct.toFixed(1)}
          unit="%"
          source="simulated"
          tone={latest.batterySocPct < 25 ? "critical" : "primary"}
        />
        <MetricCard
          label="Battery SOH"
          value={latest.batterySohPct.toFixed(1)}
          unit="%"
          source="simulated"
          sourceLabel="Modelled"
          hint="Modelled health, not measured"
        />
        <MetricCard
          label="Supercapacitor SOC"
          value={latest.supercapSocPct.toFixed(0)}
          unit="%"
          source="simulated"
          tone="glow"
        />
        <MetricCard
          label="Current power demand"
          value={latest.powerKw.toFixed(1)}
          unit="kW"
          source="simulated"
          tone={latest.powerKw > DEMO_HIGH_LOAD_THRESHOLD_KW ? "critical" : "default"}
        />
        <MetricCard
          label="Power demand +15 s"
          value={nextPredictedKw.toFixed(1)}
          unit="kW"
          source="predicted"
          tone={nextPredictedKw > DEMO_HIGH_LOAD_THRESHOLD_KW ? "warning" : "default"}
        />
        <MetricCard
          label="High-load risk (60 s)"
          value={`${probPct}%`}
          source="predicted"
          tone={probPct >= 50 ? "critical" : probPct >= 30 ? "warning" : "success"}
          hint="Demo heuristic — not a trained model"
        />
        <MetricCard
          label="Distance remaining"
          value={latest.distanceKm.toFixed(2)}
          unit="km"
          source="simulated"
          sourceLabel="Demo route"
        />
        <MetricCard
          label="Journey energy"
          value={latest.energyKwhPerKm.toFixed(3)}
          unit="kWh/km"
          source="simulated"
        />
        <MetricCard
          label="Recommended mode"
          value={latest.recommendedMode}
          source="simulated"
          tone={latest.recommendedMode === "Regenerative Energy Recovery" ? "success" : "primary"}
          hint="Rule-based demo decision engine"
        />
        <MetricCard
          label="Model confidence"
          value="—"
          source="demo"
          hint="No calibrated model — confidence unavailable"
        />
        <MetricCard
          label="Prediction status"
          value="Demo heuristic"
          source="demo"
          hint="Real backend arrives in a later phase"
          tone="warning"
        />
      </div>

      {/* Row: route preview, forecast, timeline */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-5">
          <RoutePreviewCard />
        </div>
        <Card className="border-border bg-card xl:col-span-4">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="font-display text-base">Future power demand (60 s)</CardTitle>
              <span className="rounded-md border border-warning/40 bg-warning/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-warning">
                Predicted
              </span>
            </div>
            <CardDescription>
              Forward projection from the demo heuristic. The dashed line is the 60-second high-load probability.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DemandForecastChart forecast={forecast} thresholdKw={DEMO_HIGH_LOAD_THRESHOLD_KW} />
          </CardContent>
        </Card>
        <Card className="border-border bg-card xl:col-span-3">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="font-display text-base">High-load timeline</CardTitle>
              <span className="rounded-md border border-warning/40 bg-warning/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-warning">
                Predicted
              </span>
            </div>
            <CardDescription>Next 60 seconds, coloured by predicted probability.</CardDescription>
          </CardHeader>
          <CardContent>
            <HighLoadTimeline forecast={forecast} />
          </CardContent>
        </Card>
      </div>

      {/* Row: live charts and trips */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card className="border-border bg-card xl:col-span-4">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="font-display text-base">Traction power (last 60 s)</CardTitle>
              <span className="rounded-md border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary">
                Simulated
              </span>
            </div>
            <CardDescription>Vehicle power model output — rolling, aero, gradient-free demo cycle.</CardDescription>
          </CardHeader>
          <CardContent>
            <PowerHistoryChart history={history} />
          </CardContent>
        </Card>
        <Card className="border-border bg-card xl:col-span-4">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="font-display text-base">Battery vs supercapacitor contribution</CardTitle>
              <span className="rounded-md border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary">
                Simulated
              </span>
            </div>
            <CardDescription>Stacked positive power split over the last 60 seconds.</CardDescription>
          </CardHeader>
          <CardContent>
            <ContributionChart history={history} />
          </CardContent>
        </Card>
        <div className="xl:col-span-4">
          <RecentTripsCard />
        </div>
      </div>

      {/* Row: strategy comparison + decision panel */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <StrategyComparisonCard latest={latest} />
        </div>
        <Card className="border-border bg-card xl:col-span-5">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="font-display text-base">Current decision</CardTitle>
              <span className="rounded-md border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary">
                Simulated
              </span>
            </div>
            <CardDescription>Recommendation from the transparent demo rule set.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="rounded-lg border border-primary/40 bg-primary/10 px-3 py-2.5">
              <p className="font-medium text-foreground">{latest.recommendedMode}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {latest.powerKw < -0.5
                  ? "Decelerating — regenerative braking recovers energy and recharges the supercapacitor."
                  : latest.powerKw > DEMO_HIGH_LOAD_THRESHOLD_KW && supercapEnergyKwh > 0.002
                    ? "Demand exceeds the demo threshold and the supercapacitor has usable energy, so assistance is active."
                    : "Demand is within the battery's comfortable envelope — supercapacitor assistance is not beneficial."}
              </p>
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              <dt className="text-muted-foreground">Battery contribution</dt>
              <dd className="text-right tabular-nums text-foreground">{Math.max(latest.batteryKw, 0).toFixed(1)} kW</dd>
              <dt className="text-muted-foreground">Supercapacitor contribution</dt>
              <dd className="text-right tabular-nums text-glow">{Math.max(latest.supercapKw, 0).toFixed(1)} kW</dd>
              <dt className="text-muted-foreground">Supercapacitor energy available</dt>
              <dd className="text-right tabular-nums text-foreground">{supercapEnergyKwh.toFixed(4)} kWh</dd>
              <dt className="text-muted-foreground">Demo high-load threshold</dt>
              <dd className="text-right tabular-nums text-foreground">{DEMO_HIGH_LOAD_THRESHOLD_KW} kW</dd>
            </dl>
          </CardContent>
        </Card>
      </div>

      <p className="rounded-lg border border-border bg-card px-4 py-3 text-xs leading-relaxed text-muted-foreground">
        <span className="font-medium text-foreground">Data sources on this page:</span> all speed, power, SOC, SOH,
        distance and strategy values are <span className="text-primary">simulated</span> by the software drive cycle;
        the +15 s demand, high-load probability and timeline are <span className="text-warning">predicted</span> by the
        Phase 1 demo heuristic; route fixtures and trip records are <span className="text-muted-foreground">demo</span>{" "}
        data. No Google Maps, traffic, or trained-model data is in use yet.
      </p>
    </div>
  );
}
