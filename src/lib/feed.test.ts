import { describe, expect, it } from 'vitest';
import { FEED } from '../config/photos';
import { visiblePhotos, type FeedPhoto } from './feed';
import { timeAgo } from './time';

const now = new Date('2024-06-01T12:00:00Z');
const photo = (id: string, ageMs: number, reportCount = 0): FeedPhoto => ({
  id,
  uid: 'u',
  authorName: 'A',
  authorPhoto: '',
  lat: 0,
  lon: 0,
  thumb: '',
  createdAt: new Date(now.getTime() - ageMs),
  reportCount,
});

describe('visiblePhotos', () => {
  it('keeps the last 24 h, hides reported photos, newest first', () => {
    const result = visiblePhotos(
      [
        photo('old', FEED.windowMs + 1),
        photo('a', 5000),
        photo('reported', 1000, FEED.hideAtReports),
        photo('b', 1000, FEED.hideAtReports - 1),
      ],
      now,
    );
    expect(result.map((p) => p.id)).toEqual(['b', 'a']);
  });
});

describe('timeAgo', () => {
  it('formats relative times', () => {
    expect(timeAgo(new Date(now.getTime() - 30_000), now)).toBe('just now');
    expect(timeAgo(new Date(now.getTime() - 5 * 60_000), now)).toBe('5 min ago');
    expect(timeAgo(new Date(now.getTime() - 3 * 3_600_000), now)).toBe('3 h ago');
  });
});
