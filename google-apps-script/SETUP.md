# CSE Research Hub — Simplified Administrator Email Notification & Approval Setup

This guide details the setup of the lightweight administrator email notification and approval system for **CSE Research Hub**.

The system operates strictly within the **Firebase Spark (free) plan** using Google Apps Script running under the administrator Google account (**`anik.khondokar09@gmail.com`**).

---

## 1. How It Works

```
[Student Profile Submission in App]
               │
               ▼
   [Firestore Atomic Batch Write]
     ├── users/{uid} (approvalStatus: 'pending')
     └── admin_email_outbox/{uid} (deliveryStatus: 'queued')
               │
               │ (every 5 minutes via trigger)
               ▼
   [Google Apps Script Outbox Worker]
     ├── Reads queued notifications using ScriptApp.getOAuthToken()
     ├── Generates tamper-proof HMAC-SHA256 action links (48h expiry)
     └── Sends email notification to anik.khondokar09@gmail.com via MailApp
               │
               ▼
   [Admin Receives Email & Clicks Action]
               │
               ▼
   [Google Apps Script Web App (USER_ACCESSING)]
     ├── GET: Confirms identity (anik.khondokar09@gmail.com) & displays applicant details
     └── POST: Confirms decision, verifies /admins/{ADMIN_UID}, updates users/{uid}
```

* **No Bot Account**: Uses Google Apps Script's native OAuth token (`ScriptApp.getOAuthToken()`) for the administrator Google account.
* **No Cloud Functions / Blaze**: Operates 100% on Firebase free tier.
* **Safe Mutations**: GET requests are read-only. Status changes require an explicit POST submission.

---

## 2. Required Files

The script consists of these 6 files:

| File Name | Purpose |
|---|---|
| `appsscript.json` | Project manifest defining OAuth scopes and web app configuration |
| `Code.gs` | Master entry point (`doGet`, `doPost`, `processOutbox`, triggers, diagnostics) |
| `FirestoreClient.gs` | Cloud Firestore REST client using `ScriptApp.getOAuthToken()` |
| `OutboxWorker.gs` | 5-minute background worker that queries outbox and sends emails |
| `Approval.gs` | Cryptographic token generator, validator, and approval request handlers |
| `Approval.html` | Clean, responsive approval confirmation page |

---

## 3. Step-by-Step Setup Guide

### Step 1: Create Google Apps Script Project

