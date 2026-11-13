import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  serverTimestamp,
  getCountFromServer,
  limit
} from 'firebase/firestore';
import { db } from '../config/firebase';
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
 * Retrieves recent registrations sorted client-side to avoid composite index requirements.
 */
export async function getRecentRegistrations(maxItems = 8): Promise<UserProfile[]> {
  const usersColl = collection(db, 'users');
  const snap = await getDocs(query(usersColl, limit(maxItems * 2)));

  const profiles: UserProfile[] = [];
  snap.forEach((d) => {
    profiles.push({ uid: d.id, ...d.data() } as UserProfile);
  });

  // Sort by requestedAt or createdAt descending
  profiles.sort((a, b) => {
    const timeA = a.requestedAt?.toMillis ? a.requestedAt.toMillis() : (a.createdAt?.toMillis ? a.createdAt.toMillis() : 0);
    const timeB = b.requestedAt?.toMillis ? b.requestedAt.toMillis() : (b.createdAt?.toMillis ? b.createdAt.toMillis() : 0);
    return timeB - timeA;
  });

  return profiles.slice(0, maxItems);
}

/**
 * Retrieves users filtered by approvalStatus.
 */
export async function getUsers(status?: ApprovalStatus | 'all', maxItems = 100): Promise<UserProfile[]> {
  const usersColl = collection(db, 'users');
  let q;

  if (status && status !== 'all') {
    q = query(usersColl, where('approvalStatus', '==', status), limit(maxItems));
  } else {
    q = query(usersColl, limit(maxItems));
  }

  const snap = await getDocs(q);
  const profiles: UserProfile[] = [];
  snap.forEach((d) => {
    profiles.push({ uid: d.id, ...d.data() } as UserProfile);
  });

  profiles.sort((a, b) => {
    const timeA = a.requestedAt?.toMillis ? a.requestedAt.toMillis() : (a.createdAt?.toMillis ? a.createdAt.toMillis() : 0);
    const timeB = b.requestedAt?.toMillis ? b.requestedAt.toMillis() : (b.createdAt?.toMillis ? b.createdAt.toMillis() : 0);
    return timeB - timeA;
  });

  return profiles;
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
 * Approves a pending user application.
 * Transition: pending -> approved
 */
export async function approveUser(uid: string, adminUid: string): Promise<void> {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    approvalStatus: 'approved',
    approvedBy: adminUid,
    approvedAt: serverTimestamp(),
    rejectionReason: null,
    updatedAt: serverTimestamp()
  });
}

/**
 * Rejects a pending user application.
 * Transition: pending -> rejected
 */
export async function rejectUser(uid: string, adminUid: string, reason?: string): Promise<void> {
  const userRef = doc(db, 'users', uid);
  const cleanReason = reason ? reason.trim().substring(0, 500) : null;
  await updateDoc(userRef, {
    approvalStatus: 'rejected',
    approvedBy: adminUid,
    approvedAt: null,
    rejectionReason: cleanReason,
    updatedAt: serverTimestamp()
  });
}

/**
 * Suspends an approved user.
 * Transition: approved -> suspended
 * Note: Preserves established approval history (approvedBy, approvedAt, rejectionReason).
 */
export async function suspendUser(uid: string): Promise<void> {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    approvalStatus: 'suspended',
    updatedAt: serverTimestamp()
  });
}

/**
 * Reinstates an eligible user from suspended or rejected back to approved.
 * Allowed Transitions: suspended -> approved, rejected -> approved
 */
export async function reinstateUser(uid: string, adminUid: string): Promise<void> {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    approvalStatus: 'approved',
    approvedBy: adminUid,
    approvedAt: serverTimestamp(),
    rejectionReason: null,
    updatedAt: serverTimestamp()
  });
}

