import { useCallback, useEffect, useRef, useState } from 'react';
import { LOCAL_PLAN, WATCH } from '../config/rainbow';
import { distanceKm, type LatLon } from '../lib/geo';
import { notifyIfRainbowLikely } from '../lib/notify';
import { estimateRainbows, type RainbowEstimate } from '../lib/rainbowForecast';
import { fetchCurrentWeather } from '../lib/weather';
import { errorMessage, type AsyncState } from '../lib/asyncState';

async function estimateHere(position: LatLon): Promise<RainbowEstimate> {
  const [estimate] = await estimateRainbows([position], LOCAL_PLAN, new Date(), fetchCurrentWeather);
  if (estimate === undefined) throw new Error('Rainbow estimate is missing');
  await notifyIfRainbowLikely(estimate);
  return estimate;
}

/**
 * Re-computes the local rainbow score every 10 minutes and whenever the user moves more
 * than 2 km, and fires a local notification when it passes the threshold.
 */
export function useRainbowWatch(position: LatLon | null): AsyncState<RainbowEstimate> {
  const [state, setState] = useState<AsyncState<RainbowEstimate>>({ status: 'idle' });
  const positionRef = useRef<LatLon | null>(null);
  const lastComputedAt = useRef<LatLon | null>(null);
  /** Only the latest request may update state (also invalidated on unmount). */
  const latestRequest = useRef(0);

  const run = useCallback((origin: LatLon) => {
    const requestId = ++latestRequest.current;
    lastComputedAt.current = origin;
    setState((previous) => (previous.status === 'ok' ? previous : { status: 'loading' }));
    estimateHere(origin).then(
      (value) => requestId === latestRequest.current && setState({ status: 'ok', value }),
      (error: unknown) =>
        requestId === latestRequest.current &&
        setState({ status: 'error', message: errorMessage(error) }),
    );
  }, []);

  // Position changes: recompute only after a significant move.
  useEffect(() => {
    positionRef.current = position;
    if (position === null) return;
    const last = lastComputedAt.current;
    if (last === null || distanceKm(last, position) > WATCH.moveThresholdKm) run(position);
  }, [position, run]);

  // Periodic refresh, independent of how often the GPS reports.
  useEffect(() => {
    const id = window.setInterval(() => {
      if (positionRef.current !== null) run(positionRef.current);
    }, WATCH.intervalMs);
    return () => {
      window.clearInterval(id);
      // Invalidate in-flight requests and force a fresh run if the hook is re-mounted.
      latestRequest.current += 1;
      lastComputedAt.current = null;
    };
  }, [run]);

  return state;
}
