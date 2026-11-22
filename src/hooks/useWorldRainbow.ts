import { useEffect, useState } from 'react';
import { WATCH, WORLD_PLAN } from '../config/rainbow';
import { CITIES, type City } from '../data/cities';
import { estimateRainbows, type RainbowEstimate } from '../lib/rainbowForecast';
import { fetchCurrentWeather } from '../lib/weather';
import { errorMessage, type AsyncState } from '../lib/asyncState';

export interface CityEstimate {
  readonly city: City;
  readonly estimate: RainbowEstimate;
}

/** Module-level cache so switching tabs does not refetch within 15 minutes. */
let cache: { readonly at: number; readonly value: CityEstimate[] } | null = null;

async function loadWorld(): Promise<CityEstimate[]> {
  const now = new Date();
  if (cache !== null && now.getTime() - cache.at < WATCH.worldCacheMs) return cache.value;
  const estimates = await estimateRainbows(CITIES, WORLD_PLAN, now, fetchCurrentWeather);
  const value = CITIES.map((city, i) => {
    const estimate = estimates[i];
    if (estimate === undefined) throw new Error(`Missing estimate for ${city.name}`);
    return { city, estimate };
  });
  cache = { at: now.getTime(), value };
  return value;
}

/** Light rainbow scores for ~100 world cities, refreshed every 15 minutes while `active`. */
export function useWorldRainbow(active: boolean): AsyncState<CityEstimate[]> {
  const [state, setState] = useState<AsyncState<CityEstimate[]>>({ status: 'idle' });

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    const run = () =>
      loadWorld().then(
        (value) => !cancelled && setState({ status: 'ok', value }),
        (error: unknown) => !cancelled && setState({ status: 'error', message: errorMessage(error) }),
      );
    setState((previous) => (previous.status === 'ok' ? previous : { status: 'loading' }));
    void run();
    const id = window.setInterval(run, WATCH.worldCacheMs);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [active]);

  return state;
}
