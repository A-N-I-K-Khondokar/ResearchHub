/**
 * src/services/research.service.ts
 *
 * Firestore service for shared research work at `research_works/{workId}`.
 *
 * Read-cost notes (Firebase Spark):
 *  - The feed is a single listener limited to FEED_LIMIT documents.
 *  - Author details are denormalised onto each work, so cards need no extra reads.
 *  - "My work" queries by `authorUid` only (no composite index) and sorts locally.
 */

import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  type DocumentSnapshot,
  type DocumentData,
  type Firestore,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { buildResearchWorkDocument } from '@/utils/researchWork';
import { formatRelativeDate } from '@/utils/date';
import type { UserProfile } from '@/types/user.types';
import type { ResearchWork, CreateResearchWorkInput } from '@/types/research.types';
import type { CurrentWork } from '@/types';

const COLLECTION = 'research_works';
export const FEED_LIMIT = 20;

function getFirestoreDb(): Firestore {
  if (!db) {
    throw new Error(
      '[research.service] Cloud Firestore is not initialized. Verify EXPO_PUBLIC_FIREBASE_* environment variables.',
    );
  }
  return db;
}

function toResearchWork(snap: DocumentSnapshot<DocumentData>): ResearchWork | null {
  if (!snap.exists()) return null;
  const data = snap.data({ serverTimestamps: 'estimate' });
  return {
    id: snap.id,
    authorUid: data.authorUid ?? '',
    authorName: data.authorName ?? 'CSE Researcher',
    authorPhotoURL: data.authorPhotoURL ?? null,
    authorDepartment: data.authorDepartment ?? '',
    authorDesignation: data.authorDesignation ?? '',
    title: data.title ?? '',
    description: data.description ?? '',
    tags: Array.isArray(data.tags) ? data.tags : [],
    stage: data.stage ?? 'Idea',
    externalUrl: data.externalUrl ?? null,
    status: data.status ?? 'published',
    postType: data.postType === 'collaboration' ? 'collaboration' : 'work',
    lookingFor: Array.isArray(data.lookingFor) ? data.lookingFor : [],
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

function toMillis(value: ResearchWork['createdAt'] | undefined): number {
  return value && typeof value.toMillis === 'function' ? value.toMillis() : 0;
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

/**
 * Publishes a new research work for the signed-in, approved researcher.
 * Author details are copied from their Firestore profile; the rules verify the copy.
 */
export async function createResearchWork(
  profile: UserProfile,
  input: CreateResearchWorkInput,
): Promise<string> {
  const firestore = getFirestoreDb();
  if (profile.approvalStatus !== 'approved') {
    throw new Error('[research.service] Only approved researchers can share work.');
  }

  const payload = buildResearchWorkDocument(
    {
      uid: profile.uid,
      displayName: profile.displayName,
      photoURL: profile.photoURL ?? null,
      department: profile.department,
      designation: profile.designation,
    },
    input,
    serverTimestamp(),
  );

  const ref = await addDoc(collection(firestore, COLLECTION), payload);
  return ref.id;
}

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

/** One-shot read of a single work (used by the research detail screen). */
export async function getResearchWork(workId: string): Promise<ResearchWork | null> {
  const firestore = getFirestoreDb();
  const snap = await getDoc(doc(firestore, COLLECTION, workId));
  return toResearchWork(snap);
}

/**
 * Real-time feed of the latest published work (newest first).
 * Requires the composite index declared in `firestore.indexes.json`.
 */
export function subscribePublishedFeed(
  onUpdate: (works: ResearchWork[]) => void,
  onError?: (error: Error) => void,
  maxItems: number = FEED_LIMIT,
): () => void {
  if (!db) {
    onError?.(new Error('[research.service] Cloud Firestore is not initialized.'));
    return () => {};
  }

  const q = query(
    collection(db, COLLECTION),
    where('status', '==', 'published'),
    orderBy('createdAt', 'desc'),
    limit(maxItems),
  );

  return onSnapshot(
    q,
    (snapshot) => {
      onUpdate(
        snapshot.docs
          .map((d) => toResearchWork(d))
          .filter((w): w is ResearchWork => w !== null),
      );
    },
    (err) => {
      console.error('[research.service] Feed listener error:', err);
      onError?.(err);
    },
  );
}

/** Real-time list of the given author's own work (drafts included), newest first. */
export function subscribeMyResearchWorks(
  uid: string,
  onUpdate: (works: ResearchWork[]) => void,
  onError?: (error: Error) => void,
): () => void {
  if (!db || !uid) {
    onError?.(new Error('[research.service] Firestore unavailable or missing UID.'));
    return () => {};
  }

  const q = query(collection(db, COLLECTION), where('authorUid', '==', uid));

  return onSnapshot(
    q,
    (snapshot) => {
      const works = snapshot.docs
        .map((d) => toResearchWork(d))
        .filter((w): w is ResearchWork => w !== null)
        .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
      onUpdate(works);
    },
    (err) => {
      console.error('[research.service] My-works listener error:', err);
      onError?.(err);
    },
  );
}

/**
 * Another researcher's published work (newest first). Both equality filters are
 * required by the rules for non-owners; no composite index needed.
 */
export async function getPublishedWorksByAuthor(authorUid: string): Promise<ResearchWork[]> {
  const firestore = getFirestoreDb();
  const snap = await getDocs(
    query(
      collection(firestore, COLLECTION),
      where('authorUid', '==', authorUid),
      where('status', '==', 'published'),
      limit(FEED_LIMIT),
    ),
  );
  return snap.docs
    .map((d) => toResearchWork(d))
    .filter((w): w is ResearchWork => w !== null)
    .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

/** Deletes a work. Rules allow only the author (or an administrator). */
export async function deleteResearchWork(workId: string): Promise<void> {
  const firestore = getFirestoreDb();
  await deleteDoc(doc(firestore, COLLECTION, workId));
}

// ---------------------------------------------------------------------------
// UI mapping
// ---------------------------------------------------------------------------

/** Maps a persisted work onto the `CurrentWork` shape rendered by `CurrentWorkCard`. */
export function toCurrentWork(work: ResearchWork): CurrentWork {
  const created = work.createdAt?.toDate ? work.createdAt.toDate().toISOString() : '';
  const updated = work.updatedAt?.toDate ? work.updatedAt.toDate().toISOString() : created;
  return {
    id: work.id,
    userId: work.authorUid,
    authorName: work.authorName,
    authorDepartment: work.authorDepartment,
    authorDesignation: work.authorDesignation,
    authorPhotoURL: work.authorPhotoURL,
    title: work.title,
    description: work.description,
    topics: work.tags,
    stage: work.stage,
    externalURL: work.externalUrl ?? undefined,
    postType: work.postType,
    lookingFor: work.lookingFor,
    likesCount: 0,
    commentsCount: 0,
    createdAt: created,
    updatedAt: updated,
  };
}

/** Human-readable relative date, e.g. "Just now", "3h ago", "12 Nov 2026". */
export function formatWorkDate(value: ResearchWork['createdAt'] | undefined): string {
  return formatRelativeDate(value);
}
