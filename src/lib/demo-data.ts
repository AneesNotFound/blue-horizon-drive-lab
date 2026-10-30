/*
 * Single source of truth for the Blue Horizon demo data system.
 *
 * Every value produced here is SYNTHETIC: SIMULATED, DEMO or PREDICTED — never
 * real vehicle telemetry, live traffic or trained-model output. All pages read
 * from this module (directly or via the shared app state) so the whole app
 * stays internally consistent.
 */

export const AIR_DENSITY = 1.2;

/** Demo vehicle profile — section 1 of the demo specification. */
export const DEMO_VEHICLE = {
  name: "Blue Horizon EV",
  type: "Battery Electric Vehicle with Hybrid Battery–Supercapacitor Energy Storage",
  massKg: 1500,
  rollingResistance: 0.01,
  dragCoefficient: 0.28,
  frontalAreaM2: 2.2,
  drivetrainEfficiency: 0.92,
  batteryCapacityKwh: 60,
  batteryVoltage: 400,
  batteryContinuousPowerKw: 25,
  batteryPeakPowerKw: 80,
  initialBatterySocPct: 75,
  batterySohPct: 96,
  supercapCapacitanceF: 100,
  supercapVoltageMax: 48,
  supercapVoltageMin: 24,
  initialSupercapSocPct: 80,
  maxSpeedKph: 100,
} as const;

export type VehicleProfile = typeof DEMO_VEHICLE;

/** Fields the Settings page may override; physics uses the merged profile. */
export type ProfileOverrides = {
  massKg: number;
  batteryCapacityKwh: number;
  batteryVoltage: number;
  batteryContinuousPowerKw: number;
  supercapCapacitanceF: number;
  supercapVoltageMax: number;
  drivetrainEfficiency: number;
};

/** Kept for existing imports; the configurable value lives in app settings. */
export const DEMO_HIGH_LOAD_THRESHOLD_KW = DEFAULT_THRESHOLD_KW;

export const DEFAULT_THRESHOLD_KW = 25;
export const DEFAULT_HORIZON_SEC = 60;

export function mergeProfile(overrides?: Partial<ProfileOverrides>): VehicleProfile {
  return { ...DEMO_VEHICLE, ...(overrides ?? {}) };
}

// ---------------------------------------------------------------------------
// Documented vehicle dynamics model (SI units, kW output)
// ---------------------------------------------------------------------------

/**
 * Traction power from the documented model:
 *   rolling  = Crr · m · g · v
 *   aero     = ½ · ρ · Cd · A · v²
 *   gradient = m · g · sin(θ) · v        (θ ≈ gradient% on small slopes)
 *   accel    = m · a · v
 *   traction = (sum) / drivetrain efficiency (× efficiency when regenerating)
 */
export function tractionPowerKw(
  speedKph: number,
  accelMs2: number,
  gradientPct = 0,
  v: VehicleProfile = DEMO_VEHICLE,
): number {
  const vms = speedKph / 3.6;
  if (vms <= 0) return 0;
  const rolling = v.rollingResistance * v.massKg * 9.81 * vms; // W
  const aero = 0.5 * AIR_DENSITY * v.dragCoefficient * v.frontalAreaM2 * vms * vms; // W
  const gradient = v.massKg * 9.81 * (gradientPct / 100) * vms; // W (positive uphill)
  const accel = v.massKg * accelMs2 * vms; // W
  const gross = rolling + aero + gradient + Math.max(accel, 0);
  const regen = Math.min(accel, 0) * vms * 0.6; // partial regenerative braking
  const net = gross + regen;
  const signed = net >= 0 ? net / v.drivetrainEfficiency : net * v.drivetrainEfficiency;
  return signed / 1000; // kW
}

/** E = ½ · C · V², with V mapped linearly onto SOC between the voltage limits. */
export function supercapStoredEnergyKwh(socPct: number, v: VehicleProfile = DEMO_VEHICLE): number {
  const vNow = v.supercapVoltageMin + ((v.supercapVoltageMax - v.supercapVoltageMin) * socPct) / 100;
  return (0.5 * v.supercapCapacitanceF * vNow * vNow) / 3_600_000; // J -> kWh
}

