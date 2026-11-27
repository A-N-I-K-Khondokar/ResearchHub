/**
 * src/utils/collab.ts
 *
 * Pure builders for the collaboration workflow. Free of React Native / Firebase
 * runtime imports so the Firestore emulator tests exercise the exact payloads
 * written by `collab.service.ts`. `timestamp` is the serverTimestamp() sentinel.
 */

import type { ConnectionParticipant } from '@/types/network.types';

export const collabRequestId = (workId: string, applicantUid: string): string => `${workId}_${applicantUid}`;

export interface CollabWorkSource {
  id: string;
  authorUid: string;
  title: string;
}

export function buildCollabRequest(
  applicant: ConnectionParticipant,
  work: CollabWorkSource,
  role: string,
  message: string | null,
  timestamp: unknown,
): { id: string; data: Record<string, unknown> } {
  const text = message?.trim();
  return {
    id: collabRequestId(work.id, applicant.uid),
    data: {
      workId: work.id,
      authorUid: work.authorUid,
      applicantUid: applicant.uid,
      applicant: {
        uid: applicant.uid,
        displayName: applicant.displayName,
        photoURL: applicant.photoURL ?? null,
        designation: applicant.designation,
      },
      workTitle: work.title,
      role,
      message: text ? text.slice(0, 500) : null,
      status: 'pending',
      createdAt: timestamp,
      updatedAt: timestamp,
      respondedAt: null,
    },
  };
}

export function buildCollabResponse(accept: boolean, timestamp: unknown): Record<string, unknown> {
  return { status: accept ? 'accepted' : 'declined', respondedAt: timestamp, updatedAt: timestamp };
}

/** Author removes an accepted member: the request moves accepted -> removed with a reason. */
export const REMOVAL_MESSAGE = { min: 10, max: 300 } as const;

export function validateRemovalMessage(message: string): string | null {
  const m = message.trim();
  if (m.length < REMOVAL_MESSAGE.min) return `Write at least ${REMOVAL_MESSAGE.min} characters so they understand why.`;
  if (m.length > REMOVAL_MESSAGE.max) return `Keep it under ${REMOVAL_MESSAGE.max} characters.`;
  return null;
}

export function buildCollabRemoval(message: string, timestamp: unknown): Record<string, unknown> {
  return { status: 'removed', removalMessage: message.trim(), updatedAt: timestamp };
}

export type CollabNotificationType = 'collab_request' | 'collab_accepted' | 'collab_declined' | 'collab_removed';

/** In-app notification tied to a collaboration request (`connectionId` holds the request id). */
export function buildCollabNotification(
  type: CollabNotificationType,
  actor: ConnectionParticipant,
  recipientUid: string,
  requestId: string,
  workTitle: string,
  role: string,
  timestamp: unknown,
  /** collab_removed only: the author's reason, shown to the removed member. */
  message?: string,
): Record<string, unknown> {
  return {
    recipientUid,
    actorUid: actor.uid,
    actorName: actor.displayName,
    actorPhotoURL: actor.photoURL ?? null,
    type,
    connectionId: requestId,
    workTitle,
    role,
    read: false,
    createdAt: timestamp,
    ...(message !== undefined ? { message: message.trim() } : {}),
  };
}

/** Accepted connection created by the post author when accepting an application. */
export function buildCollabConnection(
  author: ConnectionParticipant,
  applicant: ConnectionParticipant,
  requestId: string,
  timestamp: unknown,
): { id: string; data: Record<string, unknown> } {
  const users = [author.uid, applicant.uid].sort();
  const p = (x: ConnectionParticipant) => ({
    uid: x.uid,
    displayName: x.displayName,
    photoURL: x.photoURL ?? null,
    designation: x.designation,
  });
  return {
    id: `${users[0]}_${users[1]}`,
    data: {
      users,
      requesterUid: author.uid,
      recipientUid: applicant.uid,
      requester: p(author),
      recipient: p(applicant),
      status: 'accepted',
      viaCollabRequest: requestId,
      createdAt: timestamp,
      updatedAt: timestamp,
      respondedAt: timestamp,
    },
  };
}

export function buildTeamMember(applicant: ConnectionParticipant, role: string): Record<string, unknown> {
  return { uid: applicant.uid, displayName: applicant.displayName, photoURL: applicant.photoURL ?? null, role };
}

export function buildContactCard(
  uid: string,
  email: string | null,
  preferredContact: string | null,
  timestamp: unknown,
): Record<string, unknown> {
  const pref = preferredContact?.trim();
  return {
    uid,
    email: email ?? null,
    preferredContact: pref ? pref.slice(0, 200) : null,
    updatedAt: timestamp,
  };
}
