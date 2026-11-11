/**
 * src/types/user.types.ts
 *
 * User profile and account lifecycle data models for Cloud Firestore.
 * Represents the server-authoritative profile document at `users/{uid}`.
 */

import type { Timestamp } from 'firebase/firestore';

// ---------------------------------------------------------------------------
// 1. Approval Status
// ---------------------------------------------------------------------------

/**
 * Persisted account approval status in Cloud Firestore.
 * Strictly controlled by administrators via backend / security rules.
 */
export type ApprovalStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'suspended';

// ---------------------------------------------------------------------------
// 2. Social Links Sub-document
// ---------------------------------------------------------------------------

export interface UserSocialLinks {
  website?: string;
  github?: string;
  linkedin?: string;
  googleScholar?: string;
  researchGate?: string;
  [key: string]: string | undefined;
}

// ---------------------------------------------------------------------------
// 3. User Profile Read Model (Persisted Document: users/{uid})
// ---------------------------------------------------------------------------

export interface UserProfile {
  /** Firebase Authentication UID. Must match document ID. */
  uid: string;

  /** Email address from Firebase Authentication. */
  email: string;

  /** Full display name. */
  displayName: string;

  /** Profile photo URL, if available. */
  photoURL?: string | null;

  /** Academic department (e.g. 'Computer Science and Engineering'). */
  department: string;

  /** Academic program (e.g. 'B.Sc. in CSE', 'M.Sc. in CSE'). */
  program?: string | null;

  /** Academic batch or cohort (e.g. 'Batch 14', 'Faculty'). */
  batch?: string | null;

  /** Institutional Student/Faculty ID (e.g. '190104001'). */
  studentId?: string | null;

  /** Academic designation (e.g. 'Undergraduate Student', 'Graduate Researcher', 'Assistant Professor'). */
  designation: string;

  /** Scholarly biography or research focus summary. */
  bio?: string | null;

  /** Array of research interest tags. */
  researchInterests: string[];

  /** Social and academic links. */
  socialLinks?: UserSocialLinks;

  /**
   * Account approval state.
   * Controlled strictly by administrators.
   */
  approvalStatus: ApprovalStatus;

  /** Timestamp when user submitted approval request. */
  requestedAt: Timestamp;

  /** Timestamp when an administrator approved access. */
  approvedAt?: Timestamp | null;

  /** UID of administrator who approved this account. */
  approvedBy?: string | null;

  /** Explanation if the account application was rejected. */
  rejectionReason?: string | null;

  /** Document creation timestamp. */
  createdAt: Timestamp;

  /** Document last update timestamp. */
  updatedAt: Timestamp;
}

// ---------------------------------------------------------------------------
// 4. Input DTOs
// ---------------------------------------------------------------------------

/**
 * Input for creating a pending user profile upon initial onboarding.
 *
 * NOTE:
 * - `uid` and `email` are taken from the authenticated Firebase `User` object.
 * - `approvalStatus` is set internally to 'pending'.
 * - `createdAt`, `updatedAt`, and `requestedAt` are set via `serverTimestamp()`.
 * - Approval and administrator fields cannot be supplied by the user.
 */
export interface CreatePendingUserProfileInput {
  displayName: string;
  photoURL?: string | null;
  department: string;
  program?: string | null;
  batch?: string | null;
  studentId?: string | null;
  designation: string;
  bio?: string | null;
  researchInterests: string[];
  socialLinks?: UserSocialLinks;
}

/**
 * Input for updating an existing user profile.
 * Restricted strictly to user-editable fields.
 *
 * Approval fields (`approvalStatus`, `approvedAt`, `approvedBy`, `rejectionReason`)
 * and system identifiers (`uid`, `email`) CANNOT be modified through this input.
 */
export interface UpdateUserProfileInput {
  displayName?: string;
  photoURL?: string | null;
  department?: string;
  program?: string | null;
  batch?: string | null;
  studentId?: string | null;
  designation?: string;
  bio?: string | null;
  researchInterests?: string[];
  socialLinks?: UserSocialLinks;
}

