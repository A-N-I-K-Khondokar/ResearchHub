/**
 * My Network
 *
 *  Connections — search + sort, shared interests, "since", 💬 Contact, ⋯ menu,
 *                "People you may know" when the network is small
 *  Requests    — received (with shared interests) / sent (confirm withdraw)
 *  Teams       — waiting for you · teams I lead · teams I'm on · my applications
 */

import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, RefreshControl } from 'react-native';
import { COMPACT_FONT_SCALE } from '@/constants/typography';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ChevronDown,
  ChevronRight,
  Inbox,
  MessageCircle,
  MoreHorizontal,
  Search,
  Send,
  Sparkles,
  Users,
  UserPlus,
  X,
  Star,
  UserCheck,
} from 'lucide-react-native';
import { FieldFrame } from '@/components/common/TextField';
import { spacing, radius, typography, fontFamilies } from '../../constants';
import { cardShadow } from '@/constants/cards';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useCollab } from '@/context/CollabContext';
import { useConnections } from '@/hooks/useConnections';
import { useResearchDirectory } from '@/hooks/useResearchDirectory';
import { otherParticipant } from '@/services/network.service';
import { subscribeReceivedApplications } from '@/services/collab.service';
import { subscribeMyResearchWorks, subscribeWorksByIds } from '@/services/research.service';
import { formatRelativeDate } from '@/utils/date';
import { tagMatchKey } from '@/utils/researchWork';
import { chooseAction, confirmAction } from '@/utils/dialogs';
import { ScreenHeader } from '../../components/layout/ScreenHeader';
import { Avatar } from '../../components/common/Avatar';
import { ContactSheet, type ContactPerson } from '../../components/common/ContactSheet';
import { SkeletonList } from '../../components/feedback/Skeleton';
import { PersonCard } from '@/components/explore/ExploreCards';
import type { CollabRequest } from '@/types/collab.types';
import type { Connection } from '@/types/network.types';
import type { ResearchWork } from '@/types/research.types';

type Tab = 'connections' | 'requests' | 'teams';
type Sort = 'recent' | 'name';

const toMillis = (t: any) => (t?.toMillis ? t.toMillis() : 0);

