# Rainbow Finder — Software Design Document (POC)

Status: **Draft for review**
Scope: Proof of concept PWA

---

## 1. Goal

A Progressive Web App that:

1. Uses the phone's location and live weather data to estimate the chance of seeing a rainbow nearby, and notifies the user when the chance is high.
2. Lets a signed-in user photograph a rainbow and upload it.
3. Shows rainbow photos from around the world in real time on a map and in a live list.

## 2. Decisions (agreed)

| Topic | Decision |
|---|---|
| Frontend | React + Vite + TypeScript, `vite-plugin-pwa` |
| Backend | Firebase **Spark (free) plan**: Firestore, Auth, Hosting. No Cloud Functions, no Cloud Storage |
| Weather | Open-Meteo Forecast API (free, no key) |
| Notifications | Client-side checks while the app is open. Local notifications through the Service Worker (`registration.showNotification`). No server push |
| Trigger | Rainbow score ≥ 60 (0–100) within about 15 km, at most one notification per hour |
| Auth | Google sign-in (Firebase Auth). Required to upload or report; **reading the feed is public** (see §10) |
| Photo storage | Compressed JPEG stored as a base64 data URL in Firestore |
| Photo location | Device GPS at the moment of capture, rounded to 2 decimals (about 1.1 km) |
| Feed | Leaflet + OpenStreetMap world map with pins, plus a live list. Shows the last 24 h |
| Moderation | Firestore security rules plus a "Report" button. Hidden at 3 or more distinct reports |
| Language / hosting | English UI, Firebase Hosting (HTTPS) |
| Tests | Vitest unit tests for core logic |

## 3. Architecture

```
┌──────────────────────────── Browser / installed PWA ────────────────────────────┐
│                                                                                 │
│  React UI ── hooks ──┬── lib/rainbowScore (pure) ◄── lib/sun (pure)             │
│                      │          ▲                                               │
│                      │          └── lib/weather ──────────► Open-Meteo API      │
│                      ├── lib/notify ─► Service Worker.showNotification          │
│                      ├── services/photos ──────────────► Firestore (realtime)   │
│                      └── services/auth ────────────────► Firebase Auth (Google) │
│                                                                                 │
│  Service Worker (Workbox via vite-plugin-pwa): app-shell cache + notifications  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

There is no custom server. Every calculation runs on the client.

## 4. Rainbow score algorithm

A primary rainbow is visible when **all** of these hold:

* **Sun is low:** sun elevation `h` is between 0° and 42° (the bow is centred on the antisolar point, 42° in radius).
* **Sun reaches the observer:** the sky toward the sun is mostly clear where the user stands.
* **Rain is opposite the sun:** rain is falling in the antisolar direction (sun azimuth + 180°), within a few km to about 15 km.

### 4.1 Inputs

* `lat, lon`: user position
* `now`: current UTC time
* Sun position (`lib/sun.ts`): elevation and azimuth from the NOAA solar position equations (pure function, unit-tested against known values).
* Weather (`lib/weather.ts`): one Open-Meteo request for several coordinates:
  * **Observer point** `(lat, lon)`: `cloud_cover`, `direct_radiation`, `precipitation`
  * **9 antisolar sample points**: distances 3, 8 and 15 km × bearings `antisolar − 20°`, `antisolar`, `antisolar + 20°`: `precipitation` (mm, current 15-minute value)
  * Endpoint: `https://api.open-meteo.com/v1/forecast?latitude=a,b,…&longitude=x,y,…&current=…` (one call, 10 locations).
  * The exact variable availability under `current=` will be checked against the live API at the start of implementation. If `direct_radiation` is not available there, we use the `minutely_15` value for the current slot.

### 4.2 Factors (each 0..1)

```
sunFactor   = 0                      if h ≤ 0 or h ≥ 42
            = ramp up 0→1 over h ∈ (0, 5]
            = 1                      for h ∈ [5, 35]
            = ramp down 1→0 over h ∈ [35, 42)

clearFactor = clamp(direct_radiation / 200 W/m², 0, 1)      // the sun is actually shining on the observer

rainFactor  = clamp(max(precipitation at the 9 antisolar points) / 0.5 mm, 0, 1)

score       = round(100 × sunFactor × clearFactor × rainFactor)
```

The thresholds (`5°`, `35°`, `200 W/m²`, `0.5 mm`, notify at `60`) live as named constants in one config module (`src/config/rainbow.ts`) so they can be tuned.

The score also returns the **direction to look** (antisolar azimuth as a compass bearing, e.g. "Look East-South-East"), which is shown in the UI and in the notification.

## 5. Notifications (Spark plan, no server)

* On first visit the user grants **Location** and **Notifications** permissions (requested on a button press, not on load).
* While the app is open (foreground or a background tab), `useRainbowWatch` recalculates the score **every 10 minutes**, and also when the position moves more than 2 km.
* If `score ≥ 60` and no rainbow notification was sent in the last 60 minutes (timestamp in `localStorage`), it calls `registration.showNotification("Rainbow likely nearby!", { body: "Look ESE — score 78" })`.

**Known limitations (accepted for the POC):**

* There are no notifications when the app is fully closed. Mobile browsers suspend background tabs, so a reliable alert needs the app in the foreground or recently used.
* iOS shows web notifications only for a PWA **installed to the Home Screen** (iOS 16.4+).
* A later upgrade path is to move to Blaze and add a scheduled Cloud Function with FCM web push.

