/**
 * Search
 *
 *  - ranked, multi-word, typo-tolerant local search (src/utils/searchRank.ts)
 *  - filters with live counts: All · People · Collaborations · Work · Topics
 *  - "All" shows the top 3 per section (best section first) with "See all"
 *  - compact rows with highlighted matches and a "why it matched" hint
 *  - before typing: recent searches, open collaborations, suggested topics
 */

import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, ChevronRight, Clock, SearchX, Sparkles, Users, X } from 'lucide-react-native';
import { spacing, radius, typography, fontFamilies } from '@/constants';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { SearchBar } from '@/components/common/SearchBar';
import { TopicChip } from '@/components/common/TopicChip';
import { SkeletonList } from '@/components/feedback/Skeleton';
import { PersonRow, TopicRow, WorkRow } from '@/components/search/SearchRows';
import { TOPIC_TAXONOMY, matchesTopic, topicCounts } from '@/utils/search';
import { rankSearch, type Hit, type SearchFilter } from '@/utils/searchRank';
import { useResearchDirectory } from '@/hooks/useResearchDirectory';
import { useConnections } from '@/hooks/useConnections';
import { useCollaborate } from '@/hooks/useCollaborate';
import {
  addRecentSearch,
  clearRecentSearches,
  loadRecentSearches,
  removeRecentSearch,
} from '@/services/recentSearches';
import type { CurrentWork, Topic, UserProfile } from '@/types';

const FILTERS: { key: SearchFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'people', label: 'People' },
  { key: 'collaborations', label: 'Collaborations' },
  { key: 'work', label: 'Work' },
  { key: 'topics', label: 'Topics' },
];

const SECTION_TITLES: Record<Exclude<SearchFilter, 'all'>, string> = {
  people: 'Researchers',
  collaborations: 'Collaborations',
  work: 'Research work',
  topics: 'Topics',
};

const PREVIEW = 3;
const DEBOUNCE_MS = 150;

/** Accepts legacy params (e.g. category=currentWork from older links). */
function toFilter(value: string | undefined): SearchFilter {
  if (value === 'currentWork') return 'work';
  return FILTERS.some((f) => f.key === value) ? (value as SearchFilter) : 'all';
}

