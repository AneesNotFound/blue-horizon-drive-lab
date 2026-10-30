/*
 * Live software simulation for the Blue Horizon demo. One deterministic drive
 * cycle drives every page: the same state (shared through the app-state
 * provider) feeds the dashboard, prediction centre, energy management, traffic
 * analysis and trip history. All values are SIMULATED / PREDICTED demo data.
 *
 * The demo drive cycle is a documented, time-based speed schedule. The demo
 * prediction "heuristic" simply reads this same schedule ahead of the vehicle —
 * it is rule-based, NOT a trained machine-learning model.
 */

import {
  DEFAULT_HORIZON_SEC,
  DEFAULT_THRESHOLD_KW,
  DEMO_ROUTE,
  DEMO_SEGMENTS,
  DEMO_VEHICLE,
  routeSegmentAtKm,
  supercapMaxAssistKw,
  supercapStoredEnergyKwh,
  tractionPowerKw,
  mergeProfile,
  type VehicleProfile,
} from "./demo-data";

export type RecommendedMode =
  | "Battery Only"
  | "Battery + Supercapacitor Assistance"
  | "Regenerative Energy Recovery"
  | "Insufficient Data / Safe Fallback";

export type TelemetryPoint = {
  t: number; // seconds since simulation start
  speedKph: number;
  prevSpeedKph: number;
  accelMs2: number;
  gradientPct: number;
  segmentIndex: number;
  segmentName: string;
  powerKw: number; // traction demand (+) / regen (−)
  batteryKw: number;
  supercapKw: number;
  batterySocPct: number;
  batterySohPct: number;
  supercapSocPct: number;
  distanceCoveredKm: number;
  distanceRemainingKm: number;
  remainingEnergyKwh: number;
  energyKwhPerKm: number;
  highLoadProbability: number;
  predictedMaxKw: number;
  eventEtaSec: number | null;
  predictedEvent: string;
  predictionStatus: "High-load event predicted" | "No event predicted";
  recommendedMode: RecommendedMode;
};

export type ForecastPoint = { tSec: number; predictedKw: number; probability: number };

export type Forecast = {
  points: ForecastPoint[];
  peakKw: number;
  peakTSec: number;
  etaSec: number | null;
  probability: number;
  event: string;
};

// ---------------------------------------------------------------------------
// Deterministic demo drive cycle: time-based speed schedule with a scripted
// acceleration burst so the prediction has a concrete, explainable event.
// ---------------------------------------------------------------------------

const CYCLE_DT = 0.5;
const CYCLE_SECONDS = 240;
const POWER_CAP_OUT_KW = 32.8; // motor output cap of the demo powertrain (kW)

type CycleRow = { speedKph: number; accelMs2: number };

/** Scripted target speed (km/h) for a time within the 120 s demo schedule. */
function cycleTargetKph(t: number): number {
  const p = ((t % 120) + 120) % 120;
  const noise = 2 * Math.sin(t / 23); // gentle traffic wiggle (deterministic)
  let base: number;
  if (p < 20) base = 49.35; // gentle pull-away — canonical 18.5 kW at 48 km/h
  else if (p < 35) base = 44; // approach the burst zone
  else if (p < 55) base = 72; // scripted high-acceleration burst (the predicted event)
  else if (p < 75) base = 60; // cruise after the overtake
  else if (p < 95) base = 38; // braking zone — regenerative recovery
  else base = 50; // settle back to urban cruising
  return Math.max(0, base + noise);
}