/**
 * Maximum supercapacitor assistance power: bounded by a converter limit and by
 * the stored energy being able to sustain the output for ~10 seconds.
 */
export function supercapMaxAssistKw(socPct: number, v: VehicleProfile = DEMO_VEHICLE): number {
  const energyKwh = supercapStoredEnergyKwh(socPct, v);
  const energyLimited = (energyKwh * 3600) / 10; // kW sustainable for 10 s
  return Math.max(0, Math.min(30, energyLimited));
}

// ---------------------------------------------------------------------------
// Demo route: Central Station → Technology Park, 12.4 km, ~28 min
// ---------------------------------------------------------------------------

export const DEMO_ROUTE = {
  name: "Central Station → Technology Park (demo route)",
  origin: "Central Station",
  destination: "Technology Park",
  lengthKm: 12.4,
  typicalDurationMin: 28,
  source: "Demo data — no Google Maps integration yet",
} as const;

export type TrafficDensity = "Low" | "Medium" | "High";

export type RouteSegment = {
  id: string;
  name: string;
  startKm: number;
  lengthKm: number;
  speedKph: number;
  gradientPct: number;
  elevationStartM: number;
  elevationEndM: number;
  trafficDensity: TrafficDensity;
  expectedPowerKw: number;
};

const SEGMENT_SPEC: Omit<RouteSegment, "startKm" | "expectedPowerKw">[] = [
  { id: "seg-01", name: "Station Approach", lengthKm: 0.9, speedKph: 48, gradientPct: 0, elevationStartM: 12, elevationEndM: 12, trafficDensity: "Low" },
  { id: "seg-02", name: "Station Road climb", lengthKm: 1.1, speedKph: 45, gradientPct: 3.2, elevationStartM: 12, elevationEndM: 47, trafficDensity: "Medium" },
  { id: "seg-03", name: "Market Street", lengthKm: 1.0, speedKph: 35, gradientPct: 0, elevationStartM: 47, elevationEndM: 47, trafficDensity: "High" },
  { id: "seg-04", name: "Canal Bridge stretch", lengthKm: 1.2, speedKph: 55, gradientPct: -1.2, elevationStartM: 47, elevationEndM: 33, trafficDensity: "Medium" },
  { id: "seg-05", name: "Ring Road approach", lengthKm: 1.0, speedKph: 62, gradientPct: 0.8, elevationStartM: 33, elevationEndM: 41, trafficDensity: "Low" },
  { id: "seg-06", name: "Ring Road cruise", lengthKm: 1.2, speedKph: 68, gradientPct: 0, elevationStartM: 41, elevationEndM: 41, trafficDensity: "Low" },
  { id: "seg-07", name: "Hillcrest climb", lengthKm: 1.2, speedKph: 50, gradientPct: 4.5, elevationStartM: 41, elevationEndM: 95, trafficDensity: "Medium" },
  { id: "seg-08", name: "Hillcrest descent", lengthKm: 1.2, speedKph: 58, gradientPct: -4.2, elevationStartM: 95, elevationEndM: 45, trafficDensity: "Medium" },
  { id: "seg-09", name: "University Avenue", lengthKm: 1.0, speedKph: 42, gradientPct: 1.0, elevationStartM: 45, elevationEndM: 55, trafficDensity: "High" },
  { id: "seg-10", name: "Riverside straight", lengthKm: 1.2, speedKph: 60, gradientPct: -0.5, elevationStartM: 55, elevationEndM: 49, trafficDensity: "Medium" },
  { id: "seg-11", name: "Tech Park link road", lengthKm: 0.8, speedKph: 45, gradientPct: -2.0, elevationStartM: 49, elevationEndM: 33, trafficDensity: "Low" },
  { id: "seg-12", name: "Technology Park approach", lengthKm: 0.6, speedKph: 35, gradientPct: 0, elevationStartM: 33, elevationEndM: 33, trafficDensity: "Low" },
];

