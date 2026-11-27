/**
 * src/services/network.service.ts
 *
 * Researcher networking: connection requests and in-app notifications.
 *
 * Every connection change that notifies someone is written in ONE batch with
 * its notification; the security rules verify the pair with get()/getAfter().
 * No Cloud Functions, no push notifications (Firebase Spark).
 */

import {
  collection,
  doc,
  writeBatch,
  deleteDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  type DocumentData,
  type DocumentSnapshot,
  type Firestore,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import {
  buildConnectionRequest,
  buildConnectionResponse,
  buildNotification,
  type ParticipantSource,
} from '@/utils/network';
import type { UserProfile } from '@/types/user.types';
import type {
  Connection,
  InAppNotification,
  RelationshipState,
} from '@/types/network.types';

export const NOTIFICATIONS_LIMIT = 50;

function getFirestoreDb(): Firestore {
  if (!db) {
    throw new Error('[network.service] Cloud Firestore is not initialized.');
  }
  return db;
}

function toSource(profile: UserProfile): ParticipantSource {
  return {
    uid: profile.uid,
    displayName: profile.displayName,
    photoURL: profile.photoURL ?? null,
    designation: profile.designation,
  };
}

function toConnection(snap: DocumentSnapshot<DocumentData>): Connection | null {
  if (!snap.exists()) return null;
  const d = snap.data({ serverTimestamps: 'estimate' });
  return { id: snap.id, ...(d as Omit<Connection, 'id'>) };
}

function toNotification(snap: DocumentSnapshot<DocumentData>): InAppNotification | null {
  if (!snap.exists()) return null;
  const d = snap.data({ serverTimestamps: 'estimate' });
  return { id: snap.id, ...(d as Omit<InAppNotification, 'id'>) };
}

// ---------------------------------------------------------------------------
// Connections
// ---------------------------------------------------------------------------

/** Sends a connection request (+ notification for the recipient) atomically. */
export async function sendConnectionRequest(me: UserProfile, other: ParticipantSource): Promise<void> {
  const firestore = getFirestoreDb();
  if (me.uid === other.uid) throw new Error('You cannot connect with yourself.');

  const recipient: ParticipantSource = {
    uid: other.uid,
    displayName: other.displayName,
    photoURL: other.photoURL ?? null,
    designation: other.designation,
  };
  const { id, data } = buildConnectionRequest(toSource(me), recipient, serverTimestamp());
  const batch = writeBatch(firestore);
  batch.set(doc(firestore, 'connections', id), data);
  batch.set(
    doc(collection(firestore, 'notifications')),
    buildNotification('connection_request', toSource(me), other.uid, id, serverTimestamp()),
  );
  await batch.commit();
}

/**
 * Recipient accepts or rejects a pending request. Acceptance also notifies
 * the requester in the same batch; rejection is silent.
 */
export async function respondToConnection(
  me: UserProfile,
  connection: Connection,
  accept: boolean,
): Promise<void> {
  const firestore = getFirestoreDb();
  const batch = writeBatch(firestore);
  batch.update(doc(firestore, 'connections', connection.id), buildConnectionResponse(accept, serverTimestamp()));
  if (accept) {
    batch.set(
      doc(collection(firestore, 'notifications')),
      buildNotification('connection_accepted', toSource(me), connection.requesterUid, connection.id, serverTimestamp()),
    );
  }
  await batch.commit();
}

/** Cancels a pending request or removes an existing connection. */
export async function removeConnection(connectionId: string): Promise<void> {
  await deleteDoc(doc(getFirestoreDb(), 'connections', connectionId));
}

/** Real-time list of all connection documents involving `uid`. */
export function subscribeMyConnections(
  uid: string,
  onUpdate: (connections: Connection[]) => void,
  onError?: (error: Error) => void,
): () => void {
  if (!db || !uid) {
    onError?.(new Error('[network.service] Firestore unavailable or missing UID.'));
    return () => {};
  }
  const q = query(collection(db, 'connections'), where('users', 'array-contains', uid));
  return onSnapshot(
    q,
    (snapshot) =>
      onUpdate(snapshot.docs.map((d) => toConnection(d)).filter((c): c is Connection => c !== null)),
    (err) => {
      console.error('[network.service] Connections listener error:', err);
      onError?.(err);
    },
  );
}

/** Relationship between `myUid` and `otherUid` given my connection documents. */
export function relationshipFor(
  connections: Connection[],
  myUid: string,
  otherUid: string,
): { state: RelationshipState; connection: Connection | null } {
  const connection = connections.find((c) => c.users.includes(otherUid) && c.users.includes(myUid)) ?? null;
  if (!connection) return { state: 'none', connection: null };
  if (connection.status === 'accepted') return { state: 'connected', connection };
  if (connection.status === 'rejected') return { state: 'rejected', connection };
  return { state: connection.requesterUid === myUid ? 'outgoing' : 'incoming', connection };
}

/** The other participant's snapshot from a connection document. */
export function otherParticipant(connection: Connection, myUid: string) {
  return connection.requesterUid === myUid ? connection.recipient : connection.requester;
}

// ---------------------------------------------------------------------------
// In-app notifications
// ---------------------------------------------------------------------------

/** Real-time list of my latest notifications (newest first). */
export function subscribeNotifications(
  uid: string,
  onUpdate: (notifications: InAppNotification[]) => void,
  onError?: (error: Error) => void,
  max: number = NOTIFICATIONS_LIMIT,
): () => void {
  if (!db || !uid) {
    onError?.(new Error('[network.service] Firestore unavailable or missing UID.'));
    return () => {};
  }
  const q = query(
    collection(db, 'notifications'),
    where('recipientUid', '==', uid),
    orderBy('createdAt', 'desc'),
    limit(max),
  );
  return onSnapshot(
    q,
    (snapshot) =>
      onUpdate(
        snapshot.docs.map((d) => toNotification(d)).filter((n): n is InAppNotification => n !== null),
      ),
    (err) => {
      console.error('[network.service] Notifications listener error:', err);
      onError?.(err);
    },
  );
}

/** Real-time unread count for the tab badge (equality filters only; no composite index). */
export function subscribeUnreadCount(
  uid: string,
  onUpdate: (count: number) => void,
): () => void {
  if (!db || !uid) return () => {};
  const q = query(
    collection(db, 'notifications'),
    where('recipientUid', '==', uid),
    where('read', '==', false),
    limit(99),
  );
  return onSnapshot(
    q,
    (snapshot) => onUpdate(snapshot.size),
    (err) => console.error('[network.service] Unread listener error:', err),
  );
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  await updateDoc(doc(getFirestoreDb(), 'notifications', notificationId), { read: true });
}

export async function markAllNotificationsRead(notificationIds: string[]): Promise<void> {
  if (notificationIds.length === 0) return;
  const firestore = getFirestoreDb();
  const batch = writeBatch(firestore);
  notificationIds.forEach((id) => batch.update(doc(firestore, 'notifications', id), { read: true }));
  await batch.commit();
}

export async function deleteNotification(notificationId: string): Promise<void> {
  await deleteDoc(doc(getFirestoreDb(), 'notifications', notificationId));
}

/** Delete several of my notifications (recipients may delete — see rules). */
export async function deleteNotifications(notificationIds: string[]): Promise<void> {
  const firestore = getFirestoreDb();
  for (let i = 0; i < notificationIds.length; i += 400) {
    const batch = writeBatch(firestore);
    notificationIds.slice(i, i + 400).forEach((id) => batch.delete(doc(firestore, 'notifications', id)));
    await batch.commit();
  }
}
