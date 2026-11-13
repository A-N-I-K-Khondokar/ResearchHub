# CSE Research Hub — Google Apps Script Notification & Approval Setup Guide

This guide details the manual setup and configuration of the administrator email notification and approval action system for CSE Research Hub.

The architecture operates strictly within the **Firebase Spark (free) plan**, eliminating the need for Cloud Functions, Cloud Tasks, or paid third-party email providers (e.g. SendGrid, Mailgun).

---

## 1. Architecture Overview

```
[Student Profile Submission]
           │
           ▼
[Firestore Atomic Batch Write]
  ├── users/{uid} (approvalStatus: 'pending')
  └── admin_email_outbox/{uid} (deliveryStatus: 'queued')
           │
           │ (every 5 minutes via time-driven trigger)
           ▼
[Google Apps Script Outbox Worker]
  ├── Authenticates via Notification Bot ID Token (isNotificationService())
  ├── Queries queued items from admin_email_outbox
  ├── Generates HMAC-SHA256 signed action tokens (48h expiry)
  └── Dispatches HTML review email via GmailApp/MailApp
           │
           ▼
[Admin Email: anik.khondokar09@gmail.com]
  ├── "Approve Application" link (GET)
  └── "Decline Application" link (GET)
           │
           ▼
[Google Apps Script Web App (USER_ACCESSING)]
  ├── GET: Validates token + admin identity, displays confirmation view (read-only)
  └── POST: Confirms decision, verifies /admins/{ADMIN_UID}, updates users/{uid}
```

---

## 2. Account Roles & Security Separation

The system strictly decouples the administrative authority from the automated notification worker:

### Part A: Administrator Account Verification & Schema
The administrator identity is the sole entity authorized to review and approve applicant profiles:
* **Firebase Authentication**: User account for `anik.khondokar09@gmail.com` with UID `ADMIN_UID`.
* **Firestore Document**: Located at `/admins/{ADMIN_UID}`:
  * Document ID: `ADMIN_UID`
  * `uid`: (string) `ADMIN_UID`
  * `email`: (string) `anik.khondokar09@gmail.com`
  * `role`: (string) `'superadmin'` or `'admin'`
  * `addedAt`: (timestamp) Creation timestamp
  * `addedBy`: (string) Authorizing identity or `'bootstrap-console'`
* **GCP IAM Permissions**: When the Web App executes under `anik.khondokar09@gmail.com`, `ScriptApp.getOAuthToken()` communicates with Firestore REST API under the administrator's Google Cloud IAM credentials (requires Project Owner, Editor, or `roles/datastore.user`).
* **Server-Side Enforcement**: Even though IAM bypasses Firestore Security Rules, `ApprovalWebApp.gs` strictly validates that the caller is `anik.khondokar09@gmail.com`, verifies the document at `/admins/{ADMIN_UID}`, verifies the applicant is `'pending'`, and mutates only the 5 permitted approval fields via `updateMask`.

### Part B: Dedicated Notification Bot Account & Schema
The notification bot is an unprivileged automation worker responsible only for polling the outbox and sending emails:
* **Firebase Authentication**: Dedicated Email/Password account (e.g. `cse-research-hub-bot@cse.university.edu`) with UID `BOT_UID`.
* **Firestore Document**: Located at `/notification_services/{BOT_UID}`:
  * Document ID: `BOT_UID`
  * `uid`: (string) `BOT_UID`
  * `serviceName`: (string) `'Gmail Notification Dispatcher'`
  * `registeredAt`: (timestamp) Registration timestamp
* **Least Privilege Enforcement**:
  * The bot **MUST NEVER** be added to `/admins/` or assigned administrative roles.
  * The bot authenticates using Firebase Authentication ID tokens (`Bearer {botIdToken}`).
  * Operating through Firebase ID tokens, the bot is strictly constrained by production `firestore.rules` via the `isNotificationService()` rule:
    * Can read `/admin_email_outbox` queue records.
    * Can update ONLY `['deliveryStatus', 'sentAt', 'attemptCount', 'lastAttemptAt', 'lastError']`.
    * Cannot read or update `/users/{uid}`.
    * Cannot read or update `/admins/{adminId}`.

---

## 3. Required Script Properties Reference

Before execution, configure these keys in Google Apps Script under **Project Settings $\rightarrow$ Script Properties**:

