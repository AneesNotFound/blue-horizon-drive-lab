import { createFileRoute } from "@tanstack/react-router";
import { BrainCircuit, ShieldAlert } from "lucide-react";

import { DemandForecastChart } from "@/components/dashboard/charts";
import { MetricCard } from "@/components/dashboard/metric-card";
import { ProbabilityGauge } from "@/components/dashboard/gauge";
import { PageHeader } from "@/components/page-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppData } from "@/hooks/app-state";
import {
  DEMO_SEGMENTS,
  DEMO_VEHICLE,
  nextIntersectionAhead,
  supercapMaxAssistKw,
  supercapStoredEnergyKwh,
} from "@/lib/simulation";

export const Route = createFileRoute("/prediction-centre")({
  component: PredictionCentre,
  head: () => ({
    meta: [
      { title: "AI Prediction Centre — Predictive EMS" },
      {
        name: "description",
        content:
          "60-second high-load prediction for the Blue Horizon EV: inputs, result, demand graph, probability gauge and explanation from the labelled demo heuristic.",
      },
      { property: "og:title", content: "AI Prediction Centre — Predictive EMS" },
      { property: "og:description", content: "60-second high-load prediction overview (demo heuristic)." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function PredictionCentre() {
  const { latest, forecast, settings, params } = useAppData();
  const thresholdKw = settings.highLoadThresholdKw;
  const probPct = Math.round(forecast.probability * 100);
  const scEnergyKwh = supercapStoredEnergyKwh(latest.supercapSocPct, params.profile);
  const scMaxKw = supercapMaxAssistKw(latest.supercapSocPct, params.profile);
  const nextIx = nextIntersectionAhead(latest.distanceCoveredKm);
  const upcomingHill = DEMO_SEGMENTS.find(
    (s) => s.startKm >= latest.distanceCoveredKm % 12.4 && s.gradientPct > 2,
  );

  const inputs: { label: string; value: string; note: string }[] = [
    { label: "Current speed", value: `${latest.speedKph.toFixed(1)} km/h`, note: "Simulated" },
    { label: "Previous speed", value: `${latest.prevSpeedKph.toFixed(1)} km/h`, note: "Simulated" },
    { label: "Acceleration", value: `${latest.accelMs2.toFixed(2)} m/s²`, note: "Simulated" },
    { label: "Road gradient (current)", value: `${latest.gradientPct.toFixed(1)} %`, note: "Demo route segment" },
    {
      label: "Upcoming uphill",
      value: upcomingHill ? `${upcomingHill.name} (+${upcomingHill.gradientPct.toFixed(1)} %)` : "None within horizon",
      note: "Demo route segment",
    },
    { label: "Traffic density ahead", value: "Medium (demo)", note: "Synthetic traffic" },
    {
      label: "Distance to next intersection",
      value: nextIx ? `${nextIx.distanceAheadKm.toFixed(2)} km — ${nextIx.intersection.name}` : "—",
      note: "Demo fixture",
    },
    { label: "Battery SOC", value: `${latest.batterySocPct.toFixed(1)} %`, note: "Simulated" },
    { label: "Supercapacitor SOC", value: `${latest.supercapSocPct.toFixed(1)} %`, note: "Simulated" },
  ];

  const explanations = [
    `The demo drive cycle schedules an acceleration burst at +${forecast.etaSec ?? forecast.peakTSec} s: speed rises toward 72 km/h, and acceleration power (m·a·v) dominates demand.`,
    `The predicted peak of ${forecast.peakKw.toFixed(1)} kW exceeds the ${thresholdKw} kW high-load threshold, giving a ${probPct}% probability for the ${settings.predictionHorizonSec}-second horizon.`,
    `The battery's continuous limit is ${DEMO_VEHICLE.batteryContinuousPowerKw} kW, so roughly ${(Math.max(forecast.peakKw - DEMO_VEHICLE.batteryContinuousPowerKw, 0)).toFixed(1)} kW of the peak must be covered by the supercapacitor.`,
    `Supercapacitor availability was checked before recommending assistance: ${scEnergyKwh.toFixed(4)} kWh stored (½·C·V²), sustaining up to ${scMaxKw.toFixed(1)} kW for about 10 seconds.`,
    nextIx && nextIx.intersection.stoppingProbability > 0.5
      ? `A stop at ${nextIx.intersection.name} (${Math.round(nextIx.intersection.stoppingProbability * 100)}% simulated stopping probability) adds a further re-acceleration spike afterwards.`
      : "Traffic along the route is light enough that no additional stop-and-go spike is expected within the horizon.",
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="AI Prediction Centre"
        phase="Demo heuristic — rule-based"
        description={`Predicts whether a high-load event occurs within the next ${settings.predictionHorizonSec} seconds and estimates future traction power. The values come from a transparent rule-based demo heuristic; the trained Python (FastAPI + scikit-learn/XGBoost) backend is a later phase and is clearly marked wherever it is absent.`}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <MetricCard label="Current power demand" value={latest.powerKw.toFixed(1)} unit="kW" source="simulated" />
        <MetricCard
          label="Predicted maximum demand"
          value={forecast.peakKw.toFixed(1)}
          unit="kW"
          source="predicted"
          tone={forecast.peakKw > thresholdKw ? "critical" : "default"}
          hint={`At +${forecast.peakTSec} s`}
        />
        <MetricCard
          label="High-load probability"
          value={`${probPct}%`}
          source="predicted"
          tone={probPct >= 50 ? "critical" : probPct >= 30 ? "warning" : "success"}
          hint={`Horizon: ${settings.predictionHorizonSec} s`}
        />
        <MetricCard
          label="Predicted event"
          value={forecast.event}
          source="predicted"
          hint={forecast.etaSec !== null ? `Estimated event time: +${forecast.etaSec} s` : "Below 50% threshold"}
        />
        <MetricCard
          label="Model version"
          value="demo-heuristic v0.2"
          source="demo"
          hint="Rule-based — no trained model connected"
        />
        <MetricCard
          label="Input data quality"
          value="Good (simulated)"
          source="simulated"
          hint="Synthetic drive cycle — complete feature set"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card className="border-border bg-card xl:col-span-5">
          <CardHeader>
            <CardTitle className="font-display text-base">Input parameters</CardTitle>
            <CardDescription>Only inputs genuinely available at prediction time — no future measured values.</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="space-y-1.5 text-sm">
              {inputs.map((i) => (
                <div key={i.label} className="flex items-baseline justify-between gap-3 border-b border-border/40 pb-1.5 last:border-0">
                  <dt className="text-muted-foreground">{i.label}</dt>
                  <dd className="text-right text-foreground">
                    {i.value} <span className="ml-1 text-[10px] uppercase text-muted-foreground">{i.note}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>

        <Card className="border-border bg-card xl:col-span-3">
          <CardHeader>
            <CardTitle className="font-display text-base">Probability gauge</CardTitle>
            <CardDescription>A probability is not a guarantee; calibration is evaluated only with a trained model.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-2">
            <ProbabilityGauge value={forecast.probability} caption={`High-load event within ${settings.predictionHorizonSec} s (demo heuristic)`} />
            <p className="text-center text-xs text-muted-foreground">
              {probPct >= 50
                ? "High-load event likely within the horizon."
                : "No high-load event expected within the horizon."}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card xl:col-span-4">
          <CardHeader>
            <CardTitle className="font-display text-base">Why the system predicts high demand</CardTitle>
            <CardDescription>Every reason is traceable to the demo data on this page.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {explanations.map((e, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-primary">{i + 1}.</span>
                  <span>{e}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="font-display text-base">Predicted power demand over the horizon</CardTitle>
            <span className="rounded-md border border-warning/40 bg-warning/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-warning">
              Predicted
            </span>
          </div>
          <CardDescription>
            Demand projection from the shared demo drive cycle, with the {thresholdKw} kW high-load threshold marked.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DemandForecastChart forecast={forecast.points} thresholdKw={thresholdKw} />
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="font-display text-base">Model status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-2 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              <BrainCircuit className="mr-1 inline h-3.5 w-3.5" />
              This is a simulated, rule-based prediction — not a trained or validated AI model. Planned: threshold
              baseline, Random Forest and XGBoost with trip-grouped splits, a demand regressor and SHAP explanations.
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
