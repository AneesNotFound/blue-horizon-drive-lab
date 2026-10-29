import { createFileRoute } from "@tanstack/react-router";

import { DataSourceBadge, PageHeader } from "@/components/page-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/model-performance")({
  component: ModelPerformance,
  head: () => ({
    meta: [
      { title: "Model Performance — Predictive EMS" },
      {
        name: "description",
        content:
          "Evaluation interface for the high-load classifier and demand regressor. Metrics appear only after real training and evaluation runs — none are fabricated.",
      },
      { property: "og:title", content: "Model Performance — Predictive EMS" },
      { property: "og:description", content: "Classifier and regressor evaluation (not yet evaluated)." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const MODELS = ["Threshold baseline", "Random Forest", "XGBoost", "Selected model"];
const METRICS = [
  "Precision",
  "Recall",
  "F1-score",
  "ROC-AUC",
  "PR-AUC",
  "False-positive rate",
  "False-negative rate",
  "Regression MAE",
  "Regression RMSE",
  "Prediction latency",
  "Calibration (ECE)",
];

function ModelPerformance() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Model Performance"
        phase="Planned — needs trained model"
        description="Genuine evaluation of the 60-second high-load classifier and the power-demand regressor. Metrics are produced only by actual evaluation runs; until the Python training backend exists, every cell honestly reads Not evaluated. No accuracy figures are invented."
      />

      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="font-display text-base">Model comparison</CardTitle>
            <DataSourceBadge kind="demo" label="Not evaluated" />
          </div>
          <CardDescription>
            Time-ordered / trip-grouped splits will be used to prevent data leakage. All values appear after real runs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                  <th className="pb-2 font-medium">Metric</th>
                  {MODELS.map((m) => (
                    <th key={m} className="pb-2 text-right font-medium">
                      {m}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {METRICS.map((metric) => (
                  <tr key={metric} className="border-b border-border/50 last:border-0">
                    <td className="py-2 text-muted-foreground">{metric}</td>
                    {MODELS.map((m) => (
                      <td key={m} className="py-2 text-right text-muted-foreground/70">
                        Not evaluated
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card className="border-border bg-card xl:col-span-6">
          <CardHeader>
            <CardTitle className="font-display text-base">Confusion matrix</CardTitle>
            <CardDescription>Filled by the evaluation run of the selected model.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {["True positives", "False positives", "False negatives", "True negatives"].map((cell) => (
                <div key={cell} className="rounded-lg border border-border bg-background/40 px-3 py-4 text-center">
                  <p className="text-xs text-muted-foreground">{cell}</p>
                  <p className="mt-1 font-display text-lg text-muted-foreground/60">—</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card xl:col-span-6">
          <CardHeader>
            <CardTitle className="font-display text-base">Planned ablation experiments</CardTitle>
            <CardDescription>Removes one feature family at a time to measure its contribution.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• Without route elevation / gradient features.</p>
            <p>• Without traffic and intersection features.</p>
            <p>• Without recent driving-history features (speed history, acceleration, stop-and-go).</p>
            <p>• Full feature set as reference.</p>
            <p className="pt-1 text-xs">
              Each ablation reports the same metric table above and is labelled with the training-data version used.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
