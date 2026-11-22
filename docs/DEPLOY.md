# Deploying Rainbow Finder — click by click

**How it works:** every push to `main` runs a GitHub Action (`.github/workflows/deploy.yml`) that
**tests → builds → deploys** the app to **Firebase Hosting** and the security rules to **Firestore**.
You do the one-time setup below (≈ 15 minutes); after that, deploying is just merging to `main`.

Throughout this guide, replace `<PROJECT_ID>` with your Firebase project ID (e.g. `rainbow-finder-1a2b3`).

> Console labels change from time to time. If a button is named slightly differently, look for the closest match.

---

## Step 1 — Copy your Firebase web config

1. Open **https://console.firebase.google.com** and click your project.
2. Click the **⚙ gear** next to **Project Overview** (top-left) → **Project settings**.
3. On the **General** tab, scroll down to **Your apps**.
   * If you see a web app (`</>` icon) — click it.
   * If not: click the **`</>`** (Web) button → App nickname `Rainbow Finder` → leave *"Also set up Firebase Hosting"* **unchecked** → **Register app** → **Continue to console**.
4. Under **SDK setup and configuration** choose **Config**. Note these 3 values:
   * `apiKey`
   * `projectId`
   * `appId`

   (These are public client identifiers, not passwords — access is controlled by the security rules.)

## Step 2 — Google sign-in

1. Left menu → **Build → Authentication** → **Sign-in method** tab.
2. Click **Google** → toggle **Enable** → pick a **Project support email** → **Save**.
3. Open the **Settings** tab → **Authorized domains**. Check that both are listed (add them with **Add domain** if not):
   * `<PROJECT_ID>.web.app`
   * `<PROJECT_ID>.firebaseapp.com`

## Step 3 — Allow sign-in inside the installed app (iPhone / Android home-screen app)

The installed app signs in with a full-page redirect served from your own domain. Google must allow that address:

1. Open **https://console.cloud.google.com** → in the top bar, use the **project picker** to select the same project (`<PROJECT_ID>`).
2. **☰ menu → APIs & Services → Credentials**.
3. Under **OAuth 2.0 Client IDs**, click **Web client (auto created by Google Service)**.
4. **Authorized JavaScript origins** → **+ Add URI** → `https://<PROJECT_ID>.web.app`
5. **Authorized redirect URIs** → **+ Add URI** → `https://<PROJECT_ID>.web.app/__/auth/handler`
6. Click **Save**.

## Step 4 — Firestore

You already created the database. Nothing to click: the workflow deploys `firestore.rules` automatically
(**it replaces any rules you typed in the console**).

## Step 5 — Create a deploy key (service account)

Still in **https://console.cloud.google.com** with your project selected:

1. **☰ menu → IAM & Admin → Service Accounts** → **+ Create service account**.
2. Service account name: `github-deployer` → **Create and continue**.
3. **Grant this service account access to project** — add these roles (use **+ Add another role** between them):
   * **Firebase Admin**
   * **Service Usage Consumer**
   * **API Keys Viewer**

   → **Continue** → **Done**.
4. Click the new `github-deployer@…` account → **Keys** tab → **Add key → Create new key** → **JSON** → **Create**.
   A `.json` file downloads. **Treat it like a password.** You'll paste it into GitHub in the next step, then delete the file.

> If you see *"Service account key creation is disabled"*, your Google organization blocks keys (common on Workspace accounts, rare on personal Gmail). Tell me and I'll switch the workflow to keyless Workload Identity Federation.

## Step 6 — Add the secrets to GitHub

1. Open **https://github.com/AmitaiMyers/Rainbow** → **Settings** (repo tab, top right) → left menu **Secrets and variables → Actions**.
2. For each row below: **New repository secret** → enter **Name** and **Secret** → **Add secret**.

| Name | Secret (value) |
|---|---|
| `VITE_FIREBASE_API_KEY` | `apiKey` from Step 1 |
| `VITE_FIREBASE_PROJECT_ID` | `projectId` from Step 1 |
| `VITE_FIREBASE_APP_ID` | `appId` from Step 1 |
| `VITE_FIREBASE_AUTH_DOMAIN` | `<PROJECT_ID>.web.app` *(not `firebaseapp.com` — needed for sign-in in the installed app, see Step 3)* |
| `FIREBASE_SERVICE_ACCOUNT` | Open the downloaded `.json` file in a text editor, select **all** of it, paste it here |

3. Delete the downloaded `.json` file from your computer.

## Step 7 — Merge to `main` → automatic deploy

1. On the repo page → **Pull requests** tab → **New pull request**.
2. **base:** `main` ← **compare:** `claude/peaceful-ptolemy-7ikkqv` → **Create pull request** → **Create pull request**.
3. Wait for the check **Test & deploy** to turn green (on a PR it only tests and builds — it does not deploy).
4. Click **Merge pull request** → **Confirm merge**.
5. Open the **Actions** tab → click the newest **Test & deploy** run on `main` → wait for the green ✔ (≈ 2–3 min).
6. Open **https://<PROJECT_ID>.web.app** 🎉

**Redeploy any time without code changes:** **Actions** tab → **Test & deploy** (left list) → **Run workflow** → branch `main` → **Run workflow**.

## Step 8 — Install it on your phone

* **Android (Chrome):** open the site → **⋮** menu → **Install app** (or **Add to Home screen**).
* **iPhone (Safari):** open the site → **Share** button → **Add to Home Screen** → **Add**.
  Open it **from the home-screen icon** — iOS only allows notifications for installed web apps.

Then: tap **📍 Use my location** → allow, and **🔔 Turn on rainbow alerts** → allow.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| Action fails at **Check deploy secrets** with *Missing repository secret X* | Step 6 — the name must match exactly (case-sensitive). |
| Action fails at **Deploy** with *403 / permission denied* | Step 5.3 — check all three roles are on the service account. |
| Action fails with *Hosting site not found* | Firebase console → **Build → Hosting** → **Get started** → click through **Next / Next / Continue to console** (no commands needed), then re-run the workflow. |
| Site is a blank page; browser console says *Missing VITE_FIREBASE_…* | A `VITE_` secret is missing or empty — Step 6, then re-run the workflow. |
| Sign-in error *auth/unauthorized-domain* | Step 2.3. |
| Sign-in works in the browser but not in the installed app | Step 3, and `VITE_FIREBASE_AUTH_DOMAIN` must be `<PROJECT_ID>.web.app` (Step 6). |
| Upload fails with *Missing or insufficient permissions* | The rules weren't deployed — check the **Deploy** step log; it must list `firestore: released rules`. |
