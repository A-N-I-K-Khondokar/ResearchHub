# CSE Research Hub — Final Project Guide

A research discovery and researcher networking platform for the CSE department: **DISCOVER → UNDERSTAND → CONNECT**.

## 1. Architecture

```
┌────────────────────────────┐        ┌─────────────────────────────┐
│ Mobile app (Expo SDK 52)   │        │ Admin Portal (React 18 +    │
│ React Native, TypeScript,  │        │ Vite 6, TypeScript)         │
│ Expo Router                │        │ Firebase Hosting            │
└─────────────┬──────────────┘        └──────────────┬──────────────┘
              │      Firebase JS SDK (client only)    │
              └───────────────┬───────────────────────┘
                     ┌────────▼─────────┐
                     │ Firebase (Spark) │  Authentication: email/password, Google
                     │                  │  Cloud Firestore + Security Rules
                     └──────────────────┘  (no Cloud Functions, no paid services)
```

- **All authorisation is enforced by Firestore Security Rules**, not only the UI. See [FIRESTORE_DATA_MODEL.md](FIRESTORE_DATA_MODEL.md).
- Real-time updates use Firestore listeners; notifications are **in-app** while the app/portal is open (no push).

### Key source locations

| Area | Path |
|---|---|
| Routing & auth guard | `src/app/_layout.tsx` |
| Auth & session state | `src/context/AuthContext.tsx`, `src/services/auth.service.ts` |
| Firestore services | `src/services/{user,research,network,saved}.service.ts` |
| Shared hooks | `src/hooks/{useConnections,useSavedItems,useResearchDirectory}.ts` |
| Design tokens | `src/constants/{typography,spacing,radius,colors}.ts` |
| Admin portal | `admin-portal/src/` (see `admin-portal/README.md`) |
| Security rules & tests | `firestore.rules`, `tests/firestore/firestore.rules.test.mjs` |
| Demo data & QA scripts | `scripts/demo/`, `scripts/qa/` |

## 2. Features

| Feature | Status |
|---|---|
| Email/password sign-up, email verification, password reset | ✅ Live |
| Google Sign-In (web popup; native via development / preview build) | ✅ Implemented |
| Profile submission → admin approval (pending / approved / rejected / suspended) | ✅ Live |
| Rejected applicants correct & resubmit | ✅ Live |
| Home feed of current research, topic filters | ✅ Live |
| Share Current Work (publish, delete; drafts supported by the model) | ✅ Live |
| Explore, keyword search, topic pages ("Who's working on this?") | ✅ Live |
| Researcher profiles (privacy-safe, no email / student ID) | ✅ Live |
| Connections: send, withdraw, accept, decline, remove | ✅ Live |
| In-app notifications with unread badge | ✅ Live |
| Saved Items (bookmarks) | ✅ Live |
| Settings: theme (light / dark / system), sign out | ✅ Live |
| Admin portal: Google login, dashboard, real-time pending queue, approve / reject / suspend / reinstate, academic correction, paginated directory, directory sync | ✅ Live |

## 3. Original 14-week roadmap — final status

| Week / Phase | Objective | Status |
|---|---|---|
| 1 — Phase 1 | Expo setup, routing, design tokens, common components | ✅ Completed |
| 2 — Phase 2A | Authentication & onboarding UI | ✅ Completed |
| 3–4 — Phase 2B | Home Feed, root navigation audit | ✅ Completed |
| 5–6 — Phase 2C | Explore, Discovery, Dark Mode audit | ✅ Completed |
| 7 — Phase 2D | Share Current Work | ✅ Completed |
| 8 — Phase 2E | Notifications & Connections | ✅ Completed |
| 9 — Phase 2F | Researcher Profile, Settings, Saved Items; frontend freeze | ✅ Completed (Saved Items screen delivered with the backend in Weeks 10–13) |
| 10–13 — Phase 3 | Firebase backend integration & live data | ✅ Completed — auth + approval, research works, discovery, networking, notifications, saved items, admin portal, security hardening |
| 14 — Finalization | Testing, deployment, academic submission | ✅ Automated QA · ✅ Admin portal deployed · ✅ Android preview APK (GitHub release v1.0.1, device-tested) · ⏳ device QA rehearsal |

## 4. Setup

**Prerequisites:** Node.js 18+, a Firebase project, and for native builds an Expo account with `eas-cli` ≥ 27.7.

```bash
npm install
cp .env.example .env                       # fill in the Firebase web config
cd admin-portal && npm install && cp .env.example .env.local && cd ..
```