export default function MyNetworkScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { userProfile } = useAuth();
  const myUid = userProfile?.uid ?? '';
  const {
    connections,
    connected,
    incomingRequests,
    loading,
    accept,
    decline,
    handleConnectPress,
    busyUid,
    cardStatus,
  } = useConnections();
  const { myApplications, withdraw } = useCollab();
  const directory = useResearchDirectory();
  const params = useLocalSearchParams<{ tab?: string }>();

  const [tab, setTab] = useState<Tab>(
    params.tab === 'requests' ? 'requests' : params.tab === 'collaborations' || params.tab === 'teams' ? 'teams' : 'connections',
  );
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<Sort>('recent');
  const [showDeclined, setShowDeclined] = useState(false);
  const [contactPerson, setContactPerson] = useState<ContactPerson | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // ---------------------------------------------------------------------------
  // Data
  // ---------------------------------------------------------------------------
  const [received, setReceived] = useState<CollabRequest[]>([]);
  const [myWorks, setMyWorks] = useState<ResearchWork[]>([]);
  const [joinedWorks, setJoinedWorks] = useState<ResearchWork[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(true);

  useEffect(() => {
    if (!myUid) return;
    return subscribeReceivedApplications(myUid, setReceived);
  }, [myUid]);
  useEffect(() => {
    if (!myUid) return;
    return subscribeMyResearchWorks(
      myUid,
      (w) => {
        setMyWorks(w);
        setTeamsLoading(false);
      },
      () => setTeamsLoading(false),
    );
  }, [myUid]);
  const joinedKey = myApplications.filter((a) => a.status === 'accepted').map((a) => a.workId).sort().join(',');
  useEffect(() => subscribeWorksByIds(joinedKey ? joinedKey.split(',') : [], setJoinedWorks), [joinedKey]);

  const myKeys = useMemo(() => new Set((userProfile?.researchInterests ?? []).map(tagMatchKey)), [userProfile?.researchInterests]);
  const sharedWith = (uid: string) => {
    const p = directory.profileByUid.get(uid);
    return (p?.researchInterests ?? []).filter((i) => myKeys.has(tagMatchKey(i)));
  };

  const onRefresh = () => {
    setRefreshing(true);
    directory.refresh();
    setTimeout(() => setRefreshing(false), 900);
  };

  // Connections: search + sort
  const connectionRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = connected.map((c) => {
      const p = otherParticipant(c, myUid);
      const interests = directory.profileByUid.get(p.uid)?.researchInterests ?? [];
      return { c, p, interests };
    });
    const filtered = q
      ? rows.filter(({ p, interests }) =>
          [p.displayName, p.designation, ...interests].some((v) => v?.toLowerCase().includes(q)),
        )
      : rows;
    return filtered.sort((a, b) =>
      sort === 'name'
        ? a.p.displayName.localeCompare(b.p.displayName)
        : toMillis(b.c.respondedAt ?? b.c.updatedAt) - toMillis(a.c.respondedAt ?? a.c.updatedAt),
    );
  }, [connected, myUid, query, sort, directory.profileByUid]);

  const outgoing = useMemo(
    () => connections.filter((c) => c.status === 'pending' && c.requesterUid === myUid),
    [connections, myUid],
  );

  // People you may know (shown when the network is small)
  const suggestions = useMemo(() => {
    if (connected.length >= 5) return [];
    return directory.researchers
      .filter((r) => cardStatus(r.id) === 'none')
      .map((r) => ({ person: r, shared: (r.interests ?? []).filter((i) => myKeys.has(tagMatchKey(i))) }))
      .sort((a, b) => b.shared.length - a.shared.length)
      .slice(0, 8);
  }, [connected.length, directory.researchers, cardStatus, myKeys]);

  // Teams
  const waiting = useMemo(() => {
    const map = new Map<string, { workId: string; title: string; pending: number }>();
    received.forEach((r) => {
      if (r.status !== 'pending') return;
      const e = map.get(r.workId) ?? { workId: r.workId, title: r.workTitle, pending: 0 };
      e.pending += 1;
      map.set(r.workId, e);
    });
    return [...map.values()].sort((a, b) => b.pending - a.pending);
  }, [received]);
  const teamsILead = useMemo(
    () => myWorks.filter((w) => w.postType === 'collaboration' && w.status === 'published'),
    [myWorks],
  );
  const roleFor = useMemo(() => new Map(myApplications.map((a) => [a.workId, a.role] as const)), [myApplications]);
  const openApps = myApplications.filter((a) => a.status === 'pending');
  const declinedApps = myApplications.filter((a) => a.status === 'declined');

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------
  const openProfile = (uid: string) => router.push(`/(profile)/${uid}` as any);
  const contact = (p: { uid: string; displayName: string; photoURL: string | null; designation?: string }, subtitle?: string) =>
    setContactPerson({ uid: p.uid, displayName: p.displayName, photoURL: p.photoURL, subtitle: subtitle ?? p.designation });
  const connectionMenu = (c: Connection) => {
    const p = otherParticipant(c, myUid);
    chooseAction(p.displayName, [
      { label: 'View profile', onPress: () => openProfile(p.uid) },
      { label: 'Contact', onPress: () => contact(p) },
      // handleConnectPress asks "Remove connection?" first
      { label: 'Remove connection', destructive: true, onPress: () => handleConnectPress(p) },
    ]);
  };
  const withdrawApp = async (r: CollabRequest) => {
    const ok = await confirmAction({
      title: 'Withdraw application?',
      message: `Withdraw your application to "${r.workTitle}" as ${r.role}?`,
      confirmLabel: 'Withdraw',
      destructive: true,
    });
    if (ok) await withdraw(r);
  };

  // ---------------------------------------------------------------------------
  // UI helpers
  // ---------------------------------------------------------------------------
  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'connections', label: 'Connections', count: connected.length },
    { key: 'requests', label: 'Requests', count: incomingRequests.length },
    { key: 'teams', label: 'Teams', count: waiting.reduce((n, w) => n + w.pending, 0) },
  ];

  const Title = ({ icon, text }: { icon: React.ReactNode; text: string }) => (
    <View style={styles.titleRow}>
      {icon}
      <Text style={[styles.title, { color: colors.textPrimary }]}>{text}</Text>
    </View>
  );

  const EmptyBox = ({ text, action, onAction }: { text: string; action?: string; onAction?: () => void }) => (
    <View style={[styles.emptyBox, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{text}</Text>
      {action && onAction ? (
        <TouchableOpacity onPress={onAction} style={[styles.emptyBtn, { backgroundColor: colors.primaryMuted }]} accessibilityRole="button">
          <Text maxFontSizeMultiplier={COMPACT_FONT_SCALE} style={[styles.btnText, { color: colors.primary }]}>{action}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );

  const btn = (label: string, onPress: () => void, primary = false, disabled = false, icon?: React.ReactNode) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      hitSlop={4}
      style={[
        styles.btn,
        primary ? { backgroundColor: colors.primary, borderColor: colors.primary } : { borderColor: colors.border, backgroundColor: colors.surface },
      ]}
      accessibilityRole="button"
    >
      {icon}
      <Text maxFontSizeMultiplier={COMPACT_FONT_SCALE} style={[styles.btnText, { color: primary ? '#FFFFFF' : colors.textPrimary }]}>{label}</Text>
    </TouchableOpacity>
  );

  const sharedTag = (shared: string[]) =>
    shared.length ? (
      <View style={styles.sharedRow}>
        <Star size={11} color={colors.success} fill={colors.success} />
        <Text style={[styles.shared, { color: colors.success, flexShrink: 1 }]} numberOfLines={1}>
          {shared.length} shared · {shared.slice(0, 2).join(', ')}
        </Text>
      </View>
    ) : null;

  const statusChip = (status: CollabRequest['status']) => {
    const map = {
      pending: { text: 'Pending', fg: colors.primary, bg: colors.primaryMuted },
      accepted: { text: 'On the team', fg: colors.success, bg: colors.successLight },
      declined: { text: 'Declined', fg: colors.textMuted, bg: colors.surfaceSubtle },
    }[status];
    return (
      <View style={[styles.chip, { backgroundColor: map.bg }]}>
        <Text maxFontSizeMultiplier={COMPACT_FONT_SCALE} style={[styles.chipText, { color: map.fg }]}>{map.text}</Text>
      </View>
    );
  };

  // ---------------------------------------------------------------------------
  // Tabs
  // ---------------------------------------------------------------------------
  const renderConnections = () => (
    <>
      <View style={styles.toolbar}>
        <FieldFrame style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
          <Search size={16} color={colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search connections"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            style={[styles.searchInput, { color: colors.textPrimary }]}
            accessibilityLabel="Search connections"
          />
          {query ? (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={8} accessibilityLabel="Clear search">
              <X size={15} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </FieldFrame>
        <TouchableOpacity
          onPress={() => setSort((s) => (s === 'recent' ? 'name' : 'recent'))}
          style={[styles.sortBtn, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}
          accessibilityRole="button"
          accessibilityLabel={`Sorted by ${sort === 'recent' ? 'most recent' : 'name'}. Tap to change`}
        >
          <Text maxFontSizeMultiplier={COMPACT_FONT_SCALE} style={[styles.sortText, { color: colors.textSecondary }]}>{sort === 'recent' ? 'Recent' : 'A–Z'}</Text>
          <ChevronDown size={14} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <SkeletonList count={4} variant="row" />
      ) : connected.length === 0 ? (
        <EmptyBox
          text="No connections yet. Connect with researchers who share your interests."
          action="Find researchers"
          onAction={() => router.push('/(tabs)/explore' as any)}
        />
      ) : connectionRows.length === 0 ? (
        <EmptyBox text={`No connections match "${query}".`} />
      ) : (
        connectionRows.map(({ c, p }) => (
          <TouchableOpacity
        activeOpacity={0.9}
            key={c.id}
            onPress={() => openProfile(p.uid)}
            style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}
            accessibilityRole="button"
          >
            <Avatar name={p.displayName} uri={p.photoURL} size="md" />
            <View style={styles.rowBody}>
              <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>{p.displayName}</Text>
              <Text style={[styles.meta, { color: colors.textSecondary }]} numberOfLines={1}>
                {p.designation} · since {formatRelativeDate(c.respondedAt ?? c.updatedAt)}
              </Text>
              {sharedTag(sharedWith(p.uid))}
            </View>
            <TouchableOpacity
              onPress={() => contact(p)}
              hitSlop={6}
              style={[styles.iconBtn, { borderColor: colors.primaryLight }]}
              accessibilityRole="button"
              accessibilityLabel={`Contact ${p.displayName}`}
            >
              <MessageCircle size={16} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => connectionMenu(c)}
              hitSlop={6}
              style={[styles.iconBtn, { borderColor: colors.borderSubtle }]}
              accessibilityRole="button"
              accessibilityLabel={`More options for ${p.displayName}`}
            >
              <MoreHorizontal size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </TouchableOpacity>
        ))
      )}

      {!loading && suggestions.length > 0 ? (
        <View style={styles.block}>
          <Title icon={<Sparkles size={16} color={colors.primary} />} text="People you may know" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hList}>
            {suggestions.map(({ person, shared }) => (
              <PersonCard
                key={person.id}
                person={person}
                shared={shared}
                status={cardStatus(person.id)}
                onPress={() => openProfile(person.id)}
                onConnect={() => {
                  const profile = directory.profileByUid.get(person.id);
                  if (profile) handleConnectPress(profile);
                }}
              />
            ))}
          </ScrollView>
        </View>
      ) : null}
    </>
  );

  const renderRequests = () => (
    <>
      <Title icon={<UserPlus size={16} color={colors.primary} />} text={`Received · ${incomingRequests.length}`} />
      {loading ? (
        <SkeletonList count={2} variant="row" />
      ) : incomingRequests.length === 0 ? (
        <EmptyBox text="No pending requests." />
      ) : (
        incomingRequests.map((c) => {
          const p = otherParticipant(c, myUid);
          const busy = busyUid === p.uid;
          return (
            <View key={c.id} style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
              <TouchableOpacity onPress={() => openProfile(p.uid)} style={styles.rowTap} accessibilityRole="button">
                <Avatar name={p.displayName} uri={p.photoURL} size="md" />
                <View style={styles.rowBody}>
                  <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>{p.displayName}</Text>
                  <Text style={[styles.meta, { color: colors.textSecondary }]} numberOfLines={1}>
                    {p.designation} · {formatRelativeDate(c.createdAt)}
                  </Text>
                  {sharedTag(sharedWith(p.uid))}
                </View>
              </TouchableOpacity>
              <View style={styles.actions}>
                {btn('Decline', () => decline(c), false, busy)}
                {btn('Accept', () => accept(c), true, busy)}
              </View>
            </View>
          );
        })
      )}

      <View style={styles.block}>
        <Title icon={<Send size={16} color={colors.primary} />} text={`Sent · ${outgoing.length}`} />
        {outgoing.length === 0 ? (
          <EmptyBox text="No requests waiting for a reply." />
        ) : (
          outgoing.map((c) => {
            const p = otherParticipant(c, myUid);
            return (
              <View key={c.id} style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
                <TouchableOpacity onPress={() => openProfile(p.uid)} style={styles.rowTap} accessibilityRole="button">
                  <Avatar name={p.displayName} uri={p.photoURL} size="md" />
                  <View style={styles.rowBody}>
                    <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>{p.displayName}</Text>
                    <Text style={[styles.meta, { color: colors.textSecondary }]} numberOfLines={1}>
                      Sent {formatRelativeDate(c.createdAt)}
                    </Text>
                  </View>
                </TouchableOpacity>
                {/* handleConnectPress asks "Cancel request?" before withdrawing */}
                {btn('Withdraw', () => handleConnectPress(p), false, busyUid === p.uid)}
              </View>
            );
          })
        )}
      </View>
    </>
  );

  const renderTeams = () => (
    <>
      {waiting.length > 0 ? (
        <>
          <Title icon={<Inbox size={16} color={colors.warning} />} text="Waiting for you" />
          {waiting.map((w) => (
            <TouchableOpacity
        activeOpacity={0.9}
              key={w.workId}
              onPress={() => router.push({ pathname: `/(research)/${w.workId}` as any, params: { manage: '1' } })}
              style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.primaryLight }]}
              accessibilityRole="button"
            >
              <View style={[styles.tile, { backgroundColor: colors.primaryMuted }]}>
                <Users size={18} color={colors.primary} />
              </View>
              <View style={styles.rowBody}>
                <Text style={[styles.workName, { color: colors.textPrimary }]} numberOfLines={1}>{w.title}</Text>
                <Text style={[styles.meta, { color: colors.primary }]}>
                  {w.pending} applicant{w.pending === 1 ? '' : 's'} to review
                </Text>
              </View>
              {btn('Review', () => router.push({ pathname: `/(research)/${w.workId}` as any, params: { manage: '1' } }), true)}
            </TouchableOpacity>
          ))}
        </>
      ) : null}

      <View style={waiting.length ? styles.block : styles.blockFirst}>
        <Title icon={<Users size={16} color={colors.primary} />} text={`Teams I lead · ${teamsILead.length}`} />
        {teamsLoading ? (
          <SkeletonList count={1} variant="row" />
        ) : teamsILead.length === 0 ? (
          <EmptyBox
            text="Post a collaboration to start a team."
            action="Post collaboration"
            onAction={() => router.push({ pathname: '/(tabs)/share' as any, params: { mode: 'collaboration' } })}
          />
        ) : (
          teamsILead.map((w) => (
            <TouchableOpacity
        activeOpacity={0.9}
              key={w.id}
              onPress={() => router.push(`/(research)/${w.id}` as any)}
              style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}
              accessibilityRole="button"
            >
              <View style={styles.rowBody}>
                <Text style={[styles.workName, { color: colors.textPrimary }]} numberOfLines={1}>{w.title}</Text>
                <View style={styles.teamLine}>
                  {w.team.length ? (
                    <View style={styles.stack}>
                      {w.team.slice(0, 4).map((m, i) => (
                        <View key={m.uid} style={[styles.stackItem, i > 0 && { marginLeft: -8 }, { borderColor: colors.surface }]}>
                          <Avatar name={m.displayName} uri={m.photoURL} size="xs" />
                        </View>
                      ))}
                    </View>
                  ) : null}
                  <Text style={[styles.meta, { color: colors.textSecondary }]}>
                    {w.team.length ? `${w.team.length} member${w.team.length === 1 ? '' : 's'}` : 'No members yet'}
                    {w.collabStatus === 'closed' ? ' · Team formed' : ' · Open'}
                  </Text>
                </View>
              </View>
              <ChevronRight size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ))
        )}
      </View>

      <View style={styles.block}>
        <Title icon={<UserCheck size={16} color={colors.primary} />} text={`Teams I'm on · ${joinedWorks.length}`} />
        {joinedWorks.length === 0 ? (
          <EmptyBox
            text="Apply to an open collaboration to join a team."
            action="Browse collaborations"
            onAction={() => router.push({ pathname: '/(explore)/search' as any, params: { category: 'collaborations' } })}
          />
        ) : (
          joinedWorks.map((w) => (
            <TouchableOpacity
        activeOpacity={0.9}
              key={w.id}
              onPress={() => router.push(`/(research)/${w.id}` as any)}
              style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}
              accessibilityRole="button"
            >
              <Avatar name={w.authorName} uri={w.authorPhotoURL} size="md" />
              <View style={styles.rowBody}>
                <Text style={[styles.workName, { color: colors.textPrimary }]} numberOfLines={1}>{w.title}</Text>
                <Text style={[styles.meta, { color: colors.textSecondary }]} numberOfLines={1}>
                  {roleFor.get(w.id) ?? 'Member'} · led by {w.authorName.split(' ')[0]}
                </Text>
              </View>
              {btn(
                'Lead',
                () => contact({ uid: w.authorUid, displayName: w.authorName, photoURL: w.authorPhotoURL }, 'Project lead'),
                false,
                false,
                <MessageCircle size={14} color={colors.primary} />,
              )}
            </TouchableOpacity>
          ))
        )}
      </View>

      <View style={styles.block}>
        <Title icon={<Send size={16} color={colors.primary} />} text={`My applications · ${openApps.length} pending`} />
        {openApps.length === 0 ? (
          <EmptyBox text="No open applications." />
        ) : (
          openApps.map((r) => (
            <TouchableOpacity
        activeOpacity={0.9}
              key={r.id}
              onPress={() => router.push(`/(research)/${r.workId}` as any)}
              style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}
              accessibilityRole="button"
            >
              <View style={styles.rowBody}>
                <Text style={[styles.workName, { color: colors.textPrimary }]} numberOfLines={1}>{r.workTitle}</Text>
                <Text style={[styles.meta, { color: colors.textSecondary }]} numberOfLines={1}>
                  As {r.role} · {formatRelativeDate(r.createdAt)}
                </Text>
              </View>
              {statusChip(r.status)}
              {btn('Withdraw', () => withdrawApp(r))}
            </TouchableOpacity>
          ))
        )}
        {declinedApps.length > 0 ? (
          <>
            <TouchableOpacity onPress={() => setShowDeclined((v) => !v)} style={styles.foldBtn} accessibilityRole="button">
              <Text style={[styles.foldText, { color: colors.textSecondary }]}>
                {showDeclined ? 'Hide' : 'Show'} {declinedApps.length} declined
              </Text>
              <ChevronDown size={14} color={colors.textSecondary} style={showDeclined ? { transform: [{ rotate: '180deg' }] } : undefined} />
            </TouchableOpacity>
            {showDeclined
              ? declinedApps.map((r) => (
                  <TouchableOpacity
        activeOpacity={0.9}
                    key={r.id}
                    onPress={() => router.push(`/(research)/${r.workId}` as any)}
                    style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.borderSubtle, opacity: 0.75 }]}
                    accessibilityRole="button"
                  >
                    <View style={styles.rowBody}>
                      <Text style={[styles.workName, { color: colors.textPrimary }]} numberOfLines={1}>{r.workTitle}</Text>
                      <Text style={[styles.meta, { color: colors.textSecondary }]} numberOfLines={1}>As {r.role}</Text>
                    </View>
                    {statusChip(r.status)}
                  </TouchableOpacity>
                ))
              : null}
          </>
        ) : null}
      </View>
    </>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <ScreenHeader title="My Network" subtitle={`${connected.length} connection${connected.length === 1 ? '' : 's'}`} />

      {/* Underlined tabs, attached to the header (same style as Home's feed tabs) */}
      <View style={[styles.tabBar, { backgroundColor: colors.surface, borderBottomColor: colors.borderSubtle }]} accessibilityRole="tablist">
        {tabs.map((t) => {
          const active = tab === t.key;
          const attention = t.key !== 'connections' && t.count > 0;
          return (
            <TouchableOpacity
              key={t.key}
              onPress={() => setTab(t.key)}
              style={styles.tabItem}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`${t.label}, ${t.count}`}
            >
              <View style={styles.tabLabelRow}>
                <Text maxFontSizeMultiplier={COMPACT_FONT_SCALE}
                  style={[
                    styles.tabLabel,
                    { color: active ? colors.primary : colors.textSecondary },
                    active && { fontFamily: fontFamilies.sansSemiBold },
                  ]}
                  numberOfLines={1}
                >
                  {t.label}
                </Text>
                {t.count > 0 ? (
                  <View
                    style={[
                      styles.countBadge,
                      {
                        backgroundColor: attention ? '#DC2626' : active ? colors.primaryMuted : colors.surfaceSubtle,
                      },
                    ]}
                  >
                    <Text maxFontSizeMultiplier={COMPACT_FONT_SCALE}
                      style={[
                        styles.countText,
                        { color: attention ? '#FFFFFF' : active ? colors.primary : colors.textSecondary },
                      ]}
                    >
                      {t.count > 99 ? '99+' : t.count}
                    </Text>
                  </View>
                ) : null}
              </View>
              <View style={[styles.tabUnderline, { backgroundColor: active ? colors.primary : 'transparent' }]} />
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
      >
        {tab === 'connections' ? renderConnections() : tab === 'requests' ? renderRequests() : renderTeams()}
      </ScrollView>

      <ContactSheet person={contactPerson} onClose={() => setContactPerson(null)} onViewProfile={openProfile} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: spacing.sm,
  },
  tabItem: { flex: 1, alignItems: 'center', paddingTop: spacing.sm },
  tabLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 28, paddingHorizontal: 4 },
  tabLabel: { ...typography.bodyCompact, fontFamily: fontFamilies.sansMedium, flexShrink: 1 },
  tabUnderline: { alignSelf: 'stretch', height: 3, borderTopLeftRadius: 3, borderTopRightRadius: 3, marginTop: 8, marginHorizontal: spacing.md },
  countBadge: { minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 5, alignItems: 'center', justifyContent: 'center' },
  countText: { ...typography.micro, fontFamily: fontFamilies.sansBold, fontVariant: ['tabular-nums'] },
  content: { padding: spacing.md, paddingBottom: spacing.xxl, gap: spacing.sm },

  toolbar: { flexDirection: 'row', gap: spacing.xs },
  search: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: radius.button, paddingHorizontal: 12, height: spacing.secondaryButtonHeight },
  searchInput: { flex: 1, ...typography.bodyCompact, paddingVertical: 0, lineHeight: undefined },
  sortBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, borderWidth: 1, borderRadius: radius.button, paddingHorizontal: 12, height: spacing.secondaryButtonHeight },
  sortText: { ...typography.caption, fontFamily: fontFamilies.sansSemiBold },

  block: { marginTop: spacing.md, gap: spacing.sm },
  blockFirst: { gap: spacing.sm },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { ...typography.sectionTitle },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 12,
    ...cardShadow(false),
  },
  rowTap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minWidth: 0 },
  rowBody: { flex: 1, minWidth: 0, gap: 2 },
  name: { ...typography.label, fontFamily: fontFamilies.sansSemiBold },
  workName: { ...typography.body },
  meta: { ...typography.caption },
  shared: { ...typography.micro, fontFamily: fontFamilies.sansSemiBold },
  sharedRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actions: { flexDirection: 'row', gap: spacing.xs },
  btn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, height: spacing.compactButtonHeight, borderRadius: radius.button, borderWidth: 1 },
  btnText: { ...typography.buttonSmall },
  iconBtn: { width: spacing.compactButtonHeight, height: spacing.compactButtonHeight, borderRadius: radius.full, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  tile: { width: 40, height: 40, borderRadius: radius.button, alignItems: 'center', justifyContent: 'center' },
  chip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full },
  chipText: { ...typography.micro, fontFamily: fontFamilies.sansSemiBold },
  teamLine: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  stack: { flexDirection: 'row' },
  stackItem: { borderWidth: 2, borderRadius: radius.full},
  hList: { gap: spacing.sm, paddingRight: spacing.md },
  foldBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingVertical: 6 },
  foldText: { ...typography.caption, fontFamily: fontFamilies.sansSemiBold },

  emptyBox: { borderWidth: 1, borderRadius: radius.md, padding: spacing.md, alignItems: 'center', gap: spacing.sm },
  emptyText: { ...typography.bodySmall, textAlign: 'center' },
  emptyBtn: { paddingHorizontal: spacing.md, height: spacing.compactButtonHeight, borderRadius: radius.button, justifyContent: 'center' },
});
