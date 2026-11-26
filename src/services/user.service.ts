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
import { buildPendingProfileDocuments, buildResubmissionUpdate } from '@/utils/pendingProfile';
import { buildPublicProfile } from '@/utils/publicProfile';
import {
  POST_APPROVAL_EDITABLE_FIELDS,
  type UserProfile,
  type PublicProfile,
  type CreatePendingUserProfileInput,
  type UpdateUserProfileInput,
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

function mapPublicProfile(docSnap: DocumentSnapshot<DocumentData>): PublicProfile | null {
  if (!docSnap.exists()) return null;
  const d = docSnap.data({ serverTimestamps: 'estimate' });
  return {
    uid: d.uid ?? docSnap.id,
    displayName: d.displayName ?? '',
    photoURL: d.photoURL ?? null,
    department: d.department ?? '',
    program: d.program ?? null,
    batch: d.batch ?? null,
    designation: d.designation ?? '',
    bio: d.bio ?? null,
    researchInterests: Array.isArray(d.researchInterests) ? d.researchInterests : [],
    socialLinks: d.socialLinks ?? {},
    updatedAt: d.updatedAt,
  };
}

/**
 * Real-time directory of approved researchers from the sanitised
 * `public_profiles` mirror (no email / studentId). Used by Explore, search and Home.
 */
export function subscribeApprovedResearchers(
  onUpdate: (profiles: PublicProfile[]) => void,
  onError?: (error: Error) => void,
  maxItems = 100,
): () => void {
  if (!db) {
    onError?.(new Error('[user.service] Cloud Firestore is not initialized or configured.'));
    return () => {};
  }
  return onSnapshot(
    query(collection(db, 'public_profiles'), limit(maxItems)),
    (snapshot) => {
      onUpdate(
        snapshot.docs
          .map((d) => mapPublicProfile(d))
          .filter((p): p is PublicProfile => p !== null),
      );
    },
    (err) => {
      console.error('[user.service] Researcher directory listener error:', err);
      onError?.(err);
    },
  );
}

/** One researcher's public profile, or `null` if they are not in the directory. */
export async function getPublicProfile(uid: string): Promise<PublicProfile | null> {
  const firestore = getFirestoreDb();
  return mapPublicProfile(await getDoc(doc(firestore, 'public_profiles', uid)));
}

// ---------------------------------------------------------------------------
// 5. Profile Update
// ---------------------------------------------------------------------------

/**
 * Updates user-editable fields on the signed-in user's own profile.
 *
 * Security & Integrity:
 * - Rejects any attempt to modify approval fields, identity (`uid`, `email`) or roles.
 * - After approval, identity fields (department, designation, studentId, batch,
 *   program) are locked — only presentation fields may change (rule-enforced).
 * - For approved researchers the sanitised `public_profiles/{uid}` mirror is
 *   rewritten in the SAME batch so the directory never drifts.
 */
export async function updateUserProfile(
  profile: UserProfile,
  updates: UpdateUserProfileInput,
): Promise<void> {
  const firestore = getFirestoreDb();
  const uid = profile.uid;

  if (!uid || typeof uid !== 'string' || uid.trim() === '') {
    throw new Error('[user.service] Invalid profile provided to updateUserProfile.');
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

  if (profile.approvalStatus !== 'pending') {
    const locked = updateKeys.filter(
      (k) => !(POST_APPROVAL_EDITABLE_FIELDS as readonly string[]).includes(k),
    );
    if (locked.length > 0) {
      throw new Error(
        `[user.service] "${locked.join(', ')}" can only be changed by an administrator after approval.`,
      );
    }
  }

  // Whitelist sanitization: permit only user-editable profile fields
  const changes: Record<string, unknown> = {};
  if (updates.displayName !== undefined) changes.displayName = updates.displayName.trim();
  if (updates.photoURL !== undefined) changes.photoURL = updates.photoURL;
  if (updates.department !== undefined) changes.department = updates.department.trim();
  if (updates.program !== undefined) changes.program = updates.program ? updates.program.trim() : null;
  if (updates.batch !== undefined) changes.batch = updates.batch ? updates.batch.trim() : null;
  if (updates.studentId !== undefined) changes.studentId = updates.studentId ? updates.studentId.trim() : null;
  if (updates.designation !== undefined) changes.designation = updates.designation.trim();
  if (updates.bio !== undefined) changes.bio = updates.bio ? updates.bio.trim() : null;
  if (updates.researchInterests !== undefined) {
    changes.researchInterests = Array.isArray(updates.researchInterests) ? updates.researchInterests : [];
  }
  if (updates.socialLinks !== undefined) changes.socialLinks = updates.socialLinks;

  const now = serverTimestamp();
  const batch = writeBatch(firestore);
  batch.update(doc(firestore, 'users', uid), { ...changes, updatedAt: now });

  if (profile.approvalStatus === 'approved') {
    const merged = { ...profile, ...changes } as UserProfile;
    batch.set(doc(firestore, 'public_profiles', uid), buildPublicProfile(merged, now));
  }

  await batch.commit();
}

// ---------------------------------------------------------------------------
// 6. Rejected Application Resubmission
// ---------------------------------------------------------------------------

/**
 * Rejected applicant resubmits a corrected application (rejected -> pending).
 * The admin portal's live Pending queue picks it up immediately.
 */
export async function resubmitApplication(
  user: User,
  profile: UserProfile,
  input: CreatePendingUserProfileInput,
): Promise<void> {
  const firestore = getFirestoreDb();
  if (profile.approvalStatus !== 'rejected') {
    throw new Error('[user.service] Only rejected applications can be resubmitted.');
  }
  // Same verified-email token refresh as the first submission (rules check the claim).
  const tokenResult = await user.getIdTokenResult();
  if (tokenResult.claims.email_verified !== true) {
    await user.getIdToken(true);
  }
  await updateDoc(
    doc(firestore, 'users', profile.uid),
    buildResubmissionUpdate(input, profile.displayName, serverTimestamp()),
  );
}
