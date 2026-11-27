# Firestore Data Model & Security

CSE Research Hub uses **Firebase Authentication** and **Cloud Firestore** (Spark plan, no Cloud Functions). Every rule below is enforced in [`firestore.rules`](../firestore.rules) and covered by the emulator suite in [`tests/firestore/firestore.rules.test.mjs`](../tests/firestore/firestore.rules.test.mjs) (178 tests).

All timestamps written by clients must equal the server's `request.time` (`serverTimestamp()`); client-generated times are rejected.

## Collections at a glance

| Collection | Purpose | Who can read | Who can write |
|---|---|---|---|
| `users/{uid}` | Private profile + approval state | Owner, admins | Owner (create / allowlisted edits / resubmit), admins (approval fields, academic correction) |
| `public_profiles/{uid}` | Sanitised directory mirror of **approved** researchers | Approved researchers, admins | Admin or the approved owner — must exactly mirror `users/{uid}` |
| `admin_email_outbox/{uid}` | Audit record created with every application | Admins | Applicant (create, atomically with `users/{uid}`) |
| `admins/{uid}` | Administrator registry | Admins | **Nobody** from a client (Firebase Console only) |
| `research_works/{id}` | Shared current research | Author, admins, approved researchers (published only) | Approved author |
| `connections/{uidA_uidB}` | One document per researcher pair | The two participants | Requester (create), recipient (accept / reject), participants (delete) |
| `notifications/{id}` | In-app notifications | Recipient | Actor, only alongside the real connection change; recipient marks read / deletes |
| `users/{uid}/saved_items/{workId}` | Private bookmarks | Owner | Approved owner |
| `collab_requests/{workId_applicantUid}` | Applications to collaboration posts | Applicant, post author | Applicant (apply / withdraw pending), author (accept / decline) |
| `contact_cards/{uid}` | Opt-in contact details | Owner, admins, **accepted connections** | Owner |
| `admin_requests`, `notification_services` | Legacy, unused | Admins / service only | Deny-by-default for clients |

Anything not listed is denied (`match /{document=**} { allow read, write: if false; }`).

## `users/{uid}` — private profile

| Field | Type | Notes |
|---|---|---|
| `uid`, `email` | string | Immutable; `email` must equal the verified token email |
| `displayName` | string (1–100) | |
| `photoURL` | string ≤ 500 \| null | |
| `department`, `designation` | string (1–100) | Locked after approval (admin correction only) |
| `program`, `batch`, `studentId` | string \| null | Locked after approval (admin correction only) |
| `bio` | string ≤ 2000 \| null | |
| `researchInterests` | list ≤ 30 | |
| `socialLinks` | map ≤ 10 keys | `website`, `github`, `linkedin`, `googleScholar`, `researchGate` |
| `approvalStatus` | `pending` \| `approved` \| `rejected` \| `suspended` | Starts `pending` |
| `requestedAt`, `createdAt`, `updatedAt` | timestamp | |
| `approvedAt`, `approvedBy`, `rejectionReason` | timestamp / string / string \| null | Set only by admins |

**Application (create):** verified email, own UID, status `pending`, no approval metadata, and — in the **same atomic batch** — a matching `admin_email_outbox/{uid}` document.

**Approval state machine (admins only):**

```
pending ──approve──▶ approved ──suspend──▶ suspended
   │                    ▲  ▲                    │
   └──reject──▶ rejected┘  └─────reinstate──────┘
                 │
                 └──(owner) correct & resubmit──▶ pending
```

- `approve` / `reinstate`: `approvedBy == admin uid`, `approvedAt == request.time`, `rejectionReason == null`.
- `suspend` keeps the existing approval history.
- A **rejected** owner may resubmit once per rejection: status → `pending`, fresh `requestedAt`, review fields cleared.
- Owners can never change their own status, approval metadata, identity fields or roles.

## `public_profiles/{uid}` — privacy-safe directory

Fields: `uid, displayName, photoURL, department, program, batch, designation, bio, researchInterests, socialLinks, updatedAt`. **Never** contains `email`, `studentId` or review metadata. Every write must equal the approved `users/{uid}` document as it will exist after the batch (validated with `getAfter`).

