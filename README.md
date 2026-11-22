# Rainbow Finder 🌈

A Progressive Web App (POC) that tells you when a rainbow is likely near you, and lets people
share rainbow photos with the whole world in real time.

* **Now** — your rainbow chance (0–100) from the sun's position + live weather around you, with the
  direction to look. Local notification when the chance is high (while the app is open).
* **Map** — world map with the rainbow chance in ~110 cities and live photo pins.
* **Feed** — rainbow photos from the last 24 h, live. Google sign-in to upload/report.

Design: [`docs/SDD.md`](docs/SDD.md) · Deploy guide: [`docs/DEPLOY.md`](docs/DEPLOY.md)

## Stack

React + Vite + TypeScript · `vite-plugin-pwa` · Firebase (Spark/free: Auth, Firestore, Hosting) ·
Open-Meteo weather API (no key) · Leaflet + OpenStreetMap · Vitest

## Run locally

```bash
npm install
cp .env.example .env      # fill in your Firebase web config (see docs/DEPLOY.md, Step 1)
npm run dev               # http://localhost:5173
```

Location, camera and notifications need HTTPS or `localhost`. To try it on a phone, deploy it
(see below). Sign-in from `localhost` works because `localhost` is an authorized domain by default.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm test` | Unit tests (sun position, rainbow score, geo, weather parsing, image sizing, feed filter) |
| `npm run typecheck` | TypeScript check |
| `npm run build` | Typecheck + production build into `dist/` |

## Deploy

Push/merge to `main` → GitHub Actions tests, builds and deploys Hosting + Firestore rules.
One-time setup, click by click: [`docs/DEPLOY.md`](docs/DEPLOY.md).

## Known POC limitations

* Notifications only fire while the app is open (free plan = no server push). On iPhone the app must be
  installed to the Home Screen.
* The score is a likelihood hint from coarse weather-model data, not a guarantee.
* Photos are stored compressed inside Firestore (free plan has no Cloud Storage): ~3,000 photos fit in the free 1 GiB.
