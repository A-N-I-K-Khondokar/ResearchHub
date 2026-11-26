/**
 * src/services/user.service.ts
 *
 * Firestore user profile service for CSE Research Hub.
 * Manages user profile documents at `users/{uid}`.
 *
 * Architectural constraints:
 * - Operates strictly on `users/{uid}` where `uid` matches Firebase Auth UID.
 * - Enforces client-side field restrictions (server-side security enforced via Firestore Rules).
 * - Checks nullable `db: Firestore | null` from `@/config/firebase` safely.
 */

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  writeBatch,
  onSnapshot,
  serverTimestamp,
  collection,
  query,
  where,
  limit,
  type Firestore,
  type DocumentData,
  type DocumentSnapshot,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db } from '@/config/firebase';
import { buildPendingProfileDocuments } from '@/utils/pendingProfile';
import type {
  UserProfile,
  CreatePendingUserProfileInput,
  UpdateUserProfileInput,
} from '@/types/user.types';

// ---------------------------------------------------------------------------
// 1. Internal Database Access Helper
// ---------------------------------------------------------------------------

/**
 * Safely resolves the active Firestore instance.
 * Throws a descriptive error if Firebase or Firestore is unconfigured.
 */
function getFirestoreDb(): Firestore {
  if (!db) {
    throw new Error(
      '[user.service] Cloud Firestore is not initialized or configured. ' +
      'Verify EXPO_PUBLIC_FIREBASE_* environment variables and restart the application.',
    );
  }
  return db;
}