function buildCycle(): CycleRow[] {
  const rows: CycleRow[] = [];
  let v = 48; // canonical start speed: 48 km/h
  let pos = 0;
  const dt = CYCLE_DT;
  for (let t = 0; t <= CYCLE_SECONDS; t += dt) {
    const target = cycleTargetKph(t);
    let a = Math.max(-2.2, Math.min(1.2, (target - v) / 1.8));
    // Power cap: traction output may never exceed the demo motor limit.
    const vms = v / 3.6;
    const segment = routeSegmentAtKm(pos);
    const grossNoAccel = tractionPowerKw(v, 0, segment.gradientPct) * DEMO_VEHICLE.drivetrainEfficiency * 1000; // W in
    const headroom = POWER_CAP_OUT_KW * DEMO_VEHICLE.drivetrainEfficiency * 1000 - grossNoAccel; // W for accel
    const aCap = headroom > 0 && vms > 0.5 ? headroom / (DEMO_VEHICLE.massKg * vms) : 0;
    a = v > 0 ? Math.min(a, aCap) : 0;
    v = Math.max(0, v + a * dt);
    pos += (v / 3.6) * dt / 1000;
    rows.push({ speedKph: v, accelMs2: Number(a.toFixed(3)) });
  }
  return rows;
}

const CYCLE: CycleRow[] = buildCycle();

export function cycleAt(t: number): CycleRow {
  const idx = Math.round((((t % CYCLE_SECONDS) + CYCLE_SECONDS) % CYCLE_SECONDS) / CYCLE_DT);
  return CYCLE[Math.min(idx, CYCLE.length - 1)] ?? { speedKph: 48, accelMs2: 0 };
}

/** High-load probability mapped from predicted power — labelled demo heuristic. */
export function probabilityFromPower(powerKw: number, thresholdKw: number): number {
  const ratio = powerKw / thresholdKw;
  return Number(Math.max(0.02, Math.min(0.97, 0.5 + 0.64 * (ratio - 1))).toFixed(2));
}

// ---------------------------------------------------------------------------
// Forecast (60-second prediction, demo heuristic — not a trained model)
// ---------------------------------------------------------------------------

export function forecastDemand(
  latest: Pick<TelemetryPoint, "t" | "distanceCoveredKm">,
  horizonSec = DEFAULT_HORIZON_SEC,
  thresholdKw = DEFAULT_THRESHOLD_KW,
  profile: VehicleProfile = DEMO_VEHICLE,
): Forecast {
  const points: ForecastPoint[] = [];
  let peakKw = 0;
  let peakTSec = 0;
  let etaSec: number | null = null;
  let peakAccel = 0;

  for (let s = 1; s <= horizonSec; s += 1) {
    const row = cycleAt(latest.t + s);
    const futurePos = latest.distanceCoveredKm + (row.speedKph / 3.6) * s / 1000;
    const segment = routeSegmentAtKm(futurePos);
    const kw = tractionPowerKw(row.speedKph, row.accelMs2, segment.gradientPct, profile);
    if (kw > peakKw) {
      peakKw = kw;
      peakTSec = s;
      peakAccel = row.accelMs2;
    }
    const probability = probabilityFromPower(kw, thresholdKw);
    if (etaSec === null && probability >= 0.5) etaSec = s;
    if (s % 5 === 0 || s === 1) points.push({ tSec: s, predictedKw: Number(kw.toFixed(2)), probability });
  }

  let event: string;
  if (peakAccel >= 0.8) event = "High acceleration demand";
  else if (peakKw > thresholdKw) event = "Sustained high traction demand";
  else event = "No high-load event expected";

  return {
    points,
    peakKw: Number(peakKw.toFixed(2)),
    peakTSec,
    etaSec,
    probability: probabilityFromPower(peakKw, thresholdKw),
    event,
  };
}

// ---------------------------------------------------------------------------
// State stepping
// ---------------------------------------------------------------------------

export type SimParams = {
  profile: VehicleProfile;
  thresholdKw: number;
  horizonSec: number;
};

export const DEFAULT_SIM_PARAMS: SimParams = {
  profile: DEMO_VEHICLE,
  thresholdKw: DEFAULT_THRESHOLD_KW,
  horizonSec: DEFAULT_HORIZON_SEC,
};

