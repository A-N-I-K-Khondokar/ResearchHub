/**
 * src/services/saved.service.ts
 *
 * Private bookmarks at `users/{uid}/saved_items/{workId}` (owner-only).
 */

import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  type Firestore,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { buildSavedItem } from '@/utils/network';
import type { ResearchWork } from '@/types/research.types';
import type { SavedItem } from '@/types/network.types';

function getFirestoreDb(): Firestore {
  if (!db) throw new Error('[saved.service] Cloud Firestore is not initialized.');
  return db;
}

export async function saveWork(uid: string, work: ResearchWork): Promise<void> {
  const firestore = getFirestoreDb();
  await setDoc(
    doc(firestore, 'users', uid, 'saved_items', work.id),
    buildSavedItem(
      {
        id: work.id,
        title: work.title,
        authorUid: work.authorUid,
        authorName: work.authorName,
        stage: work.stage,
      },
      serverTimestamp(),
    ),
  );
}

export async function unsaveWork(uid: string, workId: string): Promise<void> {
  await deleteDoc(doc(getFirestoreDb(), 'users', uid, 'saved_items', workId));
}

/** Real-time list of my saved items, most recently saved first. */
export function subscribeSavedItems(
  uid: string,
  onUpdate: (items: SavedItem[]) => void,
  onError?: (error: Error) => void,
): () => void {
  if (!db || !uid) {
    onError?.(new Error('[saved.service] Firestore unavailable or missing UID.'));
    return () => {};
  }
  return onSnapshot(
    collection(db, 'users', uid, 'saved_items'),
    (snapshot) => {
      const items = snapshot.docs.map((d) => d.data({ serverTimestamps: 'estimate' }) as SavedItem);
      items.sort((a, b) => (b.savedAt?.toMillis?.() ?? 0) - (a.savedAt?.toMillis?.() ?? 0));
      onUpdate(items);
    },
    (err) => {
      console.error('[saved.service] Saved items listener error:', err);
      onError?.(err);
    },
  );
}