export const DEMO_SEGMENTS: RouteSegment[] = (() => {
  let start = 0;
  return SEGMENT_SPEC.map((s) => {
    const segment: RouteSegment = {
      ...s,
      startKm: Number(start.toFixed(2)),
      expectedPowerKw: Number(tractionPowerKw(s.speedKph, 0, s.gradientPct).toFixed(2)),
    };
    start += s.lengthKm;
    return segment;
  });
})();

/** The segment the vehicle is in at a given distance along the route. */
export function routeSegmentAtKm(km: number): RouteSegment {
  const clamped = ((km % DEMO_ROUTE.lengthKm) + DEMO_ROUTE.lengthKm) % DEMO_ROUTE.lengthKm;
  for (const s of DEMO_SEGMENTS) {
    if (clamped >= s.startKm && clamped < s.startKm + s.lengthKm) return s;
  }
  return DEMO_SEGMENTS[DEMO_SEGMENTS.length - 1];
}

// ---------------------------------------------------------------------------
// Demo intersections along the route (section 7) — synthetic traffic only
// ---------------------------------------------------------------------------

export type SignalState = "Red" | "Amber" | "Green";

export type DemoIntersection = {
  id: string;
  name: string;
  distanceKm: number;
  trafficDensity: TrafficDensity;
  defaultSignal: SignalState;
  stoppingProbability: number;
  /** Compatibility aliases for existing pages. */
  stoppingLikelihood: number;
  type: "Signalised" | "Unsignalised";
  signalState: "Unavailable";
};

export const DEMO_INTERSECTIONS: DemoIntersection[] = [
  { id: "ix-1", name: "Station Square junction", distanceKm: 1.2, trafficDensity: "High", defaultSignal: "Red", stoppingProbability: 0.85, stoppingLikelihood: 0.85, type: "Signalised", signalState: "Unavailable" as const },
  { id: "ix-2", name: "Market Street crossing", distanceKm: 3.5, trafficDensity: "Medium", defaultSignal: "Green", stoppingProbability: 0.2, stoppingLikelihood: 0.2, type: "Signalised", signalState: "Unavailable" as const },
  { id: "ix-3", name: "Ring Road merge", distanceKm: 5.8, trafficDensity: "Low", defaultSignal: "Green", stoppingProbability: 0.1, stoppingLikelihood: 0.1, type: "Unsignalised", signalState: "Unavailable" as const },
  { id: "ix-4", name: "Riverside Drive signals", distanceKm: 8.1, trafficDensity: "High", defaultSignal: "Red", stoppingProbability: 0.75, stoppingLikelihood: 0.75, type: "Signalised", signalState: "Unavailable" as const },
  { id: "ix-5", name: "Technology Park gate", distanceKm: 10.6, trafficDensity: "Medium", defaultSignal: "Amber", stoppingProbability: 0.55, stoppingLikelihood: 0.55, type: "Signalised", signalState: "Unavailable" as const },
];

/** Simulated effect of a signal state on predicted power demand (kW spike). */
export function signalDemandEffect(signal: SignalState, stoppingProbability: number): { label: string; extraKw: number } {
  if (signal === "Red") {
    return {
      label: "Stop likely, then a re-acceleration spike predicted after the signal changes.",
      extraKw: Number((10 * stoppingProbability).toFixed(1)),
    };
  }
  if (signal === "Amber") {
    return {
      label: "Driver may brake or accelerate through — moderate demand swing predicted.",
      extraKw: Number((5 * stoppingProbability).toFixed(1)),
    };
  }
  return {
    label: "Pass-through expected — only a minor slowdown predicted.",
    extraKw: Number((2 * stoppingProbability).toFixed(1)),
  };
}

