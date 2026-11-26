/**
 * src/hooks/useConnections.ts
 *
 * Live connection state for the signed-in researcher plus the shared
 * "Connect" button behaviour used by Home, Explore, search, topic pages and
 * researcher profiles. Identical Firestore queries opened by several screens
 * are multiplexed by the SDK into a single listener.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { confirmAction, showMessage } from '@/utils/dialogs';
import { useAuth } from '@/context/AuthContext';
import {
  subscribeMyConnections,
  sendConnectionRequest,
  respondToConnection,
  removeConnection,
  relationshipFor,
} from '@/services/network.service';
import type { ParticipantSource } from '@/utils/network';
import type { Connection, RelationshipState } from '@/types/network.types';

/** Status vocabulary understood by ResearcherCard / ResearcherDiscoveryCard. */
export type CardConnectionStatus = 'none' | 'pending' | 'connected';

export function toCardStatus(state: RelationshipState): CardConnectionStatus {
  if (state === 'connected') return 'connected';
  if (state === 'outgoing' || state === 'incoming') return 'pending';
  return 'none';
}

export function useConnections() {
  const { userProfile } = useAuth();
  const myUid = userProfile?.approvalStatus === 'approved' ? userProfile.uid : '';

  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyUid, setBusyUid] = useState<string | null>(null);

  useEffect(() => {
    if (!myUid) {
      setConnections([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    return subscribeMyConnections(
      myUid,
      (list) => {
        setConnections(list);
        setLoading(false);
      },
      () => setLoading(false),
    );
  }, [myUid]);

  const relationship = useCallback(
    (otherUid: string) => relationshipFor(connections, myUid, otherUid),
    [connections, myUid],
  );

  const cardStatus = useCallback(
    (otherUid: string): CardConnectionStatus => toCardStatus(relationship(otherUid).state),
    [relationship],
  );

  const connected = useMemo(
    () => connections.filter((c) => c.status === 'accepted'),
    [connections],
  );
  const incomingRequests = useMemo(
    () => connections.filter((c) => c.status === 'pending' && c.recipientUid === myUid),
    [connections, myUid],
  );

  const run = useCallback(async (uid: string, action: () => Promise<void>, failMessage: string) => {
    setBusyUid(uid);
    try {
      await action();
    } catch (err) {
      console.error('[useConnections] Action failed:', err);
      showMessage('Something went wrong', failMessage);
    } finally {
      setBusyUid(null);
    }
  }, []);

  const accept = useCallback(
    (connection: Connection) => {
      if (!userProfile) return Promise.resolve();
      const other = connection.requesterUid;
      return run(other, () => respondToConnection(userProfile, connection, true), 'Could not accept the request.');
    },
    [run, userProfile],
  );

  const decline = useCallback(
    (connection: Connection) => {
      if (!userProfile) return Promise.resolve();
      const other = connection.requesterUid;
      return run(other, () => respondToConnection(userProfile, connection, false), 'Could not decline the request.');
    },
    [run, userProfile],
  );

  /** Shared Connect-button handler: send / cancel / respond / remove. */
  const handleConnectPress = useCallback(
    (other: ParticipantSource) => {
      if (!userProfile || !myUid || other.uid === myUid || busyUid) return;
      const { state, connection } = relationship(other.uid);

      switch (state) {
        case 'none':
          run(other.uid, () => sendConnectionRequest(userProfile, other), 'Could not send the connection request.');
          break;
        case 'outgoing':
          confirmAction({
            title: 'Cancel request?',
            message: `Withdraw your connection request to ${other.displayName}?`,
            confirmLabel: 'Withdraw',
            cancelLabel: 'Keep',
            destructive: true,
          }).then((ok) => {
            if (ok) run(other.uid, () => removeConnection(connection!.id), 'Could not withdraw the request.');
          });
          break;
        case 'incoming':
          if (Platform.OS === 'web') {
            // Browsers only offer OK/Cancel; Decline remains on the Notifications tab.
            confirmAction({
              title: 'Connection request',
              message: `${other.displayName} wants to connect with you. Accept the request?`,
              confirmLabel: 'Accept',
            }).then((ok) => {
              if (ok) accept(connection!);
            });
          } else {
            Alert.alert('Connection request', `${other.displayName} wants to connect with you.`, [
              { text: 'Later', style: 'cancel' },
              { text: 'Decline', style: 'destructive', onPress: () => decline(connection!) },
              { text: 'Accept', onPress: () => accept(connection!) },
            ]);
          }
          break;
        case 'connected':
          confirmAction({
            title: 'Remove connection?',
            message: `You and ${other.displayName} will no longer be connected.`,
            confirmLabel: 'Remove',
            destructive: true,
          }).then((ok) => {
            if (ok) run(other.uid, () => removeConnection(connection!.id), 'Could not remove the connection.');
          });
          break;
        case 'rejected':
          if (connection?.recipientUid === myUid) {
            confirmAction({
              title: 'Request declined',
              message: `You declined ${other.displayName}'s request. Clear it so you can connect?`,
              confirmLabel: 'Clear',
            }).then((ok) => {
              if (ok) run(other.uid, () => removeConnection(connection.id), 'Could not clear the request.');
            });
          } else {
            showMessage('Request declined', `${other.displayName} declined your connection request.`);
          }
          break;
      }
    },
    [accept, busyUid, decline, myUid, relationship, run, userProfile],
  );

  return {
    connections,
    connected,
    incomingRequests,
    loading,
    busyUid,
    relationship,
    cardStatus,
    accept,
    decline,
    handleConnectPress,
  };
}
