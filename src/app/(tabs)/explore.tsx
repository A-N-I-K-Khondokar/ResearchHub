/**
 * Explore tab — discovery, centred on collaboration.
 *
 *   header: title + search bar (opens Search; Search owns all filters)
 *   1. Open collaborations   (swipe cards with Apply; your interests first)
 *   2. People like you       (shared interests; prompt if you have none)
 *   3. Topics                (live counts; your topics first, highlighted)
 *   4. Recent research       (compact rows)
 *   5. Researchers to know   (active posters you are not connected to yet)
 * Every "See all" opens Search on the matching filter.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Clock, Hash, Sparkles, UserPlus, Users } from 'lucide-react-native';
import { spacing } from '@/constants';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { TabHeader } from '@/components/layout/TabHeader';
import { SearchBar } from '@/components/common/SearchBar';
import { SkeletonList } from '@/components/feedback/Skeleton';
import { PersonRow, WorkRow } from '@/components/search/SearchRows';
import { CollabCard, PersonCard, PromptCard, SectionTitle, TopicCard } from '@/components/explore/ExploreCards';
import { TOPIC_TAXONOMY, topicCounts } from '@/utils/search';
import { tagMatchKey } from '@/utils/researchWork';
import { useResearchDirectory } from '@/hooks/useResearchDirectory';
import { useConnections } from '@/hooks/useConnections';
import { useCollaborate } from '@/hooks/useCollaborate';
import type { SearchFilter } from '@/utils/searchRank';

const TOPICS_SHOWN = 8;
const RECENT_SHOWN = 4;
const TO_KNOW_SHOWN = 4;

export default function ExploreScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { userProfile } = useAuth();
  const myUid = userProfile?.uid ?? '';

  const directory = useResearchDirectory();
  const { cardStatus, handleConnectPress } = useConnections();
  const collaborate = useCollaborate();

  // ---------------------------------------------------------------------------
  // Pull to refresh: stays on until the reload actually finishes
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
  // Data
  // ---------------------------------------------------------------------------
  const myKeys = useMemo(
    () => new Set((userProfile?.researchInterests ?? []).map(tagMatchKey)),
    [userProfile?.researchInterests],
  );
  const hasInterests = myKeys.size > 0;

  /** Open collaborations (not mine), ones matching my interests first. */
  const openCollabs = useMemo(() => {
    return directory.currentWorks
      .filter((w) => w.postType === 'collaboration' && w.collabStatus !== 'closed' && w.userId !== myUid)
      .map((w, index) => {
        const matched = [...(w.topics ?? []), ...(w.lookingFor ?? [])].filter((t) => myKeys.has(tagMatchKey(t)));
        return { work: w, matched, index };
      })
      .sort((a, b) => b.matched.length - a.matched.length || a.index - b.index)
      .slice(0, 8);
  }, [directory.currentWorks, myKeys, myUid]);

  /** People who share my research interests. */
  const peopleLikeYou = useMemo(() => {
    if (!hasInterests) return [];
    return directory.researchers
      .map((r) => ({ person: r, shared: (r.interests ?? []).filter((i) => myKeys.has(tagMatchKey(i))) }))
      .filter((x) => x.shared.length > 0)
      .sort((a, b) => b.shared.length - a.shared.length)
      .slice(0, 10);
  }, [directory.researchers, myKeys, hasInterests]);

  /** Topics with live counts — mine first, then most active. */
  const topics = useMemo(() => {
    const data = { researchers: directory.researchers, works: directory.currentWorks };
    return TOPIC_TAXONOMY.map((t) => {
      const live = topicCounts(t, data);
      return { ...live, mine: myKeys.has(tagMatchKey(t.name)) };
    }).sort(
      (a, b) =>
        Number(b.mine) - Number(a.mine) ||
        b.researchersCount + b.currentWorkCount - (a.researchersCount + a.currentWorkCount),
    );
  }, [directory.researchers, directory.currentWorks, myKeys]);

  const recentWork = useMemo(() => directory.currentWorks.slice(0, RECENT_SHOWN), [directory.currentWorks]);

  /** Active researchers I am not connected to, never repeating "People like you". */
  const toKnow = useMemo(() => {
    const shown = new Set(peopleLikeYou.map((p) => p.person.id));
    const latestTitle = new Map(directory.currentWorks.map((w) => [w.userId, w.title] as const).reverse());
    return directory.researchers
      .filter((r) => !shown.has(r.id) && cardStatus(r.id) === 'none')
      .sort((a, b) => Number((b.currentWorkIds?.length ?? 0) > 0) - Number((a.currentWorkIds?.length ?? 0) > 0))
      .slice(0, TO_KNOW_SHOWN)
      .map((r) => ({ person: r, latest: latestTitle.get(r.id) ?? null }));
  }, [directory.researchers, directory.currentWorks, peopleLikeYou, cardStatus]);

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------
  const openSearch = (category?: SearchFilter) =>
    router.push({ pathname: '/(explore)/search' as any, params: category ? { category } : {} });
  const openTopic = (name: string) =>
    router.push({ pathname: '/(explore)/topic-researchers' as any, params: { topic: name } });
  const openPerson = (uid: string) => router.push(`/(profile)/${uid}` as any);
  const openWork = (id: string) => router.push(`/(research)/${id}` as any);
  const connect = (uid: string) => {
    const profile = directory.profileByUid.get(uid);
    if (profile) handleConnectPress(profile);
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  const loading = directory.loading && !refreshing && directory.currentWorks.length === 0;

  return (
    <View style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <TabHeader title="Explore" subtitle="Collaborations, people and topics in CSE">
        <TouchableOpacity activeOpacity={0.9} onPress={() => openSearch()} accessibilityRole="search" accessibilityLabel="Search">
          <View pointerEvents="none">
            <SearchBar value="" onChangeText={() => {}} placeholder="Search people, topics, roles…" />
          </View>
        </TouchableOpacity>
      </TabHeader>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />
        }
      >
        {loading ? (
          <SkeletonList count={4} variant="row" />
        ) : (
          <>
            {/* 1. Open collaborations */}
            <View style={styles.section}>
              <SectionTitle
                icon={<Users size={17} color={colors.primary} />}
                title="Open collaborations"
                subtitle={hasInterests ? 'Matching your interests first' : 'Projects looking for teammates'}
                onAction={openCollabs.length ? () => openSearch('collaborations') : undefined}
              />
              {openCollabs.length ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hList}>
                  {openCollabs.map(({ work, matched }) => (
                    <CollabCard
                      key={work.id}
                      work={work}
                      hint={matched.length ? `Matches your interest ${matched[0]}` : null}
                      action={collaborate(work)}
                      onPress={() => openWork(work.id)}
                    />
                  ))}
                </ScrollView>
              ) : (
                <PromptCard
                  icon={<Users size={18} color={colors.primary} />}
                  title="No open collaborations right now"
                  text="Start one — describe your project and the roles you need."
                  actionLabel="Post"
                  onAction={() => router.push({ pathname: '/(tabs)/share' as any, params: { mode: 'collaboration' } })}
                />
              )}
            </View>

            {/* 2. People like you */}
            <View style={styles.section}>
              <SectionTitle
                icon={<Sparkles size={17} color={colors.primary} />}
                title="People like you"
                subtitle="Researchers who share your interests"
                onAction={peopleLikeYou.length ? () => openSearch('people') : undefined}
              />
              {!hasInterests ? (
                <PromptCard
                  icon={<Sparkles size={18} color={colors.primary} />}
                  title="Get better suggestions"
                  text="Add your research interests to find people working on the same things."
                  actionLabel="Add"
                  onAction={() => router.push({ pathname: '/(tabs)/profile' as any, params: { edit: 'profile' } })}
                />
              ) : peopleLikeYou.length ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hList}>
                  {peopleLikeYou.map(({ person, shared }) => (
                    <PersonCard
                      key={person.id}
                      person={person}
                      shared={shared}
                      status={cardStatus(person.id)}
                      onPress={() => openPerson(person.id)}
                      onConnect={() => connect(person.id)}
                    />
                  ))}
                </ScrollView>
              ) : (
                <Text style={[styles.muted, { color: colors.textSecondary }]}>
                  No one shares your interests yet — browse topics below to find nearby areas.
                </Text>
              )}
            </View>

            {/* 3. Topics */}
            <View style={styles.section}>
              <SectionTitle
                icon={<Hash size={17} color={colors.primary} />}
                title="Topics"
                subtitle={hasInterests ? 'Your topics are highlighted' : 'Find researchers by area'}
                actionLabel="All topics"
                onAction={() => openSearch('topics')}
              />
              <View style={styles.grid}>
                {topics.slice(0, TOPICS_SHOWN).map((t) => (
                  <TopicCard
                    key={t.id}
                    name={t.name}
                    researchers={t.researchersCount}
                    posts={t.currentWorkCount}
                    mine={t.mine}
                    onPress={() => openTopic(t.name)}
                  />
                ))}
              </View>
            </View>

            {/* 4. Recent research */}
            <View style={styles.section}>
              <SectionTitle
                icon={<Clock size={17} color={colors.primary} />}
                title="Recent research"
                subtitle="Latest work and collaboration posts"
                onAction={recentWork.length ? () => openSearch('work') : undefined}
              />
              {recentWork.length ? (
                <View style={styles.vList}>
                  {recentWork.map((w) => (
                    <WorkRow
                      key={w.id}
                      work={w}
                      terms={[]}
                      reason={null}
                      onPress={() => openWork(w.id)}
                      action={w.postType === 'collaboration' ? collaborate(w) : undefined}
                    />
                  ))}
                </View>
              ) : (
                <Text style={[styles.muted, { color: colors.textSecondary }]}>No research shared yet.</Text>
              )}
            </View>

            {/* 5. Researchers to know */}
            {toKnow.length ? (
              <View style={styles.section}>
                <SectionTitle
                  icon={<UserPlus size={17} color={colors.primary} />}
                  title="Researchers to know"
                  subtitle="Active in the department, not connected yet"
                  onAction={() => openSearch('people')}
                />
                <View style={styles.vList}>
                  {toKnow.map(({ person, latest }) => (
                    <PersonRow
                      key={person.id}
                      person={person}
                      terms={[]}
                      reason={latest ? `Working on: ${latest}` : person.interests?.length ? `Interested in ${person.interests.slice(0, 2).join(', ')}` : null}
                      status={cardStatus(person.id)}
                      onPress={() => openPerson(person.id)}
                      onConnect={() => connect(person.id)}
                    />
                  ))}
                </View>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  scrollContent: { paddingTop: spacing.md, paddingBottom: spacing.xxl },
  section: { paddingHorizontal: spacing.md, marginBottom: spacing.lg },
  hList: { gap: spacing.sm, paddingRight: spacing.md },
  vList: { gap: spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  muted: { fontSize: 13, lineHeight: 18 },
});
