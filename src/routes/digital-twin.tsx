import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/page-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/digital-twin")({
  component: DigitalTwin,
  head: () => ({
    meta: [
      { title: "Digital Twin Simulation — Predictive EMS" },
      {
        name: "description",
        content:
          "Software model of the hybrid battery–supercapacitor EV: documented vehicle power model, supercapacitor energy storage and planned strategy runs.",
      },
      { property: "og:title", content: "Digital Twin Simulation — Predictive EMS" },
      { property: "og:description", content: "Software model of the hybrid EV powertrain (demo values)." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const PARAM_GROUPS: { group: string; params: { label: string; value: string }[] }[] = [
  {
    group: "Vehicle",
    params: [
      { label: "Mass", value: "1500 kg" },
      { label: "Rolling resistance coefficient", value: "0.010" },
      { label: "Drag coefficient", value: "0.28" },
      { label: "Frontal area", value: "2.2 m²" },
      { label: "Drivetrain efficiency", value: "92 %" },
    ],
  },
  {
    group: "Battery",
    params: [
      { label: "Capacity", value: "55 kWh" },
      { label: "Max power", value: "80 kW" },
      { label: "Initial SOC (demo run)", value: "78 %" },
    ],
  },
  {
    group: "Supercapacitor",
    params: [
      { label: "Capacitance", value: "120 F" },
      { label: "Voltage limits", value: "24–48 V" },
      { label: "Initial energy (demo run)", value: "85 % SOC" },
    ],
  },
  {
    group: "Electronics",
    params: [{ label: "Converter efficiency", value: "95 %" }],
  },
];

function DigitalTwin() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Digital Twin Simulation"
        phase="Phase 1 — model defined"
        description="A configurable software model of a battery EV and a hybrid battery–supercapacitor EV. The live one-second drive cycle powering the dashboard already uses this model; the full configurable run-comparison interface (battery-only vs rule-based hybrid vs AI-predictive hybrid) is the next phase. All parameters are demo values."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {PARAM_GROUPS.map((g) => (
          <Card key={g.group} className="border-border bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-base">{g.group}</CardTitle>
              <CardDescription>Configured demo values</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="space-y-1.5 text-sm">
                {g.params.map((p) => (
                  <div key={p.label} className="flex items-baseline justify-between gap-2 border-b border-border/40 pb-1.5 last:border-0">
                    <dt className="text-muted-foreground">{p.label}</dt>
                    <dd className="tabular-nums text-foreground">{p.value}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card className="border-border bg-card xl:col-span-6">
          <CardHeader>
            <CardTitle className="font-display text-base">Documented vehicle power model</CardTitle>
            <CardDescription>Traction power used by the live simulation, in consistent SI units.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <ul className="space-y-2 text-muted-foreground">
              <li>
                <span className="text-foreground">Rolling resistance:</span> \(P_{roll} = C_{rr} \cdot m \cdot g \cdot v\)
              </li>
              <li>
                <span className="text-foreground">Aerodynamic drag:</span> \(P_{aero} = \tfrac{1}{2} \rho \, C_d \, A \,
                v^3\)
              </li>
              <li>
                <span className="text-foreground">Acceleration:</span> \(P_{accel} = m \cdot a \cdot v\)
              </li>
              <li>
                <span className="text-foreground">Drivetrain losses:</span> demand divided by efficiency when
                motoring, multiplied when regenerating
              </li>
            </ul>
            <p className="text-xs text-muted-foreground">
              Regenerative braking is handled separately with a partial-recovery factor; gradient terms join the model
              when route elevation arrives in Phase 2.
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card xl:col-span-6">
          <CardHeader>
            <CardTitle className="font-display text-base">Supercapacitor energy model</CardTitle>
            <CardDescription>Stored energy with respect for configured voltage limits.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="rounded-lg border border-glow/40 bg-glow/10 px-3 py-2.5 font-display text-base text-glow">
              \(E = \tfrac{1}{2} \, C \, V^2\)
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Voltage is mapped linearly onto SOC between the configured limits.</li>
              <li>• Charge/discharge is bounded by the converter power limits and efficiency.</li>
              <li>• Assistance activates only when stored energy and power capability both allow it.</li>
            </ul>
            <p className="text-xs text-muted-foreground">
              No claim of actual battery-life extension is made — the stress index is a modelled indicator only.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/40 bg-card glow-panel">
        <CardHeader>
          <CardTitle className="font-display text-base">Planned simulation runs (next phase)</CardTitle>
          <CardDescription>
            Identical drive scenarios and comparable initial conditions across all three strategies.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-background/40 px-3 py-2.5">
            <p className="font-medium text-foreground">Battery-only</p>
            <p className="mt-1 text-xs">Baseline: every demand served by the battery.</p>
          </div>
          <div className="rounded-lg border border-border bg-background/40 px-3 py-2.5">
            <p className="font-medium text-foreground">Rule-based hybrid</p>
            <p className="mt-1 text-xs">Transparent thresholds without prediction input.</p>
          </div>
          <div className="rounded-lg border border-border bg-background/40 px-3 py-2.5">
            <p className="font-medium text-foreground">AI-predictive hybrid</p>
            <p className="mt-1 text-xs">Uses the 60-second high-load prediction to pre-position supercapacitor energy.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
