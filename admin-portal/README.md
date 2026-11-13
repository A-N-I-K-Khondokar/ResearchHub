# CSE Research Hub — Separate Administrator Management Portal

A lightweight, independent administrative dashboard for **CSE Research Hub**. Built with React, Vite, TypeScript, and the Firebase Web SDK.

---

## 1. Project Overview & Architecture

- **Independent Subsystem**: Located completely within `admin-portal/`. Has its own `package.json`, `tsconfig.json`, and dependencies. It does **not** modify or bundle with the Expo mobile application.
- **Direct Cloud Firestore Integration**: Communicates directly with production Firestore database `(default)` on project `cse-research-hub`.
- **Zero Enterprise Overhead**: Pure client-side React single-page application (SPA), ready for Firebase Hosting static deployment on the free Spark plan.
- **Theme Support**: Scholarly Crisp (light) and Deep Scholar Slate (dark) themes honoring `design-reference/DESIGN.md`.

---

## 2. Administrator Authentication & Authorization Model

Access is guarded by dual-boundary verification:

1. **Google Sign-In**: Uses Firebase Authentication `signInWithPopup(auth, googleAuthProvider)`.
2. **Email Verification**: Authenticated email must match configured administrator: `anik.khondokar09@gmail.com`.
3. **Firestore Database Authorization**:
   - The portal attempts to read `/admins/{request.auth.uid}`.
   - Deployed production `firestore.rules` allow this read only if `exists(/databases/$(database)/documents/admins/$(request.auth.uid))`.
   - The portal verifies that `adminDoc.exists()` and `adminDoc.data().email.toLowerCase() === user.email.toLowerCase()`.
   - If not found or permission is denied, the user is immediately signed out and shown a setup message.

### Administrator Bootstrap Prerequisite
The administrator account must be manually registered in Firestore before initial sign-in:
- **Collection**: `admins`
- **Document ID**: `<ADMIN_FIREBASE_UID>` (The Firebase Auth UID of `anik.khondokar09@gmail.com`)
- **Fields**:
  - `uid`: string (`<ADMIN_FIREBASE_UID>`)
  - `email`: string (`"anik.khondokar09@gmail.com"`)
  - `role`: string (`"superadmin"` or `"admin"`)
  - `addedAt`: timestamp
  - `addedBy`: string (`"bootstrap-console"`)

---

## 3. Local Development Setup

### Prerequisites
- Node.js v18+ or v20+ (developed on v22)
- npm v9+

### Environment Configuration
1. Inside `admin-portal/`, copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Populate the environment variables from your Firebase Console (Project Settings $\rightarrow$ General $\rightarrow$ Web App):
   ```env
   VITE_FIREBASE_API_KEY=AIzaSy...
   VITE_FIREBASE_AUTH_DOMAIN=cse-research-hub.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=cse-research-hub
   VITE_FIREBASE_APP_ID=1:...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_ADMIN_EMAIL=anik.khondokar09@gmail.com
   ```

### Install Dependencies
```bash
cd admin-portal
npm install
```

### Run Local Development Server
```bash
npm run dev
```
The application will launch at `http://localhost:5173`.

---

## 4. Production Build & Hosting Preparation

### Compile & Validate TypeScript
```bash
npm run typecheck
```

### Production Build
```bash
npm run build
```
Generates production assets in `admin-portal/dist/`.

### Future Firebase Hosting Deployment (Preview)
When authorized for deployment:
1. In `firebase.json`, configure a separate hosting site target:
   ```json
   {
     "hosting": {
       "target": "admin-portal",
       "public": "admin-portal/dist",
       "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
       "rewrites": [
         {
           "source": "**",
           "destination": "/index.html"
         }
       ]
     }
   }
   ```
2. Apply Firebase deploy:
   ```bash
   npx firebase-tools deploy --only hosting:admin-portal --project cse-research-hub
   ```
*(Target URL: `https://cse-research-hub-admin.web.app`)*

---

## 5. In-App Real-Time Notification Limitations

- **Session-Scoped**: Real-time notifications operate through a Firestore `onSnapshot()` listener on `users` where `approvalStatus == 'pending'`.
- **Active State Only**: Notifications appear as toasts, increments in the alerts badge, and items in the activity log while the admin portal is open in an active browser tab.
- **Offline Delivery**: When the admin portal is closed, notifications do not use FCM push or background service workers. Asynchronous offline alerts are handled by the 5-minute Google Apps Script outbox polling worker configured in `google-apps-script/`.

