import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  writeBatch,
  serverTimestamp,
  getCountFromServer,
  limit,
  orderBy,
  startAfter,
  type QueryDocumentSnapshot,
  type DocumentData
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { buildPublicProfile } from '../utils/publicProfile';
import type { UserProfile, ApprovalStatus } from '../types/user.types';
import type { DashboardStats } from '../types/stats.types';

/**
 * Retrieves aggregate user metrics from Cloud Firestore using count queries.
 */
export async function getDashboardCounts(): Promise<DashboardStats> {
  const usersColl = collection(db, 'users');

  const [totalSnap, pendingSnap, approvedSnap, rejectedSnap, suspendedSnap] = await Promise.all([
    getCountFromServer(usersColl),
    getCountFromServer(query(usersColl, where('approvalStatus', '==', 'pending'))),
    getCountFromServer(query(usersColl, where('approvalStatus', '==', 'approved'))),
    getCountFromServer(query(usersColl, where('approvalStatus', '==', 'rejected'))),
    getCountFromServer(query(usersColl, where('approvalStatus', '==', 'suspended')))
  ]);

  return {
    totalUsers: totalSnap.data().count,
    pendingUsers: pendingSnap.data().count,
    approvedUsers: approvedSnap.data().count,
    rejectedUsers: rejectedSnap.data().count,
    suspendedUsers: suspendedSnap.data().count,
    loading: false
  };
}

/**
 * Retrieves the most recent registrations (single-field requestedAt index, newest first).
 */
export async function getRecentRegistrations(maxItems = 8): Promise<UserProfile[]> {
  const snap = await getDocs(
    query(collection(db, 'users'), orderBy('requestedAt', 'desc'), limit(maxItems))
  );
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() } as UserProfile));
}

export const USERS_PAGE_SIZE = 25;

export interface UsersPage {
  users: UserProfile[];
  cursor: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
}

/**
 * Cursor-paginated user directory, newest applications first.
 * Filtered queries use the (approvalStatus, requestedAt desc) composite index.
 */
export async function getUsersPage(
  status: ApprovalStatus | 'all' = 'all',
  cursor: QueryDocumentSnapshot<DocumentData> | null = null,
  pageSize = USERS_PAGE_SIZE
): Promise<UsersPage> {
  const usersColl = collection(db, 'users');
  const constraints = [
    ...(status !== 'all' ? [where('approvalStatus', '==', status)] : []),
    orderBy('requestedAt', 'desc'),
    ...(cursor ? [startAfter(cursor)] : []),
    limit(pageSize + 1)
  ];
  const snap = await getDocs(query(usersColl, ...constraints));
  const docs = snap.docs.slice(0, pageSize);
  return {
    users: docs.map((d) => ({ uid: d.id, ...d.data() } as UserProfile)),
    cursor: docs.length > 0 ? docs[docs.length - 1] : null,
    hasMore: snap.docs.length > pageSize
  };
}

/**
 * Retrieves a single user profile by UID.
 */
export async function getUserById(uid: string): Promise<UserProfile | null> {
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return null;
  return { uid: snap.id, ...snap.data() } as UserProfile;
}

/**
 * Approves a pending user application (pending -> approved) and publishes the
 * sanitised public directory mirror in the same batch.
 */
export async function approveUser(target: UserProfile, adminUid: string): Promise<void> {
  // The mirror must equal the user document exactly, so build it from the latest copy.
  const latest = (await getUserById(target.uid)) ?? target;
  const now = serverTimestamp();
  const batch = writeBatch(db);
  batch.update(doc(db, 'users', target.uid), {
    approvalStatus: 'approved',
    approvedBy: adminUid,
    approvedAt: now,
    rejectionReason: null,
    updatedAt: now
  });
  batch.set(doc(db, 'public_profiles', target.uid), buildPublicProfile(latest, now));
  await batch.commit();
}

/**
 * Rejects a pending user application.
 * Transition: pending -> rejected (the applicant may correct and resubmit).
 */
export async function rejectUser(uid: string, adminUid: string, reason?: string): Promise<void> {
  const userRef = doc(db, 'users', uid);
  const cleanReason = reason ? reason.trim().substring(0, 500) : null;
  await updateDoc(userRef, {
    approvalStatus: 'rejected',
    approvedBy: adminUid,
    approvedAt: null,
    rejectionReason: cleanReason || null,
    updatedAt: serverTimestamp()
  });
}

/**
 * Suspends an approved user (approved -> suspended) and removes them from the
 * public directory in the same batch.
 * Note: Preserves established approval history (approvedBy, approvedAt, rejectionReason).
 */
