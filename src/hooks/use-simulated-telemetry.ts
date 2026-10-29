import { useEffect, useRef, useState } from "react";

import {
  createInitialState,
  forecastDemand,
  stepSim,
  type TelemetryPoint,
} from "@/lib/simulation";

export type TelemetryState = {
  latest: TelemetryPoint;
  history: TelemetryPoint[];
};

/**
 * Ticks the software vehicle simulation once per second. Values are SIMULATED
 * demo data: identical state on server and client until the first client tick.
 */
export function useSimulatedTelemetry(maxHistory = 90): TelemetryState {
  const [state, setState] = useState<TelemetryState>(() => {
    const initial = createInitialState();
    return { latest: initial, history: [initial] };
  });
  const maxHistoryRef = useRef(maxHistory);
  maxHistoryRef.current = maxHistory;

  useEffect(() => {
    const id = setInterval(() => {
      setState((prev) => {
        const next = stepSim(prev.latest);
        return {
          latest: next,
          history: [...prev.history.slice(-(maxHistoryRef.current - 1)), next],
        };
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return state;
}

export function useSimulatedForecast(latest: TelemetryPoint) {
  // Recompute only every 5 simulated seconds to keep the forecast chart calm.
  const bucket = Math.floor(latest.t / 5);
  const [forecast, setForecast] = useState(() => forecastDemand(latest));
  useEffect(() => {
    setForecast(forecastDemand(latest));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bucket]);
  return forecast;
}