/** Distance to the next intersection ahead of the given route position. */
export function nextIntersectionAhead(positionKm: number): { intersection: DemoIntersection; distanceAheadKm: number } | null {
  const pos = ((positionKm % DEMO_ROUTE.lengthKm) + DEMO_ROUTE.lengthKm) % DEMO_ROUTE.lengthKm;
  const ahead = DEMO_INTERSECTIONS.filter((ix) => ix.distanceKm > pos).sort((a, b) => a.distanceKm - b.distanceKm);
  const next = ahead[0] ?? DEMO_INTERSECTIONS[0];
  const distanceAhead = ahead[0] ? next.distanceKm - pos : DEMO_ROUTE.lengthKm - pos + next.distanceKm;
  return { intersection: next, distanceAheadKm: Number(distanceAhead.toFixed(2)) };
}

// ---------------------------------------------------------------------------
// Energy-management decision engine (section 5)
// ---------------------------------------------------------------------------

export type StrategyId = "battery-only" | "rule-based-hybrid" | "predictive-hybrid";

export const STRATEGIES: { id: StrategyId; label: string; short: string; blurb: string }[] = [
  {
    id: "battery-only",
    label: "A — Battery Only",
    short: "Battery only",
    blurb: "Every demand served by the battery, even beyond its continuous limit.",
  },
  {
    id: "rule-based-hybrid",
    label: "B — Rule-Based Hybrid",
    short: "Rule-based hybrid",
    blurb: "Supercapacitor switches on only after demand crosses the high-load threshold.",
  },
  {
    id: "predictive-hybrid",
    label: "C — Predictive Hybrid",
    short: "Predictive hybrid",
    blurb: "Uses the 60-second prediction to pre-position supercapacitor energy before the event.",
  },
];

export type StrategyResult = {
  id: StrategyId;
  label: string;
  mode: string;
  batteryKw: number;
  supercapKw: number;
  totalKw: number;
  deficitKw: number;
  batteryWithinContinuousLimit: boolean;
  supercapEnergyOk: boolean;
  stressIndex: number;
  consumptionKwhPerKm: number;
  explanations: string[];
};

export type DecisionInput = {
  demandKw: number;
  predictedPeakKw: number;
  speedKph: number;
  batteryContinuousKw: number;
  batteryPeakKw: number;
  scAvailableEnergyKwh: number;
  scMaxAssistKw: number;
  thresholdKw: number;
};

const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));

