import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Compass, Sparkles, Filter, X } from 'lucide-react-native';
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
import { TopicChip } from '@/components/common/TopicChip';
import { SectionHeader } from '@/components/common/SectionHeader';
import { ResearcherDiscoveryCard } from '@/components/cards/ResearcherDiscoveryCard';
import { CurrentWorkCard } from '@/components/cards/CurrentWorkCard';
import { PublicationCard } from '@/components/cards/PublicationCard';

export default function ExploreScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'all' | 'people' | 'work' | 'papers'>('all');

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

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.surface }]}
      edges={['top']}
    >
      {/* Search Header Container */}
      <View
        style={[
          styles.headerContainer,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.borderSubtle,
          },
        ]}
      >
        <View style={styles.titleRow}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Explore</Text>
        </View>

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
        <View style={styles.filterRow}>
          <TouchableOpacity
            onPress={() => setSelectedTypeFilter('all')}
            style={[
              styles.filterPill,
              {
                backgroundColor: selectedTypeFilter === 'all' ? colors.primaryMuted : colors.surface,
                borderColor: selectedTypeFilter === 'all' ? colors.primary : colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.filterPillText,
                {
                  color: selectedTypeFilter === 'all' ? colors.primary : colors.textSecondary,
                },
                selectedTypeFilter === 'all' && styles.filterPillTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setSelectedTypeFilter('people')}
            style={[
              styles.filterPill,
              {
                backgroundColor: selectedTypeFilter === 'people' ? colors.primaryMuted : colors.surface,
                borderColor: selectedTypeFilter === 'people' ? colors.primary : colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.filterPillText,
                {
                  color: selectedTypeFilter === 'people' ? colors.primary : colors.textSecondary,
                },
                selectedTypeFilter === 'people' && styles.filterPillTextActive,
              ]}
            >
              People
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setSelectedTypeFilter('work')}
            style={[
              styles.filterPill,
              {
                backgroundColor: selectedTypeFilter === 'work' ? colors.primaryMuted : colors.surface,
                borderColor: selectedTypeFilter === 'work' ? colors.primary : colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.filterPillText,
                {
                  color: selectedTypeFilter === 'work' ? colors.primary : colors.textSecondary,
                },
                selectedTypeFilter === 'work' && styles.filterPillTextActive,
              ]}
            >
              Current Work
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setSelectedTypeFilter('papers')}
            style={[
              styles.filterPill,
              {
                backgroundColor: selectedTypeFilter === 'papers' ? colors.primaryMuted : colors.surface,
                borderColor: selectedTypeFilter === 'papers' ? colors.primary : colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.filterPillText,
                {
                  color: selectedTypeFilter === 'papers' ? colors.primary : colors.textSecondary,
                },
                selectedTypeFilter === 'papers' && styles.filterPillTextActive,
              ]}
            >
              Previous Research
            </Text>
          </TouchableOpacity>
        </View>
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
        {/* 1. RESEARCH TOPICS (Grid of Topic Chips) */}
        {(selectedTypeFilter === 'all' || selectedTypeFilter === 'people') && (
          <View style={styles.sectionContainer}>
            <View
              style={[
                styles.sectionCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.sectionCardHeader}>
                <Sparkles size={18} color={colors.primary} />
                <Text style={[styles.sectionCardTitle, { color: colors.textPrimary }]}>Research Topics</Text>
              </View>
              <Text style={[styles.sectionCardSubtitle, { color: colors.textSecondary }]}>
                Select a topic to find researchers currently working in that area
              </Text>
              <View style={styles.topicsGrid}>
                {mockTopics.map((t) => (
                  <TopicChip
                    key={t.id}
                    label={t.name}
                    variant="teal"
                    onPress={() => handleTopicPress(t)}
                    count={t.researchersCount}
                    style={styles.topicChipItem}
                  />
                ))}
              </View>
            </View>
          </View>
        )}

        {/* 2. FEATURED RESEARCHERS (People) */}
        {(selectedTypeFilter === 'all' || selectedTypeFilter === 'people') && (
          <View style={styles.sectionContainer}>
            <SectionHeader
              title="Featured Researchers"
              subtitle="Scholars and active researchers in CSE"
              actionLabel="View All"
              onActionPress={() => router.push({
                pathname: '/(explore)/search' as any,
                params: { category: 'people' },
              })}
            />

            {featuredResearchers.map((researcher) => {
              const primaryWorkId = researcher.currentWorkIds?.[0];
              const primaryWork = primaryWorkId ? getCurrentWorkById(primaryWorkId) : null;

              return (
                <ResearcherDiscoveryCard
                  key={researcher.id}
                  researcher={researcher}
                  currentWork={primaryWork}
                  connectionStatus={connectionStates[researcher.id] || 'none'}
                  onPress={() => router.push(`/(profile)/${researcher.id}` as any)}
                  onConnectPress={() => handleToggleConnect(researcher.id)}
                  onTopicPress={(topic) => handleTopicPress(topic)}
                />
              );
            })}
          </View>
        )}

        {/* 3. TRENDING CURRENT WORK */}
        {(selectedTypeFilter === 'all' || selectedTypeFilter === 'work') && (
          <View style={styles.sectionContainer}>
            <SectionHeader
              title="Trending Current Work"
              subtitle="Active experiments and ongoing thesis projects"
              actionLabel="View All"
              onActionPress={() => router.push({
                pathname: '/(explore)/search' as any,
                params: { category: 'currentWork' },
              })}
            />

            {allCurrentWork.slice(0, 3).map((work) => {
              const author = getResearcherById(work.userId || work.researcherId || '');
              return (
                <CurrentWorkCard
                  key={work.id}
                  work={work}
                  authorName={author ? author.name : work.authorName}
                  authorBatch={author ? author.batch || author.designation : work.authorBatch}
                  authorAvatar={author?.photoURL || author?.avatar}
                  onPress={() => router.push(`/(research)/${work.id}` as any)}
                  onAuthorPress={() => router.push(`/(profile)/${work.userId || work.researcherId}` as any)}
                  onTopicPress={(topic) => handleTopicPress(topic)}
                />
              );
            })}
          </View>
        )}

        {/* 4. PREVIOUS RESEARCH (Completed Papers) */}
        {(selectedTypeFilter === 'all' || selectedTypeFilter === 'papers') && (
          <View style={styles.sectionContainer}>
            <SectionHeader
              title="Explore Previous Research"
              subtitle="Peer-reviewed publications and conference proceedings"
              actionLabel="Browse Archive"
              onActionPress={() => router.push({
                pathname: '/(explore)/search' as any,
                params: { category: 'publications' },
              })}
            />

            {allPublications.map((pub) => (
              <PublicationCard
                key={pub.id}
                publication={pub}
                onPress={() => router.push(`/(research)/${pub.id}` as any)}
                onExternalPress={() => {}}
                onTopicPress={(topic) => handleTopicPress(topic)}
              />
            ))}
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  titleRow: {
    marginBottom: spacing.sm,
  },
  headerTitle: {
    ...typography.display,
    fontSize: 28,
    lineHeight: 34,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  filterPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  filterPillText: {
    ...typography.caption,
    fontFamily: fontFamilies.sansMedium,
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
  sectionCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.xs,
    ...shadows.card,
  },
  sectionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    marginBottom: 4,
  },
  sectionCardTitle: {
    ...typography.title,
  },
  sectionCardSubtitle: {
    ...typography.caption,
    marginBottom: spacing.md,
  },
  topicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs + 2,
  },
  topicChipItem: {
    marginBottom: spacing.xs,
  },
  bottomSpacer: {
    height: 48,
  },
});
