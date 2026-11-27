/**
 * src/services/collab.service.ts
 *
 * Tier 1 collaboration workflow: applications to collaboration posts, the
 * author's accept / decline (team + connection), post status, contact cards.
 * Every write that notifies someone is ONE batch with its notification; the
 * security rules verify the pair (see firestore.rules).
 */

import {
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type DocumentSnapshot,
  type Firestore,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import {
  buildCollabConnection,
  buildCollabNotification,
  buildCollabRemoval,
  buildCollabRequest,
  buildCollabResponse,
  buildContactCard,
  buildTeamMember,
} from '@/utils/collab';
import { buildConnectionResponse, buildNotification, connectionIdFor } from '@/utils/network';
import type { UserProfile } from '@/types/user.types';
import type { ConnectionParticipant, Connection } from '@/types/network.types';
import type { CollabRequest, CollabStatus, ContactCard } from '@/types/collab.types';

function getFirestoreDb(): Firestore {
  if (!db) throw new Error('[collab.service] Cloud Firestore is not initialized.');
  return db;
}

const participantOf = (p: UserProfile): ConnectionParticipant => ({
  uid: p.uid,
  displayName: p.displayName,
  photoURL: p.photoURL ?? null,
  designation: p.designation,
});

function toRequest(snap: DocumentSnapshot<DocumentData>): CollabRequest | null {
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data({ serverTimestamps: 'estimate' }) as Omit<CollabRequest, 'id'>) };
}

const byNewest = (a: CollabRequest, b: CollabRequest) =>
  (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0);

// ---------------------------------------------------------------------------
// Applications
// ---------------------------------------------------------------------------

export interface CollabWorkRef {
  id: string;
  authorUid: string;
  title: string;
}

/** Apply to a collaboration post for one of its roles (+ notifies the author). */
export async function applyToCollaboration(
  me: UserProfile,
  work: CollabWorkRef,
  role: string,
  message: string | null,
): Promise<void> {
  const firestore = getFirestoreDb();
  const applicant = participantOf(me);
  const { id, data } = buildCollabRequest(applicant, work, role, message, serverTimestamp());
  const batch = writeBatch(firestore);
  batch.set(doc(firestore, 'collab_requests', id), data);
  batch.set(
    doc(collection(firestore, 'notifications')),
    buildCollabNotification('collab_request', applicant, work.authorUid, id, work.title, role, serverTimestamp()),
  );
  await batch.commit();
}

/** Withdraw my pending application. */
export async function withdrawApplication(requestId: string): Promise<void> {
  await deleteDoc(doc(getFirestoreDb(), 'collab_requests', requestId));
}

/**
 * Author accepts or declines an application. Accepting also adds the applicant
 * to the post's team and connects the two researchers (all in one batch).
 * `existing` is the current connection between author and applicant, if any.
 */
export async function respondToApplication(
  me: UserProfile,
  request: CollabRequest,
  accept: boolean,
  existing: Connection | null,
): Promise<void> {
  const firestore = getFirestoreDb();
  const author = participantOf(me);
  const now = serverTimestamp();
  const batch = writeBatch(firestore);

  batch.update(doc(firestore, 'collab_requests', request.id), buildCollabResponse(accept, now));

  if (accept) {
    batch.update(doc(firestore, 'research_works', request.workId), {
      team: arrayUnion(buildTeamMember(request.applicant, request.role)),
      updatedAt: now,
    });

    if (!existing) {
      // No relationship yet: connect directly (rules require this accepted application).
      const conn = buildCollabConnection(author, request.applicant, request.id, now);
      batch.set(doc(firestore, 'connections', conn.id), conn.data);
    } else if (existing.status === 'pending' && existing.recipientUid === me.uid) {
      // The applicant had already asked to connect: accept that request too.
      batch.update(doc(firestore, 'connections', existing.id), buildConnectionResponse(true, now));
      batch.set(
        doc(collection(firestore, 'notifications')),
        buildNotification('connection_accepted', author, request.applicantUid, existing.id, now),
      );
    }
    // Already connected, or the author's own request is still pending: team only.
  }

  batch.set(
    doc(collection(firestore, 'notifications')),
    buildCollabNotification(
      accept ? 'collab_accepted' : 'collab_declined',
      author,
      request.applicantUid,
      request.id,
      request.workTitle,
      request.role,
      now,
    ),
  );
  await batch.commit();
}

