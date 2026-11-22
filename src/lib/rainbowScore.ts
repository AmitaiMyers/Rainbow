import { RAINBOW, type SamplingPlan } from '../config/rainbow';
import { destinationPoint, normalizeBearing, type LatLon } from './geo';
import { ramp } from './math';

export interface ScoreInputs {
  readonly sunElevationDeg: number;
  readonly directRadiationWm2: number;
  readonly maxAntisolarPrecipitationMm: number;
}

export interface ScoreBreakdown {
  readonly sunFactor: number;
  readonly clearFactor: number;
  readonly rainFactor: number;
  /** 0–100 */
  readonly score: number;
}

/** 0 when the sun is down or higher than 42°, 1 in the sweet spot, linear ramps in between. */
export function sunFactor(elevationDeg: number): number {
  if (elevationDeg <= 0 || elevationDeg >= RAINBOW.maxSunElevationDeg) return 0;
  const rising = ramp(elevationDeg, 0, RAINBOW.sunRampUpEndDeg);
  const falling = ramp(elevationDeg, RAINBOW.maxSunElevationDeg, RAINBOW.sunRampDownStartDeg);
  return Math.min(rising, falling);
}

/** How strongly the sun is actually shining on the observer. */
export function clearFactor(directRadiationWm2: number): number {
  return ramp(directRadiationWm2, 0, RAINBOW.fullDirectRadiationWm2);
}

/** How much rain is falling in the antisolar direction. */
export function rainFactor(precipitationMm: number): number {
  return ramp(precipitationMm, 0, RAINBOW.fullRainMm);
}

export function scoreRainbow(inputs: ScoreInputs): ScoreBreakdown {
  const sun = sunFactor(inputs.sunElevationDeg);
  const clear = clearFactor(inputs.directRadiationWm2);
  const rain = rainFactor(inputs.maxAntisolarPrecipitationMm);
  return {
    sunFactor: sun,
    clearFactor: clear,
    rainFactor: rain,
    score: Math.round(100 * sun * clear * rain),
  };
}

/** The rainbow appears opposite the sun. */
export function antisolarBearing(sunAzimuthDeg: number): number {
  return normalizeBearing(sunAzimuthDeg + 180);
}

/** Rain sample points around the antisolar direction, per the sampling plan. */
export function antisolarSamplePoints(
  origin: LatLon,
  antisolarBearingDeg: number,
  plan: SamplingPlan,
): LatLon[] {
  return plan.distancesKm.flatMap((distance) =>
    plan.bearingOffsetsDeg.map((offset) =>
      destinationPoint(origin, antisolarBearingDeg + offset, distance),
    ),
  );
}
