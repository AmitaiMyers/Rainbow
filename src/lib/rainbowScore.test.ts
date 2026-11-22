import { describe, expect, it } from 'vitest';
import { LOCAL_PLAN, RAINBOW } from '../config/rainbow';
import { distanceKm } from './geo';
import {
  antisolarBearing,
  antisolarSamplePoints,
  clearFactor,
  rainFactor,
  scoreRainbow,
  sunFactor,
} from './rainbowScore';

describe('sunFactor', () => {
  it('is 0 at night, at the horizon and at/above 42°', () => {
    expect(sunFactor(-10)).toBe(0);
    expect(sunFactor(0)).toBe(0);
    expect(sunFactor(42)).toBe(0);
    expect(sunFactor(60)).toBe(0);
  });

  it('is 1 in the sweet spot and ramps at both ends', () => {
    expect(sunFactor(RAINBOW.sunRampUpEndDeg)).toBe(1);
    expect(sunFactor(20)).toBe(1);
    expect(sunFactor(RAINBOW.sunRampDownStartDeg)).toBe(1);
    expect(sunFactor(2.5)).toBeCloseTo(0.5);
    expect(sunFactor(38.5)).toBeCloseTo(0.5);
  });
});

describe('clearFactor and rainFactor', () => {
  it('scale linearly and clamp to 0..1', () => {
    expect(clearFactor(0)).toBe(0);
    expect(clearFactor(RAINBOW.fullDirectRadiationWm2 / 2)).toBeCloseTo(0.5);
    expect(clearFactor(1000)).toBe(1);
    expect(rainFactor(0)).toBe(0);
    expect(rainFactor(RAINBOW.fullRainMm / 2)).toBeCloseTo(0.5);
    expect(rainFactor(10)).toBe(1);
  });
});

describe('scoreRainbow', () => {
  it('is 100 with a low sun, full sunshine and rain opposite', () => {
    const result = scoreRainbow({
      sunElevationDeg: 20,
      directRadiationWm2: 500,
      maxAntisolarPrecipitationMm: 2,
    });
    expect(result.score).toBe(100);
  });

  it('is 0 when any condition is missing', () => {
    const ideal = { sunElevationDeg: 20, directRadiationWm2: 500, maxAntisolarPrecipitationMm: 2 };
    expect(scoreRainbow({ ...ideal, sunElevationDeg: 50 }).score).toBe(0);
    expect(scoreRainbow({ ...ideal, directRadiationWm2: 0 }).score).toBe(0);
    expect(scoreRainbow({ ...ideal, maxAntisolarPrecipitationMm: 0 }).score).toBe(0);
  });

  it('multiplies partial factors', () => {
    const result = scoreRainbow({
      sunElevationDeg: 20,
      directRadiationWm2: RAINBOW.fullDirectRadiationWm2 / 2,
      maxAntisolarPrecipitationMm: RAINBOW.fullRainMm / 2,
    });
    expect(result.score).toBe(25);
  });
});

describe('antisolar sampling', () => {
  it('points opposite the sun', () => {
    expect(antisolarBearing(90)).toBe(270);
    expect(antisolarBearing(250)).toBe(70);
  });

  it('creates distances × offsets points at the planned distances', () => {
    const origin = { lat: 32, lon: 35 };
    const points = antisolarSamplePoints(origin, 270, LOCAL_PLAN);
    expect(points).toHaveLength(9);
    const distances = points.map((p) => Math.round(distanceKm(origin, p)));
    expect(distances).toEqual([3, 3, 3, 8, 8, 8, 15, 15, 15]);
    // Due west: the middle point of each ring keeps the latitude.
    expect(points[1]?.lat).toBeCloseTo(32, 2);
    expect(points[1]?.lon).toBeLessThan(35);
  });
});