/**
 * Author removes an accepted member from the team, with a required reason.
 * One batch: request accepted -> removed (+ reason), the member's exact team
 * entry leaves the post, and the member gets a notice with the same reason.
 * The connection between the two researchers is kept.
 */
export async function removeTeamMember(me: UserProfile, request: CollabRequest, message: string): Promise<void> {
  const firestore = getFirestoreDb();
  const author = participantOf(me);
  const now = serverTimestamp();
  const reason = message.trim();
  const batch = writeBatch(firestore);
  batch.update(doc(firestore, 'collab_requests', request.id), buildCollabRemoval(reason, now));
  batch.update(doc(firestore, 'research_works', request.workId), {
    team: arrayRemove(buildTeamMember(request.applicant, request.role)),
    updatedAt: now,
  });
  batch.set(
    doc(collection(firestore, 'notifications')),
    buildCollabNotification('collab_removed', author, request.applicantUid, request.id, request.workTitle, request.role, now, reason),
  );
  await batch.commit();
}

/** Real-time list of my own applications (as applicant). */
export function subscribeMyApplications(
  uid: string,
  onUpdate: (requests: CollabRequest[]) => void,
  onError?: (e: Error) => void,
): () => void {
  if (!db || !uid) return () => {};
  return onSnapshot(
    query(collection(db, 'collab_requests'), where('applicantUid', '==', uid)),
    (snap) => onUpdate(snap.docs.map(toRequest).filter((r): r is CollabRequest => r !== null).sort(byNewest)),
    (err) => {
      console.error('[collab.service] My applications listener error:', err);
      onError?.(err);
    },
  );
}

/** Real-time list of applications to my posts (optionally one post). */
export function subscribeReceivedApplications(
  authorUid: string,
  onUpdate: (requests: CollabRequest[]) => void,
  workId?: string,
  onError?: (e: Error) => void,
): () => void {
  if (!db || !authorUid) return () => {};
  const constraints = [where('authorUid', '==', authorUid), ...(workId ? [where('workId', '==', workId)] : [])];
  return onSnapshot(
    query(collection(db, 'collab_requests'), ...constraints),
    (snap) => onUpdate(snap.docs.map(toRequest).filter((r): r is CollabRequest => r !== null).sort(byNewest)),
    (err) => {
      console.error('[collab.service] Received applications listener error:', err);
      onError?.(err);
    },
  );
}

// ---------------------------------------------------------------------------
// Post status
// ---------------------------------------------------------------------------

/** Author opens / closes a collaboration post ("Team formed"). */
export async function setCollabStatus(workId: string, status: CollabStatus): Promise<void> {
  await updateDoc(doc(getFirestoreDb(), 'research_works', workId), {
    collabStatus: status,
    updatedAt: serverTimestamp(),
  });
}

// ---------------------------------------------------------------------------
// Contact cards
// ---------------------------------------------------------------------------

/** Save my contact card. `shareEmail` shares my verified sign-in email. */
export async function saveContactCard(
  me: UserProfile,
  shareEmail: boolean,
  preferredContact: string | null,
): Promise<void> {
  const firestore = getFirestoreDb();
  await setDoc(
    doc(firestore, 'contact_cards', me.uid),
    buildContactCard(me.uid, shareEmail ? me.email : null, preferredContact, serverTimestamp()),
  );
}

/**
 * Read a contact card. Returns `null` when none exists OR when the rules deny
 * access (not connected) — callers show "Connect to see contact details".
 */
export async function getContactCard(uid: string): Promise<ContactCard | null> {
  try {
    const snap = await getDoc(doc(getFirestoreDb(), 'contact_cards', uid));
    return snap.exists() ? (snap.data({ serverTimestamps: 'estimate' }) as ContactCard) : null;
  } catch (err: any) {
    if (err?.code === 'permission-denied') return null;
    throw err;
  }
}

export { connectionIdFor };