| Property Key | Required Value / Description | Example |
|---|---|---|
| `FIREBASE_PROJECT_ID` | Production Firebase Project ID | `cse-research-hub` |
| `FIREBASE_API_KEY` | Web API Key from Firebase Console (Project Settings $\rightarrow$ General) | `AIzaSy...` |
| `BOT_EMAIL` | Dedicated notification bot account email | `cse-hub-bot@cse.university.edu` |
| `BOT_UID` | Dedicated notification bot Firebase Auth UID | `bot_xyz789...` |
| `BOT_REFRESH_TOKEN` | Generated automatically by `bootstrapBotAuthentication()` | *(Do not enter manually)* |
| `ADMIN_EMAIL` | Administrator destination & authorized identity | `anik.khondokar09@gmail.com` |
| `ADMIN_UID` | Administrator Firebase UID (matching `admins/{ADMIN_UID}`) | `admin_uid_456...` |
| `HMAC_SECRET` | 64+ char random hex string used to sign action tokens | *(Generated below)* |
| `WEB_APP_URL` | Deployed Web App URL (populated after Step 8) | `https://script.google.com/macros/s/.../exec` |

> [!CAUTION]
> Never hardcode passwords, API keys, refresh tokens, or HMAC secrets into source files. Script Properties are stored encrypted within Google's cloud infrastructure.

---

## 4. Step-by-Step Manual Setup

### Step 1: Create Dedicated Bot Account in Firebase Authentication

