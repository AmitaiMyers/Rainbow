import { describe, expect, it, vi } from 'vitest';
import { LOCAL_PLAN, WORLD_PLAN } from '../config/rainbow';
import { estimateRainbows } from './rainbowForecast';
import type { CurrentWeather, WeatherFetcher } from './weather';

const AT_EQUATOR = { lat: 0, lon: 0 };
// 2024-03-20 08:00 UTC at lon 0: sun ≈ 30° up in the east → inside the rainbow window
const MORNING = new Date('2024-03-20T08:00:00Z');
const MIDNIGHT = new Date('2024-03-20T00:00:00Z');

function fakeFetcher(observer: CurrentWeather, sample: CurrentWeather): WeatherFetcher {
  return vi.fn<WeatherFetcher>(async (points) => points.map((_, i) => (i === 0 ? observer : sample)));
}

describe('estimateRainbows', () => {
  it('does not call the weather API when the sun rules a rainbow out', async () => {
    const fetcher = vi.fn<WeatherFetcher>();
    const [estimate] = await estimateRainbows([AT_EQUATOR], LOCAL_PLAN, MIDNIGHT, fetcher);
    expect(fetcher).not.toHaveBeenCalled();
    expect(estimate?.score).toBe(0);
    expect(estimate?.directRadiationWm2).toBeNull();
  });

  it('requests observer + 9 samples and scores a sunny morning with rain in the west', async () => {
    const fetcher = fakeFetcher(
      { directRadiationWm2: 600, precipitationMm: 0 },
      { directRadiationWm2: 0, precipitationMm: 1 },
    );
    const [estimate] = await estimateRainbows([AT_EQUATOR], LOCAL_PLAN, MORNING, fetcher);
    expect(fetcher).toHaveBeenCalledOnce();
    expect(vi.mocked(fetcher).mock.calls[0]?.[0]).toHaveLength(10);
    expect(estimate?.score).toBe(100);
    expect(estimate?.lookLabel).toBe('W');
  });

  it('batches many origins into one request and maps results back in order', async () => {
    const origins = [AT_EQUATOR, { lat: 0, lon: 180 }, { lat: 0, lon: 1 }]; // middle one is at night
    const fetcher = vi.fn<WeatherFetcher>(async (points) =>
      points.map((p) => ({
        directRadiationWm2: 600,
        precipitationMm: p.lon > 0.5 ? 1 : 0, // only origin #3's sample is rainy
      })),
    );
    const estimates = await estimateRainbows(origins, WORLD_PLAN, MORNING, fetcher);
    expect(vi.mocked(fetcher).mock.calls[0]?.[0]).toHaveLength(4); // 2 daytime origins × 2 points
    expect(estimates.map((e) => e.score)).toEqual([0, 0, 100]);
  });
});
