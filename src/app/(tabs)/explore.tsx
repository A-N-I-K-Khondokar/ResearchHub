import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowRight,
  Layers,
  Bookmark,
  Users,
} from 'lucide-react-native';
import { spacing, radius, typography, fontFamilies, shadows, floatingButtonTokens } from '@/constants';
import { useTheme } from '@/context/ThemeContext';
import { Topic } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { SkeletonList } from '@/components/feedback/Skeleton';
import { ResearcherCard } from '@/components/cards/ResearcherCard';
import { tagMatchKey } from '@/utils/researchWork';
import { FlatList } from 'react-native';
import { TOPIC_TAXONOMY } from '@/utils/search';
import { useResearchDirectory } from '@/hooks/useResearchDirectory';
import { useConnections } from '@/hooks/useConnections';
import { useSavedItems } from '@/hooks/useSavedItems';
import { formatWorkDate } from '@/services/research.service';
import { ActivityIndicator } from 'react-native';
import { SearchBar } from '@/components/common/SearchBar';
import { ResearcherDiscoveryCard } from '@/components/cards/ResearcherDiscoveryCard';

type ExploreFilterType = 'all' | 'people' | 'work' | 'topics';

const filterCategories: { key: ExploreFilterType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'people', label: 'People' },
  { key: 'work', label: 'Current Work' },
  { key: 'topics', label: 'Topics' },
];

