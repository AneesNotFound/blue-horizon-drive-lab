import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Explicit data-source labelling. Every metric in the app must carry one of
 * these badges so simulated or predicted values are never presented as real
 * measurements.
 */
export type DataSourceKind = "measured" | "dataset-derived" | "simulated" | "predicted" | "demo";

const dataSourceStyles: Record<DataSourceKind, string> = {
  measured: "border-success/40 bg-success/10 text-success",
  "dataset-derived": "border-glow/40 bg-glow/10 text-glow",
  simulated: "border-primary/40 bg-primary/10 text-primary",
  predicted: "border-warning/40 bg-warning/10 text-warning",
  demo: "border-border bg-muted text-muted-foreground",
};

const dataSourceLabels: Record<DataSourceKind, string> = {
  measured: "Measured",
  "dataset-derived": "Dataset-derived",
  simulated: "Simulated",
  predicted: "Predicted",
  demo: "Demo",
};

export function DataSourceBadge({
  kind,
  label,
  className,
}: {
  kind: DataSourceKind;
  label?: string;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn("text-[10px] font-medium uppercase tracking-wide", dataSourceStyles[kind], className)}
    >
      {label ?? dataSourceLabels[kind]}
    </Badge>
  );
}

export function PhaseBadge({ phase }: { phase: string }) {
  const active = phase.toLowerCase().startsWith("phase 1");
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-[10px] font-medium uppercase tracking-wide",
        active ? "border-success/40 bg-success/10 text-success" : "border-border bg-muted text-muted-foreground",
      )}
    >
      {phase}
    </Badge>
  );
}

export function PageHeader({
  title,
  description,
  phase,
  actions,
}: {
  title: string;
  description: string;
  phase: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-border pb-5 md:flex-row md:items-start md:justify-between">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-display text-xl font-semibold tracking-tight text-foreground md:text-2xl">{title}</h1>
          <PhaseBadge phase={phase} />
        </div>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}