1. In your browser, ensure you are signed in as **`anik.khondokar09@gmail.com`**.
2. Go to **[Google Apps Script](https://script.google.com/)**.
3. Click **New Project** (top-left).
4. Name the project: `CSE Research Hub Notification Service`.

### Step 2: Copy Files into the Script Editor

1. **Enable Manifest View**:
   - In the left sidebar, click **Project Settings** (gear icon).
   - Check **"Show \"appsscript.json\" manifest file in editor"**.
2. **Update `appsscript.json`**:
   - In the left sidebar, click `<> Editor` $\rightarrow$ click `appsscript.json`.
   - Replace its entire contents with [`appsscript.json`](file:///Users/anikkhondokar/Documents/6th%20SEMESTER/App%20Dev/ResearchHub/google-apps-script/appsscript.json).
3. **Add Script Files**:
   - For each file below, click the **+** icon next to **Files** $\rightarrow$ select **Script**:
     - `Code.gs` $\leftarrow$ copy contents of [`Code.gs`](file:///Users/anikkhondokar/Documents/6th%20SEMESTER/App%20Dev/ResearchHub/google-apps-script/Code.gs)
     - `FirestoreClient.gs` $\leftarrow$ copy contents of [`FirestoreClient.gs`](file:///Users/anikkhondokar/Documents/6th%20SEMESTER/App%20Dev/ResearchHub/google-apps-script/FirestoreClient.gs)
     - `OutboxWorker.gs` $\leftarrow$ copy contents of [`OutboxWorker.gs`](file:///Users/anikkhondokar/Documents/6th%20SEMESTER/App%20Dev/ResearchHub/google-apps-script/OutboxWorker.gs)
     - `Approval.gs` $\leftarrow$ copy contents of [`Approval.gs`](file:///Users/anikkhondokar/Documents/6th%20SEMESTER/App%20Dev/ResearchHub/google-apps-script/Approval.gs)
4. **Add HTML Template**:
   - Click the **+** icon next to **Files** $\rightarrow$ select **HTML**.
   - Name it `Approval` (Apps Script will append `.html`).
   - Replace its contents with [`Approval.html`](file:///Users/anikkhondokar/Documents/6th%20SEMESTER/App%20Dev/ResearchHub/google-apps-script/Approval.html).
5. Click **Save all files** (or press `Cmd+S`).

### Step 3: Configure Script Properties

1. Generate a strong HMAC secret in your local terminal:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
2. In the Apps Script editor, click **Project Settings** (gear icon) on the left sidebar.
3. Scroll down to **Script Properties** $\rightarrow$ click **Add script property** for each of the following:

   | Property | Value | Description |
   |---|---|---|
   | `FIREBASE_PROJECT_ID` | `cse-research-hub` | Your Firebase Project ID |
   | `FIREBASE_API_KEY` | *(From Firebase Console)* | Project Settings $\rightarrow$ General $\rightarrow$ Web API Key |
   | `ADMIN_EMAIL` | `anik.khondokar09@gmail.com` | Destination for emails & authorized reviewer |
   | `ADMIN_UID` | *(Your Firebase Admin UID)* | The UID matching `/admins/{ADMIN_UID}` in Firestore |
   | `HMAC_SECRET` | *(64-char string generated above)* | Key used to sign expiring action links |

4. Click **Save script properties**.

> [!NOTE]
> Values stored in Script Properties are accessible in plaintext to editors of this script project. Keep project sharing private to `anik.khondokar09@gmail.com`. Never log these values.

### Step 4: Authorize Google Permissions & Run Diagnostic Check

1. In the Apps Script editor, open `Code.gs`.
2. In the function dropdown at the top toolbar, select `testOutboxWorker`.
3. Click **Run**.
4. A permissions dialog will appear on first run:
   - Click **Review permissions**.
   - Select your account: `anik.khondokar09@gmail.com`.
   - Click **Advanced** $\rightarrow$ click **Go to CSE Research Hub Notification Service (unsafe)**.
   - Click **Allow**.
5. Check the **Execution log** at the bottom:
   - Verify that it logs: `Properties verified`, `Firestore connectivity verified`, and your remaining email quota (typically 100/day for personal Gmail or 1500/day for Workspace).

### Step 5: Deploy the Web App

1. In the top-right corner, click **Deploy** $\rightarrow$ **New deployment**.
2. Click the gear icon next to "Select type" $\rightarrow$ choose **Web app**.
3. Fill in the deployment details:
   - **Description**: `CSE Research Hub Admin Approval Gateway`
   - **Execute as**: **User accessing the web app**
   - **Who has access**: **Anyone with Google Account**
4. Click **Deploy**.
5. Copy the generated **Web app URL** (`https://script.google.com/macros/s/.../exec`).

### Step 6: Save the Web App URL in Script Properties

1. Go back to **Project Settings** (gear icon) $\rightarrow$ scroll to **Script Properties**.
2. Click **Add script property**:
   - Property: `WEB_APP_URL`
   - Value: *(Paste the Web App URL from Step 5)*
3. Click **Save script properties**.

### Step 7: Configure the 5-Minute Trigger

1. In the editor toolbar dropdown, select `setupOutboxTrigger`.
2. Click **Run**.
3. In the execution log, verify: `[OutboxWorker] Installed 5-minute cron trigger`.
4. To verify: Click **Triggers** (clock icon in left sidebar) $\rightarrow$ confirm `processOutbox` is active with event source "Time-driven" running every 5 minutes.

---

## 4. Testing the System

1. In your Expo mobile app, register a new profile or submit a profile setup.
2. An atomic write will create:
   - `users/{uid}` with `approvalStatus: 'pending'`
   - `admin_email_outbox/{uid}` with `deliveryStatus: 'queued'`
3. Within 5 minutes (or immediately by selecting `processOutbox` in Apps Script and clicking **Run**):
   - You will receive an email at **`anik.khondokar09@gmail.com`** with subject `New Account Approval Request — CSE Research Hub`.
   - The email contains the applicant details and two buttons: **Approve Application** and **Reject Application**.
4. Click either button:
   - Opens the confirmation page in your browser.
   - Requires you to be signed in as `anik.khondokar09@gmail.com`.
   - Displays applicant information.
   - Clicking **Confirm Approval** updates Firestore to `approvalStatus: 'approved'`.
   - The user immediately gains access in the app!

---

## 5. Security Summary

- **IAM Scopes**: REST requests to Cloud Firestore are made via `ScriptApp.getOAuthToken()`, inheriting the administrator's IAM permissions (`roles/datastore.user` or Project Owner/Editor).
- **Tamper Resistance**: Action links are HMAC-SHA256 signed with a 48-hour expiration. An attacker cannot guess or forge approval links.
- **Strict Allowlist**: Updates to `users/{uid}` modify only the 5 approval fields (`approvalStatus`, `approvedBy`, `approvedAt`, `rejectionReason`, `updatedAt`). Identity fields are immutable.
- **Fail-Closed Identity Check**: The Web App rejects anonymous visitors and any Google account other than `anik.khondokar09@gmail.com`.
