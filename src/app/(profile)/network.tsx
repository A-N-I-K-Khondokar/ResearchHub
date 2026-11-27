import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronRight, Users, UserPlus, Send, Briefcase } from 'lucide-react-native';
import { spacing, radius, typography, fontFamilies } from '../../constants';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useCollab } from '@/context/CollabContext';
import { useConnections } from '@/hooks/useConnections';
import { otherParticipant } from '@/services/network.service';
import { subscribeReceivedApplications } from '@/services/collab.service';
import { formatRelativeDate } from '@/utils/date';
import { ScreenHeader } from '../../components/layout/ScreenHeader';
import { Avatar } from '../../components/common/Avatar';
import type { CollabRequest } from '@/types/collab.types';

type Tab = 'connections' | 'requests' | 'collaborations';

/** My Network — connections, connection requests and collaborations in one place. */
export default function MyNetworkScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { userProfile } = useAuth();
  const myUid = userProfile?.uid ?? '';
  const { connections, connected, incomingRequests, accept, decline, handleConnectPress, busyUid } = useConnections();
  const { myApplications } = useCollab();
  const [received, setReceived] = useState<CollabRequest[]>([]);
  const params = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<Tab>(
    params.tab === 'requests' || params.tab === 'collaborations' ? params.tab : 'connections',
  );

  useEffect(() => {
    if (!myUid) return;
    return subscribeReceivedApplications(myUid, setReceived);
  }, [myUid]);

  const outgoing = useMemo(
    () => connections.filter((c) => c.status === 'pending' && c.requesterUid === myUid),
    [connections, myUid],
  );

  // Applications to my posts, grouped per post
  const receivedByPost = useMemo(() => {
    const map = new Map<string, { workId: string; title: string; total: number; pending: number }>();
    received.forEach((r) => {
      const entry = map.get(r.workId) ?? { workId: r.workId, title: r.workTitle, total: 0, pending: 0 };
      entry.total += 1;
      if (r.status === 'pending') entry.pending += 1;
      map.set(r.workId, entry);
    });
    return [...map.values()].sort((a, b) => b.pending - a.pending);
  }, [received]);

  const pendingReview = received.filter((r) => r.status === 'pending').length;

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'connections', label: 'Connections', count: connected.length },
    { key: 'requests', label: 'Requests', count: incomingRequests.length },
    { key: 'collaborations', label: 'Collaborations', count: pendingReview },
  ];

  const statusChip = (status: CollabRequest['status']) => {
    const map = {
      pending: { text: 'Pending', fg: colors.primary, bg: colors.primaryMuted },
      accepted: { text: 'On the team', fg: colors.success, bg: colors.successLight },
      declined: { text: 'Declined', fg: colors.textMuted, bg: colors.surfaceSubtle },
    }[status];
    return (
      <View style={[styles.chip, { backgroundColor: map.bg }]}>
        <Text style={[styles.chipText, { color: map.fg }]}>{map.text}</Text>
      </View>
    );
  };

  const Empty = ({ text }: { text: string }) => (
    <Text style={[styles.empty, { color: colors.textSecondary }]}>{text}</Text>
  );

  const SectionTitle = ({ icon, text }: { icon: React.ReactNode; text: string }) => (
    <View style={styles.sectionTitleRow}>
      {icon}
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{text}</Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <ScreenHeader title="My Network" />

      <View style={[styles.segment, { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderSubtle }]}>
        {tabs.map((t) => {
          const active = tab === t.key;
          return (
            <TouchableOpacity
              key={t.key}
              onPress={() => setTab(t.key)}
              style={[styles.segmentOption, active && { backgroundColor: colors.surface, borderColor: colors.border }]}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.segmentText, { color: active ? colors.primary : colors.textSecondary }]} numberOfLines={1}>
                {t.label}
                {t.count > 0 ? ` (${t.count})` : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {tab === 'connections' ? (
          connected.length === 0 ? (
            <Empty text="No connections yet. Find researchers in Explore and tap Connect." />
          ) : (
            connected.map((c) => {
              const p = otherParticipant(c, myUid);
              return (
                <TouchableOpacity
                  key={c.id}
                  onPress={() => router.push(`/(profile)/${p.uid}` as any)}
                  style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}
                  accessibilityRole="button"
                >
                  <Avatar name={p.displayName} uri={p.photoURL} size="md" />
                  <View style={styles.rowBody}>
                    <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>{p.displayName}</Text>
                    <Text style={[styles.meta, { color: colors.textSecondary }]} numberOfLines={1}>{p.designation}</Text>
                  </View>
                  <ChevronRight size={18} color={colors.textMuted} />
                </TouchableOpacity>
              );
            })
          )
        ) : null}

        {tab === 'requests' ? (
          <>
            <SectionTitle icon={<UserPlus size={16} color={colors.primary} />} text={`Received (${incomingRequests.length})`} />
            {incomingRequests.length === 0 ? (
              <Empty text="No pending requests." />
            ) : (
              incomingRequests.map((c) => {
                const p = otherParticipant(c, myUid);
                const busy = busyUid === p.uid;
                return (
                  <View key={c.id} style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
                    <TouchableOpacity onPress={() => router.push(`/(profile)/${p.uid}` as any)} style={styles.rowTap}>
                      <Avatar name={p.displayName} uri={p.photoURL} size="md" />
                      <View style={styles.rowBody}>
                        <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>{p.displayName}</Text>
                        <Text style={[styles.meta, { color: colors.textSecondary }]} numberOfLines={1}>
                          {p.designation} · {formatRelativeDate(c.createdAt)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                    <View style={styles.rowActions}>
                      <TouchableOpacity
                        onPress={() => decline(c)}
                        disabled={busy}
                        style={[styles.smallBtn, { borderColor: colors.border }]}
                        accessibilityRole="button"
                      >
                        <Text style={[styles.smallBtnText, { color: colors.textPrimary }]}>Decline</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => accept(c)}
                        disabled={busy}
                        style={[styles.smallBtn, { backgroundColor: colors.primary, borderColor: colors.primary }]}
                        accessibilityRole="button"
                      >
                        <Text style={[styles.smallBtnText, { color: '#FFFFFF' }]}>Accept</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}

            <SectionTitle icon={<Send size={16} color={colors.primary} />} text={`Sent (${outgoing.length})`} />
            {outgoing.length === 0 ? (
              <Empty text="No requests waiting for a reply." />
            ) : (
              outgoing.map((c) => {
                const p = otherParticipant(c, myUid);
                return (
                  <View key={c.id} style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
                    <TouchableOpacity onPress={() => router.push(`/(profile)/${p.uid}` as any)} style={styles.rowTap}>
                      <Avatar name={p.displayName} uri={p.photoURL} size="md" />
                      <View style={styles.rowBody}>
                        <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>{p.displayName}</Text>
                        <Text style={[styles.meta, { color: colors.textSecondary }]} numberOfLines={1}>
                          Sent {formatRelativeDate(c.createdAt)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleConnectPress(p)}
                      style={[styles.smallBtn, { borderColor: colors.border }]}
                      accessibilityRole="button"
                    >
                      <Text style={[styles.smallBtnText, { color: colors.textPrimary }]}>Withdraw</Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </>
        ) : null}

        {tab === 'collaborations' ? (
          <>
            <SectionTitle icon={<Briefcase size={16} color={colors.primary} />} text="Applications to my posts" />
            {receivedByPost.length === 0 ? (
              <Empty text="No applications yet. Post a collaboration request from the Share tab." />
            ) : (
              receivedByPost.map((p) => (
                <TouchableOpacity
                  key={p.workId}
                  onPress={() => router.push(`/(research)/${p.workId}` as any)}
                  style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}
                  accessibilityRole="button"
                >
                  <View style={[styles.iconTile, { backgroundColor: colors.primaryMuted }]}>
                    <Users size={18} color={colors.primary} />
                  </View>
                  <View style={styles.rowBody}>
                    <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>{p.title}</Text>
                    <Text style={[styles.meta, { color: p.pending ? colors.primary : colors.textSecondary }]} numberOfLines={1}>
                      {p.pending ? `${p.pending} waiting for review · ` : ''}{p.total} applicant{p.total === 1 ? '' : 's'}
                    </Text>
                  </View>
                  <ChevronRight size={18} color={colors.textMuted} />
                </TouchableOpacity>
              ))
            )}

            <SectionTitle icon={<Send size={16} color={colors.primary} />} text="My applications" />
            {myApplications.length === 0 ? (
              <Empty text="You haven't applied to any collaboration yet." />
            ) : (
              myApplications.map((r) => (
                <TouchableOpacity
                  key={r.id}
                  onPress={() => router.push(`/(research)/${r.workId}` as any)}
                  style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}
                  accessibilityRole="button"
                >
                  <View style={styles.rowBody}>
                    <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>{r.workTitle}</Text>
                    <Text style={[styles.meta, { color: colors.textSecondary }]} numberOfLines={1}>
                      As {r.role} · {formatRelativeDate(r.createdAt)}
                    </Text>
                  </View>
                  {statusChip(r.status)}
                </TouchableOpacity>
              ))
            )}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  segment: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: radius.button,
    padding: 4,
    gap: 4,
    margin: spacing.md,
    marginBottom: 0,
  },
  segmentOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'transparent',
    paddingHorizontal: 4,
  },
  segmentText: { ...typography.caption, fontSize: 13, fontFamily: fontFamilies.sansSemiBold },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.md, marginBottom: spacing.sm },
  sectionTitle: { ...typography.sectionHeader },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  rowTap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minWidth: 0 },
  rowBody: { flex: 1, minWidth: 0 },
  rowActions: { flexDirection: 'row', gap: spacing.xs },
  name: { ...typography.label },
  meta: { ...typography.caption, marginTop: 2 },
  smallBtn: {
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: radius.button,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallBtnText: { ...typography.caption, fontSize: 13, fontFamily: fontFamilies.sansSemiBold },
  iconTile: { width: 40, height: 40, borderRadius: radius.button, alignItems: 'center', justifyContent: 'center' },
  chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full },
  chipText: { ...typography.caption, fontFamily: fontFamilies.sansSemiBold },
  empty: { ...typography.bodySmall, marginBottom: spacing.sm },
});
