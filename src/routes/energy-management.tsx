import { createFileRoute } from "@tanstack/react-router";

import { MetricCard } from "@/components/dashboard/metric-card";
import { PageHeader } from "@/components/page-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSimulatedTelemetry } from "@/hooks/use-simulated-telemetry";
import {
  DEMO_HIGH_LOAD_THRESHOLD_KW,
  DEMO_VEHICLE,
  supercapStoredEnergyKwh,
} from "@/lib/simulation";

export const Route = createFileRoute("/energy-management")({
  component: EnergyManagement,
  head: () => ({
    meta: [
      { title: "Energy Management — Predictive EMS" },
      {
        name: "description",
        content:
          "Simulated operating-mode recommendation for the hybrid battery–supercapacitor powertrain, with constraints and decision rationale.",
      },
      { property: "og:title", content: "Energy Management — Predictive EMS" },
      { property: "og:description", content: "Simulated hybrid energy-management recommendation and constraints." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function EnergyManagement() {
  const { latest } = useSimulatedTelemetry();
  const supercapEnergyKwh = supercapStoredEnergyKwh(latest.supercapSocPct);
  const scEnergyKwh = supercapEnergyKwh;
  const reason =
    latest.powerKw < -0.5
      ? "Traction demand is negative: regenerative braking recovers energy and recharges the supercapacitor."
      : latest.powerKw > DEMO_HIGH_LOAD_THRESHOLD_KW && scEnergyKwh > 0.002
        ? `Predicted demand (${latest.powerKw.toFixed(1)} kW) exceeds the demo threshold (${DEMO_HIGH_LOAD_THRESHOLD_KW} kW) and the supercapacitor holds ${scEnergyKwh.toFixed(4)} kWh of usable energy, so assistance is beneficial.`
        : `Demand (${latest.powerKw.toFixed(1)} kW) is within the battery's comfortable envelope; switching on the supercapacitor would add converter losses without benefit.`;

  const constraints: { label: string; value: string }[] = [
    { label: "Battery power limit", value: `${DEMO_VEHICLE.batteryMaxPowerKw} kW (configured demo)` },
    { label: "Battery SOC", value: `${latest.batterySocPct.toFixed(1)} % (simulated)` },
    { label: "Supercapacitor voltage limits", value: `${DEMO_VEHICLE.supercapVoltageMin}–${DEMO_VEHICLE.supercapVoltageMax} V` },
    { label: "Supercapacitor stored energy", value: `${scEnergyKwh.toFixed(4)} kWh (simulated)` },
    { label: "Converter efficiency", value: `${(DEMO_VEHICLE.converterEfficiency * 100).toFixed(0)} % (modelled)` },
    { label: "Switching penalty", value: "Applied in demo rules to avoid mode chatter" },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Energy Management"
        phase="Phase 1 — demo decision engine"
        description="A transparent, rule-based simulated decision engine chooses the operating mode from predicted demand and the simulated storage state. The supercapacitor is never activated merely because a high-load event is predicted — energy and power capability are checked first. This is a software recommendation, not a physical vehicle controller."
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard label="Recommended mode" value={latest.recommendedMode} source="simulated" tone="primary" />
        <MetricCard label="Battery contribution" value={Math.max(latest.batteryKw, 0).toFixed(1)} unit="kW" source="simulated" />
        <MetricCard label="Supercapacitor contribution" value={Math.max(latest.supercapKw, 0).toFixed(1)} unit="kW" source="simulated" tone="glow" />
        <MetricCard label="Available supercap energy" value={scEnergyKwh.toFixed(4)} unit="kWh" source="simulated" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card className="border-border bg-card xl:col-span-6">
          <CardHeader>
            <CardTitle className="font-display text-base">Reason for the recommendation</CardTitle>
            <CardDescription>Updated every simulated second from the demo rule set.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="rounded-lg border border-primary/40 bg-primary/10 px-3 py-3 text-sm text-foreground">{reason}</p>
            <p className="mt-3 text-xs text-muted-foreground">
              Expected event timing: {"the demo heuristic sees the next burst window of the simulated drive cycle; "}
              the predictive strategy and baseline comparison run in the Phase 2 digital twin.
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card xl:col-span-6">
          <CardHeader>
            <CardTitle className="font-display text-base">Operating constraints considered</CardTitle>
            <CardDescription>All configured demo values — no physical sensors exist in this project.</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-y-2 text-sm sm:grid-cols-2 sm:gap-x-6">
              {constraints.map((c) => (
                <div key={c.label} className="flex flex-col border-b border-border/50 py-1.5 sm:flex-row sm:items-baseline sm:justify-between sm:border-0">
                  <dt className="text-muted-foreground">{c.label}</dt>
                  <dd className="tabular-nums text-foreground">{c.value}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="font-display text-base">Operating modes</CardTitle>
          <CardDescription>The four modes the decision engine may recommend.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { mode: "Battery Only", desc: "Demand handled entirely by the battery." },
            { mode: "Battery + Supercapacitor Assistance", desc: "Supercapacitor covers demand peaks within its energy and power limits." },
            { mode: "Regenerative Energy Recovery", desc: "Braking energy is recovered and stored in the supercapacitor." },
            { mode: "Insufficient Data / Safe Fallback", desc: "Battery-only conservative behaviour when inputs are unreliable." },
          ].map((m) => {
            const active = m.mode === latest.recommendedMode;
            return (
              <div
                key={m.mode}
                className={`rounded-lg border px-3 py-2.5 ${active ? "border-primary/60 bg-primary/10" : "border-border bg-background/40"}`}
              >
                <p className="text-sm font-medium text-foreground">{m.mode}</p>
                <p className="mt-1 text-xs text-muted-foreground">{m.desc}</p>
                {active ? <p className="mt-1.5 text-[10px] font-medium uppercase tracking-wide text-primary">Active now (simulated)</p> : null}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
