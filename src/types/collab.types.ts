/**
 * src/types/collab.types.ts
 *
 * Collaboration workflow (Tier 1):
 *  - `collab_requests/{workId}_{applicantUid}` — a researcher applies to a
 *    collaboration post for one of its "looking for" roles, with a message.
 *  - `contact_cards/{uid}` — opt-in contact details visible only to accepted
 *    connections (email stays private otherwise).
 */

import type { Timestamp } from 'firebase/firestore';
import type { ConnectionParticipant } from './network.types';

/** 'removed': the author took an accepted member off the team (with a reason). */
export type CollabRequestStatus = 'pending' | 'accepted' | 'declined' | 'removed';

export interface CollabRequest {
  id: string;
  workId: string;
  /** Post author (reviews the request). */
  authorUid: string;
  applicantUid: string;
  applicant: ConnectionParticipant;
  workTitle: string;
  role: string;
  message: string | null;
  status: CollabRequestStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  respondedAt: Timestamp | null;
  /** Set when status is 'removed': the author's reason. */
  removalMessage?: string;
}

/** Member shown on a collaboration post once accepted. */
export interface TeamMember {
  uid: string;
  displayName: string;
  photoURL: string | null;
  role: string;
}

export type CollabStatus = 'open' | 'closed';

export interface ContactCard {
  uid: string;
  /** The owner's verified sign-in email, only if they chose to share it. */
  email: string | null;
  /** Free text, e.g. "WhatsApp +8801…", "Telegram @name", "linkedin.com/in/…". */
  preferredContact: string | null;
  updatedAt: Timestamp;
}

export const COLLAB_LIMITS = {
  messageMax: 500,
  preferredContactMax: 200,
  teamMax: 20,
} as const;
