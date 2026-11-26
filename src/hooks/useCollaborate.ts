/**
 * src/hooks/useCollaborate.ts
 *
 * One place that decides the "I'm interested" action on collaboration posts,
 * so Home, Search, topic pages and the detail screen all behave the same.
 *
 *   const collaborate = useCollaborate();
 *   <CurrentWorkCard {...collaborate(work)} />
 *
 * - Someone else's collaboration post: "I'm interested · Connect" -> sends a
 *   connection request; then "Request pending" / "Connected · View profile".
 * - Your own post: a disabled "Your collaboration post" label (so the action is
 *   never silently missing).
 * - Work posts: no collaboration props.
 */

import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useConnections } from '@/hooks/useConnections';
import type { ParticipantSource } from '@/utils/network';

/** Minimal post shape — satisfied by both ResearchWork and the card's CurrentWork. */
export interface CollaborationPostLike {
  postType?: 'work' | 'collaboration';
  authorUid?: string;
  userId?: string;
  authorName: string;
  authorPhotoURL?: string | null;
  authorDesignation?: string;
}

export interface CollaborateProps {
  onCollaboratePress?: () => void;
  collaborateLabel?: string;
  collaborateDisabled?: boolean;
}

export function useCollaborate() {
  const router = useRouter();
  const { firebaseUser } = useAuth();
  const { cardStatus, handleConnectPress } = useConnections();

  return useCallback(
    (post: CollaborationPostLike, authorProfile?: ParticipantSource | null): CollaborateProps => {
      if (post.postType !== 'collaboration') return {};
      const authorUid = post.authorUid ?? post.userId ?? '';
      if (!authorUid) return {};

      if (authorUid === firebaseUser?.uid) {
        return { collaborateLabel: 'Your collaboration post', collaborateDisabled: true, onCollaboratePress: () => {} };
      }

      const status = cardStatus(authorUid);
      if (status === 'connected') {
        return {
          collaborateLabel: 'Connected · View profile',
          onCollaboratePress: () => router.push(`/(profile)/${authorUid}` as any),
        };
      }
      if (status === 'pending') {
        return { collaborateLabel: 'Request pending', collaborateDisabled: true, onCollaboratePress: () => {} };
      }

      // Prefer the live directory profile; fall back to the author snapshot on the post.
      const target: ParticipantSource = authorProfile ?? {
        uid: authorUid,
        displayName: post.authorName,
        photoURL: post.authorPhotoURL ?? null,
        designation: post.authorDesignation ?? '',
      };
      return { collaborateLabel: "I'm interested · Connect", onCollaboratePress: () => handleConnectPress(target) };
    },
    [cardStatus, firebaseUser?.uid, handleConnectPress, router],
  );
}
