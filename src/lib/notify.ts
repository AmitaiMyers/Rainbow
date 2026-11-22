import { NOTIFY } from '../config/rainbow';
import type { RainbowEstimate } from './rainbowForecast';

const LAST_SENT_KEY = 'rainbow:lastNotificationAt';

export function notificationsSupported(): boolean {
  return 'Notification' in window && 'serviceWorker' in navigator;
}

export function shouldNotify(score: number, lastSentAtMs: number | null, nowMs: number): boolean {
  if (score < NOTIFY.minScore) return false;
  return lastSentAtMs === null || nowMs - lastSentAtMs >= NOTIFY.cooldownMs;
}

function readLastSentAt(): number | null {
  const stored = localStorage.getItem(LAST_SENT_KEY);
  return stored === null ? null : Number(stored);
}

/** Shows a local notification through the service worker when the score passes the threshold. */
export async function notifyIfRainbowLikely(estimate: RainbowEstimate): Promise<boolean> {
  if (!notificationsSupported() || Notification.permission !== 'granted') return false;
  const nowMs = estimate.computedAt.getTime();
  if (!shouldNotify(estimate.score, readLastSentAt(), nowMs)) return false;

  const registration = await navigator.serviceWorker.ready;
  await registration.showNotification('🌈 Rainbow likely nearby!', {
    body: `Look ${estimate.lookLabel} (${Math.round(estimate.lookBearingDeg)}°) — rainbow score ${estimate.score}`,
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: 'rainbow-nearby',
  });
  localStorage.setItem(LAST_SENT_KEY, String(nowMs));
  return true;
}
