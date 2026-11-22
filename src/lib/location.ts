import type { LatLon } from './geo';

const GEOLOCATION_ERRORS: Record<number, string> = {
  1: 'Location permission was denied. Enable it in your browser settings.',
  2: 'Your location is unavailable right now.',
  3: 'Getting your location timed out.',
};

export function describeGeolocationError(error: GeolocationPositionError): string {
  const message = GEOLOCATION_ERRORS[error.code];
  if (message === undefined) throw new Error(`Unknown geolocation error code ${error.code}: ${error.message}`);
  return message;
}

export function toLatLon(position: GeolocationPosition): LatLon {
  return { lat: position.coords.latitude, lon: position.coords.longitude };
}

/** One fresh, high-accuracy GPS fix (used when capturing a photo). */
export function getCurrentLocation(): Promise<LatLon> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => resolve(toLatLon(position)),
      (error) => reject(new Error(describeGeolocationError(error))),
      { enableHighAccuracy: true, maximumAge: 60_000, timeout: 20_000 },
    );
  });
}