function decorate(latest: Omit<TelemetryPoint, "predictedMaxKw" | "eventEtaSec" | "predictedEvent" | "predictionStatus" | "highLoadProbability">, params: SimParams): TelemetryPoint {
  const forecast = forecastDemand(latest, params.horizonSec, params.thresholdKw, params.profile);
  const scEnergyKwh = supercapStoredEnergyKwh(latest.supercapSocPct, params.profile);
  const prePosition = forecast.peakKw > params.thresholdKw && scEnergyKwh > 0.004 && supercapMaxAssistKw(latest.supercapSocPct, params.profile) > 0.5;
  const recommendedMode: RecommendedMode =
    latest.powerKw < -0.5
      ? "Regenerative Energy Recovery"
      : prePosition
        ? "Battery + Supercapacitor Assistance"
        : "Battery Only";
  return {
    ...latest,
    highLoadProbability: forecast.probability,
    predictedMaxKw: forecast.peakKw,
    eventEtaSec: forecast.etaSec,
    predictedEvent: forecast.event,
    predictionStatus: forecast.etaSec !== null ? "High-load event predicted" : "No event predicted",
    recommendedMode,
  };
}

/** Canonical demo snapshot — the exact labelled values from the demo spec. */
export function createCanonicalPoint(params: SimParams = DEFAULT_SIM_PARAMS): TelemetryPoint {
  const row = cycleAt(0);
  const profile = params.profile;
  const segment = routeSegmentAtKm(0);
  const base: Omit<TelemetryPoint, "predictedMaxKw" | "eventEtaSec" | "predictedEvent" | "predictionStatus" | "highLoadProbability"> = {
    t: 0,
    speedKph: row.speedKph,
    prevSpeedKph: row.speedKph,
    accelMs2: row.accelMs2,
    gradientPct: segment.gradientPct,
    segmentIndex: 0,
    segmentName: segment.name,
    powerKw: Number(tractionPowerKw(row.speedKph, row.accelMs2, segment.gradientPct, profile).toFixed(2)),
    batteryKw: 0,
    supercapKw: 0,
    batterySocPct: profile.initialBatterySocPct,
    batterySohPct: profile.batterySohPct,
    supercapSocPct: profile.initialSupercapSocPct,
    distanceCoveredKm: 0,
    distanceRemainingKm: DEMO_ROUTE.lengthKm,
    remainingEnergyKwh: Number(((profile.batteryCapacityKwh * profile.initialBatterySocPct) / 100).toFixed(1)),
    energyKwhPerKm: 0.24,
    recommendedMode: "Battery Only",
  };
  const demand = base.powerKw;
  const scMax = supercapMaxAssistKw(base.supercapSocPct, profile);
  const supercapKw = demand > params.thresholdKw ? Math.min(demand - profile.batteryContinuousPowerKw, scMax) : 0;
  base.batteryKw = Number((demand - supercapKw).toFixed(2));
  base.supercapKw = Number(supercapKw.toFixed(2));
  const decorated = decorate(base, params);
  return decorated;
}