export function evaluateStrategy(id: StrategyId, input: DecisionInput): StrategyResult {
  const { demandKw, predictedPeakKw, speedKph, batteryContinuousKw, batteryPeakKw, scAvailableEnergyKwh, scMaxAssistKw, thresholdKw } =
    input;
  const baseConsumption = speedKph > 3 ? Math.abs(demandKw) / speedKph : 0.24;

  if (id === "battery-only") {
    const batteryKw = Math.min(demandKw, batteryPeakKw);
    const deficit = Math.max(0, demandKw - batteryPeakKw);
    const overContinuous = Math.max(0, demandKw - batteryContinuousKw);
    const stress = clamp(0.3 + 0.75 * (overContinuous / batteryContinuousKw), 0.1, 1);
    const explanations = [
      `Battery-only strategy: the full ${demandKw.toFixed(1)} kW demand is placed on the battery.`,
      overContinuous > 0
        ? `Demand exceeds the ${batteryContinuousKw} kW continuous limit by ${overContinuous.toFixed(1)} kW — sustained high current raises battery stress and heating.`
        : `Demand is within the ${batteryContinuousKw} kW continuous battery limit.`,
      "No supercapacitor support is used, so peak-current stress is never shifted away from the battery.",
    ];
    return {
      id,
      label: "A — Battery Only",
      mode: overContinuous > 0 ? "Battery Only — above continuous limit" : "Battery Only",
      batteryKw: Number(batteryKw.toFixed(2)),
      supercapKw: 0,
      totalKw: Number(batteryKw.toFixed(2)),
      deficitKw: Number(deficit.toFixed(2)),
      batteryWithinContinuousLimit: overContinuous === 0,
      supercapEnergyOk: false,
      stressIndex: Number(stress.toFixed(2)),
      consumptionKwhPerKm: Number((baseConsumption * 1.04).toFixed(3)),
      explanations,
    };
  }

  const scEnergyOk = scAvailableEnergyKwh > 0.004 && scMaxAssistKw > 0.5;

  if (id === "rule-based-hybrid") {
    const assist = demandKw > thresholdKw && scEnergyOk;
    const supercapKw = assist ? clamp(demandKw - batteryContinuousKw, 0, scMaxAssistKw) : 0;
    const batteryKw = demandKw - supercapKw;
    const stress = clamp(0.32 + 0.25 * (Math.max(batteryKw - batteryContinuousKw, 0) / batteryContinuousKw), 0.1, 1);
    const explanations = [
      assist
        ? `Demand (${demandKw.toFixed(1)} kW) crossed the ${thresholdKw} kW threshold, so the rule switches the supercapacitor on.`
        : `Demand (${demandKw.toFixed(1)} kW) is below the ${thresholdKw} kW threshold — no switching (avoids unnecessary mode changes).`,
      assist
        ? `Supercapacitor covers ${supercapKw.toFixed(1)} kW, keeping the battery at its ${batteryContinuousKw} kW continuous limit.`
        : "Battery handles the demand alone within its comfortable envelope.",
      scEnergyOk
        ? `Supercapacitor energy check passed: ${(scAvailableEnergyKwh * 1000).toFixed(1)} Wh stored (½·C·V²), enough to sustain assistance.`
        : "Supercapacitor energy check failed — assistance withheld despite the prediction.",
      "This rule is reactive: it cannot prepare the supercapacitor before the demand arrives.",
    ];
    return {
      id,
      label: "B — Rule-Based Hybrid",
      mode: assist ? "Battery + Supercapacitor Assistance" : "Battery Only",
      batteryKw: Number(batteryKw.toFixed(2)),
      supercapKw: Number(supercapKw.toFixed(2)),
      totalKw: Number(demandKw.toFixed(2)),
      deficitKw: 0,
      batteryWithinContinuousLimit: batteryKw <= batteryContinuousKw + 0.05,
      supercapEnergyOk,
      stressIndex: Number(stress.toFixed(2)),
      consumptionKwhPerKm: Number((baseConsumption * 1.0).toFixed(3)),
      explanations,
    };
  }

  // Predictive hybrid: pre-positions the supercapacitor using the forecast.
  const prePosition = predictedPeakKw > thresholdKw && scEnergyOk;
  const targetSplit = Math.max(demandKw, prePosition ? predictedPeakKw : 0);
  const supercapKw = prePosition ? clamp(targetSplit - batteryContinuousKw, 0, scMaxAssistKw) : 0;
  const batteryKw = Math.min(demandKw, prePosition ? batteryContinuousKw : batteryPeakKw);
  const stress = clamp(0.28 + 0.15 * (Math.max(batteryKw - batteryContinuousKw, 0) / batteryContinuousKw), 0.1, 1);
  const explanations = [
    prePosition
      ? `Prediction sees a ${predictedPeakKw.toFixed(1)} kW peak within the horizon, so the supercapacitor is pre-positioned before the event.`
      : `Predicted peak (${predictedPeakKw.toFixed(1)} kW) stays below the ${thresholdKw} kW threshold — battery-only operation is sufficient.`,
    prePosition
      ? `Supercapacitor reserves ${supercapKw.toFixed(1)} kW so the battery never exceeds its ${batteryContinuousKw} kW continuous limit.`
      : "No reserve needed; the battery operates in its efficient band.",
    scEnergyOk
      ? `Supercapacitor energy verified before activation: ${(scAvailableEnergyKwh * 1000).toFixed(1)} Wh available.`
      : "Supercapacitor energy too low — the strategy falls back to conservative battery operation.",
    "Pre-positioning avoids reactive switching and keeps battery current smoother (modelled stress index is lowest of the three strategies).",
  ];
  return {
    id,
    label: "C — Predictive Hybrid",
    mode: prePosition ? "Battery + Supercapacitor Assistance (pre-positioned)" : "Battery Only",
    batteryKw: Number(batteryKw.toFixed(2)),
    supercapKw: Number(supercapKw.toFixed(2)),
    totalKw: Number((batteryKw + supercapKw).toFixed(2)),
    deficitKw: 0,
    batteryWithinContinuousLimit: batteryKw <= batteryContinuousKw + 0.05,
    supercapEnergyOk,
    stressIndex: Number(stress.toFixed(2)),
    consumptionKwhPerKm: Number((baseConsumption * 0.96).toFixed(3)),
    explanations,
  };
}

