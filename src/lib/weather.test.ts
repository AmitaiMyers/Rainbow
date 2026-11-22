import { describe, expect, it } from 'vitest';
import { buildWeatherUrl, parseWeatherResponse } from './weather';

const location = (radiation: number, precipitation: number) => ({
  latitude: 32,
  longitude: 35,
  current: { time: '2024-03-20T08:00', interval: 900, direct_radiation: radiation, precipitation },
});

describe('buildWeatherUrl', () => {
  it('joins coordinates and requests current variables', () => {
    const url = new URL(buildWeatherUrl([{ lat: 32.123456, lon: 34.7 }, { lat: -1, lon: 2 }]));
    expect(url.searchParams.get('latitude')).toBe('32.1235,-1');
    expect(url.searchParams.get('longitude')).toBe('34.7,2');
    expect(url.searchParams.get('current')).toBe('direct_radiation,precipitation');
  });

  it('rejects an empty point list', () => {
    expect(() => buildWeatherUrl([])).toThrow();
  });
});

describe('parseWeatherResponse', () => {
  it('accepts a single object for one location', () => {
    expect(parseWeatherResponse(location(300, 0.1), 1)).toEqual([
      { directRadiationWm2: 300, precipitationMm: 0.1 },
    ]);
  });

  it('accepts an array for several locations', () => {
    expect(parseWeatherResponse([location(1, 2), location(3, 4)], 2)).toHaveLength(2);
  });

  it('fails fast on a count mismatch or missing values', () => {
    expect(() => parseWeatherResponse([location(1, 2)], 2)).toThrow(/expected 2/);
    expect(() => parseWeatherResponse({ current: { precipitation: 1 } }, 1)).toThrow(
      /direct_radiation/,
    );
    expect(() => parseWeatherResponse({ error: true, reason: 'bad' }, 1)).toThrow(/current/);
  });
});
