import type { User } from 'firebase/auth';
import {
  Timestamp,
  collection,
  doc,
  getDoc,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
  writeBatch,
  type DocumentSnapshot,
} from 'firebase/firestore';
import { FEED, PHOTO } from '../config/photos';
import type { FeedPhoto } from '../lib/feed';
import { roundLatLon, type LatLon } from '../lib/geo';
import { preparePhoto, type PreparedPhoto } from '../lib/image';
import { getCurrentLocation } from '../lib/location';
import { db } from './firebase';

const PHOTOS = 'photos';
const PHOTO_IMAGES = 'photoImages';
const REPORTS = 'reports';

function requireField<T>(data: Record<string, unknown>, field: string, type: 'string' | 'number'): T {
  const value = data[field];
  if (typeof value !== type) throw new Error(`photos doc: "${field}" must be a ${type}`);
  return value as T;
}

function toFeedPhoto(snapshot: DocumentSnapshot): FeedPhoto {
  // 'estimate' fills a pending serverTimestamp() with the local clock until the server confirms.
  const data = snapshot.data({ serverTimestamps: 'estimate' });
  if (data === undefined) throw new Error(`photos/${snapshot.id} has no data`);
  const createdAt = data['createdAt'];
  if (!(createdAt instanceof Timestamp)) throw new Error(`photos/${snapshot.id}: createdAt is not a Timestamp`);
  return {
    id: snapshot.id,
    uid: requireField(data, 'uid', 'string'),
    authorName: requireField(data, 'authorName', 'string'),
    authorPhoto: requireField(data, 'authorPhoto', 'string'),
    lat: requireField(data, 'lat', 'number'),
    lon: requireField(data, 'lon', 'number'),
    thumb: requireField(data, 'thumb', 'string'),
    createdAt: createdAt.toDate(),
    reportCount: requireField(data, 'reportCount', 'number'),
  };
}

/** Writes the photo metadata + thumbnail and the full image in one atomic batch. */
export async function uploadPhoto(user: User, photo: PreparedPhoto, location: LatLon): Promise<string> {
  const rounded = roundLatLon(location, PHOTO.coordDecimals);
  const photoRef = doc(collection(db, PHOTOS));
  const batch = writeBatch(db);
  batch.set(photoRef, {
    uid: user.uid,
    authorName: user.displayName ?? 'Anonymous',
    authorPhoto: user.photoURL ?? '',
    lat: rounded.lat,
    lon: rounded.lon,
    thumb: photo.thumb,
    createdAt: serverTimestamp(),
    reportCount: 0,
  });
  batch.set(doc(db, PHOTO_IMAGES, photoRef.id), { uid: user.uid, image: photo.image });
  await batch.commit();
  return photoRef.id;
}

/**
 * Live feed of the last 24 h (cutoff fixed at subscribe time; callers re-filter with
 * visiblePhotos() so photos still drop out as they age).
 */
export function subscribeToFeed(
  onChange: (photos: FeedPhoto[]) => void,
  onError: (error: Error) => void,
): () => void {
  const feedQuery = query(
    collection(db, PHOTOS),
    where('createdAt', '>', Timestamp.fromMillis(Date.now() - FEED.windowMs)),
    orderBy('createdAt', 'desc'),
    limit(FEED.limit),
  );
  return onSnapshot(feedQuery, (snapshot) => onChange(snapshot.docs.map(toFeedPhoto)), onError);
}

export async function loadFullImage(photoId: string): Promise<string> {
  const snapshot = await getDoc(doc(db, PHOTO_IMAGES, photoId));
  if (!snapshot.exists()) throw new Error('This photo has been deleted.');
  return requireField(snapshot.data(), 'image', 'string');
}

/** One report per user per photo; the report doc and the counter change together (see firestore.rules). */
export async function reportPhoto(photoId: string, reporterUid: string): Promise<void> {
  const reportRef = doc(db, PHOTOS, photoId, REPORTS, reporterUid);
  if ((await getDoc(reportRef)).exists()) throw new Error('You already reported this photo.');
  const batch = writeBatch(db);
  batch.set(reportRef, { createdAt: serverTimestamp() });
  batch.update(doc(db, PHOTOS, photoId), { reportCount: increment(1) });
  await batch.commit();
}

export async function deletePhoto(photoId: string): Promise<void> {
  const batch = writeBatch(db);
  batch.delete(doc(db, PHOTOS, photoId));
  batch.delete(doc(db, PHOTO_IMAGES, photoId));
  await batch.commit();
}

/** Full "I see a rainbow" flow: compress the photo and take a fresh GPS fix in parallel, then upload. */
export async function shareRainbowPhoto(user: User, file: File): Promise<string> {
  const [prepared, location] = await Promise.all([preparePhoto(file), getCurrentLocation()]);
  return uploadPhoto(user, prepared, location);
}
