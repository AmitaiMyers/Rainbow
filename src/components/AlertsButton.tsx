import { useState } from 'react';
import { notificationsSupported } from '../lib/notify';

export function AlertsButton() {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(() =>
    notificationsSupported() ? Notification.permission : 'unsupported',
  );

  if (permission === 'unsupported') {
    return (
      <p className="hint">
        This browser can't show notifications. On iPhone, tap Share → “Add to Home Screen” and open
        the app from there.
      </p>
    );
  }
  if (permission === 'granted') {
    return <p className="hint">🔔 Rainbow alerts are on while the app is open.</p>;
  }
  if (permission === 'denied') {
    return <p className="hint">Notifications are blocked. Allow them in your browser's site settings.</p>;
  }
  return (
    <button className="button secondary" onClick={() => void Notification.requestPermission().then(setPermission)}>
      🔔 Turn on rainbow alerts
    </button>
  );
}