export async function suspendUser(uid: string): Promise<void> {
  const batch = writeBatch(db);
  batch.update(doc(db, 'users', uid), {
    approvalStatus: 'suspended',
    updatedAt: serverTimestamp()
  });
  batch.delete(doc(db, 'public_profiles', uid));
  await batch.commit();
}

/**
 * Reinstates an eligible user from suspended or rejected back to approved,
 * re-publishing their public directory mirror in the same batch.
 */
export async function reinstateUser(target: UserProfile, adminUid: string): Promise<void> {
  const latest = (await getUserById(target.uid)) ?? target;
  const now = serverTimestamp();
  const batch = writeBatch(db);
  batch.update(doc(db, 'users', target.uid), {
    approvalStatus: 'approved',
    approvedBy: adminUid,
    approvedAt: now,
    rejectionReason: null,
    updatedAt: now
  });
  batch.set(doc(db, 'public_profiles', target.uid), buildPublicProfile(latest, now));
  await batch.commit();
}

export interface AcademicCorrection {
  department: string;
  designation: string;
  program: string | null;
  batch: string | null;
  studentId: string | null;
}

/**
 * Administrator corrects locked academic fields (no status change).
 * Approved researchers' public mirror is refreshed in the same batch.
 */
export async function correctAcademicDetails(
  target: UserProfile,
  fields: AcademicCorrection
): Promise<void> {
  const clean = {
    department: fields.department.trim(),
    designation: fields.designation.trim(),
    program: fields.program?.trim() || null,
    batch: fields.batch?.trim() || null,
    studentId: fields.studentId?.trim() || null
  };
  if (!clean.department || !clean.designation) {
    throw new Error('Department and designation are required.');
  }
  const latest = (await getUserById(target.uid)) ?? target;
  const now = serverTimestamp();
  const batch = writeBatch(db);
  batch.update(doc(db, 'users', target.uid), { ...clean, updatedAt: now });
  if (latest.approvalStatus === 'approved') {
    batch.set(doc(db, 'public_profiles', target.uid), buildPublicProfile({ ...latest, ...clean }, now));
  }
  await batch.commit();
}

/**
 * One-time / repair sync of the public directory:
 *  - publishes a mirror for every approved user;
 *  - removes mirrors whose user is no longer approved.
 * Returns how many mirrors were written and removed.
 */
export async function syncPublicDirectory(): Promise<{ published: number; removed: number }> {
  const [approvedSnap, mirrorSnap] = await Promise.all([
    getDocs(query(collection(db, 'users'), where('approvalStatus', '==', 'approved'))),
    getDocs(collection(db, 'public_profiles'))
  ]);
  const approvedIds = new Set(approvedSnap.docs.map((d) => d.id));

  type Op = { kind: 'set'; user: UserProfile } | { kind: 'delete'; uid: string };
  const ops: Op[] = [
    ...approvedSnap.docs.map((d) => ({ kind: 'set' as const, user: { uid: d.id, ...d.data() } as UserProfile })),
    ...mirrorSnap.docs.filter((d) => !approvedIds.has(d.id)).map((d) => ({ kind: 'delete' as const, uid: d.id }))
  ];

  // Firestore batches are limited to 500 writes
  for (let i = 0; i < ops.length; i += 400) {
    const batch = writeBatch(db);
    const now = serverTimestamp();
    ops.slice(i, i + 400).forEach((op) => {
      if (op.kind === 'set') {
        batch.set(doc(db, 'public_profiles', op.user.uid), buildPublicProfile(op.user, now));
      } else {
        batch.delete(doc(db, 'public_profiles', op.uid));
      }
    });
    await batch.commit();
  }

  return {
    published: ops.filter((o) => o.kind === 'set').length,
    removed: ops.filter((o) => o.kind === 'delete').length
  };
}

/**
 * Recent account decisions for the Activity page, read from the fields already
 * stored on each user (approvalStatus, approvedBy, approvedAt, rejectionReason,
 * updatedAt). Uses the automatic single-field `updatedAt` index.
 */
export async function getRecentDecisions(maxItems = 30): Promise<UserProfile[]> {
  const snap = await getDocs(
    query(collection(db, 'users'), orderBy('updatedAt', 'desc'), limit(maxItems * 2))
  );
  return snap.docs
    .map((d) => ({ uid: d.id, ...d.data() } as UserProfile))
    .filter((u) => u.approvalStatus !== 'pending')
    .slice(0, maxItems);
}

/** uid -> admin email, to show who made a decision (admins may read `admins`). */
export async function getAdminDirectory(): Promise<Map<string, string>> {
  try {
    const snap = await getDocs(collection(db, 'admins'));
    return new Map(snap.docs.map((d) => [d.id, String(d.data().email ?? 'Admin')] as const));
  } catch {
    return new Map();
  }
}

