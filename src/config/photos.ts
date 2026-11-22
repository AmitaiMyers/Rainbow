/**
 * Photo and feed limits (see docs/SDD.md §6–7).
 * IMPORTANT: the *MaxChars values are also enforced in firestore.rules — keep them in sync.
 */
export const PHOTO = {
  fullMaxSidePx: 1080,
  fullStartQuality: 0.8,
  fullMinQuality: 0.5,
  /** ≈ 330 KB of JPEG as a base64 data URL. Must match firestore.rules (photoImages.image). */
  fullMaxChars: 450_000,
  thumbMaxSidePx: 240,
  thumbStartQuality: 0.7,
  thumbMinQuality: 0.4,
  /** Must match firestore.rules (photos.thumb). */
  thumbMaxChars: 40_000,
  qualityStep: 0.1,
  /** 2 decimals ≈ 1.1 km — location privacy. */
  coordDecimals: 2,
} as const;

export const FEED = {
  windowMs: 24 * 60 * 60 * 1000,
  limit: 200,
  hideAtReports: 3,
} as const;
