/**
 * src/utils/network.ts
 *
 * Pure builders for connection, notification and saved-item documents.
 * Free of React Native / Firebase runtime imports so the Firestore emulator
 * test suite exercises the exact payloads the services write.
 * `timestamp` is the `serverTimestamp()` sentinel supplied by the caller.
 */

import type { ConnectionParticipant, InAppNotificationType } from '@/types/network.types';

/** Deterministic connection document ID for a pair of UIDs. */
export function connectionIdFor(uidA: string, uidB: string): string {
  return uidA < uidB ? `${uidA}_${uidB}` : `${uidB}_${uidA}`;
}

/** Minimal profile shape needed to build participant snapshots. */
export interface ParticipantSource {
  uid: string;
  displayName: string;
  photoURL?: string | null;
  designation: string;
}

export function toParticipant(source: ParticipantSource): ConnectionParticipant {
  return {
    uid: source.uid,
    displayName: source.displayName,
    photoURL: source.photoURL ?? null,
    designation: source.designation,
  };
}

export function buildConnectionRequest(
  requester: ParticipantSource,
  recipient: ParticipantSource,
  timestamp: unknown,
): { id: string; data: Record<string, unknown> } {
  const users = [requester.uid, recipient.uid].sort();
  return {
    id: connectionIdFor(requester.uid, recipient.uid),
    data: {
      users,
      requesterUid: requester.uid,
      recipientUid: recipient.uid,
      requester: toParticipant(requester),
      recipient: toParticipant(recipient),
      status: 'pending',
      createdAt: timestamp,
      updatedAt: timestamp,
      respondedAt: null,
    },
  };
}

/** Recipient's response payload (accept or reject). */
export function buildConnectionResponse(
  accept: boolean,
  timestamp: unknown,
): Record<string, unknown> {
  return {
    status: accept ? 'accepted' : 'rejected',
    respondedAt: timestamp,
    updatedAt: timestamp,
  };
}

export function buildNotification(
  type: InAppNotificationType,
  actor: ParticipantSource,
  recipientUid: string,
  connectionId: string,
  timestamp: unknown,
): Record<string, unknown> {
  return {
    recipientUid,
    actorUid: actor.uid,
    actorName: actor.displayName,
    actorPhotoURL: actor.photoURL ?? null,
    type,
    connectionId,
    read: false,
    createdAt: timestamp,
  };
}

export interface SavedWorkSource {
  id: string;
  title: string;
  authorUid: string;
  authorName: string;
  stage: string;
}

export function buildSavedItem(work: SavedWorkSource, timestamp: unknown): Record<string, unknown> {
  return {
    workId: work.id,
    workTitle: work.title,
    workAuthorUid: work.authorUid,
    workAuthorName: work.authorName,
    workStage: work.stage,
    savedAt: timestamp,
  };
}
