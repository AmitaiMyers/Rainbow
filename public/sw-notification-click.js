// Imported into the generated Workbox service worker (vite.config.ts → workbox.importScripts).
// Focuses the open app (or opens it) when the user taps a rainbow notification.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      const existing = windows[0];
      return existing ? existing.focus() : self.clients.openWindow('/');
    }),
  );
});
