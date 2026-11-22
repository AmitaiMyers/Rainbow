import type { LatLon } from './geo';
import { roundLatLon } from './geo';

/** Current conditions for one point (Open-Meteo `current`, 15-minute model data). */
export interface CurrentWeather {
  /** W/m², average of the preceding 15 minutes. */
  readonly directRadiationWm2: number;
  /** mm, sum of the preceding 15 minutes. */
  readonly precipitationMm: number;
}

export type WeatherFetcher = (points: readonly LatLon[]) => Promise<CurrentWeather[]>;

const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';
const CURRENT_VARIABLES = 'direct_radiation,precipitation';
const URL_COORD_DECIMALS = 4;

export function buildWeatherUrl(points: readonly LatLon[]): string {
  if (points.length === 0) throw new Error('buildWeatherUrl: at least one point is required');
  const rounded = points.map((point) => roundLatLon(point, URL_COORD_DECIMALS));
  const params = new URLSearchParams({
    latitude: rounded.map((p) => p.lat).join(','),
    longitude: rounded.map((p) => p.lon).join(','),
    current: CURRENT_VARIABLES,
    timezone: 'GMT',
  });
  return `${OPEN_METEO_URL}?${params.toString()}`;
}

function requireFiniteNumber(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`Open-Meteo response: "${field}" must be a finite number, got ${String(value)}`);
  }
  return value;
}

function parseLocation(location: unknown, index: number): CurrentWeather {
  if (typeof location !== 'object' || location === null || !('current' in location)) {
    throw new Error(`Open-Meteo response: location #${index} has no "current" block`);
  }
  const current = location.current;
  if (typeof current !== 'object' || current === null) {
    throw new Error(`Open-Meteo response: location #${index} "current" is not an object`);
  }
  const fields = current as Record<string, unknown>;
  return {
    directRadiationWm2: requireFiniteNumber(fields['direct_radiation'], 'current.direct_radiation'),
    precipitationMm: requireFiniteNumber(fields['precipitation'], 'current.precipitation'),
  };
}

/**
 * Open-Meteo returns a single object for one location and an array for several.
 * The result is always one entry per requested point, in request order.
 */
export function parseWeatherResponse(body: unknown, expectedCount: number): CurrentWeather[] {
  const locations = Array.isArray(body) ? body : [body];
  if (locations.length !== expectedCount) {
    throw new Error(
      `Open-Meteo response: expected ${expectedCount} locations, got ${locations.length}`,
    );
  }
  return locations.map(parseLocation);
}

export const fetchCurrentWeather: WeatherFetcher = async (points) => {
  const response = await fetch(buildWeatherUrl(points));
  if (!response.ok) {
    throw new Error(`Open-Meteo request failed: HTTP ${response.status} ${await response.text()}`);
  }
  return parseWeatherResponse(await response.json(), points.length);
};
