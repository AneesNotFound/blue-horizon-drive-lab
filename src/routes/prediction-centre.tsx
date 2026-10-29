import { createFileRoute } from "@tanstack/react-router";
import { BrainCircuit, ShieldAlert } from "lucide-react";

import { MetricCard } from "@/components/dashboard/metric-card";
import { PageHeader } from "@/components/page-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useSimulatedForecast, useSimulatedTelemetry } from "@/hooks/use-simulated-telemetry";
import { DEMO_HIGH_LOAD_THRESHOLD_KW } from "@/lib/simulation";

export const Route = createFileRoute("/prediction-centre")({
  component: PredictionCentre,
  head: () => ({
    meta: [
      { title: "AI Prediction Centre — Predictive EMS" },
      {
        name: "description",
        content:
          "60-second high-load prediction and power-demand estimates from the Phase 1 demo heuristic, with the trained-model pipeline clearly marked as not yet connected.",
      },
      { property: "og:title", content: "AI Prediction Centre — Predictive EMS" },
      { property: "og:description", content: "60-second high-load prediction overview (demo heuristic)." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const DEMO_MODEL = {
  version: "demo-heuristic v0.1",
  horizonSeconds: 60,
  thresholdKw: DEMO_HIGH_LOAD_THRESHOLD_KW,
  status: "Demo heuristic — no trained model connected",
};

function PredictionCentre() {
  const { latest } = useSimulatedTelemetry();
  const forecast = useSimulatedForecast(latest);
  const probPct = Math.round(latest.highLoadProbability * 100);
  const etaEvent = forecast.find((f) => f.probability >= 0.5);

  return (
    <div className="space-y-5">
      <PageHeader
        title="AI Prediction Centre"
        phase="Phase 1 — demo heuristic"
        description="Predicts whether a high-load event occurs within the next 60 seconds and estimates future traction power. The values below come from a transparent demo heuristic; the trained Python (FastAPI + scikit-learn/XGBoost) backend is a later phase and is clearly marked wherever it is absent."
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <MetricCard
          label="High-load probability"
          value={`${probPct}%`}
          source="predicted"
          tone={probPct >= 50 ? "critical" : probPct >= 30 ? "warning" : "success"}
          hint={`Horizon: ${DEMO_MODEL.horizonSeconds} s`}
        />
        <MetricCard
          label="Predicted demand +15 s"
          value={(forecast[2]?.predictedKw ?? latest.powerKw).toFixed(1)}
          unit="kW"
          source="predicted"
        />
        <MetricCard
          label="Predicted demand +60 s"
          value={(forecast[11]?.predictedKw ?? forecast.at(-1)?.predictedKw ?? 0).toFixed(1)}
          unit="kW"
          source="predicted"
        />
        <MetricCard
          label="Event timing"
          value={etaEvent ? `+${etaEvent.tSec} s` : "None likely"}
          source="predicted"
          hint={etaEvent ? `P ≈ ${Math.round(etaEvent.probability * 100)}%` : "Below 50% threshold"}
        />
        <MetricCard label="Model version" value={DEMO_MODEL.version} source="demo" hint={DEMO_MODEL.status} />
        <MetricCard
          label="Input data quality"
          value="Good (simulated)"
          source="simulated"
          hint="Synthetic drive cycle — complete feature set"
        />
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="font-display text-base">Probability detail</CardTitle>
          <CardDescription>
            A probability is not a guarantee. Calibration will be evaluated before any output is described as a
            reliable confidence score.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Progress value={probPct} className="h-2.5" />
          <p className="text-xs text-muted-foreground">
            {probPct >= 50
              ? "High-load event likely within the next 60 seconds (demo heuristic)."
              : "No high-load event expected within the next 60 seconds (demo heuristic)."}
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card className="border-border bg-card xl:col-span-6">
          <CardHeader>
            <CardTitle className="font-display text-base">Features used by the demo heuristic</CardTitle>
            <CardDescription>Only inputs genuinely available at prediction time — no future measured values.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {[
              "Current speed (simulated)",
              "Recent speed history (simulated)",
              "Acceleration / deceleration (simulated)",
              "Recent stop-and-go pattern (simulated)",
              "Vehicle mass (configured demo value)",
              "Battery SOC (simulated)",
              "Supercapacitor stored energy (simulated)",
              "Demo drive-cycle pattern (simulated)",
            ].map((f) => (
              <Badge key={f} variant="outline" className="border-border bg-muted text-muted-foreground">
                {f}
              </Badge>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border bg-card xl:col-span-6">
          <CardHeader>
            <CardTitle className="font-display text-base">Planned trained-model pipeline</CardTitle>
            <CardDescription>Not evaluated — the table fills only after real training and evaluation runs.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <ul className="space-y-1.5">
              <li>• Threshold baseline, Random Forest and XGBoost compared on validation data.</li>
              <li>• Time-ordered / trip-grouped train–validation–test splits to prevent leakage.</li>
              <li>• High-load label: 90th-percentile traction power threshold, configurable.</li>
              <li>• Regression head for future power demand in kW.</li>
              <li>• Explanation method (e.g. SHAP) for the selected trained model.</li>
            </ul>
            <div className="flex items-start gap-2 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                <BrainCircuit className="mr-1 inline h-3.5 w-3.5" />
                Nothing on this page is a trained-model output yet. All predictions are heuristic and labelled as such.
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
