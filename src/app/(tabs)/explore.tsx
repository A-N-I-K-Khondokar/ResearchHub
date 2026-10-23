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
  Eye,
  Bookmark,
  FileText,
  Quote,
} from 'lucide-react-native';
import { spacing, radius, typography, fontFamilies, shadows } from '@/constants';
import { useTheme } from '@/context/ThemeContext';
import {
  mockTopics,
  mockResearchers,
  getActiveCurrentWork,
  getPublications,
  getResearcherById,
  getCurrentWorkById,
} from '@/data';
import { Topic, UserProfile } from '@/types';
import { SearchBar } from '@/components/common/SearchBar';
import { ResearcherDiscoveryCard } from '@/components/cards/ResearcherDiscoveryCard';

type ExploreFilterType = 'all' | 'people' | 'work' | 'topics' | 'papers';

const filterCategories: { key: ExploreFilterType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'people', label: 'People' },
  { key: 'work', label: 'Current Work' },
  { key: 'topics', label: 'Topics' },
  { key: 'papers', label: 'Previous Research' },
];

export default function ExploreScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<ExploreFilterType>('all');

  const [connectionStates, setConnectionStates] = useState<Record<string, 'none' | 'pending' | 'connected'>>(() => {
    const initial: Record<string, 'none' | 'pending' | 'connected'> = {};
    mockResearchers.forEach((r) => {
      initial[r.id] = r.connectionStatus || 'none';
    });
    return initial;
  });

  const featuredResearchers = useMemo(() => mockResearchers.slice(0, 3), []);
  const allCurrentWork = useMemo(() => getActiveCurrentWork(), []);
  const allPublications = useMemo(() => getPublications(), []);

  const handleRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 600);
  }, []);

  const handleToggleConnect = (researcherId: string) => {
    setConnectionStates((prev) => {
      const current = prev[researcherId] || 'none';
      let nextState: 'none' | 'pending' | 'connected' = 'pending';
      if (current === 'none') nextState = 'pending';
      else if (current === 'pending') nextState = 'connected';
      else nextState = 'none';

      return {
        ...prev,
        [researcherId]: nextState,
      };
    });
  };

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
        {/* 1. RESEARCH TOPICS (Bento Container) */}
        {(selectedTypeFilter === 'all' || selectedTypeFilter === 'topics') && (
          <View style={styles.sectionContainer}>
            <View
              style={[
                styles.bentoContainer,
                {
                  backgroundColor: colors.surfaceContainerLowest,
                  borderColor: colors.borderSubtle,
                },
              ]}
            >
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

              <View style={styles.topicsGrid}>
                {mockTopics.map((t) => {
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

        {/* 2. FEATURED RESEARCHERS (Bento Container) */}
        {(selectedTypeFilter === 'all' || selectedTypeFilter === 'people') && (
          <View style={styles.sectionContainer}>
            <View
              style={[
                styles.bentoContainer,
                {
                  backgroundColor: colors.surfaceContainerLowest,
                  borderColor: colors.borderSubtle,
                },
              ]}
            >
              {/* Bento Section Header */}
              <View style={styles.bentoHeaderRow}>
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

              {/* Bento Cards List */}
              <View style={styles.bentoCardsList}>
                {featuredResearchers.map((researcher) => {
                  const primaryWorkId = researcher.currentWorkIds?.[0];
                  const primaryWork = primaryWorkId
                    ? getCurrentWorkById(primaryWorkId)
                    : null;

                  return (
                    <ResearcherDiscoveryCard
                      key={researcher.id}
                      researcher={researcher}
                      currentWork={primaryWork}
                      connectionStatus={connectionStates[researcher.id] || 'none'}
                      onPress={() =>
                        router.push(`/(profile)/${researcher.id}` as any)
                      }
                      onConnectPress={() => handleToggleConnect(researcher.id)}
                      onTopicPress={(topic) => handleTopicPress(topic)}
                    />
                  );
                })}
              </View>
            </View>
          </View>
        )}

        {/* 3. TRENDING CURRENT WORK (Bento Container) */}
        {(selectedTypeFilter === 'all' || selectedTypeFilter === 'work') && (
          <View style={styles.sectionContainer}>
            <View
              style={[
                styles.bentoContainer,
                {
                  backgroundColor: colors.surfaceContainerLowest,
                  borderColor: colors.borderSubtle,
                },
              ]}
            >
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
                {allCurrentWork.slice(0, 3).map((work, idx) => {
                  const author = getResearcherById(work.userId || work.researcherId || '');
                  const views = work.likesCount ? work.likesCount * 35 : idx === 0 ? 1200 : 890;
                  const viewsText = views > 999 ? `${(views / 1000).toFixed(1)}k` : `${views}`;
                  const bookmarks = work.commentsCount ? work.commentsCount * 5 : idx === 0 ? 45 : 32;

                  return (
                    <TouchableOpacity
                      key={work.id}
                      activeOpacity={0.8}
                      onPress={() => router.push(`/(research)/${work.id}` as any)}
                      style={[
                        styles.currentWorkItem,
                        {
                          borderLeftColor: colors.primary,
                        },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={work.title}
                    >
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
                        Updated {work.updatedAt || 'recently'} by {author ? author.name : work.authorName || 'Research Team'}
                      </Text>
                      <View style={styles.currentWorkStatsRow}>
                        <View style={styles.currentWorkStatItem}>
                          <Eye size={14} color={colors.textSecondary} />
                          <Text
                            style={[
                              styles.currentWorkStatText,
                              { color: colors.textSecondary },
                            ]}
                          >
                            {viewsText}
                          </Text>
                        </View>
                        <View style={styles.currentWorkStatItem}>
                          <Bookmark size={14} color={colors.textSecondary} />
                          <Text
                            style={[
                              styles.currentWorkStatText,
                              { color: colors.textSecondary },
                            ]}
                          >
                            {bookmarks}
                          </Text>
                        </View>
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
                    backgroundColor: isDark
                      ? 'rgba(36, 113, 231, 0.15)'
                      : 'rgba(10, 61, 175, 0.08)',
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="View Activity Feed"
              >
                <Text style={[styles.viewActivityFeedText, { color: colors.primary }]}>
                  View Activity Feed
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 4. EXPLORE PREVIOUS RESEARCH (Bento Container) */}
        {(selectedTypeFilter === 'all' || selectedTypeFilter === 'papers') && (
          <View style={styles.sectionContainer}>
            <View
              style={[
                styles.bentoContainer,
                {
                  backgroundColor: colors.surfaceContainerLowest,
                  borderColor: colors.borderSubtle,
                },
              ]}
            >
              <View style={styles.bentoHeaderRow}>
                <View style={styles.bentoHeaderLeft}>
                  <Text
                    style={[styles.bentoTitle, { color: colors.textPrimary }]}
                    numberOfLines={1}
                  >
                    Explore Previous Research
                  </Text>
                  <Text
                    style={[styles.bentoSubtitle, { color: colors.textSecondary }]}
                    numberOfLines={1}
                  >
                    Peer-reviewed publications and conference proceedings
                  </Text>
                </View>
              </View>

              <View style={styles.papersGrid}>
                {allPublications.map((pub, idx) => {
                  const citations =
                    (pub as any).citationsCount ||
                    (idx === 0 ? 42 : idx === 1 ? 128 : idx === 2 ? 85 : 56);

                  return (
                    <TouchableOpacity
                      key={pub.id}
                      activeOpacity={0.8}
                      onPress={() => router.push(`/(research)/${pub.id}` as any)}
                      style={[
                        styles.paperCard,
                        {
                          backgroundColor: colors.surface,
                          borderColor: colors.borderSubtle,
                        },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={pub.title}
                    >
                      <View style={styles.paperHeaderRow}>
                        <FileText size={16} color={colors.textSecondary} />
                        <Text
                          style={[
                            styles.paperYear,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {pub.year}
                        </Text>
                      </View>
                      <Text
                        style={[styles.paperTitle, { color: colors.textPrimary }]}
                        numberOfLines={2}
                        ellipsizeMode="tail"
                      >
                        {pub.title}
                      </Text>
                      <Text
                        style={[styles.paperVenue, { color: colors.textSecondary }]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {pub.venue}
                      </Text>
                      <View style={styles.paperCitationsRow}>
                        <Quote size={13} color={colors.textSecondary} />
                        <Text
                          style={[
                            styles.paperCitationsText,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {citations} Citations
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
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
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    maxWidth: '100%',
    flexShrink: 1,
  },
  filterPillText: {
    ...typography.caption,
    fontFamily: fontFamilies.sansMedium,
    flexShrink: 1,
  },
  filterPillTextActive: {
    fontFamily: fontFamilies.sansSemiBold,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: spacing.md,
    paddingBottom: 120,
  },
  sectionContainer: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  bentoContainer: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    elevation: 2,
    shadowColor: '#172033',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  bentoHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  bentoHeaderLeft: {
    flex: 1,
    flexShrink: 1,
    marginRight: spacing.sm,
  },
  bentoIconTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bentoTitle: {
    fontSize: 18,
    fontFamily: fontFamilies.serif,
    fontWeight: '600',
    letterSpacing: -0.2,
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
  bentoCardsList: {
    gap: 16,
  },
  topicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  solidTopicChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
    borderWidth: 0,
    maxWidth: '100%',
    flexShrink: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  solidTopicChipLabel: {
    fontSize: 13,
    fontFamily: fontFamilies.sansSemiBold,
    fontWeight: '600',
    flexShrink: 1,
  },
  currentWorkList: {
    gap: 16,
  },
  currentWorkItem: {
    borderLeftWidth: 2,
    paddingLeft: 14,
    paddingVertical: 2,
  },
  currentWorkTitle: {
    fontSize: 15,
    fontFamily: fontFamilies.sansSemiBold,
    fontWeight: '600',
    marginBottom: 3,
  },
  currentWorkMeta: {
    fontSize: 12.5,
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
    fontSize: 11.5,
    fontFamily: fontFamilies.sansSemiBold,
    fontWeight: '600',
  },
  viewActivityFeedBtn: {
    marginTop: 20,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewActivityFeedText: {
    fontSize: 13,
    fontFamily: fontFamilies.sansSemiBold,
    fontWeight: '600',
  },
  papersGrid: {
    gap: 12,
  },
  paperCard: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
  },
  paperHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  paperYear: {
    fontSize: 11.5,
    fontFamily: fontFamilies.sansSemiBold,
    fontWeight: '600',
  },
  paperTitle: {
    fontSize: 14,
    fontFamily: fontFamilies.sansSemiBold,
    fontWeight: '600',
    lineHeight: 20,
    marginBottom: 6,
  },
  paperVenue: {
    fontSize: 12,
    fontFamily: fontFamilies.sansRegular,
    lineHeight: 16,
    marginBottom: 10,
  },
  paperCitationsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  paperCitationsText: {
    fontSize: 11.5,
    fontFamily: fontFamilies.sansSemiBold,
    fontWeight: '600',
  },
  topicChipItem: {
    marginBottom: spacing.xs,
    maxWidth: '100%',
    flexShrink: 1,
  },
  bottomSpacer: {
    height: 48,
  },
});
