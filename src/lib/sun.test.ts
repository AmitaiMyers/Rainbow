import { describe, expect, it } from 'vitest';
import { sunPosition } from './sun';

const LONDON = { lat: 51.5, lon: 0 };

describe('sunPosition', () => {
  it('puts the sun near the zenith at the equator at solar noon on the March equinox', () => {
    // EoT ≈ -7.5 min on 2024-03-20 → solar noon at lon 0 ≈ 12:07:30 UTC
    const sun = sunPosition(new Date('2024-03-20T12:07:30Z'), { lat: 0, lon: 0 });
    expect(sun.elevationDeg).toBeGreaterThan(89);
  });

  it('matches 90 - lat + declination at solar noon on the June solstice (London)', () => {
    // EoT ≈ -1.8 min on 2024-06-20 → solar noon ≈ 12:01:48 UTC; declination ≈ 23.44°
    const sun = sunPosition(new Date('2024-06-20T12:01:48Z'), LONDON);
    expect(sun.elevationDeg).toBeCloseTo(90 - 51.5 + 23.44, 0);
    expect(Math.abs(sun.azimuthDeg - 180)).toBeLessThan(1);
  });

  it('matches 90 - lat - declination at solar noon on the December solstice (London)', () => {
    // EoT ≈ +1.9 min on 2024-12-21 → solar noon ≈ 11:58 UTC
    const sun = sunPosition(new Date('2024-12-21T11:58:00Z'), LONDON);
    expect(sun.elevationDeg).toBeCloseTo(90 - 51.5 - 23.44, 0);
  });

  it('is in the east in the morning and the west in the afternoon', () => {
    const morning = sunPosition(new Date('2024-03-20T07:00:00Z'), { lat: 32, lon: 0 });
    const afternoon = sunPosition(new Date('2024-03-20T17:00:00Z'), { lat: 32, lon: 0 });
    expect(morning.azimuthDeg).toBeGreaterThan(80);
    expect(morning.azimuthDeg).toBeLessThan(110);
    expect(afternoon.azimuthDeg).toBeGreaterThan(250);
    expect(afternoon.azimuthDeg).toBeLessThan(280);
    expect(morning.elevationDeg).toBeGreaterThan(0);
  });

  it('is well below the horizon at local midnight', () => {
    const sun = sunPosition(new Date('2024-03-20T00:00:00Z'), { lat: 0, lon: 0 });
    expect(sun.elevationDeg).toBeLessThan(-60);
  });

  it('accounts for longitude (Tel Aviv sun is up at 06:00 UTC in June)', () => {
    const sun = sunPosition(new Date('2024-06-21T06:00:00Z'), { lat: 32.08, lon: 34.78 });
    expect(sun.elevationDeg).toBeGreaterThan(30);
    expect(sun.azimuthDeg).toBeGreaterThan(60);
    expect(sun.azimuthDeg).toBeLessThan(110);
  });
});