export default function GlobalSearchScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ q?: string; category?: string }>();
  const { firebaseUser, userProfile } = useAuth();
  const myUid = firebaseUser?.uid ?? '';

  const [query, setQuery] = useState(params.q || '');
  const [debounced, setDebounced] = useState(params.q || '');
  const [filter, setFilter] = useState<SearchFilter>(toFilter(params.category));
  const [recent, setRecent] = useState<string[]>([]);

  const directory = useResearchDirectory();
  const { cardStatus, handleConnectPress } = useConnections();
  const collaborate = useCollaborate();

  useEffect(() => {
    if (params.q) {
      setQuery(params.q);
      setDebounced(params.q);
    }
    if (params.category) setFilter(toFilter(params.category));
  }, [params.q, params.category]);

  // Debounce typing so results don't flicker on every key press
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    loadRecentSearches(myUid).then(setRecent);
  }, [myUid]);

  const dataset = useMemo(
    () => ({ researchers: directory.researchers, works: directory.currentWorks }),
    [directory.researchers, directory.currentWorks],
  );

  const results = useMemo(
    () => rankSearch<UserProfile, CurrentWork, Topic>(debounced, {
      people: directory.researchers,
      works: directory.currentWorks,
      topics: TOPIC_TAXONOMY,
    }),
    [debounced, directory.researchers, directory.currentWorks],
  );

  const liveTopics = useMemo(() => TOPIC_TAXONOMY.map((t) => topicCounts(t, dataset)), [dataset]);
  const topicStats = useMemo(() => new Map(liveTopics.map((t) => [t.id, t] as const)), [liveTopics]);

  // Before typing: suggestions
  const openCollabs = useMemo(
    () =>
      directory.currentWorks
        .filter((w) => w.postType === 'collaboration' && w.collabStatus !== 'closed' && w.userId !== myUid)
        .slice(0, 3),
    [directory.currentWorks, myUid],
  );
  const suggestedTopics = useMemo(() => {
    const mine = userProfile?.researchInterests ?? [];
    const fromInterests = liveTopics.filter((t) => mine.some((i) => matchesTopic([i], t.name)));
    return fromInterests.length ? fromInterests : [];
  }, [liveTopics, userProfile?.researchInterests]);
  const popularTopics = useMemo(
    () => [...liveTopics].sort((a, b) => b.researchersCount + b.currentWorkCount - (a.researchersCount + a.currentWorkCount)),
    [liveTopics],
  );

  // -------------------------------------------------------------------------
  // Actions
  // -------------------------------------------------------------------------

  const remember = (q = query) => {
    if (q.trim().length >= 2) addRecentSearch(myUid, q, recent).then(setRecent);
  };

  const runSearch = (q: string) => {
    setQuery(q);
    setDebounced(q);
    remember(q);
  };

  const openTopic = (name: string) => {
    remember();
    router.push({ pathname: '/(explore)/topic-researchers' as any, params: { topic: name } });
  };
  const openPerson = (uid: string) => {
    remember();
    router.push((uid === myUid ? '/(tabs)/profile' : `/(profile)/${uid}`) as any);
  };
  const openWork = (id: string) => {
    remember();
    router.push(`/(research)/${id}` as any);
  };
  const connect = (uid: string) => {
    const profile = directory.profileByUid.get(uid);
    if (profile) handleConnectPress(profile);
  };

  // -------------------------------------------------------------------------
  // Render helpers
  // -------------------------------------------------------------------------

  const renderHits = (key: Exclude<SearchFilter, 'all'>, limit?: number) => {
    const terms = results.terms;
    if (key === 'people') {
      return (results.people as Hit<UserProfile>[]).slice(0, limit).map((h) => (
        <PersonRow
          key={h.item.id}
          person={h.item}
          terms={terms}
          reason={h.reason}
          status={cardStatus(h.item.id)}
          onPress={() => openPerson(h.item.id)}
          onConnect={() => connect(h.item.id)}
        />
      ));
    }
    if (key === 'topics') {
      return (results.topics as Hit<Topic>[]).slice(0, limit).map((h) => {
        const stats = topicStats.get(h.item.id);
        return (
          <TopicRow
            key={h.item.id}
            name={h.item.name}
            terms={terms}
            researchers={stats?.researchersCount ?? 0}
            works={stats?.currentWorkCount ?? 0}
            onPress={() => openTopic(h.item.name)}
          />
        );
      });
    }
    const hits = (key === 'collaborations' ? results.collaborations : results.work) as Hit<CurrentWork>[];
    return hits.slice(0, limit).map((h) => (
      <WorkRow
        key={h.item.id}
        work={h.item}
        terms={terms}
        reason={h.reason}
        onPress={() => openWork(h.item.id)}
        action={h.item.postType === 'collaboration' ? collaborate(h.item) : undefined}
      />
    ));
  };

  const renderSectionHeader = (title: string, count: number, onSeeAll?: () => void) => (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
        {title} <Text style={{ color: colors.textMuted }}>· {count}</Text>
      </Text>
      {onSeeAll ? (
        <TouchableOpacity onPress={onSeeAll} hitSlop={8} style={styles.seeAll} accessibilityRole="button">
          <Text style={[styles.seeAllText, { color: colors.primary }]}>See all</Text>
          <ChevronRight size={15} color={colors.primary} />
        </TouchableOpacity>
      ) : null}
    </View>
  );

  const renderResults = () => {
    if (filter !== 'all') {
      const count = results.counts[filter];
      if (count === 0) return renderNoResults();
      return (
        <View style={styles.list}>
          {renderSectionHeader(SECTION_TITLES[filter], count)}
          {renderHits(filter)}
        </View>
      );
    }
    if (results.counts.all === 0) return renderNoResults();

    // Best-matching section first
    const sections = (['people', 'collaborations', 'work', 'topics'] as const)
      .map((key) => ({ key, count: results.counts[key], top: (results[key][0] as Hit<unknown> | undefined)?.score ?? 0 }))
      .filter((s) => s.count > 0)
      .sort((a, b) => b.top - a.top);

    return (
      <View style={styles.list}>
        {sections.map((s) => (
          <View key={s.key} style={styles.section}>
            {renderSectionHeader(SECTION_TITLES[s.key], s.count, s.count > PREVIEW ? () => setFilter(s.key) : undefined)}
            {renderHits(s.key, PREVIEW)}
          </View>
        ))}
      </View>
    );
  };

  const renderNoResults = () => (
    <View style={styles.empty}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.surfaceSubtle }]}>
        <SearchX size={28} color={colors.textMuted} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No matches for "{debounced.trim()}"</Text>
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        {filter !== 'all' && results.counts.all > 0
          ? `Nothing in ${SECTION_TITLES[filter as Exclude<SearchFilter, 'all'>]}, but there ${results.counts.all === 1 ? 'is 1 result' : `are ${results.counts.all} results`} in other categories.`
          : results.terms.length > 1
            ? 'Try fewer words, or check the spelling.'
            : 'Try a broader word, a research topic or a role like "ML Engineer".'}
      </Text>
      {filter !== 'all' && results.counts.all > 0 ? (
        <TouchableOpacity onPress={() => setFilter('all')} style={[styles.emptyBtn, { borderColor: colors.border }]}>
          <Text style={[styles.seeAllText, { color: colors.primary }]}>Show all results</Text>
        </TouchableOpacity>
      ) : (
        <>
          <Text style={[styles.subhead, { color: colors.textSecondary }]}>Popular topics</Text>
          <View style={styles.chips}>
            {popularTopics.slice(0, 6).map((t) => (
              <TopicChip key={t.id} label={t.name} variant="teal" count={t.researchersCount} onPress={() => openTopic(t.name)} />
            ))}
          </View>
        </>
      )}
    </View>
  );

  /** Empty query + a specific filter → browse everything in that category. */
  const renderBrowse = () => {
    const f = filter as Exclude<SearchFilter, 'all'>;
    if (f === 'people') {
      const list = [...directory.researchers].sort((a, b) => a.name.localeCompare(b.name));
      return (
        <View style={styles.list}>
          {renderSectionHeader('All researchers', list.length)}
          {list.map((p) => (
            <PersonRow
              key={p.id}
              person={p}
              terms={[]}
              reason={p.interests?.length ? `Interested in ${p.interests.slice(0, 3).join(', ')}` : null}
              status={cardStatus(p.id)}
              onPress={() => openPerson(p.id)}
              onConnect={() => connect(p.id)}
            />
          ))}
        </View>
      );
    }
    if (f === 'topics') {
      return (
        <View style={styles.list}>
          {renderSectionHeader('All topics', popularTopics.length)}
          {popularTopics.map((t) => (
            <TopicRow
              key={t.id}
              name={t.name}
              terms={[]}
              researchers={t.researchersCount}
              works={t.currentWorkCount}
              onPress={() => openTopic(t.name)}
            />
          ))}
        </View>
      );
    }
    const isCollab = f === 'collaborations';
    const list = directory.currentWorks
      .filter((w) => (w.postType === 'collaboration') === isCollab)
      .sort((a, b) => (isCollab ? Number(a.collabStatus === 'closed') - Number(b.collabStatus === 'closed') : 0));
    return (
      <View style={styles.list}>
        {renderSectionHeader(isCollab ? 'All collaborations' : 'All research work', list.length)}
        {list.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textSecondary, paddingHorizontal: 0, textAlign: 'left' }]}>
            Nothing here yet.
          </Text>
        ) : (
          list.map((w) => (
            <WorkRow
              key={w.id}
              work={w}
              terms={[]}
              reason={null}
              onPress={() => openWork(w.id)}
              action={isCollab ? collaborate(w) : undefined}
            />
          ))
        )}
      </View>
    );
  };

  const renderStart = () => (
    <View style={styles.list}>
      {recent.length > 0 ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recent searches</Text>
            <TouchableOpacity
              onPress={() => {
                clearRecentSearches(myUid);
                setRecent([]);
              }}
              hitSlop={8}
              accessibilityRole="button"
            >
              <Text style={[styles.seeAllText, { color: colors.textSecondary }]}>Clear all</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.chips}>
            {recent.map((r) => (
              <View key={r} style={[styles.recentChip, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
                <TouchableOpacity onPress={() => runSearch(r)} style={styles.recentTap} accessibilityRole="button" accessibilityLabel={`Search ${r}`}>
                  <Clock size={13} color={colors.textMuted} />
                  <Text style={[styles.recentText, { color: colors.textPrimary }]} numberOfLines={1}>{r}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => removeRecentSearch(myUid, r, recent).then(setRecent)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${r} from recent searches`}
                >
                  <X size={13} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {openCollabs.length > 0 ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.titleWithIcon}>
              <Users size={16} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Open collaborations</Text>
            </View>
            <TouchableOpacity onPress={() => setFilter('collaborations')} hitSlop={8} style={styles.seeAll} accessibilityRole="button">
              <Text style={[styles.seeAllText, { color: colors.primary }]}>See all</Text>
              <ChevronRight size={15} color={colors.primary} />
            </TouchableOpacity>
          </View>
          {openCollabs.map((w) => (
            <WorkRow key={w.id} work={w} terms={[]} reason={null} onPress={() => openWork(w.id)} action={collaborate(w)} />
          ))}
        </View>
      ) : null}

      {suggestedTopics.length > 0 ? (
        <View style={styles.section}>
          <View style={styles.titleWithIcon}>
            <Sparkles size={16} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>From your interests</Text>
          </View>
          <View style={[styles.chips, { marginTop: spacing.sm }]}>
            {suggestedTopics.map((t) => (
              <TopicChip key={t.id} label={t.name} variant="primary" count={t.researchersCount} onPress={() => openTopic(t.name)} />
            ))}
          </View>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Browse topics</Text>
        <View style={[styles.chips, { marginTop: spacing.sm }]}>
          {popularTopics.map((t) => (
            <TopicChip key={t.id} label={t.name} variant="teal" count={t.researchersCount} onPress={() => openTopic(t.name)} />
          ))}
        </View>
      </View>
    </View>
  );

  const typing = query.trim().length > 0;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.surface }]} edges={['top']}>
      {/* Header: back + search + filters with counts */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.borderSubtle }]}>
        <View style={styles.searchRow}>
          <TouchableOpacity
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)' as any))}
            style={[styles.backButton, { backgroundColor: colors.surfaceSubtle }]}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <ArrowLeft size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.searchContainer}>
            <SearchBar
              value={query}
              onChangeText={setQuery}
              placeholder="People, topics, roles or research"
              autoFocus={!params.q}
              onClear={() => setDebounced('')}
              onSubmitEditing={() => remember()}
              accessibilityLabel="Search"
            />
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
          keyboardShouldPersistTaps="handled"
        >
          {FILTERS.map((f) => {
            const selected = filter === f.key;
            const count = typing ? results.counts[f.key] : null;
            return (
              <TouchableOpacity
                key={f.key}
                activeOpacity={0.8}
                onPress={() => setFilter(f.key)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: selected ? colors.primary : colors.surfaceSubtle,
                    borderColor: selected ? colors.primary : colors.borderSubtle,
                  },
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={count !== null ? `${f.label}, ${count} results` : f.label}
              >
                <Text
                  style={[
                    styles.filterText,
                    { color: selected ? '#FFFFFF' : colors.textSecondary },
                    selected && { fontFamily: fontFamilies.sansSemiBold },
                  ]}
                >
                  {f.label}
                  {count !== null ? ` ${count}` : ''}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {directory.loading ? (
          <View style={{ paddingTop: spacing.md }}>
            <SkeletonList count={4} variant="row" />
          </View>
        ) : !typing ? (
          filter === 'all' ? renderStart() : renderBrowse()
        ) : (
          renderResults()
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { borderBottomWidth: 1, paddingTop: spacing.xs },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.xs,
  },
  backButton: { width: 40, height: 40, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  searchContainer: { flex: 1 },
  filters: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.xs },
  filterChip: { paddingHorizontal: 14, height: 34, borderRadius: radius.full, borderWidth: 1, justifyContent: 'center' },
  filterText: { ...typography.caption, fontSize: 13 },
  container: { flex: 1 },
  scrollContent: { padding: spacing.md, paddingBottom: spacing.xxl },
  list: { gap: spacing.sm },
  section: { gap: spacing.sm, marginBottom: spacing.md },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { ...typography.title, fontSize: 16 },
  titleWithIcon: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  seeAll: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAllText: { ...typography.label, fontFamily: fontFamilies.sansSemiBold },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  recentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 10,
    paddingRight: 10,
    height: 34,
    borderRadius: radius.full,
    borderWidth: 1,
    maxWidth: '100%',
  },
  recentTap: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  recentText: { ...typography.caption, fontSize: 13, flexShrink: 1 },
  empty: { alignItems: 'center', paddingTop: spacing.xl, gap: spacing.sm },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { ...typography.title, textAlign: 'center' },
  emptyText: { ...typography.bodySmall, textAlign: 'center', paddingHorizontal: spacing.lg },
  emptyBtn: { paddingHorizontal: spacing.md, height: 40, borderRadius: radius.button, borderWidth: 1, justifyContent: 'center', marginTop: spacing.xs },
  subhead: { ...typography.caption, fontFamily: fontFamilies.sansSemiBold, marginTop: spacing.md },
});
