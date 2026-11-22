import { describe, expect, it } from 'vitest';
import {
  compassLabel,
  destinationPoint,
  distanceKm,
  normalizeBearing,
  normalizeLongitude,
  roundLatLon,
} from './geo';

describe('geo', () => {
  it('moves ~0.09° of latitude per 10 km northwards', () => {
    const p = destinationPoint({ lat: 0, lon: 0 }, 0, 10);
    expect(p.lat).toBeCloseTo(0.0899, 3);
    expect(p.lon).toBeCloseTo(0, 6);
  });

  it('round-trips destinationPoint with distanceKm', () => {
    const origin = { lat: 32.08, lon: 34.78 };
    for (const bearing of [0, 45, 112, 250, 359]) {
      const p = destinationPoint(origin, bearing, 15);
      expect(distanceKm(origin, p)).toBeCloseTo(15, 6);
    }
  });

  it('wraps across the antimeridian', () => {
    const p = destinationPoint({ lat: 0, lon: 179.99 }, 90, 10);
    expect(p.lon).toBeLessThan(-179);
  });

  it('measures London–Paris as ~344 km', () => {
    expect(distanceKm({ lat: 51.5074, lon: -0.1278 }, { lat: 48.8566, lon: 2.3522 })).toBeCloseTo(
      344,
      -1,
    );
  });

  it('normalizes bearings and longitudes', () => {
    expect(normalizeBearing(-90)).toBe(270);
    expect(normalizeBearing(720)).toBe(0);
    expect(normalizeLongitude(190)).toBe(-170);
    expect(normalizeLongitude(-181)).toBe(179);
  });

  it('rounds coordinates for privacy', () => {
    expect(roundLatLon({ lat: 32.08567, lon: 34.78123 }, 2)).toEqual({ lat: 32.09, lon: 34.78 });
  });

  it('labels compass bearings', () => {
    expect(compassLabel(0)).toBe('N');
    expect(compassLabel(112)).toBe('ESE');
    expect(compassLabel(180)).toBe('S');
    expect(compassLabel(355)).toBe('N');
    expect(compassLabel(-90)).toBe('W');
  });
});