/** Advance the shared simulation by one second. */
export function stepSim(prev: TelemetryPoint, params: SimParams = DEFAULT_SIM_PARAMS): TelemetryPoint {
  const { profile, thresholdKw } = params;
  const row = cycleAt(prev.t + 1);
  const speedKph = row.speedKph;
  const accelMs2 = row.accelMs2;
  const distanceCoveredKm = prev.distanceCoveredKm + (speedKph / 3.6) / 1000;
  const wrapped = distanceCoveredKm >= DEMO_ROUTE.lengthKm;
  const posInLap = wrapped ? distanceCoveredKm - DEMO_ROUTE.lengthKm : distanceCoveredKm;
  const segment = routeSegmentAtKm(posInLap);
  const powerKw = tractionPowerKw(speedKph, accelMs2, segment.gradientPct, profile);

  // Energy split between battery and supercapacitor (demo decision rules).
  let batteryKw: number;
  let supercapKw: number;
  const scEnergyKwh = supercapStoredEnergyKwh(prev.supercapSocPct, profile);
  const scMax = supercapMaxAssistKw(prev.supercapSocPct, profile);
  if (powerKw < -0.5) {
    // Regenerative braking: most recovered energy goes to the supercapacitor.
    supercapKw = powerKw * 0.7;
    batteryKw = powerKw * 0.3;
  } else {
    supercapKw = powerKw > thresholdKw ? Math.min(powerKw - profile.batteryContinuousPowerKw, scMax) : 0;
    batteryKw = powerKw - supercapKw;
    // Gentle battery top-up of the supercapacitor while cruising.
    if (supercapKw === 0 && powerKw < thresholdKw * 0.4 && prev.supercapSocPct < 95 && scEnergyKwh > 0) {
      supercapKw = -0.5;
      batteryKw += 0.5;
    }
  }

  const lapReset = wrapped;
  const batterySocPct = lapReset
    ? profile.initialBatterySocPct
    : Math.max(5, Math.min(100, prev.batterySocPct - (batteryKw / 3600 / profile.batteryCapacityKwh) * 100));
  const scEnergyNow = supercapStoredEnergyKwh(prev.supercapSocPct, profile);
  const supercapSocPct = lapReset
    ? profile.initialSupercapSocPct
    : Math.max(0, Math.min(100, prev.supercapSocPct - ((supercapKw / 3600) / Math.max(scEnergyNow, 1e-6)) * 100));

  const energyKwhPerKm = distanceCoveredKm > 0.2 ? Number((Math.max(powerKw, 0) / speedKph).toFixed(3)) : prev.energyKwhPerKm;

  const next: Omit<TelemetryPoint, "predictedMaxKw" | "eventEtaSec" | "predictedEvent" | "predictionStatus" | "highLoadProbability"> = {
    t: prev.t + 1,
    speedKph: Number(speedKph.toFixed(2)),
    prevSpeedKph: prev.speedKph,
    accelMs2,
    gradientPct: segment.gradientPct,
    segmentIndex: DEMO_SEGMENTS.indexOf(segment),
    segmentName: segment.name,
    powerKw: Number(powerKw.toFixed(2)),
    batteryKw: Number(batteryKw.toFixed(2)),
    supercapKw: Number(supercapKw.toFixed(2)),
    batterySocPct: Number(batterySocPct.toFixed(2)),
    batterySohPct: prev.batterySohPct,
    supercapSocPct: Number(supercapSocPct.toFixed(2)),
    distanceCoveredKm: Number(distanceCoveredKm.toFixed(3)),
    distanceRemainingKm: Number(Math.max(0, DEMO_ROUTE.lengthKm - posInLap).toFixed(2)),
    remainingEnergyKwh: Number(((profile.batteryCapacityKwh * batterySocPct) / 100).toFixed(1)),
    energyKwhPerKm,
    recommendedMode: prev.recommendedMode,
  };
  return decorate(next, params);
}

export { mergeProfile, DEMO_ROUTE, DEMO_VEHICLE, DEMO_SEGMENTS, supercapStoredEnergyKwh, supercapMaxAssistKw, tractionPowerKw, routeSegmentAtKm };
export {
  DEMO_INTERSECTIONS,
  DEMO_TRIPS,
  DEMO_HIGH_LOAD_THRESHOLD_KW,
  DEFAULT_THRESHOLD_KW,
  DEFAULT_HORIZON_SEC,
  STRATEGIES,
  evaluateStrategy,
  evaluateAllStrategies,
  signalDemandEffect,
  nextIntersectionAhead,
  tripEnergyConsumedKwh,
  tripEnergyPerKm,
} from "./demo-data";

/** Strategy comparison snapshot used by the dashboard panel (simulated). */
export function strategyComparison(latest: TelemetryPoint) {
  const hybridPeak = Math.max(latest.batteryKw, 0.1);
  return {
    batteryOnly: {
      peakBatteryPowerKw: Math.max(latest.powerKw, 0.1),
      socUsedLast60sPct: 0.42,
      energyKwhPerKm: Number((latest.energyKwhPerKm * 1.04).toFixed(3)),
      stressIndex: 0.68,
    },
    hybrid: {
      peakBatteryPowerKw: hybridPeak,
      socUsedLast60sPct: 0.31,
      energyKwhPerKm: latest.energyKwhPerKm,
      stressIndex: 0.41,
    },
  };
}
