import { describe, expect, it } from 'vitest';
import { encodeWithinLimit, fitWithin, qualitySteps } from './image';

describe('fitWithin', () => {
  it('scales landscape and portrait images by their longest side', () => {
    expect(fitWithin({ width: 4000, height: 3000 }, 1080)).toEqual({ width: 1080, height: 810 });
    expect(fitWithin({ width: 3000, height: 4000 }, 1080)).toEqual({ width: 810, height: 1080 });
  });

  it('never upscales', () => {
    expect(fitWithin({ width: 200, height: 100 }, 1080)).toEqual({ width: 200, height: 100 });
  });
});

describe('qualitySteps', () => {
  it('includes both ends', () => {
    expect(qualitySteps(0.8, 0.5, 0.1)).toEqual([0.8, 0.7, 0.6, 0.5]);
  });
});

describe('encodeWithinLimit', () => {
  const target = { maxSidePx: 100, startQuality: 0.8, minQuality: 0.5, maxChars: 650 };
  const fakeEncode = (quality: number) => 'x'.repeat(Math.round(quality * 1000));

  it('lowers quality until the result fits', () => {
    expect(encodeWithinLimit(fakeEncode, target)).toHaveLength(600);
  });

  it('throws when even the minimum quality is too large', () => {
    expect(() => encodeWithinLimit(fakeEncode, { ...target, maxChars: 100 })).toThrow(/too detailed/);
  });
});
