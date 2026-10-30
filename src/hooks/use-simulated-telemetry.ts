import { useAppData } from "./app-state";

export type { TelemetryState } from "./app-state-types";

/**
 * Shared simulated telemetry. The state lives in <AppDataProvider> so every
 * page observes the same ticking simulation — one connected demo dataset.
 */
export function useSimulatedTelemetry() {
  const { latest, history } = useAppData();
  return { latest, history };
}

/** Shared 60-second forecast from the demo heuristic (recomputed every 5 s). */
export function useSimulatedForecast() {
  const { forecast } = useAppData();
  return forecast;
}