## 6. Photo capture and upload

1. The user taps **"I see a rainbow!"** (signed-in only).
2. `<input type="file" accept="image/*" capture="environment">` opens the rear camera.
3. `lib/image.ts` resizes the image on a canvas:
   * **full**: longest side 1080 px, JPEG quality 0.8, target ≤ 300 KB (quality is lowered step by step if it's larger; upload fails with a clear error if it's still too large at q = 0.5)
   * **thumb**: longest side 240 px, JPEG quality 0.7, ≤ 30 KB
4. The current GPS position is read (`getCurrentPosition`, high accuracy) and rounded to 2 decimals.
5. One Firestore **batch** writes `photos/{id}` (metadata + thumbnail) and `photoImages/{id}` (full image).

The full image sits in its own document so that the map and list download only the small thumbnails. The full image loads when a photo is opened.

## 7. Data model (Firestore)

```
photos/{photoId}
  uid:          string            // author (Firebase Auth uid)
  authorName:   string            // Google displayName
  authorPhoto:  string            // Google photoURL
  lat:          number            // rounded to 2 decimals
  lon:          number
  thumb:        string            // data:image/jpeg;base64,…  (≤ 40 000 chars)
  createdAt:    timestamp         // serverTimestamp()
  reportCount:  number            // starts at 0

photos/{photoId}/reports/{uid}    // one document per reporting user (dedupe)
  createdAt:    timestamp

photoImages/{photoId}
  uid:          string
  image:        string            // data:image/jpeg;base64,…  (≤ 450 000 chars)
```

**Live feed query:** `photos where createdAt > now − 24h orderBy createdAt desc limit 200`, through `onSnapshot` for real-time updates. Photos with `reportCount ≥ 3` are filtered out on the client (Firestore can't combine this with the range filter without a composite index, and the client filter is simpler at POC scale).

**Free-tier budget:** 1 GiB storage is about 3,000 photos at roughly 330 KB each, and the 50k reads/day are shared across all users. Both are fine for a POC.

## 8. Security rules (summary)

* `photos`, `photoImages`: **read** is public. **create** requires sign-in, `uid == request.auth.uid`, the exact field set, size limits on `thumb`/`image`, valid lat/lon ranges, `createdAt == request.time` and `reportCount == 0`. **delete** is author only. **update** is allowed only as a report: `reportCount` increases by exactly 1 and nothing else changes, with `!exists(reports/{auth.uid})` and `existsAfter(reports/{auth.uid})` in the same batch.
* `reports/{uid}`: create only where the document id equals `request.auth.uid`. No update or delete.
* Everything else is denied.

## 9. Project structure

```
index.html
vite.config.ts               # React + vite-plugin-pwa (manifest, icons, Workbox)
firebase.json                # Hosting (dist/) + Firestore rules/indexes
firestore.rules
firestore.indexes.json
.env.example                 # VITE_FIREBASE_* placeholders
src/
  main.tsx, App.tsx
  config/firebase.ts         # init from import.meta.env (fails fast if a key is missing)
  config/rainbow.ts          # tunable thresholds
  lib/sun.ts                 # solar elevation/azimuth            (unit-tested)
  lib/geo.ts                 # destination point, rounding, distance (unit-tested)
  lib/rainbowScore.ts        # pure score + look-direction        (unit-tested)
  lib/weather.ts             # Open-Meteo client + response validation
  lib/image.ts               # resize/compress helpers            (unit-tested: size math)
  lib/notify.ts              # permission + cooldown + showNotification
  services/auth.ts           # Google sign-in/out
  services/photos.ts         # upload batch, live feed, report, delete
  hooks/useLocation.ts, useRainbowWatch.ts, usePhotoFeed.ts, useAuth.ts
  components/ScoreCard.tsx, MapView.tsx, PhotoList.tsx, PhotoViewer.tsx,
             CaptureButton.tsx, SignInButton.tsx
```

**Screens (one page, bottom tab bar):** **Now** (score card, look-direction, enable-alerts button, "I see a rainbow!") · **Map** (world map with thumbnail pins) · **Feed** (live list, newest first, Report/Delete).

## 10. Open questions (please confirm)

1. **"Calculate the weather in the world":** this design calculates the rainbow chance **only around the user**, and the world view comes from user photos. Do you also want a global "rainbow chance" layer on the map (for example, a score for ~100 major cities refreshed when the map opens)? It's extra Open-Meteo load but still free.
2. **Public feed:** is it OK that anyone can **view** photos without signing in (sign-in needed only to upload or report)?
3. **Firebase config:** please send the web app config (`apiKey`, `authDomain`, `projectId`, `appId`, `messagingSenderId`; `storageBucket` isn't needed). Also confirm that **Google** is enabled under Authentication → Sign-in method, and that the Hosting domain (`<project>.web.app`) is in Authorized domains.

## 11. Risks

* **Google sign-in in an installed iOS PWA:** popups can fail in standalone mode. We use `signInWithPopup` and fall back to `signInWithRedirect`; for the redirect to work, `authDomain` should be set to the Hosting domain.
* **OpenStreetMap tile policy:** acceptable for low POC traffic, and attribution is shown. A production version would need a tile provider.
* **Score accuracy:** model weather is coarse (km grid, 15-minute steps), so the score is a "likelihood" hint, not a guarantee.
