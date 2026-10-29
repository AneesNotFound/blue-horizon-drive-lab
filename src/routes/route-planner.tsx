import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Map } from "lucide-react";

import { DataSourceBadge, PageHeader } from "@/components/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DEMO_ROUTE } from "@/lib/simulation";

export const Route = createFileRoute("/route-planner")({
  component: RoutePlanner,
  head: () => ({
    meta: [
      { title: "Route Planner — Predictive EMS" },
      {
        name: "description",
        content:
          "Demo route selection with simulated distance, duration and energy estimates. Google Maps integration arrives in Phase 2.",
      },
      { property: "og:title", content: "Route Planner — Predictive EMS" },
      { property: "og:description", content: "Demo route selection with simulated estimates." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const DEMO_ROUTES = [
  DEMO_ROUTE,
  {
    name: "Demo Route B — Hilly ring road",
    origin: "Tech Park East (demo)",
    destination: "Hillcrest Suburb (demo)",
    lengthKm: 18.7,
    typicalDurationMin: 31,
    source: "Demo data — no Google Maps integration yet",
  },
  {
    name: "Demo Route C — Highway stretch",
    origin: "City Terminal (demo)",
    destination: "Airport Cargo Gate (demo)",
    lengthKm: 27.3,
    typicalDurationMin: 22,
    source: "Demo data — no Google Maps integration yet",
  },
] as const;

function RoutePlanner() {
  const [selected, setSelected] = useState(0);
  const route = DEMO_ROUTES[selected];
  // Simulated energy estimates from the demo vehicle model — not real route data.
  const energyEstimate = route.lengthKm * (selected === 1 ? 0.168 : selected === 2 ? 0.121 : 0.148);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Route Planner"
        phase="Phase 1 — demo mode"
        description="Select a sample route to view its simulated summary. Google Maps route calculation, live traffic and elevation analysis are added in Phase 2; nothing on this page is real map or traffic data."
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card className="border-border bg-card xl:col-span-7">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="font-display text-base">Sample routes</CardTitle>
              <DataSourceBadge kind="demo" />
            </div>
            <CardDescription>Fixed demo fixtures so every screen stays testable without paid APIs.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-3">
            {DEMO_ROUTES.map((r, i) => (
              <Button
                key={r.name}
                variant={i === selected ? "default" : "outline"}
                className="h-auto flex-col items-start gap-1 px-3 py-3 text-left"
                onClick={() => setSelected(i)}
              >
                <span className="text-xs font-semibold leading-snug">{r.name}</span>
                <span className="text-[11px] font-normal opacity-80">{r.lengthKm} km · ~{r.typicalDurationMin} min</span>
              </Button>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border bg-card xl:col-span-5" key={route.name}>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="font-display text-base">Selected route summary</CardTitle>
              <DataSourceBadge kind="simulated" />
            </div>
            <CardDescription>{route.name}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
              <dt className="text-muted-foreground">Origin</dt>
              <dd className="text-right text-foreground">{route.origin}</dd>
              <dt className="text-muted-foreground">Destination</dt>
              <dd className="text-right text-foreground">{route.destination}</dd>
              <dt className="text-muted-foreground">Distance</dt>
              <dd className="text-right tabular-nums text-foreground">{route.lengthKm} km</dd>
              <dt className="text-muted-foreground">Typical duration</dt>
              <dd className="text-right tabular-nums text-foreground">~{route.typicalDurationMin} min</dd>
              <dt className="text-muted-foreground">Estimated energy</dt>
              <dd className="text-right tabular-nums text-foreground">{energyEstimate.toFixed(2)} kWh</dd>
              <dt className="text-muted-foreground">Elevation profile</dt>
              <dd className="text-right text-warning">Not available in Phase 1</dd>
              <dt className="text-muted-foreground">Live traffic</dt>
              <dd className="text-right text-warning">Not available in Phase 1</dd>
            </dl>
            <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              Distance and duration are demo fixture values; energy is derived from the demo vehicle power model.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/40 bg-card glow-panel">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display text-base">
            <Map className="h-4 w-4 text-primary" /> Coming in Phase 2
          </CardTitle>
          <CardDescription>What the real Google Maps integration will add to this page.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {[
            "Interactive map with selectable routes (Routes API)",
            "Places autocomplete for origin/destination",
            "Traffic-aware routing and congestion view",
            "Elevation profile and gradient segments",
            "Mapped intersections and road features",
            "Per-segment predicted power demand",
          ].map((item) => (
            <Badge key={item} variant="outline" className="border-border bg-muted text-muted-foreground">
              {item}
            </Badge>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