/** Maps a `users/{uid}` snapshot onto the `UserProfile` read model. */
function mapUserProfile(docSnap: DocumentSnapshot<DocumentData>): UserProfile | null {
  if (!docSnap.exists()) return null;
  const data = docSnap.data({ serverTimestamps: 'estimate' });
  return {
    uid: data.uid ?? docSnap.id,
    email: data.email ?? '',
    displayName: data.displayName ?? '',
    photoURL: data.photoURL ?? null,
    department: data.department ?? '',
    program: data.program ?? null,
    batch: data.batch ?? null,
    studentId: data.studentId ?? null,
    designation: data.designation ?? '',
    bio: data.bio ?? null,
    researchInterests: Array.isArray(data.researchInterests) ? data.researchInterests : [],
    socialLinks: data.socialLinks ?? {},
    approvalStatus: data.approvalStatus ?? 'pending',
    requestedAt: data.requestedAt,
    approvedAt: data.approvedAt ?? null,
    approvedBy: data.approvedBy ?? null,
    rejectionReason: data.rejectionReason ?? null,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

// ---------------------------------------------------------------------------
// 2. Profile Creation
// ---------------------------------------------------------------------------

/**
 * Creates a new pending user profile document in Firestore at `users/{user.uid}`.
 *
 * Rules:
 * - Document ID is strictly the authenticated user's `uid`.
 * - Email is obtained directly from Firebase Authentication (`user.email`),
 *   supporting personal Gmail or institutional email addresses.
 * - Approval status is set internally to `'pending'`.
 * - Timestamps (`createdAt`, `updatedAt`, `requestedAt`) are initialized with `serverTimestamp()`.
 * - Prevents accidental overwriting if a profile already exists for this UID.
 *
 * @param user Authenticated Firebase User instance.
 * @param input User-provided onboarding details (department, designation, interests, etc.).
 * @returns The newly created `UserProfile` document.
 */
export async function createPendingUserProfile(
  user: User,
  input: CreatePendingUserProfileInput,
): Promise<UserProfile> {
  const firestore = getFirestoreDb();

  if (!user || !user.uid) {
    throw new Error('[user.service] An authenticated Firebase user is required.');
  }

  if (!user.email) {
    throw new Error('[user.service] Authenticated user must have an email address associated with their account.');
  }

  if (!user.emailVerified) {
    throw new Error('[user.service] Authenticated user must have a verified email address to submit a profile.');
  }

  const userDocRef = doc(firestore, 'users', user.uid);
  const outboxDocRef = doc(firestore, 'admin_email_outbox', user.uid);

  // Ensure the ID token carries the verified-email claim. `reload()` updates
  // `user.emailVerified` locally but does NOT refresh the token, and the
  // security rules check `request.auth.token.email_verified`.
  const tokenResult = await user.getIdTokenResult();
  if (tokenResult.claims.email_verified !== true) {
    await user.getIdToken(true);
  }

  // Guard: friendly early exit if the applicant's own profile already exists.
  // (The applicant may read their own `users/{uid}`; they may NOT read the
  // outbox, so duplicate outbox protection is enforced by the rules' `!exists`
  // checks on both documents when the batch commits.)
  const existingUserDoc = await getDoc(userDocRef);
  if (existingUserDoc.exists()) {
    throw new Error(`[user.service] A profile already exists for UID "${user.uid}". Cannot overwrite.`);
  }

  const { profile: newProfileDoc, outbox: newOutboxDoc } = buildPendingProfileDocuments(
    { uid: user.uid, email: user.email, displayName: user.displayName, photoURL: user.photoURL },
    input,
    serverTimestamp(),
  );

  // Atomic creation of user profile and outbox notification request in a single batch
  const batch = writeBatch(firestore);
  batch.set(userDocRef, newProfileDoc);
  batch.set(outboxDocRef, newOutboxDoc);
  await batch.commit();

  const created = await getUserProfile(user.uid);
  if (!created) {
    throw new Error('[user.service] Profile was created but could not be retrieved from Firestore.');
  }

  return created;
}

// ---------------------------------------------------------------------------
// 3. Profile Retrieval
// ---------------------------------------------------------------------------

/**
 * Retrieves the user profile document for a given UID from `users/{uid}`.
 *
 * @param uid Firebase Auth UID.
 * @returns `UserProfile` if the document exists, or `null` if not found.
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const firestore = getFirestoreDb();

  if (!uid || typeof uid !== 'string' || uid.trim() === '') {
    throw new Error('[user.service] Invalid UID provided to getUserProfile.');
  }

  const docSnap = await getDoc(doc(firestore, 'users', uid.trim()));
  return mapUserProfile(docSnap);
}

// ---------------------------------------------------------------------------
// 4. Real-time Subscription
// ---------------------------------------------------------------------------

/**
 * Subscribes to real-time updates for a user profile document at `users/{uid}`.
 *
 * @param uid Firebase Auth UID.
 * @param onUpdate Callback invoked with updated `UserProfile` or `null` if removed.
 * @param onError Optional error handler.
 * @returns Unsubscribe function to terminate the listener.
 */
export function subscribeUserProfile(
  uid: string,
  onUpdate: (profile: UserProfile | null) => void,
  onError?: (error: Error) => void,
): () => void {
  if (!db) {
    const error = new Error('[user.service] Cloud Firestore is not initialized or configured.');
    if (onError) {
      onError(error);
    } else {
      console.error(error);
    }
    return () => {};
  }

  if (!uid || typeof uid !== 'string' || uid.trim() === '') {
    const error = new Error('[user.service] Invalid UID provided to subscribeUserProfile.');
    if (onError) {
      onError(error);
    } else {
      console.error(error);
    }
    return () => {};
  }

  const userDocRef = doc(db, 'users', uid.trim());

  return onSnapshot(
    userDocRef,
    (docSnap) => {
      onUpdate(mapUserProfile(docSnap));
    },
    (err) => {
      console.error(`[user.service] Snapshot listener error for UID "${uid}":`, err);
      if (onError) {
        onError(err);
      }
    },
  );
}

/**
 * Real-time directory of approved researchers (used by Explore, search and
 * Home). The `approvalStatus == 'approved'` filter is required by the rules.
 */
export function subscribeApprovedResearchers(
  onUpdate: (profiles: UserProfile[]) => void,
  onError?: (error: Error) => void,
  maxItems = 100,
): () => void {
  if (!db) {
    onError?.(new Error('[user.service] Cloud Firestore is not initialized or configured.'));
    return () => {};
  }
  const q = query(
    collection(db, 'users'),
    where('approvalStatus', '==', 'approved'),
    limit(maxItems),
  );
  return onSnapshot(
    q,
    (snapshot) => {
      onUpdate(
        snapshot.docs
          .map((d) => mapUserProfile(d))
          .filter((p): p is UserProfile => p !== null),
      );
    },
    (err) => {
      console.error('[user.service] Researcher directory listener error:', err);
      onError?.(err);
    },
  );
}

// ---------------------------------------------------------------------------
// 5. Profile Update
// ---------------------------------------------------------------------------

/**
 * Updates user-editable fields on an existing profile at `users/{uid}`.
 *
 * Security & Integrity:
 * - Rejects any attempt to modify approval fields (`approvalStatus`, `approvedAt`, `approvedBy`, `rejectionReason`).
 * - Rejects any attempt to modify system identifiers (`uid`, `email`).
 * - Rejects any attempt to assign administrator roles or privileges.
 * - Automatically updates `updatedAt` with `serverTimestamp()`.
 *
 * @param uid Firebase Auth UID.
 * @param updates Subset of user-editable fields.
 */
export async function updateUserProfile(
  uid: string,
  updates: UpdateUserProfileInput,
): Promise<void> {
  const firestore = getFirestoreDb();

  if (!uid || typeof uid !== 'string' || uid.trim() === '') {
    throw new Error('[user.service] Invalid UID provided to updateUserProfile.');
  }

  // Defensive blacklist: Block protected, admin, or identity fields
  const forbiddenKeys = [
    'approvalStatus',
    'approvedAt',
    'approvedBy',
    'rejectionReason',
    'role',
    'roles',
    'isAdmin',
    'admin',
    'requestedAt',
    'createdAt',
    'uid',
    'email',
  ];

  const updateKeys = Object.keys(updates);
  for (const key of forbiddenKeys) {
    if (updateKeys.includes(key)) {
      throw new Error(
        `[user.service] Unauthorized field update: "${key}" is protected and cannot be modified by user.`,
      );
    }
  }

  // Whitelist sanitization: permit only user-editable profile fields
  const sanitizedUpdates: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };

  if (updates.displayName !== undefined) sanitizedUpdates.displayName = updates.displayName.trim();
  if (updates.photoURL !== undefined) sanitizedUpdates.photoURL = updates.photoURL;
  if (updates.department !== undefined) sanitizedUpdates.department = updates.department.trim();
  if (updates.program !== undefined) sanitizedUpdates.program = updates.program ? updates.program.trim() : null;
  if (updates.batch !== undefined) sanitizedUpdates.batch = updates.batch ? updates.batch.trim() : null;
  if (updates.studentId !== undefined) sanitizedUpdates.studentId = updates.studentId ? updates.studentId.trim() : null;
  if (updates.designation !== undefined) sanitizedUpdates.designation = updates.designation.trim();
  if (updates.bio !== undefined) sanitizedUpdates.bio = updates.bio ? updates.bio.trim() : null;
  if (updates.researchInterests !== undefined) {
    sanitizedUpdates.researchInterests = Array.isArray(updates.researchInterests)
      ? updates.researchInterests
      : [];
  }
  if (updates.socialLinks !== undefined) {
    sanitizedUpdates.socialLinks = updates.socialLinks;
  }

  const userDocRef = doc(firestore, 'users', uid.trim());
  await updateDoc(userDocRef, sanitizedUpdates);
}

