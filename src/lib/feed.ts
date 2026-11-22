import { FEED } from '../config/photos';

export interface FeedPhoto {
  readonly id: string;
  readonly uid: string;
  readonly authorName: string;
  readonly authorPhoto: string;
  readonly lat: number;
  readonly lon: number;
  readonly thumb: string;
  readonly createdAt: Date;
  readonly reportCount: number;
}

/** Photos from the last 24 h that have not been hidden by reports, newest first. */
export function visiblePhotos(photos: readonly FeedPhoto[], now: Date): FeedPhoto[] {
  const cutoff = now.getTime() - FEED.windowMs;
  return photos
    .filter((p) => p.createdAt.getTime() > cutoff && p.reportCount < FEED.hideAtReports)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
