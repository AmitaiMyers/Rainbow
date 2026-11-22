import { clamp, mod, toDeg, toRad } from './math';

export interface LatLon {
  readonly lat: number;
  readonly lon: number;
}

const EARTH_RADIUS_KM = 6371;

const COMPASS_POINTS = [
  'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
  'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW',
] as const;

export function normalizeBearing(deg: number): number {
  return mod(deg, 360);
}

export function normalizeLongitude(deg: number): number {
  return mod(deg + 180, 360) - 180;
}

/** Point reached by travelling `distanceKm` from `origin` on a great circle with initial `bearingDeg`. */
export function destinationPoint(origin: LatLon, bearingDeg: number, distanceKm: number): LatLon {
  const angular = distanceKm / EARTH_RADIUS_KM;
  const bearing = toRad(bearingDeg);
  const lat1 = toRad(origin.lat);
  const lon1 = toRad(origin.lon);

  const sinLat2 =
    Math.sin(lat1) * Math.cos(angular) + Math.cos(lat1) * Math.sin(angular) * Math.cos(bearing);
  const lat2 = Math.asin(clamp(sinLat2, -1, 1));
  const lon2 =
    lon1 +
    Math.atan2(
      Math.sin(bearing) * Math.sin(angular) * Math.cos(lat1),
      Math.cos(angular) - Math.sin(lat1) * Math.sin(lat2),
    );

  return { lat: toDeg(lat2), lon: normalizeLongitude(toDeg(lon2)) };
}

/** Great-circle (haversine) distance in km. */
export function distanceKm(a: LatLon, b: LatLon): number {
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(clamp(h, 0, 1)));
}

export function roundCoord(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function roundLatLon(point: LatLon, decimals: number): LatLon {
  return { lat: roundCoord(point.lat, decimals), lon: roundCoord(point.lon, decimals) };
}

/** 16-point compass label, e.g. 112° → "ESE". */
export function compassLabel(bearingDeg: number): string {
  const index = Math.round(normalizeBearing(bearingDeg) / 22.5) % COMPASS_POINTS.length;
  const label = COMPASS_POINTS[index];
  if (label === undefined) throw new Error(`No compass label for bearing ${bearingDeg}`);
  return label;
}
