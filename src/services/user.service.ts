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
  onSnapshot,
  serverTimestamp,
  type Firestore,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db } from '@/config/firebase';
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

  const userDocRef = doc(firestore, 'users', user.uid);

  // Guard: Prevent overwriting an existing profile
  const existingDoc = await getDoc(userDocRef);
  if (existingDoc.exists()) {
    throw new Error(`[user.service] A profile already exists for UID "${user.uid}". Cannot overwrite.`);
  }

  const now = serverTimestamp();

  const newProfileDoc = {
    uid: user.uid,
    email: user.email,
    displayName: input.displayName?.trim() || user.displayName || '',
    photoURL: input.photoURL ?? user.photoURL ?? null,
    department: input.department.trim(),
    program: input.program?.trim() ?? null,
    batch: input.batch?.trim() ?? null,
    studentId: input.studentId?.trim() ?? null,
    designation: input.designation.trim(),
    bio: input.bio?.trim() ?? null,
    researchInterests: Array.isArray(input.researchInterests) ? input.researchInterests : [],
    socialLinks: input.socialLinks ?? {},
    approvalStatus: 'pending' as const,
    requestedAt: now,
    approvedAt: null,
    approvedBy: null,
    rejectionReason: null,
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(userDocRef, newProfileDoc);

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

  const userDocRef = doc(firestore, 'users', uid.trim());
  const docSnap = await getDoc(userDocRef);

  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data();

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
  } as UserProfile;
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
      if (!docSnap.exists()) {
        onUpdate(null);
        return;
      }

      const data = docSnap.data();
      const profile: UserProfile = {
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

      onUpdate(profile);
    },
    (err) => {
      console.error(`[user.service] Snapshot listener error for UID "${uid}":`, err);
      if (onError) {
        onError(err);
      }
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

