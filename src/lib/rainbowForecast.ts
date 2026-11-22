import type { SamplingPlan } from '../config/rainbow';
import { compassLabel, type LatLon } from './geo';
import {
  antisolarBearing,
  antisolarSamplePoints,
  scoreRainbow,
  sunFactor,
  type ScoreBreakdown,
} from './rainbowScore';
import { sunPosition } from './sun';
import type { CurrentWeather, WeatherFetcher } from './weather';

export interface RainbowEstimate extends ScoreBreakdown {
  readonly origin: LatLon;
  readonly sunElevationDeg: number;
  /** Where to look: the antisolar bearing, degrees clockwise from north. */
  readonly lookBearingDeg: number;
  readonly lookLabel: string;
  /** null when no weather was needed (sun outside the 0–42° window). */
  readonly directRadiationWm2: number | null;
  readonly maxAntisolarPrecipitationMm: number | null;
  readonly computedAt: Date;
}

interface OriginPlan {
  readonly origin: LatLon;
  readonly sunElevationDeg: number;
  readonly lookBearingDeg: number;
  /** [observer, ...rain samples], empty when the sun rules out a rainbow. */
  readonly weatherPoints: readonly LatLon[];
}

function planOrigin(origin: LatLon, now: Date, plan: SamplingPlan): OriginPlan {
  const sun = sunPosition(now, origin);
  const lookBearingDeg = antisolarBearing(sun.azimuthDeg);
  const needsWeather = sunFactor(sun.elevationDeg) > 0;
  return {
    origin,
    sunElevationDeg: sun.elevationDeg,
    lookBearingDeg,
    weatherPoints: needsWeather
      ? [origin, ...antisolarSamplePoints(origin, lookBearingDeg, plan)]
      : [],
  };
}

function buildEstimate(
  plan: OriginPlan,
  weather: readonly CurrentWeather[],
  now: Date,
): RainbowEstimate {
  const [observer, ...samples] = weather;
  const directRadiationWm2 = observer === undefined ? null : observer.directRadiationWm2;
  const maxAntisolarPrecipitationMm =
    observer === undefined ? null : Math.max(...samples.map((s) => s.precipitationMm));

  const breakdown = scoreRainbow({
    sunElevationDeg: plan.sunElevationDeg,
    directRadiationWm2: directRadiationWm2 ?? 0,
    maxAntisolarPrecipitationMm: maxAntisolarPrecipitationMm ?? 0,
  });

  return {
    ...breakdown,
    origin: plan.origin,
    sunElevationDeg: plan.sunElevationDeg,
    lookBearingDeg: plan.lookBearingDeg,
    lookLabel: compassLabel(plan.lookBearingDeg),
    directRadiationWm2,
    maxAntisolarPrecipitationMm,
    computedAt: now,
  };
}

/**
 * Rainbow estimates for many origins with a single weather request.
 * Origins where the sun rules out a rainbow (night, or sun above 42°) need no weather data.
 */
export async function estimateRainbows(
  origins: readonly LatLon[],
  plan: SamplingPlan,
  now: Date,
  fetchWeather: WeatherFetcher,
): Promise<RainbowEstimate[]> {
  const plans = origins.map((origin) => planOrigin(origin, now, plan));
  const allPoints = plans.flatMap((p) => p.weatherPoints);
  const weather = allPoints.length === 0 ? [] : await fetchWeather(allPoints);

  let offset = 0;
  return plans.map((p) => {
    const slice = weather.slice(offset, offset + p.weatherPoints.length);
    offset += p.weatherPoints.length;
    return buildEstimate(p, slice, now);
  });
}
