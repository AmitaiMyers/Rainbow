import { useCallback, useEffect, useState } from 'react';
import type { LatLon } from '../lib/geo';
import { describeGeolocationError, toLatLon } from '../lib/location';

export type LocationState =
  | { readonly status: 'idle' }
  | { readonly status: 'locating' }
  | { readonly status: 'ok'; readonly position: LatLon }
  | { readonly status: 'error'; readonly message: string };

/**
 * Watches the device position. Starts automatically when permission was granted before,
 * otherwise only after the user presses a button (`start`).
 */
export function useLocation(): { state: LocationState; start: () => void } {
  const [state, setState] = useState<LocationState>({ status: 'idle' });
  const [watching, setWatching] = useState(false);

  useEffect(() => {
    if (!watching) return;
    setState({ status: 'locating' });
    const id = navigator.geolocation.watchPosition(
      (position) => setState({ status: 'ok', position: toLatLon(position) }),
      (error) => setState({ status: 'error', message: describeGeolocationError(error) }),
      { enableHighAccuracy: false, maximumAge: 5 * 60_000, timeout: 30_000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [watching]);

  useEffect(() => {
    if (!('permissions' in navigator)) return;
    void navigator.permissions.query({ name: 'geolocation' }).then((status) => {
      if (status.state === 'granted') setWatching(true);
    });
  }, []);

  const start = useCallback(() => setWatching(true), []);
  return { state, start };
}
