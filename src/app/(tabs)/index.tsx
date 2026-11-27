/**
 * Home
 *
 *   greeting + composer + two clear actions (Share update / Post collaboration)
 *   ⚡ Needs your attention — applicants waiting, connection requests, unread
 *   topic chips (your interests first ★) + feed tabs: For you · Latest · Collaborations
 *   one continuous feed with a single "People like you" strip, then "Show more"
 *
 * Data comes from the shared useResearchDirectory hook (one feed listener for
 * the whole app — no duplicate Firestore reads).
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { COMPACT_FONT_SCALE } from '@/constants/typography';
import { useRouter } from 'expo-router';
import { Bell, BellRing, BookOpen, CheckCircle2, ChevronRight, Sparkles, UserPlus, Users, X } from 'lucide-react-native';
import { spacing, radius, typography, fontFamilies } from '../../constants';
import { cardShadow } from '@/constants/cards';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { TOPIC_TAXONOMY, topicCounts } from '@/utils/search';
import { tagMatchKey } from '@/utils/researchWork';
import { useResearchDirectory } from '@/hooks/useResearchDirectory';
import { useConnections } from '@/hooks/useConnections';
import { useSavedItems } from '@/hooks/useSavedItems';
import { useCollaborate } from '@/hooks/useCollaborate';
import { toCurrentWork } from '@/services/research.service';
import { subscribeReceivedApplications } from '@/services/collab.service';
import { subscribeUnreadCount } from '@/services/network.service';
import type { ResearchWork } from '@/types/research.types';
import type { CollabRequest } from '@/types/collab.types';
import type { Topic } from '../../types';
import { HomeHeader } from '../../components/home/HomeHeader';
import { TopicShortcutRow } from '../../components/home/TopicShortcutRow';
import { CurrentWorkCard } from '../../components/cards/CurrentWorkCard';
import { Avatar } from '../../components/common/Avatar';
import { SkeletonList } from '../../components/feedback/Skeleton';
import { PersonCard, SectionTitle } from '@/components/explore/ExploreCards';

type FeedTab = 'forYou' | 'latest' | 'collaborations';
const FEED_TABS: { key: FeedTab; label: string }[] = [
  { key: 'forYou', label: 'For you' },
  { key: 'latest', label: 'Latest' },
  { key: 'collaborations', label: 'Collaborations' },
];
const PAGE = 10;
const STRIP_AFTER = 4;

export default function HomeFeedScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { firebaseUser, userProfile } = useAuth();
  const myUid = firebaseUser?.uid ?? '';
  const approved = userProfile?.approvalStatus === 'approved';
  const firstName = (userProfile?.displayName || 'Researcher').split(' ')[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const directory = useResearchDirectory();
  const { cardStatus, handleConnectPress, incomingRequests } = useConnections();
  const { isSaved, toggleSave } = useSavedItems();
  const collaborate = useCollaborate();

  const [tab, setTab] = useState<FeedTab>('forYou');
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [visible, setVisible] = useState(PAGE);

  // ---------------------------------------------------------------------------
  // "Needs your attention" sources
  // ---------------------------------------------------------------------------
  const [received, setReceived] = useState<CollabRequest[]>([]);
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    if (!approved || !myUid) return;
    return subscribeReceivedApplications(myUid, setReceived);
  }, [approved, myUid]);
  useEffect(() => {
    if (!approved || !myUid) return;
    return subscribeUnreadCount(myUid, setUnread);
  }, [approved, myUid]);

  /** Pending applicants grouped by post. */
  const waiting = useMemo(() => {
    const byWork = new Map<string, { workId: string; title: string; count: number }>();
    received
      .filter((r) => r.status === 'pending')
      .forEach((r) => {
        const cur = byWork.get(r.workId) ?? { workId: r.workId, title: r.workTitle, count: 0 };
        cur.count += 1;
        byWork.set(r.workId, cur);
      });
    return [...byWork.values()].sort((a, b) => b.count - a.count);
  }, [received]);

  // ---------------------------------------------------------------------------
  // Pull to refresh: on until the reload actually finishes
  // ---------------------------------------------------------------------------
  const [refreshing, setRefreshing] = useState(false);
  const sawLoading = useRef(false);
  useEffect(() => {
    if (!refreshing) return;
    if (directory.loading) sawLoading.current = true;
    else if (sawLoading.current) {
      sawLoading.current = false;
      setRefreshing(false);
    }
  }, [refreshing, directory.loading]);
  useEffect(() => {
    if (!refreshing) return;
    const safety = setTimeout(() => setRefreshing(false), 6000);
    return () => clearTimeout(safety);
  }, [refreshing]);
  const onRefresh = () => {
    sawLoading.current = false;
    setRefreshing(true);
    directory.refresh();
  };

  // ---------------------------------------------------------------------------
  // Feed
  // ---------------------------------------------------------------------------
  const myKeys = useMemo(
    () => new Set((userProfile?.researchInterests ?? []).map(tagMatchKey)),
    [userProfile?.researchInterests],
  );

  const topics = useMemo(() => {
    const data = { researchers: directory.researchers, works: directory.currentWorks };
    return TOPIC_TAXONOMY.map((t) => topicCounts(t, data)).sort(
      (a, b) =>
        Number(myKeys.has(tagMatchKey(b.name))) - Number(myKeys.has(tagMatchKey(a.name))) ||
        b.currentWorkCount - a.currentWorkCount,
    );
  }, [directory.researchers, directory.currentWorks, myKeys]);
  const myTopicIds = useMemo(
    () => new Set(topics.filter((t) => myKeys.has(tagMatchKey(t.name))).map((t) => t.id)),
    [topics, myKeys],
  );

  const feed = useMemo(() => {
    let list: ResearchWork[] = directory.works;
    if (tab === 'collaborations') {
      list = list.filter((w) => w.postType === 'collaboration' && w.collabStatus !== 'closed');
    }
    if (selectedTopic) {
      const key = tagMatchKey(selectedTopic.name);
      list = list.filter((w) => w.tags.some((t) => tagMatchKey(t) === key));
    }
    if (tab === 'forYou') {
      // Interests + connections first; newest wins ties (list is newest-first).
      const score = (w: ResearchWork) =>
        w.tags.filter((t) => myKeys.has(tagMatchKey(t))).length * 2 +
        (w.authorUid !== myUid && cardStatus(w.authorUid) === 'connected' ? 3 : 0) +
        (w.postType === 'collaboration' && w.collabStatus !== 'closed' ? 1 : 0);
      list = list
        .map((w, i) => ({ w, i, s: score(w) }))
        .sort((a, b) => b.s - a.s || a.i - b.i)
        .map((x) => x.w);
    }
    return list;
  }, [directory.works, tab, selectedTopic, myKeys, myUid, cardStatus]);

  // Reset paging when the feed's meaning changes
  useEffect(() => setVisible(PAGE), [tab, selectedTopic]);

  const peopleLikeYou = useMemo(() => {
    if (myKeys.size === 0) return [];
    return directory.researchers
      .map((r) => ({ person: r, shared: (r.interests ?? []).filter((i) => myKeys.has(tagMatchKey(i))) }))
      .filter((x) => x.shared.length > 0 && cardStatus(x.person.id) !== 'connected')
      .sort((a, b) => b.shared.length - a.shared.length)
      .slice(0, 10);
  }, [directory.researchers, myKeys, cardStatus]);

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------
  const openAuthor = (uid: string) =>
    router.push((uid === myUid ? '/(tabs)/profile' : `/(profile)/${uid}`) as any);
  const connect = (uid: string) => {
    const profile = directory.profileByUid.get(uid);
    if (profile) handleConnectPress(profile);
  };
  const selectTopicByTag = (tag: string) => {
    const key = tagMatchKey(tag);
    const t = topics.find((x) => tagMatchKey(x.name) === key);
    if (t) setSelectedTopic(t);
  };

  const renderCard = (work: ResearchWork) => (
    <CurrentWorkCard
      key={work.id}
      work={toCurrentWork(work)}
      authorName={work.authorName}
      authorBatch={/computer science/i.test(work.authorDepartment) ? 'CSE' : work.authorDepartment || 'CSE'}
      authorAvatar={work.authorPhotoURL}
      authorRole={work.authorDesignation || undefined}
      isBookmarked={isSaved(work.id)}
      {...collaborate(work)}
      onPress={() => router.push(`/(research)/${work.id}` as any)}
      onAuthorPress={() => openAuthor(work.authorUid)}
      onTopicPress={selectTopicByTag}
      onBookmarkPress={() => toggleSave(work)}
    />
  );

  // ---------------------------------------------------------------------------
  // Render pieces
  // ---------------------------------------------------------------------------
  const attention: { key: string; icon: React.ReactNode; title: string; sub: string; onPress: () => void }[] = [
    ...waiting.slice(0, 3).map((w) => ({
      key: `apps-${w.workId}`,
      icon: <Users size={16} color={colors.primary} />,
      title: `${w.count} applicant${w.count === 1 ? '' : 's'} waiting`,
      sub: w.title,
      onPress: () => router.push({ pathname: `/(research)/${w.workId}` as any, params: { manage: '1' } }),
    })),
    ...(incomingRequests.length
      ? [{
          key: 'requests',
          icon: <UserPlus size={16} color={colors.primary} />,
          title: `${incomingRequests.length} connection request${incomingRequests.length === 1 ? '' : 's'}`,
          sub: 'Review in My Network',
          onPress: () => router.push({ pathname: '/(profile)/network' as any, params: { tab: 'requests' } }),
        }]
      : []),
    ...(unread
      ? [{
          key: 'unread',
          icon: <Bell size={16} color={colors.primary} />,
          title: `${unread} unread notification${unread === 1 ? '' : 's'}`,
          sub: 'Open Notifications',
          onPress: () => router.push('/(tabs)/notifications' as any),
        }]
      : []),
  ];

  const renderFeed = () => {
    if (directory.loading && directory.works.length === 0) return <SkeletonList count={2} />;
    if (directory.error && directory.works.length === 0) {
      return (
        <View style={[styles.empty, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Feed unavailable</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Could not load the research feed.</Text>
          <TouchableOpacity onPress={onRefresh} style={[styles.emptyBtn, { backgroundColor: colors.primaryMuted }]}>
            <Text maxFontSizeMultiplier={COMPACT_FONT_SCALE} style={[styles.emptyBtnText, { color: colors.primary }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    if (feed.length === 0) {
      const filtered = Boolean(selectedTopic) || tab === 'collaborations';
      return (
        <View style={[styles.empty, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
            {filtered ? 'Nothing here yet' : 'No research shared yet'}
          </Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {selectedTopic
              ? `No posts about ${selectedTopic.name} yet.`
              : tab === 'collaborations'
                ? 'No open collaborations right now — start one!'
                : 'Be the first to share what you are working on.'}
          </Text>
          <TouchableOpacity
            onPress={() =>
              selectedTopic
                ? setSelectedTopic(null)
                : router.push({ pathname: '/(tabs)/share' as any, params: { mode: tab === 'collaborations' ? 'collaboration' : 'work' } })
            }
            style={[styles.emptyBtn, { backgroundColor: colors.primaryMuted }]}
          >
            <Text maxFontSizeMultiplier={COMPACT_FONT_SCALE} style={[styles.emptyBtnText, { color: colors.primary }]}>
              {selectedTopic ? 'Show all posts' : tab === 'collaborations' ? 'Post collaboration' : 'Share your work'}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    const shown = feed.slice(0, visible);
    return (
      <>
        {shown.slice(0, STRIP_AFTER).map(renderCard)}

        {peopleLikeYou.length > 0 && !selectedTopic ? (
          <View style={styles.strip}>
            <SectionTitle
              icon={<Sparkles size={16} color={colors.primary} />}
              title="People like you"
              subtitle="Share your research interests"
              onAction={() => router.push('/(tabs)/explore' as any)}
              actionLabel="Explore"
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stripList}>
              {peopleLikeYou.map(({ person, shared }) => (
                <PersonCard
                  key={person.id}
                  person={person}
                  shared={shared}
                  status={cardStatus(person.id)}
                  onPress={() => openAuthor(person.id)}
                  onConnect={() => connect(person.id)}
                />
              ))}
            </ScrollView>
          </View>
        ) : null}

        {shown.slice(STRIP_AFTER).map(renderCard)}

        {feed.length > visible ? (
          <TouchableOpacity
            onPress={() => setVisible((v) => v + PAGE)}
            style={[styles.moreBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
            accessibilityRole="button"
          >
            <Text maxFontSizeMultiplier={COMPACT_FONT_SCALE} style={[styles.moreText, { color: colors.primary }]}>
              Show more ({feed.length - visible})
            </Text>
          </TouchableOpacity>
        ) : feed.length > PAGE ? (
          <View style={styles.endRow}>
            <CheckCircle2 size={14} color={colors.textMuted} />
            <Text style={[styles.end, { color: colors.textMuted }]}>You're all caught up</Text>
          </View>
        ) : null}
      </>
    );
  };

  return (
    <View style={[styles.safeArea, { backgroundColor: colors.surface }]}>
      <HomeHeader onSearchPress={() => router.push('/(explore)/search' as any)} />

      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
      >
        {/* Greeting + composer */}
        <View style={[styles.hero, { backgroundColor: colors.surface, borderBottomColor: colors.borderSubtle }]}>
          <Text style={[styles.greeting, { color: colors.textPrimary }]} numberOfLines={1}>
            {greeting}, {firstName}
          </Text>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => router.push({ pathname: '/(tabs)/share' as any, params: { mode: 'work' } })}
            style={[styles.composer, { backgroundColor: colors.background, borderColor: colors.borderSubtle }]}
            accessibilityRole="button"
            accessibilityLabel="Share what you're working on"
          >
            <Avatar name={userProfile?.displayName || 'You'} uri={userProfile?.photoURL} size="sm" />
            <Text style={[styles.composerText, { color: colors.textMuted }]} numberOfLines={1}>
              Share what you're working on…
            </Text>
          </TouchableOpacity>
          <View style={styles.quickRow}>
            <TouchableOpacity
              onPress={() => router.push({ pathname: '/(tabs)/share' as any, params: { mode: 'work' } })}
              style={[styles.quick, { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderSubtle }]}
              accessibilityRole="button"
            >
              <BookOpen size={15} color={colors.textPrimary} />
              <Text maxFontSizeMultiplier={COMPACT_FONT_SCALE} style={[styles.quickText, { color: colors.textPrimary }]}>Share update</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push({ pathname: '/(tabs)/share' as any, params: { mode: 'collaboration' } })}
              style={[styles.quick, { backgroundColor: colors.primaryMuted, borderColor: colors.primaryLight }]}
              accessibilityRole="button"
            >
              <Users size={15} color={colors.primary} />
              <Text maxFontSizeMultiplier={COMPACT_FONT_SCALE} style={[styles.quickText, { color: colors.primary }]}>Post collaboration</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Needs your attention */}
        {attention.length > 0 ? (
          <View style={styles.attention}>
            <View style={styles.attentionHead}>
              <BellRing size={15} color={colors.warning} />
              <Text style={[styles.attentionTitle, { color: colors.textPrimary }]}>Needs your attention</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stripList}>
              {attention.map((a) => (
                <TouchableOpacity
        activeOpacity={0.9}
                  key={a.key}
                  onPress={a.onPress}
                  style={[styles.attentionCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}
                  accessibilityRole="button"
                  accessibilityLabel={`${a.title}. ${a.sub}`}
                >
                  <View style={[styles.attentionIcon, { backgroundColor: colors.primaryMuted }]}>{a.icon}</View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={[styles.attentionCardTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                      {a.title}
                    </Text>
                    <Text style={[styles.attentionSub, { color: colors.textSecondary }]} numberOfLines={1}>
                      {a.sub}
                    </Text>
                  </View>
                  <ChevronRight size={16} color={colors.textMuted} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {/* Topics + feed tabs */}
        <View style={[styles.filters, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
          <TopicShortcutRow
            topics={topics}
            selectedTopicId={selectedTopic?.id}
            markedIds={myTopicIds}
            onSelectTopic={(t) => setSelectedTopic((cur) => (cur?.id === t.id ? null : t))}
          />
          <View style={[styles.tabs, { borderTopColor: colors.borderSubtle }]} accessibilityRole="tablist">
            {FEED_TABS.map((t) => {
              const active = tab === t.key;
              return (
                <TouchableOpacity
                  key={t.key}
                  onPress={() => setTab(t.key)}
                  style={[styles.tab, active && { borderBottomColor: colors.primary }]}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                >
                  <Text maxFontSizeMultiplier={COMPACT_FONT_SCALE}
                    style={[
                      styles.tabText,
                      { color: active ? colors.primary : colors.textSecondary },
                      active && { fontFamily: fontFamilies.sansSemiBold },
                    ]}
                  >
                    {t.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {selectedTopic ? (
          <View style={styles.filterLine}>
            <Text style={[styles.filterText, { color: colors.textSecondary }]}>
              Filtered: <Text style={{ color: colors.textPrimary, fontFamily: fontFamilies.sansSemiBold }}>{selectedTopic.name}</Text>
            </Text>
            <TouchableOpacity onPress={() => setSelectedTopic(null)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Clear topic filter">
              <X size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.feed}>{renderFeed()}</View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  scrollContent: { paddingBottom: spacing.xxl },

  hero: { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.md, borderBottomWidth: 1 },
  greeting: { ...typography.headline },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: 6,
    paddingRight: spacing.md,
    height: 48,
    marginTop: spacing.md,
  },
  composerText: { ...typography.bodyCompact, flex: 1 },
  quickRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  quick: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: spacing.compactButtonHeight,
    borderRadius: radius.button,
    borderWidth: 1,
  },
  quickText: { ...typography.buttonSmall },

  attention: { paddingTop: spacing.md },
  attentionHead: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  attentionTitle: { ...typography.label, fontFamily: fontFamilies.sansSemiBold },
  attentionCard: {
    width: 250,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 12,
    ...cardShadow(false),
  },
  attentionIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  attentionCardTitle: { ...typography.label, fontFamily: fontFamilies.sansSemiBold },
  attentionSub: { ...typography.caption },

  filters: { marginTop: spacing.md, borderTopWidth: 1, borderBottomWidth: 1, paddingTop: spacing.xs },
  tabs: { flexDirection: 'row', borderTopWidth: 1, marginTop: spacing.xs, paddingHorizontal: spacing.sm },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabText: { ...typography.label },
  filterLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  filterText: { ...typography.caption },

  feed: { paddingTop: spacing.sm },
  strip: { paddingHorizontal: spacing.md, paddingVertical: spacing.md },
  stripList: { gap: spacing.sm, paddingHorizontal: spacing.md },

  empty: { marginHorizontal: spacing.md, borderWidth: 1, borderRadius: radius.md, padding: spacing.lg, alignItems: 'center', gap: spacing.xs },
  emptyTitle: { ...typography.title },
  emptyText: { ...typography.bodySmall, textAlign: 'center' },
  emptyBtn: { marginTop: spacing.sm, paddingHorizontal: spacing.md, height: spacing.compactButtonHeight, borderRadius: radius.button, justifyContent: 'center' },
  emptyBtnText: { ...typography.buttonSmall },
  moreBtn: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    height: spacing.secondaryButtonHeight,
    borderRadius: radius.button,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreText: { ...typography.button },
  end: { ...typography.caption, textAlign: 'center' },
  endRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: spacing.md },
});
