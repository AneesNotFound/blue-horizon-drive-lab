/*
 * Software simulation of the hybrid battery-supercapacitor vehicle used for
 * Phase 1 demo data. Every value produced here is SIMULATED / DEMO data, not
 * real telemetry. The prediction values come from a transparent demo
 * heuristic, NOT from a trained model — the real prediction backend is a
 * later phase.
 */

export const SIMULATION_LABEL = "Simulated (demo)";

/** Demo vehicle parameters — clearly labelled demo values. */
export const DEMO_VEHICLE = {
  massKg: 1500,
  dragCoefficient: 0.28,
  frontalAreaM2: 2.2,
  rollingResistance: 0.01,
  drivetrainEfficiency: 0.92,
  batteryCapacityKwh: 55,
  batteryMaxPowerKw: 80,
  supercapCapacitanceF: 120,
  supercapVoltageMax: 48,
  supercapVoltageMin: 24,
  converterEfficiency: 0.95,
};

/**
 * Demo high-load threshold. In a later phase this will be calibrated from
 * training data (e.g. the 90th percentile of positive traction power).
 */
export const DEMO_HIGH_LOAD_THRESHOLD_KW = 25;

export const DEMO_ROUTE = {
  name: "Demo Route A — Urban corridor",
  origin: "Campus North Gate (demo)",
  destination: "Riverside Business Park (demo)",
  lengthKm: 12.4,
  typicalDurationMin: 24,
  source: "Demo data — no Google Maps integration yet",
} as const;

export type TelemetryPoint = {
  t: number; // seconds since simulation start
  speedKph: number;
  accelMs2: number;
  powerKw: number; // traction power demand (+) / regen (-)
  batteryKw: number;
  supercapKw: number;
  batterySocPct: number;
  batterySohPct: number;
  supercapSocPct: number;
  distanceKm: number;
  energyKwhPerKm: number;
  highLoadProbability: number;
  recommendedMode: RecommendedMode;
};

export type RecommendedMode =
  | "Battery Only"
  | "Battery + Supercapacitor Assistance"
  | "Regenerative Energy Recovery"
  | "Insufficient Data / Safe Fallback";

const AIR_DENSITY = 1.2;

/** Traction power from a documented vehicle power model (rolling + aero + accel). */
export function tractionPowerKw(speedKph: number, accelMs2: number, v = DEMO_VEHICLE): number {
  const vms = speedKph / 3.6;
  if (vms <= 0) return 0;
  const rolling = v.rollingResistance * v.massKg * 9.81 * vms; // W
  const aero = 0.5 * AIR_DENSITY * v.dragCoefficient * v.frontalAreaM2 * vms * vms; // W
  const accel = v.massKg * accelMs2 * vms; // W
  const gross = rolling + aero + Math.max(accel, 0);
  const regen = Math.min(accel, 0) * vms * 0.6; // partial regenerative braking
  const net = gross + regen;
  const signed = net >= 0 ? net / v.drivetrainEfficiency : net * v.drivetrainEfficiency;
  return signed / 1000; // kW
}

export function supercapStoredEnergyKwh(socPct: number, v = DEMO_VEHICLE): number {
  // E = 1/2 * C * V^2 at the voltage corresponding to the current SOC.
  const vNow = v.supercapVoltageMin + ((v.supercapVoltageMax - v.supercapVoltageMin) * socPct) / 100;
  return 0.5 * v.supercapCapacitanceF * vNow * vNow / 3_600_000; // J -> kWh
}

/** Deterministic pseudo-random generator so server and client agree. */
function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function createInitialState(t = 0): TelemetryPoint {
  const point: TelemetryPoint = {
    t,
    speedKph: 32,
    accelMs2: 0,
    powerKw: tractionPowerKw(32, 0),
    batteryKw: tractionPowerKw(32, 0),
    supercapKw: 0,
    batterySocPct: 78,
    batterySohPct: 96.5,
    supercapSocPct: 85,
    distanceKm: DEMO_ROUTE.lengthKm,
    energyKwhPerKm: 0.148,
    highLoadProbability: 0.18,
    recommendedMode: "Battery Only",
  };
  return point;
}

