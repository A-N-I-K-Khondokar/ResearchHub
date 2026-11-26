/**
 * src/utils/pendingProfile.ts
 *
 * Pure builder for the two documents written atomically when an applicant
 * submits their profile: `users/{uid}` and `admin_email_outbox/{uid}`.
 *
 * Kept free of React Native / Firebase runtime imports so the exact same
 * payload logic used by `user.service.ts` can be exercised by the Firestore
 * emulator test suite (tests/firestore/firestore.rules.test.mjs).
 *
 * `timestamp` is the server timestamp sentinel (`serverTimestamp()`) supplied
 * by the caller; the security rules require it to resolve to `request.time`.
 */

import type { CreatePendingUserProfileInput } from '@/types/user.types';

export interface PendingProfileIdentity {
  uid: string;
  email: string;
  displayName?: string | null;
  photoURL?: string | null;
}

export function buildPendingProfileDocuments(
  identity: PendingProfileIdentity,
  input: CreatePendingUserProfileInput,
  timestamp: unknown,
): { profile: Record<string, unknown>; outbox: Record<string, unknown> } {
  const profile = {
    uid: identity.uid,
    email: identity.email,
    displayName: input.displayName?.trim() || identity.displayName || '',
    photoURL: input.photoURL ?? identity.photoURL ?? null,
    department: input.department.trim(),
    program: input.program?.trim() ?? null,
    batch: input.batch?.trim() ?? null,
    studentId: input.studentId?.trim() ?? null,
    designation: input.designation.trim(),
    bio: input.bio?.trim() ?? null,
    researchInterests: Array.isArray(input.researchInterests) ? input.researchInterests : [],
    socialLinks: input.socialLinks ?? {},
    approvalStatus: 'pending',
    requestedAt: timestamp,
    approvedAt: null,
    approvedBy: null,
    rejectionReason: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  const outbox = {
    uid: identity.uid,
    userEmail: identity.email,
    displayName: profile.displayName,
    department: profile.department,
    designation: profile.designation,
    program: profile.program,
    batch: profile.batch,
    researchInterests: profile.researchInterests,
    deliveryStatus: 'queued',
    createdAt: timestamp,
    sentAt: null,
    attemptCount: 0,
    lastAttemptAt: null,
    lastError: null,
  };

  return { profile, outbox };
}

/**
 * Update payload for a rejected applicant resubmitting a corrected application
 * (`users/{uid}`: rejected -> pending). Academic fields are normalised exactly
 * like the original submission; review metadata is cleared and `requestedAt`
 * is refreshed (the rules require `request.time`).
 */
export function buildResubmissionUpdate(
  input: CreatePendingUserProfileInput,
  fallbackDisplayName: string,
  timestamp: unknown,
): Record<string, unknown> {
  return {
    displayName: input.displayName?.trim() || fallbackDisplayName,
    photoURL: input.photoURL ?? null,
    department: input.department.trim(),
    program: input.program?.trim() ?? null,
    batch: input.batch?.trim() ?? null,
    studentId: input.studentId?.trim() ?? null,
    designation: input.designation.trim(),
    bio: input.bio?.trim() ?? null,
    researchInterests: Array.isArray(input.researchInterests) ? input.researchInterests : [],
    socialLinks: input.socialLinks ?? {},
    approvalStatus: 'pending',
    requestedAt: timestamp,
    approvedBy: null,
    approvedAt: null,
    rejectionReason: null,
    updatedAt: timestamp,
  };
}
