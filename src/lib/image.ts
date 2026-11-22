import { PHOTO } from '../config/photos';

export interface Size {
  readonly width: number;
  readonly height: number;
}

export interface CompressionTarget {
  readonly maxSidePx: number;
  readonly startQuality: number;
  readonly minQuality: number;
  readonly maxChars: number;
}

export interface PreparedPhoto {
  /** data:image/jpeg;base64,… */
  readonly image: string;
  readonly thumb: string;
}

const FULL_TARGET: CompressionTarget = {
  maxSidePx: PHOTO.fullMaxSidePx,
  startQuality: PHOTO.fullStartQuality,
  minQuality: PHOTO.fullMinQuality,
  maxChars: PHOTO.fullMaxChars,
};

const THUMB_TARGET: CompressionTarget = {
  maxSidePx: PHOTO.thumbMaxSidePx,
  startQuality: PHOTO.thumbStartQuality,
  minQuality: PHOTO.thumbMinQuality,
  maxChars: PHOTO.thumbMaxChars,
};

/** Scale `size` down (never up) so its longest side is at most `maxSide`. */
export function fitWithin(size: Size, maxSide: number): Size {
  const scale = Math.min(1, maxSide / Math.max(size.width, size.height));
  return {
    width: Math.max(1, Math.round(size.width * scale)),
    height: Math.max(1, Math.round(size.height * scale)),
  };
}

/** Qualities to try, from start down to min (inclusive), in `step` decrements. */
export function qualitySteps(start: number, min: number, step: number): number[] {
  const steps: number[] = [];
  for (let q = start; q >= min - 1e-9; q -= step) steps.push(Math.round(q * 100) / 100);
  return steps;
}

/** Encode at decreasing quality until the result fits in `maxChars`. Throws if it never fits. */
export function encodeWithinLimit(
  encode: (quality: number) => string,
  target: CompressionTarget,
): string {
  for (const quality of qualitySteps(target.startQuality, target.minQuality, PHOTO.qualityStep)) {
    const encoded = encode(quality);
    if (encoded.length <= target.maxChars) return encoded;
  }
  throw new Error(
    `Photo is too detailed to compress below ${target.maxChars} characters at quality ${target.minQuality}`,
  );
}

function renderJpeg(bitmap: ImageBitmap, target: CompressionTarget): string {
  const size = fitWithin(bitmap, target.maxSidePx);
  const canvas = document.createElement('canvas');
  canvas.width = size.width;
  canvas.height = size.height;
  const context = canvas.getContext('2d');
  if (context === null) throw new Error('Canvas 2D context is not available');
  context.drawImage(bitmap, 0, 0, size.width, size.height);
  return encodeWithinLimit((quality) => canvas.toDataURL('image/jpeg', quality), target);
}

/** Resize + compress a captured photo into the full image and the feed thumbnail. */
export async function preparePhoto(file: File): Promise<PreparedPhoto> {
  if (!file.type.startsWith('image/')) throw new Error(`Not an image: ${file.type || 'unknown type'}`);
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const prepared = { image: renderJpeg(bitmap, FULL_TARGET), thumb: renderJpeg(bitmap, THUMB_TARGET) };
  bitmap.close();
  return prepared;
}
