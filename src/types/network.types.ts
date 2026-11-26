/**
 * src/types/network.types.ts
 *
 * Firestore data models for researcher networking (Stage 3):
 *  - `connections/{pairId}`              — one document per researcher pair
 *  - `notifications/{notificationId}`    — in-app notifications (no push)
 *  - `users/{uid}/saved_items/{workId}`  — the owner's bookmarked research work
 */

import type { Timestamp } from 'firebase/firestore';

// ---------------------------------------------------------------------------
// Connections
// ---------------------------------------------------------------------------

export type ConnectionStatus = 'pending' | 'accepted' | 'rejected';

/** Snapshot of a participant, validated against `users/{uid}` by the rules. */
export interface ConnectionParticipant {
  uid: string;
  displayName: string;
  photoURL: string | null;
  designation: string;
}

/**
 * Document ID is `${smallerUid}_${largerUid}` so a pair can only ever have
 * one connection document (prevents duplicate requests in either direction).
 */
export interface Connection {
  id: string;
  /** Both participant UIDs, sorted ascending (enables `array-contains` queries). */
  users: [string, string];
  requesterUid: string;
  recipientUid: string;
  requester: ConnectionParticipant;
  recipient: ConnectionParticipant;
  status: ConnectionStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  respondedAt: Timestamp | null;
}

/** UI-level relationship between the signed-in user and another researcher. */
export type RelationshipState =
  | 'none'
  | 'outgoing'   // I sent a pending request
  | 'incoming'   // They sent me a pending request
  | 'connected'
  | 'rejected';  // Request was declined (either direction)

// ---------------------------------------------------------------------------
// In-app notifications
// ---------------------------------------------------------------------------

export type InAppNotificationType =
  | 'connection_request'
  | 'connection_accepted'
  | 'collab_request'
  | 'collab_accepted'
  | 'collab_declined';

export interface InAppNotification {
  id: string;
  recipientUid: string;
  actorUid: string;
  actorName: string;
  actorPhotoURL: string | null;
  type: InAppNotificationType;
  /** Connection id, or the collaboration request id for collab_* types. */
  connectionId: string;
  /** Collaboration notifications only. */
  workTitle?: string;
  role?: string;
  read: boolean;
  createdAt: Timestamp;
}

// ---------------------------------------------------------------------------
// Saved items
// ---------------------------------------------------------------------------

/** Document ID equals `workId` (one bookmark per work). */
export interface SavedItem {
  workId: string;
  workTitle: string;
  workAuthorUid: string;
  workAuthorName: string;
  workStage: string;
  savedAt: Timestamp;
}
