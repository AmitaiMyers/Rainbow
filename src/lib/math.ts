export const DEG_TO_RAD = Math.PI / 180;
export const RAD_TO_DEG = 180 / Math.PI;

export function toRad(deg: number): number {
  return deg * DEG_TO_RAD;
}

export function toDeg(rad: number): number {
  return rad * RAD_TO_DEG;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Positive modulo: result is always in [0, divisor). */
export function mod(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}

/** Linear 0..1 position of `value` between `from` and `to` (clamped). Works for from > to too. */
export function ramp(value: number, from: number, to: number): number {
  return clamp((value - from) / (to - from), 0, 1);
}