/** Advance the simulated drive by one second. */
export function stepSim(prev: TelemetryPoint, rng = makeRng((prev.t + 1) * 7919)): TelemetryPoint {
  const r = rng();

  // Simulated driving profile: urban cruise with occasional acceleration bursts.
  let targetSpeed = 34 + 18 * Math.sin(prev.t / 40) + 6 * (r - 0.5);
  const burstWindow = prev.t % 90;
  if (burstWindow > 78) targetSpeed = Math.min(68, targetSpeed + 26); // burst / overtake scenario
  const accelMs2 = Math.max(-2.2, Math.min(1.8, (targetSpeed - prev.speedKph) / 3.6 / 2.2));

  const speedKph = Math.max(0, prev.speedKph + accelMs2 * 3.6);
  const powerKw = tractionPowerKw(speedKph, accelMs2);

  // Energy split between battery and supercapacitor (simple demo rule):
  // during high demand the supercap covers the share above its power band.
  const scEnergyKwh = supercapStoredEnergyKwh(prev.supercapSocPct);
  const canAssist = powerKw > DEMO_HIGH_LOAD_THRESHOLD_KW && scEnergyKwh > 0.002;
  const supercapKw = canAssist ? Math.min(powerKw - DEMO_HIGH_LOAD_THRESHOLD_KW * 0.6, 18) : 0;
  const batteryKw = powerKw - supercapKw;

  const batterySocPct = Math.max(
    5,
    Math.min(100, prev.batterySocPct - (batteryKw * 1) / 3600 / DEMO_VEHICLE.batteryCapacityKwh * 100 * 1.05),
  );
  const supercapSocPct = Math.max(
    0,
    Math.min(100, prev.supercapSocPct - (supercapKw * 1) / 3600 / Math.max(scEnergyKwh, 1e-6) * 100 + (powerKw < 0 ? 14 : 0.4)),
  );

  const distanceKm = Math.max(0, prev.distanceKm - (speedKph / 3.6) / 1000);
  const energyKwhPerKm = speedKph > 5 ? Math.abs(powerKw) / (speedKph / 3.6) / 1000 * 1000 : prev.energyKwhPerKm;

  // Demo high-load heuristic for the next 60 seconds. This is NOT a trained
  // model — it reads the simulated near-future speed profile only.
  const upcomingBurst = (prev.t % 90) > 62 && (prev.t % 90) < 80;
  const baseProb = upcomingBurst ? 0.82 : 0.12 + 0.25 * Math.abs(accelMs2) / 2;
  const highLoadProbability = Math.max(0.02, Math.min(0.97, baseProb + 0.08 * (r - 0.5)));

  const recommendedMode: RecommendedMode =
    powerKw < -0.5
      ? "Regenerative Energy Recovery"
      : canAssist
        ? "Battery + Supercapacitor Assistance"
        : "Battery Only";

  return {
    t: prev.t + 1,
    speedKph,
    accelMs2,
    powerKw,
    batteryKw,
    supercapKw,
    batterySocPct,
    batterySohPct: prev.batterySohPct,
    supercapSocPct,
    distanceKm,
    energyKwhPerKm,
    highLoadProbability,
    recommendedMode,
  };
}

/** Simulated 60-second forward power-demand projection (5 s resolution). */
export function forecastDemand(latest: TelemetryPoint) {
  const points: { tSec: number; predictedKw: number; probability: number }[] = [];
  for (let s = 5; s <= 60; s += 5) {
    const futureT = latest.t + s;
    const phase = futureT % 90;
    const burst = phase > 78 && phase < 92;
    const baseKw = 8 + 9 * Math.sin(futureT / 40) + (burst ? 24 : 0);
    const predictedKw = Math.max(0, baseKw + 2 * Math.sin(futureT / 7));
    points.push({
      tSec: s,
      predictedKw: Number(predictedKw.toFixed(2)),
      probability: Number(
        Math.max(0.02, Math.min(0.97, burst ? 0.8 : 0.1 + predictedKw / DEMO_HIGH_LOAD_THRESHOLD_KW / 3)).toFixed(2),
      ),
    });
  }
  return points;
}

/** Battery-only vs hybrid strategy comparison for the demo run (simulated). */
export function strategyComparison(latest: TelemetryPoint) {
  const hybridPeak = Math.max(latest.batteryKw, 0.1);
  return {
    batteryOnly: {
      peakBatteryPowerKw: Math.max(latest.powerKw, 0.1),
      socUsedLast60sPct: 0.42,
      energyKwhPerKm: latest.energyKwhPerKm * 1.04,
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

/** Demo recent trips shown on the dashboard and Trip History page. */
export const DEMO_TRIPS = [
  { id: "demo-trip-001", route: DEMO_ROUTE.name, scenario: "Urban stop-and-go", distanceKm: 11.9, energyKwhPerKm: 0.152, strategy: "AI-predictive hybrid", peakBatteryKw: 41.2, completedAt: "Demo run" },
  { id: "demo-trip-002", route: DEMO_ROUTE.name, scenario: "Mixed urban + arterial", distanceKm: 12.4, energyKwhPerKm: 0.141, strategy: "Rule-based hybrid", peakBatteryKw: 47.8, completedAt: "Demo run" },
  { id: "demo-trip-003", route: DEMO_ROUTE.name, scenario: "Free-flow arterial", distanceKm: 12.4, energyKwhPerKm: 0.127, strategy: "Battery-only", peakBatteryKw: 52.4, completedAt: "Demo run" },
];

/** Demo intersections along Demo Route A (all values demo/simulated). */
export const DEMO_INTERSECTIONS = [
  { id: "ix-1", name: "North Gate junction", distanceKm: 1.1, stoppingLikelihood: 0.72, signalState: "Unavailable" as const, type: "Signalised" },
  { id: "ix-2", name: "Market Street crossing", distanceKm: 3.4, stoppingLikelihood: 0.55, signalState: "Unavailable" as const, type: "Signalised" },
  { id: "ix-3", name: "Ring Road merge", distanceKm: 5.9, stoppingLikelihood: 0.28, signalState: "Unavailable" as const, type: "Unsignalised" },
  { id: "ix-4", name: "Riverside Drive signals", distanceKm: 9.6, stoppingLikelihood: 0.64, signalState: "Unavailable" as const, type: "Signalised" },
];
