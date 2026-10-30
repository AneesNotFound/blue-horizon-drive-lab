import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  DEFAULT_HORIZON_SEC,
  DEFAULT_THRESHOLD_KW,
  DEMO_INTERSECTIONS,
  mergeProfile,
  type ProfileOverrides,
  type SignalState,
} from "@/lib/demo-data";
import {
  createCanonicalPoint,
  forecastDemand,
  stepSim,
  type Forecast,
  type SimParams,
  type TelemetryPoint,
} from "@/lib/simulation";

export type DemoSettings = {
  demoMode: boolean;
  /** Simulation ticks per real second (1 = real time). */
  simulationSpeed: number;
  predictionHorizonSec: number;
  highLoadThresholdKw: number;
  trafficSignalsEnabled: boolean;
  profile: ProfileOverrides;
};

export const DEFAULT_SETTINGS: DemoSettings = {
  demoMode: true,
  simulationSpeed: 1,
  predictionHorizonSec: DEFAULT_HORIZON_SEC,
  highLoadThresholdKw: DEFAULT_THRESHOLD_KW,
  trafficSignalsEnabled: true,
  profile: {
    massKg: 1500,
    batteryCapacityKwh: 60,
    batteryVoltage: 400,
    batteryContinuousPowerKw: 25,
    supercapCapacitanceF: 100,
    supercapVoltageMax: 48,
    drivetrainEfficiency: 0.92,
  },
};

export type SignalOverrides = Record<string, SignalState>;

type AppData = {
  latest: TelemetryPoint;
  history: TelemetryPoint[];
  forecast: Forecast;
  settings: DemoSettings;
  params: SimParams;
  signals: SignalOverrides;
  setSettings: (patch: Partial<DemoSettings>) => void;
  setProfile: (patch: Partial<ProfileOverrides>) => void;
  resetRun: () => void;
  setSignal: (id: string, state: SignalState) => void;
  resetSignals: () => void;
};

const AppDataContext = createContext<AppData | null>(null);

const STORAGE_KEY = "pems-demo-settings-v1";

const defaultSignals: SignalOverrides = Object.fromEntries(
  DEMO_INTERSECTIONS.map((ix) => [ix.id, ix.defaultSignal]),
);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [settings, setSettingsState] = useState<DemoSettings>(DEFAULT_SETTINGS);
  const [signals, setSignals] = useState<SignalOverrides>(defaultSignals);
  const params = useMemo<SimParams>(
    () => ({
      profile: mergeProfile(settings.profile),
      thresholdKw: settings.highLoadThresholdKw,
      horizonSec: settings.predictionHorizonSec,
    }),
    [settings.profile, settings.highLoadThresholdKw, settings.predictionHorizonSec],
  );

  const [state, setState] = useState<{ latest: TelemetryPoint; history: TelemetryPoint[] }>(() => {
    const initial = createCanonicalPoint();
    return { latest: initial, history: [initial] };
  });

  // Restore persisted settings on the client only (hydration-safe).
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<DemoSettings>;
        setSettingsState((prev) => ({ ...prev, ...parsed, profile: { ...prev.profile, ...(parsed.profile ?? {}) } }));
      }
    } catch {
      // ignore malformed storage
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // storage unavailable — settings stay in memory
    }
  }, [settings]);

  // One shared ticking simulation for the whole application.
  useEffect(() => {
    if (!settings.demoMode) return; // demo mode off → frozen at the canonical snapshot
    const id = setInterval(() => {
      setState((prev) => {
        const next = stepSim(prev.latest, params);
        return { latest: next, history: [...prev.history.slice(-89), next] };
      });
    }, Math.max(150, Math.round(1000 / settings.simulationSpeed)));
    return () => clearInterval(id);
  }, [settings.demoMode, settings.simulationSpeed, params]);

  const setSettings = useCallback((patch: Partial<DemoSettings>) => {
    setSettingsState((prev) => ({ ...prev, ...patch }));
  }, []);

  const setProfile = useCallback((patch: Partial<ProfileOverrides>) => {
    setSettingsState((prev) => ({ ...prev, profile: { ...prev.profile, ...patch } }));
  }, []);

  const resetRun = useCallback(() => {
    setState(() => {
      const initial = createCanonicalPoint(params);
      return { latest: initial, history: [initial] };
    });
  }, [params]);

  const setSignal = useCallback((id: string, state: SignalState) => {
    setSignals((prev) => ({ ...prev, [id]: state }));
  }, []);

  const resetSignals = useCallback(() => setSignals(defaultSignals), []);

  // Forecast recomputed on 5-second buckets to keep charts calm.
  const bucket = Math.floor(state.latest.t / 5);
  const forecast = useMemo(
    () => forecastDemand(state.latest, params.horizonSec, params.thresholdKw, params.profile),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bucket, params],
  );

  const value: AppData = {
    latest: state.latest,
    history: state.history,
    forecast,
    settings,
    params,
    signals,
    setSettings,
    setProfile,
    resetRun,
    setSignal,
    resetSignals,
  };

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppData {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used inside <AppDataProvider>");
  return ctx;
}
