import type { LatLon } from './geo';
import { clamp, mod, toDeg, toRad } from './math';

export interface SunPosition {
  /** Degrees above the horizon (negative = below). Geometric, no refraction. */
  readonly elevationDeg: number;
  /** Degrees clockwise from true north (90 = east, 180 = south). */
  readonly azimuthDeg: number;
}

const MS_PER_DAY = 86_400_000;
const UNIX_EPOCH_JULIAN_DAY = 2_440_587.5;
const J2000_JULIAN_DAY = 2_451_545;
const DAYS_PER_JULIAN_CENTURY = 36_525;

/**
 * Solar position using the NOAA solar-calculator equations
 * (accurate to well under 1° for dates near the present — enough for rainbows).
 */
export function sunPosition(date: Date, observer: LatLon): SunPosition {
  const julianDay = date.getTime() / MS_PER_DAY + UNIX_EPOCH_JULIAN_DAY;
  const t = (julianDay - J2000_JULIAN_DAY) / DAYS_PER_JULIAN_CENTURY;

  const meanLongitude = mod(280.46646 + t * (36000.76983 + t * 0.0003032), 360);
  const meanAnomaly = 357.52911 + t * (35999.05029 - 0.0001537 * t);
  const eccentricity = 0.016708634 - t * (0.000042037 + 0.0000001267 * t);
  const m = toRad(meanAnomaly);

  const equationOfCenter =
    Math.sin(m) * (1.914602 - t * (0.004817 + 0.000014 * t)) +
    Math.sin(2 * m) * (0.019993 - 0.000101 * t) +
    Math.sin(3 * m) * 0.000289;

  const omega = toRad(125.04 - 1934.136 * t);
  const apparentLongitude = toRad(meanLongitude + equationOfCenter - 0.00569 - 0.00478 * Math.sin(omega));

  const meanObliquity =
    23 + (26 + (21.448 - t * (46.815 + t * (0.00059 - t * 0.001813))) / 60) / 60;
  const obliquity = toRad(meanObliquity + 0.00256 * Math.cos(omega));

  const declination = Math.asin(Math.sin(obliquity) * Math.sin(apparentLongitude));

  const y = Math.tan(obliquity / 2) ** 2;
  const l0 = toRad(meanLongitude);
  const equationOfTimeMinutes =
    4 *
    toDeg(
      y * Math.sin(2 * l0) -
        2 * eccentricity * Math.sin(m) +
        4 * eccentricity * y * Math.sin(m) * Math.cos(2 * l0) -
        0.5 * y * y * Math.sin(4 * l0) -
        1.25 * eccentricity * eccentricity * Math.sin(2 * m),
    );

  const utcMinutes =
    date.getUTCHours() * 60 + date.getUTCMinutes() + date.getUTCSeconds() / 60;
  const trueSolarMinutes = mod(utcMinutes + equationOfTimeMinutes + 4 * observer.lon, 1440);
  const hourAngle = toRad(trueSolarMinutes / 4 - 180);

  const lat = toRad(observer.lat);
  const cosZenith =
    Math.sin(lat) * Math.sin(declination) +
    Math.cos(lat) * Math.cos(declination) * Math.cos(hourAngle);
  const zenith = Math.acos(clamp(cosZenith, -1, 1));

  const azimuthFromSouth = Math.atan2(
    Math.sin(hourAngle),
    Math.cos(hourAngle) * Math.sin(lat) - Math.tan(declination) * Math.cos(lat),
  );

  return {
    elevationDeg: 90 - toDeg(zenith),
    azimuthDeg: mod(toDeg(azimuthFromSouth) + 180, 360),
  };
}
