import { useAppData } from "./app-state";

/**
 * Shared simulated telemetry. The state lives in <AppDataProvider> so every
 * page observes the same ticking simulation — one connected demo dataset.
 */
export function useSimulatedTelemetry() {
  const { latest, history } = useAppData();
  return { latest, history };
}

/** Shared prediction-horizon forecast from the demo heuristic (5 s buckets). */
export function useSimulatedForecast() {
  const { forecast } = useAppData();
  return forecast;
}
