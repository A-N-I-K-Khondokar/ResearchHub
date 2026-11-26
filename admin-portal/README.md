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
2. **Email Verification**: Authenticated email must match configured administrator: `your-admin@example.com`.
3. **Firestore Database Authorization**:
   - The portal attempts to read `/admins/{request.auth.uid}`.
   - Deployed production `firestore.rules` allow this read only if `exists(/databases/$(database)/documents/admins/$(request.auth.uid))`.
   - The portal verifies that `adminDoc.exists()` and `adminDoc.data().email.toLowerCase() === user.email.toLowerCase()`.
   - If not found or permission is denied, the user is immediately signed out and shown a setup message.

### Administrator Bootstrap Prerequisite
The administrator account must be manually registered in Firestore before initial sign-in:
- **Collection**: `admins`
- **Document ID**: `<ADMIN_FIREBASE_UID>` (The Firebase Auth UID of `your-admin@example.com`)
- **Fields**:
  - `uid`: string (`<ADMIN_FIREBASE_UID>`)
  - `email`: string (`"your-admin@example.com"`)
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
   VITE_ADMIN_EMAIL=your-admin@example.com
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

## 5. In-App Real-Time Notifications

- **Single shared listener**: `NotificationContext` owns the only `onSnapshot()` listener on `users` where `approvalStatus == 'pending'`. The sidebar badge, the Pending page and the new-application toasts all read from it.
- **Session-scoped**: Notifications appear only while the portal is open (no FCM push, no service worker). A toast's **Review Applicant** button opens the applicant detail modal.
- **Resubmissions**: A rejected applicant who resubmits moves back to `pending` and appears in the queue (and as a toast) in real time.
- The Google Apps Script email workflow in `google-apps-script/` is **not used** — this portal is the administration interface.

## 6. Admin Actions and Firestore Writes

Every action follows the approval state machine enforced in `firestore.rules`:

| Action | Transition | Writes (one atomic batch) |
|---|---|---|
| Approve | pending → approved | `users/{uid}` approval fields + `public_profiles/{uid}` mirror |
| Reject (optional reason) | pending → rejected | `users/{uid}` approval fields (applicant may correct and resubmit) |
| Suspend | approved → suspended | `users/{uid}` status + delete `public_profiles/{uid}` |
| Reinstate | suspended / rejected → approved | `users/{uid}` approval fields + `public_profiles/{uid}` mirror |
| Correct academic details | no status change | `users/{uid}` department / designation / program / batch / studentId (+ mirror if approved) |
| Sync Public Directory (Overview) | — | Publishes mirrors for all approved users, removes stale ones (safe to re-run) |

`public_profiles/{uid}` is the privacy-safe directory researchers read: it never contains email, student ID or review metadata. The rules require it to exactly mirror the approved `users/{uid}` document.

The Users page is cursor-paginated (25 per page, newest applications first, **Load more**). Its search box filters the pages already loaded.

## 7. Collections Overview

| Collection | Used by | Notes |
|---|---|---|
| `users/{uid}` | App + Portal | Private: owner and admins only |
| `public_profiles/{uid}` | App (read), Portal (write) | Sanitised mirror of approved researchers |
| `admins/{uid}` | Portal | Console / Admin SDK only — clients can never write it |
| `admin_email_outbox/{uid}` | App (create) | Created atomically with each application; kept as an audit trail (email worker not used) |
| `research_works`, `connections`, `notifications`, `users/{uid}/saved_items` | App | Researcher features |
| `admin_requests`, `notification_services` | — | **Unused** legacy collections; rules kept (deny-by-default for clients) so the original tests remain valid |