/** Run all three strategies over the same scenario for comparison. */
export function evaluateAllStrategies(input: DecisionInput): StrategyResult[] {
  return STRATEGIES.map((s) => evaluateStrategy(s.id, input));
}

// ---------------------------------------------------------------------------
// Sample trip history (section 9) — synthetic records
// ---------------------------------------------------------------------------

export type DemoTrip = {
  id: string;
  origin: string;
  destination: string;
  scenario: string;
  distanceKm: number;
  durationMin: number;
  batterySocStart: number;
  batterySocEnd: number;
  scSocStart: number;
  scSocEnd: number;
  strategy: string;
  predictedHighLoadEvents: number;
};

export const DEMO_TRIPS: DemoTrip[] = [
  { id: "demo-trip-001", origin: "Central Station", destination: "Technology Park", scenario: "Morning peak — stop-and-go", distanceKm: 12.4, durationMin: 31, batterySocStart: 75, batterySocEnd: 70, scSocStart: 80, scSocEnd: 72, strategy: "AI-predictive hybrid", predictedHighLoadEvents: 3 },
  { id: "demo-trip-002", origin: "Central Station", destination: "Technology Park", scenario: "Midday mixed traffic", distanceKm: 12.4, durationMin: 28, batterySocStart: 75, batterySocEnd: 71, scSocStart: 80, scSocEnd: 75, strategy: "Rule-based hybrid", predictedHighLoadEvents: 2 },
  { id: "demo-trip-003", origin: "Central Station", destination: "Technology Park", scenario: "Free-flow evening run", distanceKm: 12.4, durationMin: 26, batterySocStart: 75, batterySocEnd: 69, scSocStart: 80, scSocEnd: 78, strategy: "Battery-only", predictedHighLoadEvents: 3 },
  { id: "demo-trip-004", origin: "Technology Park", destination: "Central Station", scenario: "Uphill-heavy return run", distanceKm: 12.4, durationMin: 30, batterySocStart: 75, batterySocEnd: 69, scSocStart: 80, scSocEnd: 70, strategy: "AI-predictive hybrid", predictedHighLoadEvents: 4 },
  { id: "demo-trip-005", origin: "Technology Park", destination: "Central Station", scenario: "Night run — low traffic", distanceKm: 12.4, durationMin: 24, batterySocStart: 75, batterySocEnd: 72, scSocStart: 80, scSocEnd: 77, strategy: "Rule-based hybrid", predictedHighLoadEvents: 1 },
];

/** Energy drawn from the pack, derived from the SOC drop (keeps records consistent). */
export function tripEnergyConsumedKwh(trip: DemoTrip, capacityKwh = DEMO_VEHICLE.batteryCapacityKwh): number {
  return Number(((capacityKwh * (trip.batterySocStart - trip.batterySocEnd)) / 100).toFixed(2));
}

export function tripEnergyPerKm(trip: DemoTrip, capacityKwh = DEMO_VEHICLE.batteryCapacityKwh): number {
  return Number((tripEnergyConsumedKwh(trip, capacityKwh) / trip.distanceKm).toFixed(3));
}
