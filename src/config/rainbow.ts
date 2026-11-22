/**
 * Tunable thresholds for the rainbow-score algorithm (see docs/SDD.md §4).
 * All physics/weather constants live here so they can be tuned in one place.
 */
export const RAINBOW = {
  /** A primary rainbow is centred on the antisolar point with a 42° radius. */
  maxSunElevationDeg: 42,
  /** Sun factor ramps 0 → 1 between the horizon and this elevation. */
  sunRampUpEndDeg: 5,
  /** Sun factor ramps 1 → 0 between this elevation and maxSunElevationDeg. */
  sunRampDownStartDeg: 35,
  /** Direct radiation (W/m²) at which the observer counts as fully sunlit. */
  fullDirectRadiationWm2: 200,
  /**
   * Precipitation (mm in the preceding 15 minutes, Open-Meteo `current`) at which rain
   * counts as fully present. 0.25 mm / 15 min ≈ 1 mm/h, a typical light-to-moderate shower.
   */
  fullRainMm: 0.25,
} as const;

/** Sampling of rain points in the antisolar direction. */
export interface SamplingPlan {
  readonly distancesKm: readonly number[];
  readonly bearingOffsetsDeg: readonly number[];
}

/** Full plan for the user's own location: 3 distances × 3 bearings = 9 points. */
export const LOCAL_PLAN: SamplingPlan = {
  distancesKm: [3, 8, 15],
  bearingOffsetsDeg: [-20, 0, 20],
};

/** Light plan for the world layer: 1 point per city (see SDD §4.4). */
export const WORLD_PLAN: SamplingPlan = {
  distancesKm: [8],
  bearingOffsetsDeg: [0],
};

export const WATCH = {
  /** Re-compute the local score this often while the app is open. */
  intervalMs: 10 * 60 * 1000,
  /** Re-compute immediately when the user moved further than this. */
  moveThresholdKm: 2,
  /** World-layer results are reused for this long. */
  worldCacheMs: 15 * 60 * 1000,
} as const;

export const NOTIFY = {
  minScore: 60,
  cooldownMs: 60 * 60 * 1000,
} as const;