Written by: the admin portal on approve / reinstate / academic correction (same batch), the owner when editing their profile (same batch), the app's self-heal on sign-in (`ensurePublicProfile`), and the portal's **Sync Public Directory** button. Removed when a researcher is suspended.

## `research_works/{id}`

| Field | Notes |
|---|---|
| `authorUid` | Must be the caller; immutable |
| `authorName`, `authorPhotoURL`, `authorDepartment`, `authorDesignation` | Snapshot validated against the author's `users` document at creation (prevents impersonation); immutable |
| `title` (3–200), `description` (20–5000) | |
| `tags` | ≤ 10, e.g. `#MachineLearning` |
| `stage` | `Idea` \| `Literature Review` \| `Experiment` \| `Writing` |
| `externalUrl` | `http(s)://…` ≤ 500 \| null |
| `status` | `published` (approved researchers) \| `draft` (author only) |

Queries must be provably safe: the feed uses `status == 'published'`; "my work" uses `authorUid == uid`; another researcher's work uses both.

## `connections/{uidA_uidB}`

Document ID is the two UIDs **sorted** and joined with `_`, so a pair can only ever have one document — duplicate requests in either direction are impossible. Fields: `users` (sorted pair), `requesterUid`, `recipientUid`, `requester` / `recipient` (participant snapshots validated against `users`), `status` (`pending` → `accepted` | `rejected`, recipient only), `createdAt`, `updatedAt`, `respondedAt`.

Participants may cancel a pending request or remove a connection; a **rejected** request can only be cleared by its recipient (prevents re-request spam).

## `notifications/{id}`

`recipientUid, actorUid, actorName, actorPhotoURL, type, connectionId, read, createdAt` (+ `workTitle`, `role` for collaboration types) where `type` is `connection_request`, `connection_accepted`, `collab_request`, `collab_accepted` or `collab_declined` (`connectionId` then holds the application ID). A notification can only be created **in the same batch** as the connection change it describes (verified with `get` / `getAfter`), so notifications cannot be forged or spammed. Recipients may only flip `read` to `true` or delete.

## Collaboration posts and `collab_requests/{workId_applicantUid}`

A `research_works` document with `postType: 'collaboration'` lists `lookingFor` roles (1–10), an author-managed `collabStatus` (`open` | `closed` = "Team formed") and a `team` list (≤ 20 accepted members).

An application (`workId, authorUid, applicantUid, applicant snapshot, workTitle, role, message, status`) can only be created for an **open, published collaboration post you did not write**, for one of its `lookingFor` roles, together with a `collab_request` notification to the author. One application per person per post (deterministic ID). The applicant may withdraw while pending; only the author accepts or declines.

**Accepting** is one atomic batch: the application → `accepted`, the applicant is added to the post's `team`, the two researchers are **connected** (a connection created directly as `accepted` is allowed only with `viaCollabRequest` pointing at that accepted application), and a `collab_accepted` notification is sent.

## `contact_cards/{uid}`

`uid, email, preferredContact, updatedAt`. Opt-in contact details so collaborators can reach each other (there is no in-app chat). `email` may only be the owner's verified sign-in email. Readable **only** by the owner, admins and researchers with an **accepted connection** (checked with the sorted connection ID).

## `users/{uid}/saved_items/{workId}`

`workId, workTitle, workAuthorUid, workAuthorName, workStage, savedAt`. Document ID equals the work ID (one bookmark per work). The snapshot must match a work the owner may read; no updates — remove and save again.

## Composite indexes ([`firestore.indexes.json`](../firestore.indexes.json))

| Collection | Fields | Used by |
|---|---|---|
| `research_works` | `status` ↑, `createdAt` ↓ | Home feed / Explore |
| `notifications` | `recipientUid` ↑, `createdAt` ↓ | Notifications tab |
| `users` | `approvalStatus` ↑, `requestedAt` ↓ | Admin portal paginated directory |

## Administrator access

An account is an administrator only if `admins/{uid}` exists. That collection cannot be written by any client (`allow write: if false`); administrators are provisioned in the Firebase Console. The admin portal additionally checks the configured `VITE_ADMIN_EMAIL` and that the admin record's email matches the signed-in account.
