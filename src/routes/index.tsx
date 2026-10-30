import { createFileRoute } from "@tanstack/react-router";

import {
  ContributionChart,
  DemandForecastChart,
  PowerHistoryChart,
  SocHistoryChart,
  SpeedHistoryChart,
} from "@/components/dashboard/charts";
import { MetricCard } from "@/components/dashboard/metric-card";
import { RecentTripsCard, StrategyComparisonCard } from "@/components/dashboard/panels";
import { HighLoadTimeline, RoutePreviewCard } from "@/components/dashboard/route-preview";
import { PageHeader } from "@/components/page-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppData } from "@/hooks/app-state";
import { supercapStoredEnergyKwh } from "@/lib/simulation";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Overview Dashboard — Predictive EMS" },
      {
        name: "description",
        content:
          "Live simulated overview of the Blue Horizon EV: speed, SOC, power demand, 60-second high-load prediction and energy strategy comparison — all labelled demo data.",
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

const badge =
  "rounded-md border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide";

function Index() {
  const { latest, history, forecast, settings, params } = useAppData();
  const thresholdKw = settings.highLoadThresholdKw;
  const probPct = Math.round(latest.highLoadProbability * 100);
  const next15 = forecast.points.find((p) => p.tSec >= 15) ?? forecast.points[forecast.points.length - 1];
  const supercapEnergyKwh = supercapStoredEnergyKwh(latest.supercapSocPct, params.profile);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Overview Dashboard"
        phase="Demo mode — active"
        description="Live view of the software-simulated Blue Horizon EV. Every value is labelled with its source; nothing here is real vehicle telemetry and no trained model is connected."
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
          value={latest.batterySohPct.toFixed(0)}
          unit="%"
          source="simulated"
          sourceLabel="Modelled"
          hint="Assumed simulation parameter"
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
          tone={latest.powerKw > thresholdKw ? "critical" : "default"}
        />
        <MetricCard
          label="Power demand +15 s"
          value={(next15?.predictedKw ?? latest.powerKw).toFixed(1)}
          unit="kW"
          source="predicted"
          tone={(next15?.predictedKw ?? 0) > thresholdKw ? "warning" : "default"}
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
          value={latest.distanceRemainingKm.toFixed(2)}
          unit="km"
          source="simulated"
          sourceLabel="Demo route"
        />
        <MetricCard
          label="Estimated remaining energy"
          value={latest.remainingEnergyKwh.toFixed(1)}
          unit="kWh"
          source="simulated"
          hint="Capacity × battery SOC"
        />
        <MetricCard
          label="Recommended mode"
          value={latest.recommendedMode}
          source="simulated"
          tone={latest.recommendedMode === "Regenerative Energy Recovery" ? "success" : "primary"}
          hint="Rule-based demo decision engine"
        />
        <MetricCard
          label="Prediction status"
          value={latest.predictionStatus}
          source="predicted"
          hint={latest.eventEtaSec !== null ? `Event expected at +${latest.eventEtaSec} s` : "Below 50% probability"}
          tone={latest.predictionStatus === "High-load event predicted" ? "warning" : "default"}
        />
        <MetricCard
          label="Model confidence"
          value="—"
          source="demo"
          hint="No calibrated model — confidence unavailable"
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
              <CardTitle className="font-display text-base">Predicted power demand (next 60 s)</CardTitle>
              <span className={`${badge} border-warning/40 bg-warning/10 text-warning`}>Predicted</span>
            </div>
            <CardDescription>
              Forward projection from the demo heuristic. The dashed line is the high-load probability.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DemandForecastChart forecast={forecast.points} thresholdKw={thresholdKw} />
          </CardContent>
        </Card>
        <Card className="border-border bg-card xl:col-span-3">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="font-display text-base">High-load timeline</CardTitle>
              <span className={`${badge} border-warning/40 bg-warning/10 text-warning`}>Predicted</span>
            </div>
            <CardDescription>Next {settings.predictionHorizonSec} seconds, coloured by predicted probability.</CardDescription>
          </CardHeader>
          <CardContent>
            <HighLoadTimeline forecast={forecast.points} />
          </CardContent>
        </Card>
      </div>

      {/* Row: live charts */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card className="border-border bg-card xl:col-span-4">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="font-display text-base">Vehicle speed (last 60 s)</CardTitle>
              <span className={`${badge} border-primary/40 bg-primary/10 text-primary`}>Simulated</span>
            </div>
            <CardDescription>Speed trace from the shared demo drive cycle.</CardDescription>
          </CardHeader>
          <CardContent>
            <SpeedHistoryChart history={history} />
          </CardContent>
        </Card>
        <Card className="border-border bg-card xl:col-span-4">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="font-display text-base">Battery &amp; supercapacitor SOC</CardTitle>
              <span className={`${badge} border-primary/40 bg-primary/10 text-primary`}>Simulated</span>
            </div>
            <CardDescription>SOC history for both storage systems over the last 60 seconds.</CardDescription>
          </CardHeader>
          <CardContent>
            <SocHistoryChart history={history} />
          </CardContent>
        </Card>
        <Card className="border-border bg-card xl:col-span-4">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="font-display text-base">Traction power (last 60 s)</CardTitle>
              <span className={`${badge} border-primary/40 bg-primary/10 text-primary`}>Simulated</span>
            </div>
            <CardDescription>Vehicle power model output — rolling, aero, gradient and acceleration terms.</CardDescription>
          </CardHeader>
          <CardContent>
            <PowerHistoryChart history={history} />
          </CardContent>
        </Card>
      </div>

      {/* Row: contribution, trips, strategy */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card className="border-border bg-card xl:col-span-4">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="font-display text-base">Battery vs supercapacitor contribution</CardTitle>
              <span className={`${badge} border-primary/40 bg-primary/10 text-primary`}>Simulated</span>
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
        <div className="xl:col-span-4">
          <StrategyComparisonCard latest={latest} />
        </div>
      </div>

      {/* Decision panel */}
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="font-display text-base">Current decision</CardTitle>
            <span className={`${badge} border-primary/40 bg-primary/10 text-primary`}>Simulated</span>
          </div>
          <CardDescription>Recommendation from the transparent demo rule set.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="rounded-lg border border-primary/40 bg-primary/10 px-3 py-2.5">
            <p className="font-medium text-foreground">{latest.recommendedMode}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {latest.powerKw < -0.5
                ? "Decelerating — regenerative braking recovers energy and recharges the supercapacitor."
                : forecast.peakKw > thresholdKw && supercapEnergyKwh > 0.004
                  ? `A ${forecast.peakKw.toFixed(1)} kW peak is predicted at +${forecast.peakTSec} s; the supercapacitor is pre-positioned to keep the battery within its continuous limit.`
                  : "Demand is within the battery's comfortable envelope — supercapacitor assistance is not beneficial."}
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-4">
            <div>
              <dt className="text-xs text-muted-foreground">Battery contribution</dt>
              <dd className="tabular-nums text-foreground">{Math.max(latest.batteryKw, 0).toFixed(1)} kW</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Supercapacitor contribution</dt>
              <dd className="tabular-nums text-glow">{Math.max(latest.supercapKw, 0).toFixed(1)} kW</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Supercap energy available</dt>
              <dd className="tabular-nums text-foreground">{supercapEnergyKwh.toFixed(4)} kWh</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">High-load threshold</dt>
              <dd className="tabular-nums text-foreground">{thresholdKw} kW</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <p className="rounded-lg border border-border bg-card px-4 py-3 text-xs leading-relaxed text-muted-foreground">
        <span className="font-medium text-foreground">Data sources on this page:</span> all speed, power, SOC, SOH,
        distance and strategy values are <span className="text-primary">simulated</span> by the software drive cycle;
        the demand forecast, high-load probability and timeline are <span className="text-warning">predicted</span> by
        the demo heuristic; route fixtures and trip records are <span className="text-muted-foreground">demo</span>{" "}
        data. No Google Maps, traffic, or trained-model data is in use.
      </p>
    </div>
  );
}
