/**
 * src/hooks/useCollaborate.ts
 *
 * One place that decides the collaboration action on a post, so Home, Search,
 * topic pages and the detail screen all behave the same.
 *
 *   const collaborate = useCollaborate();
 *   <CurrentWorkCard {...collaborate(work)} />
 *
 * States: Apply → Application sent (tap to withdraw) → You're on the team /
 * Application declined; plus "Team formed" (closed post) and "Your
 * collaboration post" (own post). Work posts get no collaboration props.
 */

import { useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCollab } from '@/context/CollabContext';
import { confirmAction } from '@/utils/dialogs';

/** Minimal post shape — satisfied by both ResearchWork and the card's CurrentWork. */
export interface CollaborationPostLike {
  id: string;
  title: string;
  postType?: 'work' | 'collaboration';
  authorUid?: string;
  userId?: string;
  authorName: string;
  lookingFor?: string[];
  collabStatus?: 'open' | 'closed';
  team?: { uid: string }[];
}

export type CollaborateState = 'own' | 'member' | 'declined' | 'pending' | 'closed' | 'open';

export interface CollaborateProps {
  onCollaboratePress?: () => void;
  collaborateLabel?: string;
  collaborateDisabled?: boolean;
  /** Drives the button icon (see collabStateIcon). */
  collaborateState?: CollaborateState;
}

export function useCollaborate() {
  const { firebaseUser } = useAuth();
  const { applicationFor, openApply, withdraw } = useCollab();

  return useCallback(
    (post: CollaborationPostLike): CollaborateProps => {
      if (post.postType !== 'collaboration') return {};
      const authorUid = post.authorUid ?? post.userId ?? '';
      if (!authorUid) return {};

      if (authorUid === firebaseUser?.uid) {
        return { collaborateLabel: 'Your collaboration post', collaborateState: 'own', collaborateDisabled: true, onCollaboratePress: () => {} };
      }

      const application = applicationFor(post.id);
      const onTeam = (post.team ?? []).some((m) => m.uid === firebaseUser?.uid);
      if (onTeam || application?.status === 'accepted') {
        return { collaborateLabel: "You're on the team", collaborateState: 'member', collaborateDisabled: true, onCollaboratePress: () => {} };
      }
      if (application?.status === 'declined') {
        return { collaborateLabel: 'Application declined', collaborateState: 'declined', collaborateDisabled: true, onCollaboratePress: () => {} };
      }
      if (application?.status === 'pending') {
        return {
          collaborateLabel: 'Application sent · Tap to withdraw',
          collaborateState: 'pending',
          onCollaboratePress: async () => {
            const ok = await confirmAction({
              title: 'Withdraw application?',
              message: `Withdraw your application to "${post.title}"?`,
              confirmLabel: 'Withdraw',
              destructive: true,
            });
            if (ok) await withdraw(application);
          },
        };
      }
      if (post.collabStatus === 'closed') {
        return { collaborateLabel: 'Team formed', collaborateState: 'closed', collaborateDisabled: true, onCollaboratePress: () => {} };
      }
      return {
        collaborateLabel: "I'm interested · Apply",
        collaborateState: 'open',
        onCollaboratePress: () =>
          openApply({
            id: post.id,
            authorUid,
            authorName: post.authorName,
            title: post.title,
            lookingFor: post.lookingFor ?? [],
            teamUids: (post.team ?? []).map((m) => m.uid),
          }),
      };
    },
    [applicationFor, firebaseUser?.uid, openApply, withdraw],
  );
}