1. Open **[Firebase Console](https://console.firebase.google.com/)** $\rightarrow$ `cse-research-hub`.
2. Navigate to **Authentication** $\rightarrow$ **Users** tab.
3. Click **Add user**.
4. Enter a dedicated bot email (e.g. `cse-research-hub-bot@cse.university.edu` or a dedicated address) and a secure temporary password.
5. Click **Add user**.
6. Copy the generated **User UID** for the bot account.

### Step 2: Register Bot in Firestore `notification_services` Collection

1. In Firebase Console, navigate to **Firestore Database** $\rightarrow$ **Data**.
2. Click **Start collection** (or navigate to `notification_services` if it already exists).
3. Set Collection ID: `notification_services`.
4. Set Document ID: `<PASTE_BOT_UID>` (exact UID from Step 1).
5. Add fields:
   * `uid`: (string) `<PASTE_BOT_UID>`
   * `serviceName`: (string) `Gmail Notification Dispatcher`
   * `registeredAt`: (timestamp) Current timestamp
6. Save the document.

> [!IMPORTANT]
> The document ID in `/notification_services/{BOT_UID}` **must** exactly match the Firebase Auth UID created in Step 1. This satisfies the `isNotificationService()` check in production `firestore.rules`.

### Step 3: Create Google Apps Script Project

1. Open [Google Apps Script](https://script.google.com/) signed in as **`anik.khondokar09@gmail.com`**.
2. Click **New Project**.
3. Name the project: `CSE Research Hub Notification Service`.

### Step 4: Copy Source Files

In the Apps Script editor:

1. Enable manifest view:
   * Click **Project Settings** (gear icon) on the left sidebar.
   * Check **"Show \"appsscript.json\" manifest file in editor"**.
2. Copy [`appsscript.json`](file:///Users/anikkhondokar/Documents/6th%20SEMESTER/App%20Dev/ResearchHub/google-apps-script/appsscript.json) into `appsscript.json`.
3. Create and copy the following script files (click **+** next to Files $\rightarrow$ **Script**):
   * `Code.gs` $\leftarrow$ [`google-apps-script/Code.gs`](file:///Users/anikkhondokar/Documents/6th%20SEMESTER/App%20Dev/ResearchHub/google-apps-script/Code.gs)
   * `FirebaseAuth.gs` $\leftarrow$ [`google-apps-script/FirebaseAuth.gs`](file:///Users/anikkhondokar/Documents/6th%20SEMESTER/App%20Dev/ResearchHub/google-apps-script/FirebaseAuth.gs)
   * `FirestoreClient.gs` $\leftarrow$ [`google-apps-script/FirestoreClient.gs`](file:///Users/anikkhondokar/Documents/6th%20SEMESTER/App%20Dev/ResearchHub/google-apps-script/FirestoreClient.gs)
   * `OutboxWorker.gs` $\leftarrow$ [`google-apps-script/OutboxWorker.gs`](file:///Users/anikkhondokar/Documents/6th%20SEMESTER/App%20Dev/ResearchHub/google-apps-script/OutboxWorker.gs)
   * `EmailTemplate.gs` $\leftarrow$ [`google-apps-script/EmailTemplate.gs`](file:///Users/anikkhondokar/Documents/6th%20SEMESTER/App%20Dev/ResearchHub/google-apps-script/EmailTemplate.gs)
   * `ApprovalWebApp.gs` $\leftarrow$ [`google-apps-script/ApprovalWebApp.gs`](file:///Users/anikkhondokar/Documents/6th%20SEMESTER/App%20Dev/ResearchHub/google-apps-script/ApprovalWebApp.gs)
4. Create the HTML confirmation file (click **+** next to Files $\rightarrow$ **HTML**):
   * `Approval.html` $\leftarrow$ [`google-apps-script/Approval.html`](file:///Users/anikkhondokar/Documents/6th%20SEMESTER/App%20Dev/ResearchHub/google-apps-script/Approval.html)
5. Click **Save all files** (disk icon or `Cmd+S`).

### Step 5: Configure Script Properties

Generate a strong HMAC secret in your local terminal:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

In the Apps Script editor:
1. Click **Project Settings** (gear icon) $\rightarrow$ scroll to **Script Properties**.
2. Click **Add script property** for each required key:
   * `FIREBASE_PROJECT_ID`: `cse-research-hub`
   * `FIREBASE_API_KEY`: *(From Firebase Console $\rightarrow$ Project Settings)*
   * `BOT_EMAIL`: *(Bot email from Step 1)*
   * `BOT_UID`: *(Bot UID from Step 1)*
   * `ADMIN_EMAIL`: `anik.khondokar09@gmail.com`
   * `ADMIN_UID`: *(UID of your administrator account in `admins/{ADMIN_UID}`)*
   * `HMAC_SECRET`: *(Generated 64-char hex string)*
3. Click **Save script properties**.

### Step 6: Bootstrap Bot Authentication

1. In the Apps Script editor, open `Code.gs`.
2. In the function dropdown at the top toolbar, select `bootstrapBotAuthentication`.
3. In `Code.gs`, temporarily provide the bot's password:
   ```javascript
   function runBootstrap() {
     bootstrapBotAuthentication('YOUR_BOT_PASSWORD_HERE');
   }
   ```
4. Run `runBootstrap`.
5. When prompted, review and grant Google OAuth authorization permissions.
6. Check **Execution log**: verify it outputs:
   `[FirebaseAuth] Bot authentication bootstrap successful. Refresh token secured for UID: ...`
7. In **Project Settings** $\rightarrow$ **Script Properties**, verify that `BOT_REFRESH_TOKEN` is now populated.
8. Delete the temporary `runBootstrap` function from `Code.gs` to ensure no passwords remain in code.

### Step 7: Test Bot Connectivity

1. In the function dropdown, select `testBotConnection`.
2. Click **Run**.
3. Verify execution log reports:
   - ID token successfully retrieved
   - Outbox query succeeded
   - Remaining daily email quota logged

### Step 8: Deploy the Web App

1. In the top right corner of the Apps Script editor, click **Deploy** $\rightarrow$ **New deployment**.
2. Click the gear icon next to "Select type" $\rightarrow$ choose **Web app**.
3. Configure the deployment settings with strict attention to identity boundaries:
   * **Description**: `CSE Research Hub Admin Approval Gateway`
   * **Execute as**: **User accessing the web app**
     > *Why:* When set to "User accessing", `Session.getActiveUser().getEmail()` dynamically extracts the Google identity of the administrator opening the link. If set to "Me" (script owner), the script would not be able to identify who is making the decision.
   * **Who has access**: **Anyone with Google Account**
     > *Why:* This setting requires visitors to be authenticated with a Google account to view or submit the form. Anonymous visitors cannot access the script.
   * **Server-Side Exact Email Enforcement**:
     > The Web App's server-side logic in `ApprovalWebApp.gs` immediately inspects `Session.getActiveUser().getEmail()` and enforces strict equality with `ADMIN_EMAIL` (`anik.khondokar09@gmail.com`). Any other signed-in Google account receives an immediate "Unauthorized Account" rejection page. Anonymous access fails closed.
4. Click **Deploy**.
5. Copy the generated **Web app URL** (`https://script.google.com/macros/s/.../exec`).

### Step 9: Save `WEB_APP_URL` in Script Properties

1. Go to **Project Settings** $\rightarrow$ **Script Properties**.
2. Click **Add script property**:
   * Property: `WEB_APP_URL`
   * Value: `<PASTE_COPIED_WEB_APP_URL>`
3. Click **Save script properties**.

### Step 10: Enable the Recurring 5-Minute Trigger

1. In `Code.gs`, select `setupOutboxTrigger` from the toolbar dropdown.
2. Click **Run**.
3. Verify execution log: `[OutboxWorker] Installed 5-minute cron trigger.`
4. Click **Triggers** (clock icon on left sidebar) and verify that `processOutbox` is listed with event source "Time-driven", type "Minutes timer", interval "Every 5 minutes".

---

## 5. Operational Guarantees & Email Delivery Semantics

### At-Least-Once Delivery
Email dispatch operates under **at-least-once delivery semantics**:
1. When an outbox item is processed, its status is marked as `'sending'`.
2. MailApp delivers the email through Gmail infrastructure.
3. Upon return, the status is marked as `'sent'`.

If an unexpected execution timeout or network interruption occurs immediately after MailApp sends the email but before the Firestore status update is recorded, the item will be re-attempted on the next 5-minute cycle, potentially producing a duplicate email. **Exactly-once email delivery is not possible across distributed network boundaries.**

### Stale-Worker Recovery Policy
If an Apps Script worker process is abruptly terminated (e.g. hitting Google's 6-minute execution limit or experiencing an unhandled socket drop), records may remain locked in `deliveryStatus: 'sending'`.
* `OutboxWorker.gs` runs an automated stale recovery pass at the start of every 5-minute cycle.
* Any item in `'sending'` status whose `lastAttemptAt` is older than **15 minutes** is identified as stale.
* If `attemptCount < 5`: The item is automatically reset to `'queued'` status with a descriptive error note, allowing the next run to retry dispatch.
* If `attemptCount >= 5`: The item is permanently marked as `'failed'` to prevent infinite retry loops.

### Retry Policy
- Each failure increments `attemptCount` and records a sanitized `lastError` in the document.
- Retries are attempted up to **5 times**.
- After 5 failed attempts, the record remains in `failed` status without being discarded, allowing the administrator to inspect issues directly in Firestore Console.

### Daily Email Quotas
- **Consumer Gmail (`@gmail.com`)**: 100 recipients / 24-hour rolling window.
- **Google Workspace Accounts**: 1,500 recipients / 24-hour rolling window.
- `OutboxWorker.gs` dynamically checks `MailApp.getRemainingDailyQuota()`. If 0 remaining quota is detected, it halts processing immediately without modifying document state.
- Monitor remaining quota at any time using `checkDailyEmailQuota()` in `Code.gs`.

### Pausing or Removing the Trigger
To temporarily stop background polling:
1. Run `removeOutboxTrigger()` from `Code.gs`, OR
2. In Apps Script, open **Triggers** (clock icon) $\rightarrow$ click the three dots on `processOutbox` $\rightarrow$ **Delete trigger**.

---

## 6. Security Checklist

- [x] Dedicated bot account has no administrative claims or roles.
- [x] Bot UID is recorded in `/notification_services/{BOT_UID}` to satisfy `firestore.rules`.
- [x] Web App executes as **User accessing** and strictly verifies `Session.getActiveUser().getEmail() === 'anik.khondokar09@gmail.com'`.
- [x] Administrator identity verified against `/admins/{ADMIN_UID}` in Firestore prior to any status change.
- [x] GET requests are 100% read-only; mutations require explicit POST submission.
- [x] Action links are HMAC-SHA256 signed and expire in 48 hours.
- [x] Outbox updates strictly adhere to the `firestore.rules` field allowlist (`deliveryStatus`, `sentAt`, `attemptCount`, `lastAttemptAt`, `lastError`).
- [x] Timestamps (`sentAt`, `lastAttemptAt`, `approvedAt`, `updatedAt`) formatted as native Firestore REST `timestampValue`.
- [x] Stale `sending` records recovered automatically after 15 minutes.
- [x] Quota exhaustion detected and halted before claiming items.
- [x] No secrets, passwords, or tokens are committed to source control.

