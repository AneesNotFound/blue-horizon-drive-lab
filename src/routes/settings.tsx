import { createFileRoute } from "@tanstack/react-router";

import { DataSourceBadge, PageHeader } from "@/components/page-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/settings")({
  component: Settings,
  head: () => ({
    meta: [
      { title: "Settings & Data Sources — Predictive EMS" },
      {
        name: "description",
        content:
          "Status of every data source in the system: simulation engine, Google Maps, trained prediction model and traffic signals, plus the phase roadmap.",
      },
      { property: "og:title", content: "Settings & Data Sources — Predictive EMS" },
      { property: "og:description", content: "Data-source status and phase roadmap." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const DATA_SOURCES: {
  name: string;
  status: "Active" | "Not configured" | "Not connected";
  kind: "measured" | "dataset-derived" | "simulated" | "predicted" | "demo";
  detail: string;
}[] = [
  {
    name: "Vehicle & energy simulation",
    status: "Active",
    kind: "simulated",
    detail: "Software drive cycle and powertrain model — the source of every simulated value in the app.",
  },
  {
    name: "Prediction (demo heuristic)",
    status: "Active",
    kind: "predicted",
    detail: "Phase 1 demo heuristic for the 60-second high-load horizon. Clearly not a trained model.",
  },
  {
    name: "Google Maps Platform",
    status: "Not configured",
    kind: "demo",
    detail: "Maps JavaScript, Routes, Places and Elevation APIs arrive in Phase 2. Keys will live in server-side configuration, restricted by origin and API permission.",
  },
  {
    name: "Live traffic conditions",
    status: "Not configured",
    kind: "demo",
    detail: "Uses only data the configured service is permitted to provide; simulated traffic-signal mode stays explicitly labelled.",
  },
  {
    name: "Trained prediction backend (FastAPI)",
    status: "Not connected",
    kind: "demo",
    detail: "Python training and inference service with scikit-learn/XGBoost; connects through a documented API in a later phase.",
  },
  {
    name: "Trip history storage",
    status: "Not connected",
    kind: "demo",
    detail: "Persistent storage of completed runs arrives with the backend phase; demo records are in-app only.",
  },
];

const ROADMAP = [
  { phase: "Phase 1 (this delivery)", items: "Black-and-blue responsive design, navigation shell, overview dashboard with simulated telemetry and labelled data sources." },
  { phase: "Phase 2", items: "Google Maps route planner with elevation and traffic-aware routing; real intersection mapping." },
  { phase: "Phase 3", items: "Python prediction backend: training pipeline, 60-second high-load classifier, demand regressor, explainability." },
  { phase: "Phase 4", items: "Digital twin run comparisons, predictive decision engine, model-performance evaluation, persistent trip history." },
];

function Settings() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Settings & Data Sources"
        phase="Phase 1 — active"
        description="Every metric in the application traces back to one of the sources below. Where a source is not yet connected, the interface shows demo or unavailable states instead of substituting other data."
      />

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="font-display text-base">Data sources</CardTitle>
          <CardDescription>Current connection status of each external or internal source.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {DATA_SOURCES.map((s) => (
            <div key={s.name} className="rounded-lg border border-border bg-background/40 px-3.5 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-foreground">{s.name}</p>
                <DataSourceBadge
                  kind={s.status === "Active" ? s.kind : "demo"}
                  label={s.status === "Active" ? undefined : s.status}
                />
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{s.detail}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="font-display text-base">Delivery roadmap</CardTitle>
          <CardDescription>What is built now and what each later phase adds.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {ROADMAP.map((r) => (
            <div key={r.phase} className="flex flex-col gap-1 rounded-lg border border-border bg-background/40 px-3.5 py-2.5 sm:flex-row sm:items-baseline sm:gap-4">
              <p className="w-44 shrink-0 text-sm font-medium text-foreground">{r.phase}</p>
              <p className="text-xs leading-relaxed text-muted-foreground">{r.items}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