export default function ExploreScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<ExploreFilterType>('all');

  const directory = useResearchDirectory();
  const { cardStatus, handleConnectPress } = useConnections();
  const { isSaved, toggleSave } = useSavedItems();

  // Researchers with recently shared work first, then the rest of the directory
  // People who share your research interests (computed on-device, no backend call)
  const { userProfile } = useAuth();
  const sharedInterestPeople = useMemo(() => {
    const mine = new Set((userProfile?.researchInterests ?? []).map(tagMatchKey));
    if (mine.size === 0) return [];
    return directory.researchers
      .map((r) => ({
        researcher: r,
        shared: (r.interests ?? []).filter((i) => mine.has(tagMatchKey(i))).length,
      }))
      .filter((x) => x.shared > 0)
      .sort((a, b) => b.shared - a.shared)
      .slice(0, 10);
  }, [directory.researchers, userProfile?.researchInterests]);

  const featuredResearchers = useMemo(() => {
    const active = directory.researchers.filter((r) => (r.currentWorkIds?.length ?? 0) > 0);
    const others = directory.researchers.filter((r) => (r.currentWorkIds?.length ?? 0) === 0);
    return [...active, ...others].slice(0, 3);
  }, [directory.researchers]);
  const allCurrentWork = directory.works;

  const handleRefresh = React.useCallback(() => {
    setRefreshing(true);
    directory.refresh();
    setTimeout(() => setRefreshing(false), 800);
  }, [directory]);

  const handleTopicPress = (topic: Topic | string) => {
    const topicName = typeof topic === 'string' ? topic : topic.name;
    router.push({
      pathname: '/(explore)/topic-researchers' as any,
      params: { topic: topicName },
    });
  };

  const getTopicChipStyle = (topicName: string) => {
    const lower = topicName.toLowerCase();
    // 1. "AI & Machine Learning": bg #EBF2FF, text #1B5ECC (SemiBold)
    if (
      lower.includes('learning') ||
      lower.includes('machine') ||
      lower.includes('ai')
    ) {
      return {
        bg: isDark ? 'rgba(36, 113, 231, 0.22)' : '#EBF2FF',
        text: isDark ? '#93C5FD' : '#1B5ECC',
      };
    }
    // 2. "Computer Vision": bg #EEF2FF, text #4338CA
    if (lower.includes('vision') || lower.includes('cv')) {
      return {
        bg: isDark ? 'rgba(99, 102, 241, 0.22)' : '#EEF2FF',
        text: isDark ? '#C7D2FE' : '#4338CA',
      };
    }
    // 3. "Natural Language Processing": bg #FFF0EB, text #CB4C23
    if (
      lower.includes('nlp') ||
      lower.includes('language') ||
      lower.includes('speech') ||
      lower.includes('bangla')
    ) {
      return {
        bg: isDark ? 'rgba(255, 113, 69, 0.22)' : '#FFF0EB',
        text: isDark ? '#FFB59F' : '#CB4C23',
      };
    }
    // 4. Default/Others: bg colors.surfaceContainerHigh, text colors.textPrimary
    return {
      bg: colors.surfaceContainerHigh,
      text: colors.textPrimary,
    };
  };

  return (
    <View style={[styles.safeArea, { backgroundColor: colors.surface }]}>
      {/* Search Header Container (Top Explore title removed) */}
      <View
        style={[
          styles.headerContainer,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.borderSubtle,
            paddingTop: insets.top + 16,
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => router.push('/(explore)/search' as any)}
        >
          <View pointerEvents="none">
            <SearchBar
              value=""
              onChangeText={() => {}}
              placeholder="Search researchers, topics, or research"
              onFilterPress={() => router.push('/(explore)/search' as any)}
            />
          </View>
        </TouchableOpacity>

        {/* Quick Category Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScrollView}
          contentContainerStyle={styles.filterScrollContent}
        >
          {filterCategories.map((cat) => {
            const isSelected = selectedTypeFilter === cat.key;
            return (
              <TouchableOpacity
                key={cat.key}
                activeOpacity={0.8}
                onPress={() => setSelectedTypeFilter(cat.key)}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.surfaceSubtle,
                    borderColor: isSelected ? colors.primary : colors.borderSubtle,
                  },
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    {
                      color: isSelected ? '#FFFFFF' : colors.textSecondary,
                    },
                    isSelected && styles.filterPillTextActive,
                  ]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {cat.label}
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* 1. RESEARCH TOPICS */}
        {(selectedTypeFilter === 'all' || selectedTypeFilter === 'topics') && (
          <View style={styles.sectionContainer}>
            <View style={styles.bentoHeaderRow}>
              <View style={styles.bentoHeaderLeft}>
                <Text
                  style={[styles.bentoTitle, { color: colors.textPrimary }]}
                  numberOfLines={1}
                >
                  Research Topics
                </Text>
                <Text
                  style={[styles.bentoSubtitle, { color: colors.textSecondary }]}
                  numberOfLines={1}
                >
                  Select a topic to find researchers currently working in that area
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.topicsCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.borderSubtle,
                  shadowOpacity: isDark ? 0 : 0.03,
                  elevation: isDark ? 0 : 1,
                },
              ]}
            >
              <View style={styles.topicsGrid}>
                {TOPIC_TAXONOMY.map((t) => {
                  const scheme = getTopicChipStyle(t.name);
                  return (
                    <TouchableOpacity
                      key={t.id}
                      activeOpacity={0.75}
                      onPress={() => handleTopicPress(t)}
                      style={[
                        styles.solidTopicChip,
                        {
                          backgroundColor: scheme.bg,
                        },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={t.name}
                    >
                      <Text
                        style={[
                          styles.solidTopicChipLabel,
                          { color: scheme.text },
                        ]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {t.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        {/* 1b. PEOPLE WITH SHARED INTERESTS */}
        {(selectedTypeFilter === 'all' || selectedTypeFilter === 'people') && sharedInterestPeople.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.bentoHeaderRow}>
              <View style={styles.bentoHeaderLeft}>
                <Text style={[styles.bentoTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                  People With Shared Interests
                </Text>
                <Text style={[styles.bentoSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                  Researchers working on topics you follow
                </Text>
              </View>
            </View>
            <FlatList
              horizontal
              data={sharedInterestPeople}
              keyExtractor={(item) => item.researcher.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: spacing.sm, paddingVertical: spacing.xs }}
              renderItem={({ item }) => (
                <ResearcherCard
                  researcher={item.researcher}
                  sharedInterestsCount={item.shared}
                  connectionStatus={cardStatus(item.researcher.id)}
                  onPress={() => router.push(`/(profile)/${item.researcher.id}` as any)}
                  onConnectPress={() => {
                    const profile = directory.profileByUid.get(item.researcher.id);
                    if (profile) handleConnectPress(profile);
                  }}
                />
              )}
            />
          </View>
        )}

        {/* 2. FEATURED RESEARCHERS */}
        {(selectedTypeFilter === 'all' || selectedTypeFilter === 'people') && (
          <View style={styles.sectionContainer}>
            <View style={styles.featuredResearchersContainer}>
              {/* Section Header */}
              <View style={styles.featuredResearchersHeaderRow}>
                <View style={styles.bentoHeaderLeft}>
                  <Text
                    style={[styles.bentoTitle, { color: colors.textPrimary }]}
                    numberOfLines={1}
                  >
                    Featured Researchers
                  </Text>
                  <Text
                    style={[styles.bentoSubtitle, { color: colors.textSecondary }]}
                    numberOfLines={1}
                  >
                    Active scholars and thesis contributors in CSE
                  </Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() =>
                    router.push({
                      pathname: '/(explore)/search' as any,
                      params: { category: 'people' },
                    })
                  }
                  style={styles.bentoActionBtn}
                  accessibilityRole="button"
                  accessibilityLabel="View all featured researchers"
                >
                  <Text style={[styles.bentoActionText, { color: colors.primary }]}>
                    View All
                  </Text>
                  <ArrowRight size={14} color={colors.primary} />
                </TouchableOpacity>
              </View>

              {/* Cards List */}
              <View style={styles.featuredResearchersList}>
                {directory.loading ? (
                  <SkeletonList count={2} variant="row" />
                ) : featuredResearchers.length === 0 ? (
                  <Text style={[styles.currentWorkMeta, { color: colors.textSecondary }]}>
                    No other approved researchers yet.
                  </Text>
                ) : null}
                {featuredResearchers.map((researcher) => {
                  const primaryWorkId = researcher.currentWorkIds?.[0];
                  const primaryWork = primaryWorkId
                    ? directory.currentWorks.find((w) => w.id === primaryWorkId) ?? null
                    : null;

                  return (
                    <ResearcherDiscoveryCard
                      key={researcher.id}
                      researcher={researcher}
                      currentWork={primaryWork}
                      connectionStatus={cardStatus(researcher.id)}
                      onPress={() =>
                        router.push(`/(profile)/${researcher.id}` as any)
                      }
                      onConnectPress={() => {
                        const profile = directory.profileByUid.get(researcher.id);
                        if (profile) handleConnectPress(profile);
                      }}
                      onTopicPress={(topic) => handleTopicPress(topic)}
                    />
                  );
                })}
              </View>
            </View>
          </View>
        )}

        {/* 3. TRENDING CURRENT WORK */}
        {(selectedTypeFilter === 'all' || selectedTypeFilter === 'work') && (
          <View style={styles.sectionContainer}>
            <View style={styles.bentoHeaderRow}>
              <View style={styles.bentoHeaderLeft}>
                <Text
                  style={[styles.bentoTitle, { color: colors.textPrimary }]}
                  numberOfLines={1}
                >
                  Trending Current Work
                </Text>
                <Text
                  style={[styles.bentoSubtitle, { color: colors.textSecondary }]}
                  numberOfLines={1}
                >
                  Active experiments and ongoing thesis projects
                </Text>
              </View>
            </View>

            <View style={styles.currentWorkList}>
              {!directory.loading && allCurrentWork.length === 0 ? (
                <Text style={[styles.currentWorkMeta, { color: colors.textSecondary }]}>
                  No research has been shared yet.
                </Text>
              ) : null}
              {allCurrentWork.slice(0, 3).map((work) => {
                const saved = isSaved(work.id);

                return (
                  <TouchableOpacity
                    key={work.id}
                    activeOpacity={0.8}
                    onPress={() => router.push(`/(research)/${work.id}` as any)}
                    style={[
                      styles.currentWorkItem,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.borderSubtle,
                        borderLeftColor: colors.primary,
                        shadowOpacity: isDark ? 0 : 0.03,
                        elevation: isDark ? 0 : 1,
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={work.title}
                  >
                    {work.postType === 'collaboration' ? (
                      <View style={[styles.collabTag, { backgroundColor: colors.primaryMuted }]}>
                        <Users size={11} color={colors.primary} />
                        <Text style={[styles.collabTagText, { color: colors.primary }]}>Looking for collaborators</Text>
                      </View>
                    ) : null}
                    <Text
                      style={[styles.currentWorkTitle, { color: colors.primary }]}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {work.title}
                    </Text>
                    <Text
                      style={[styles.currentWorkMeta, { color: colors.textSecondary }]}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      Shared {formatWorkDate(work.createdAt)} by {work.authorName}
                    </Text>
                    <View style={styles.currentWorkStatsRow}>
                      <View style={styles.currentWorkStatItem}>
                        <Layers size={14} color={colors.textSecondary} />
                        <Text
                          style={[
                            styles.currentWorkStatText,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {work.stage}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.currentWorkStatItem}
                        onPress={() => toggleSave(work)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        accessibilityRole="button"
                        accessibilityLabel={saved ? 'Remove from saved items' : 'Save research'}
                      >
                        <Bookmark
                          size={14}
                          color={saved ? colors.primary : colors.textSecondary}
                          fill={saved ? colors.primary : 'transparent'}
                        />
                        <Text
                          style={[
                            styles.currentWorkStatText,
                            { color: saved ? colors.primary : colors.textSecondary },
                          ]}
                        >
                          {saved ? 'Saved' : 'Save'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* View Activity Feed Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() =>
                router.push({
                  pathname: '/(explore)/search' as any,
                  params: { category: 'currentWork' },
                })
              }
              style={[
                styles.viewActivityFeedBtn,
                {
                  backgroundColor: isDark ? colors.surfaceContainer : colors.surface,
                  borderColor: isDark ? colors.borderSubtle : '#D4D8E2',
                },
                floatingButtonTokens.secondary,
              ]}
              accessibilityRole="button"
              accessibilityLabel="View Activity Feed"
            >
              <Text style={[styles.viewActivityFeedText, { color: colors.primary }]}>
                View Activity Feed
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  collabTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
    marginBottom: 6,
  },
  collabTagText: {
    ...typography.micro,
    fontFamily: fontFamilies.sansSemiBold,
  },
  safeArea: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  filterScrollView: {
    marginHorizontal: -spacing.md,
    marginTop: spacing.sm,
  },
  filterScrollContent: {
    paddingHorizontal: spacing.md,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    maxWidth: '100%',
    flexShrink: 1,
    minHeight: 32,
    justifyContent: 'center',
  },
  filterPillText: {
    ...typography.caption,
    fontFamily: fontFamilies.sansMedium,
    flexShrink: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  filterPillTextActive: {
    fontFamily: fontFamilies.sansSemiBold,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: spacing.md,
    paddingBottom: 32,
  },
  sectionContainer: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  bentoHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  bentoHeaderLeft: {
    flex: 1,
    flexShrink: 1,
    marginRight: spacing.sm,
  },
  bentoTitle: {
    ...typography.sectionHeader,
  },
  bentoSubtitle: {
    fontSize: 13,
    fontFamily: fontFamilies.sansRegular,
    lineHeight: 18,
    marginTop: 3,
  },
  bentoActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    flexShrink: 0,
  },
  bentoActionText: {
    fontSize: 13,
    fontFamily: fontFamilies.sansSemiBold,
    fontWeight: '600',
  },
  featuredResearchersContainer: {
    // Un-nested section container without redundant outer borders or background
  },
  featuredResearchersHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  featuredResearchersList: {
    gap: 12,
  },
  topicsCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#071A3E',
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
  },
  topicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  solidTopicChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 9999,
    borderWidth: 0,
    maxWidth: '100%',
    flexShrink: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 32,
  },
  solidTopicChipLabel: {
    fontSize: 13,
    fontFamily: fontFamilies.sansSemiBold,
    fontWeight: '600',
    flexShrink: 1,
  },
  currentWorkList: {
    gap: 12,
  },
  currentWorkItem: {
    borderRadius: 12,
    borderWidth: 1,
    borderLeftWidth: 3,
    padding: 14,
    shadowColor: '#071A3E',
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
  },
  currentWorkTitle: {
    fontSize: 15,
    fontFamily: fontFamilies.sansSemiBold,
    fontWeight: '600',
    marginBottom: 3,
  },
  currentWorkMeta: {
    fontSize: 13,
    fontFamily: fontFamilies.sansRegular,
    lineHeight: 18,
    marginBottom: 8,
  },
  currentWorkStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  currentWorkStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  currentWorkStatText: {
    fontSize: 12,
    fontFamily: fontFamilies.sansSemiBold,
    fontWeight: '600',
  },
  viewActivityFeedBtn: {
    marginTop: 12,
    height: 44,
    borderRadius: radius.button,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewActivityFeedText: {
    fontSize: 13,
    fontFamily: fontFamilies.sansSemiBold,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 48,
  },
});
