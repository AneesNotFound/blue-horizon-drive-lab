import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { TelemetryPoint } from "@/lib/simulation";

const axisStyle = { fill: "var(--color-muted-foreground)", fontSize: 11 };
const tooltipStyle = {
  backgroundColor: "var(--color-popover)",
  border: "1px solid var(--color-border)",
  borderRadius: 8,
  color: "var(--color-foreground)",
  fontSize: 12,
};

export function PowerHistoryChart({ history }: { history: TelemetryPoint[] }) {
  const data = history.slice(-60).map((p) => ({
    t: p.t,
    powerKw: Number(p.powerKw.toFixed(2)),
  }));

  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <defs>
            <linearGradient id="powerFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.45} />
              <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="t" tick={axisStyle} tickLine={false} axisLine={false} width={40} />
          <YAxis tick={axisStyle} tickLine={false} axisLine={false} unit=" kW" />
          <Tooltip contentStyle={tooltipStyle} labelFormatter={(v) => `t = ${v}s (simulated)`} />
          <ReferenceLine y={0} stroke="var(--color-border)" />
          <Area
            type="monotone"
            dataKey="powerKw"
            name="Traction power"
            stroke="var(--color-primary)"
            fill="url(#powerFill)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SpeedHistoryChart({ history }: { history: TelemetryPoint[] }) {
  const data = history.slice(-60).map((p) => ({ t: p.t, speedKph: Number(p.speedKph.toFixed(1)) }));
  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <defs>
            <linearGradient id="speedFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-glow)" stopOpacity={0.4} />
              <stop offset="100%" stopColor="var(--color-glow)" stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="t" tick={axisStyle} tickLine={false} axisLine={false} width={40} />
          <YAxis tick={axisStyle} tickLine={false} axisLine={false} unit=" km/h" domain={[0, 100]} />
          <Tooltip contentStyle={tooltipStyle} labelFormatter={(v) => `t = ${v}s (simulated)`} />
          <Area
            type="monotone"
            dataKey="speedKph"
            name="Vehicle speed"
            stroke="var(--color-glow)"
            fill="url(#speedFill)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SocHistoryChart({ history }: { history: TelemetryPoint[] }) {
  const data = history.slice(-60).map((p) => ({
    t: p.t,
    batterySoc: Number(p.batterySocPct.toFixed(2)),
    supercapSoc: Number(p.supercapSocPct.toFixed(1)),
  }));
  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="t" tick={axisStyle} tickLine={false} axisLine={false} width={40} />
          <YAxis tick={axisStyle} tickLine={false} axisLine={false} unit=" %" domain={[0, 100]} />
          <Tooltip contentStyle={tooltipStyle} labelFormatter={(v) => `t = ${v}s (simulated)`} />
          <Line
            type="monotone"
            dataKey="batterySoc"
            name="Battery SOC (%)"
            stroke="var(--color-primary)"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="supercapSoc"
            name="Supercapacitor SOC (%)"
            stroke="var(--color-glow)"
            strokeWidth={1.5}
            strokeDasharray="5 4"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DemandForecastChart({
  forecast,
  thresholdKw,
}: {
  forecast: { tSec: number; predictedKw: number; probability: number }[];
  thresholdKw: number;
}) {
  const data = forecast.map((f) => ({ ...f, probabilityPct: f.probability * 100 }));

  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -18 }}>
          <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="tSec" tick={axisStyle} tickLine={false} axisLine={false} unit="s" />
          <YAxis yAxisId="kw" tick={axisStyle} tickLine={false} axisLine={false} unit=" kW" />
          <YAxis
            yAxisId="pct"
            orientation="right"
            domain={[0, 100]}
            tick={axisStyle}
            tickLine={false}
            axisLine={false}
            unit="%"
          />
          <Tooltip contentStyle={tooltipStyle} labelFormatter={(v) => `+${v}s ahead (predicted)`} />
          <ReferenceLine
            yAxisId="kw"
            y={thresholdKw}
            stroke="var(--color-critical)"
            strokeDasharray="4 4"
            label={{ value: "High-load threshold (demo)", fill: "var(--color-critical)", fontSize: 10, position: "insideTopRight" }}
          />
          <Line
            yAxisId="kw"
            type="monotone"
            dataKey="predictedKw"
            name="Predicted demand (kW)"
            stroke="var(--color-primary)"
            strokeWidth={2}
            dot={{ r: 2.5, fill: "var(--color-primary)" }}
          />
          <Line
            yAxisId="pct"
            type="monotone"
            dataKey="probabilityPct"
            name="High-load probability (%)"
            stroke="var(--color-warning)"
            strokeWidth={1.5}
            strokeDasharray="5 4"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ContributionChart({ history }: { history: TelemetryPoint[] }) {
  const data = history.slice(-60).map((p) => ({
    t: p.t,
    battery: Number(Math.max(p.batteryKw, 0).toFixed(2)),
    supercap: Number(Math.max(p.supercapKw, 0).toFixed(2)),
  }));

  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <defs>
            <linearGradient id="battFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.4} />
              <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0.03} />
            </linearGradient>
            <linearGradient id="scFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-glow)" stopOpacity={0.45} />
              <stop offset="100%" stopColor="var(--color-glow)" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="t" tick={axisStyle} tickLine={false} axisLine={false} />
          <YAxis tick={axisStyle} tickLine={false} axisLine={false} unit=" kW" />
          <Tooltip contentStyle={tooltipStyle} labelFormatter={(v) => `t = ${v}s (simulated)`} />
          <Area
            type="monotone"
            dataKey="battery"
            name="Battery"
            stackId="contrib"
            stroke="var(--color-primary)"
            fill="url(#battFill)"
            strokeWidth={1.5}
          />
          <Area
            type="monotone"
            dataKey="supercap"
            name="Supercapacitor"
            stackId="contrib"
            stroke="var(--color-glow)"
            fill="url(#scFill)"
            strokeWidth={1.5}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
