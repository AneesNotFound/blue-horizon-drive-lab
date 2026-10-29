import type { ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { DataSourceBadge, type DataSourceKind } from "@/components/page-shell";
import { cn } from "@/lib/utils";

type Tone = "default" | "primary" | "success" | "warning" | "critical" | "glow";

const toneClasses: Record<Tone, string> = {
  default: "text-foreground",
  primary: "text-primary",
  success: "text-success",
  warning: "text-warning",
  critical: "text-critical",
  glow: "text-glow",
};

export function MetricCard({
  label,
  value,
  unit,
  source,
  sourceLabel,
  tone = "default",
  hint,
  children,
}: {
  label: string;
  value: string | number;
  unit?: string;
  source: DataSourceKind;
  sourceLabel?: string;
  tone?: Tone;
  hint?: string;
  children?: ReactNode;
}) {
  return (
    <Card className="border-border bg-card">
      <CardContent className="flex h-full flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
          <DataSourceBadge kind={source} label={sourceLabel} />
        </div>
        <div className={cn("font-display text-2xl font-semibold tabular-nums tracking-tight", toneClasses[tone])}>
          {value}
          {unit ? <span className="ml-1 text-sm font-medium text-muted-foreground">{unit}</span> : null}
        </div>
        {hint ? <p className="text-[11px] leading-snug text-muted-foreground">{hint}</p> : null}
        {children}
      </CardContent>
    </Card>
  );
}
