import { describe, expect, it } from 'vitest';
import { NOTIFY } from '../config/rainbow';
import { shouldNotify } from './notify';

describe('shouldNotify', () => {
  const now = 10 * NOTIFY.cooldownMs;

  it('needs the score to reach the threshold', () => {
    expect(shouldNotify(NOTIFY.minScore - 1, null, now)).toBe(false);
    expect(shouldNotify(NOTIFY.minScore, null, now)).toBe(true);
  });

  it('respects the cooldown', () => {
    expect(shouldNotify(100, now - NOTIFY.cooldownMs + 1, now)).toBe(false);
    expect(shouldNotify(100, now - NOTIFY.cooldownMs, now)).toBe(true);
  });
});