| Run | Command |
|---|---|
| Mobile (dev build / emulator) | `npx expo start` |
| Mobile in the browser | `npm run web` |
| Admin portal | `cd admin-portal && npm run dev` |

Email/password works in Expo Go; **native Google Sign-In needs a development or preview build** (`expo-dev-client`).

## 5. Testing & quality

| Check | Command | Expected |
|---|---|---|
| Mobile type check | `npm run typecheck` | 0 errors |
| Admin type check / build | `cd admin-portal && npm run typecheck && npm run build` | 0 errors / build succeeds |
| Expo bundles (Android, iOS, web) | `npx expo export` | 3 bundles |
| Security rules (emulator, Java required) | `npm run test:rules` | **150 passed** |
| Live production smoke test | `npm run qa:smoke` (after `demo:seed`) | **21 passed** |

The rules suite covers registration, the approval state machine, privacy, research works, connections, notifications, saved items and admin-privilege escalation. The smoke test signs in as two demo accounts and runs publish → feed → save → connect → notify → accept against the deployed backend, then cleans up.

### Demo data

`npm run demo:seed -- --yes` creates fictional researchers (IDs prefixed `demo_`), research work, connection requests and two sign-in accounts (password in the git-ignored `scripts/demo/.demo-credentials.json`). `npm run demo:clean -- --yes` removes all of it.

## 6. Deployment

### Firestore rules & indexes (deployed)

```bash
npx --yes firebase-tools@15.35.0 deploy --only firestore:rules,firestore:indexes --project cse-research-hub
```

Always back up the live ruleset first (see `backups/`) and run `npm run test:rules`.

### Admin portal → Firebase Hosting

`firebase.json` serves `admin-portal/dist` (built automatically by `predeploy`) with SPA rewrites and security headers.

```bash
npx --yes firebase-tools@15.35.0 deploy --only hosting --project cse-research-hub
```

**Live:** `https://cse-research-hub.web.app` (deployed 26 Nov 2026). Google sign-in works there — the `web.app` / `firebaseapp.com` domains are authorised by default.

`VITE_ADMIN_EMAIL` (in `admin-portal/.env.local`) is reduced to a **SHA-256 fingerprint at build time** (`vite.config.ts`), so the administrator's address never appears in the public JavaScript. Changing the admin email requires a rebuild and redeploy.

### Android preview APK (EAS)

**Released 26 Nov 2026 as [v1.0.1](https://github.com/A-N-I-K-Khondokar/ResearchHub/releases/tag/v1.0.1)** (device-tested: Google and email/password sign-in) with the `preview` profile. The `preview` EAS environment already holds the Firebase variables, and the signing certificate SHA-1 matches the one registered in `google-services.json`, so native Google Sign-In works. To rebuild: `eas build --platform android --profile preview`.

First-time setup (already done for this project):

1. `npm install -g eas-cli` (needs ≥ 27.7), then `eas login`.
2. Create the Firebase variables for the **preview** environment — `.env` is git-ignored and is **not** uploaded with the build:
   ```bash
   eas env:create --environment preview --visibility plaintext --name EXPO_PUBLIC_FIREBASE_API_KEY --value "<value from .env>"
   # repeat for every EXPO_PUBLIC_* variable in .env.example
   ```
3. `eas build --platform android --profile preview` → download the APK link and install on the phone.
4. Native Google Sign-In on that APK requires its signing certificate's SHA-1 in Firebase Console → Project settings → Android app (`eas credentials` shows it); then download the updated `google-services.json`. Email/password sign-in works without this.

> **Note:** read `EXPO_PUBLIC_*` variables only as literal `process.env.EXPO_PUBLIC_NAME`. Expo does not inline dynamic `process.env[key]`, which is empty in release builds — this caused v1.0.0's sign-in failure.

## 7. Known limitations

- Likes and comments are visual only (not part of the roadmap scope).
- Profile photo upload is not available (Firebase Storage not configured); Google accounts use their Google photo.
- Search runs on the device over the latest 100 researchers and 50 works — fine for a department, not for thousands of users.
- Author names on existing posts and connection cards are snapshots; a later rename does not rewrite old items.
- Notifications are in-app only (no push).
- `admin_requests`, `notification_services` and the `google-apps-script/` folder are unused legacy pieces kept for reference.

## 8. Project history

Daily development logs are in `Activity/`. Stage-by-stage backend work (Weeks 10–14) is summarised in this guide; rules backups taken before each production deployment are in `backups/`.
