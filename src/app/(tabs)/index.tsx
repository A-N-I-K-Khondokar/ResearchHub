import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { spacing, radius, typography, fontFamilies, shadows } from '../../constants';
import { useTheme } from '@/context/ThemeContext';
import {
  currentUser,
  mockTopics,
  mockResearchers,
  mockCurrentWorks,
  getActiveCurrentWork,
  getFeaturedResearchers,
  getRecentPublications,
  getResearcherById,
  getUnreadNotificationsCount,
} from '../../data';
import { Topic } from '../../types';
import { HomeHeader } from '../../components/home/HomeHeader';
import { TopicShortcutRow } from '../../components/home/TopicShortcutRow';
import { CurrentWorkCard } from '../../components/cards/CurrentWorkCard';
import { ResearcherCard } from '../../components/cards/ResearcherCard';
import { PublicationCard } from '../../components/cards/PublicationCard';
import { SectionHeader } from '../../components/common/SectionHeader';

export default function HomeFeedScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);

  // Initialize local states accurately from mock data
  const [likedWorkIds, setLikedWorkIds] = useState<Set<string>>(() => {
    const set = new Set<string>();
    mockCurrentWorks.forEach((w) => {
      if (w.isLiked) set.add(w.id);
    });
    return set;
  });

  const [bookmarkedWorkIds, setBookmarkedWorkIds] = useState<Set<string>>(() => {
    const set = new Set<string>();
    mockCurrentWorks.forEach((w) => {
      if (w.isBookmarked) set.add(w.id);
    });
    return set;
  });

  const [connectionStates, setConnectionStates] = useState<Record<string, 'none' | 'pending' | 'connected'>>(() => {
    const initial: Record<string, 'none' | 'pending' | 'connected'> = {};
    mockResearchers.forEach((r) => {
      initial[r.id] = r.connectionStatus || 'none';
    });
    return initial;
  });

  const allCurrentWork = useMemo(() => getActiveCurrentWork(), []);
  const featuredResearchers = useMemo(() => getFeaturedResearchers(), []);
  const recentPublications = useMemo(() => getRecentPublications(), []);
  const unreadNotificationsCount = useMemo(() => getUnreadNotificationsCount(), []);

  // Filtered current work based on selected topic
  const filteredWork = useMemo(() => {
    if (!selectedTopic) return allCurrentWork;
    return allCurrentWork.filter(
      (work) =>
        work.topics &&
        work.topics.some(
          (t) => t.toLowerCase() === selectedTopic.name.toLowerCase()
        )
    );
  }, [allCurrentWork, selectedTopic]);

  const handleRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 600);
  }, []);

  const handleToggleLike = (workId: string) => {
    setLikedWorkIds((prev) => {
      const next = new Set(prev);
      if (next.has(workId)) {
        next.delete(workId);
      } else {
        next.add(workId);
      }
      return next;
    });
  };

  const handleToggleBookmark = (workId: string) => {
    setBookmarkedWorkIds((prev) => {
      const next = new Set(prev);
      if (next.has(workId)) {
        next.delete(workId);
      } else {
        next.add(workId);
      }
      return next;
    });
  };

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

  const handleTopicSelect = (topic: Topic) => {
    if (selectedTopic?.id === topic.id) {
      setSelectedTopic(null); // Deselect filter
    } else {
      setSelectedTopic(topic);
    }
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.surface }]}
      edges={['top']}
    >
      {/* Header */}
      <HomeHeader
        userName={currentUser.name}
        userAvatar={currentUser.photoURL || currentUser.avatar}
        unreadNotificationsCount={unreadNotificationsCount}
        onAvatarPress={() => router.push('/(tabs)/profile' as any)}
        onSearchPress={() => router.push('/(explore)/search' as any)}
        onNotificationPress={() => router.push('/(tabs)/notifications' as any)}
      />

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
        {/* Topic Shortcuts Row */}
        <View
          style={[
            styles.topicSection,
            {
              backgroundColor: colors.surface,
              borderBottomColor: colors.borderSubtle,
            },
          ]}
        >
          <TopicShortcutRow
            topics={mockTopics}
            selectedTopicId={selectedTopic?.id}
            onSelectTopic={handleTopicSelect}
          />
        </View>

        {/* Section 1: People are working on (Momentum Feed) */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderWrapper}>
            <SectionHeader
              title="People are working on"
              indicatorColor="#2471E7"
              badge={{ text: 'Live Feed', dotColor: colors.success }}
              actionLabel={selectedTopic ? 'Clear filter' : undefined}
              onActionPress={selectedTopic ? () => setSelectedTopic(null) : undefined}
            />
          </View>

          {filteredWork.length === 0 ? (
            <View
              style={[
                styles.emptyContainer,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No research found</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                No current work matches "{selectedTopic?.name}".
              </Text>
              <TouchableOpacity
                onPress={() => setSelectedTopic(null)}
                style={[styles.clearFilterButton, { backgroundColor: colors.primaryMuted }]}
              >
                <Text style={[styles.clearFilterText, { color: colors.primary }]}>Show all research</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredWork.slice(0, 3).map((work) => {
              const researcherId = work.userId || work.researcherId || '';
              const author = getResearcherById(researcherId);
              const authorName = author ? author.name : work.authorName || 'CSE Researcher';
              const authorBatch = author?.id === 'res-rafiq-003' 
                ? 'CSE • Batch 12' 
                : author ? `CSE • ${author.batch || 'Batch 14'}` : work.authorBatch || 'CSE';
              const authorRole = author?.id === 'res-mou-002'
                ? 'NLP Lab'
                : author?.batch === 'Faculty' || author?.id === 'res-rafiq-003'
                ? 'Faculty'
                : undefined;
              const isLiked = likedWorkIds.has(work.id);
              const isBookmarked = bookmarkedWorkIds.has(work.id);
              const likeDelta = isLiked && !work.isLiked ? 1 : !isLiked && work.isLiked ? -1 : 0;

              return (
                <CurrentWorkCard
                  key={work.id}
                  work={{
                    ...work,
                    likesCount: Math.max(0, (work.likesCount || 0) + likeDelta),
                  }}
                  authorName={authorName}
                  authorBatch={authorBatch}
                  authorAvatar={author?.photoURL || author?.avatar}
                  authorRole={authorRole}
                  isLiked={isLiked}
                  isBookmarked={isBookmarked}
                  onPress={() => router.push(`/(research)/${work.id}` as any)}
                  onAuthorPress={() =>
                    router.push(`/(profile)/${researcherId}` as any)
                  }
                  onTopicPress={(topicName) => {
                    const foundTopic = mockTopics.find(
                      (t) => t.name.toLowerCase() === topicName.toLowerCase()
                    );
                    if (foundTopic) setSelectedTopic(foundTopic);
                  }}
                  onLikePress={() => handleToggleLike(work.id)}
                  onBookmarkPress={() => handleToggleBookmark(work.id)}
                  onCommentPress={() => router.push(`/(research)/${work.id}` as any)}
                />
              );
            })
          )}
        </View>

        {/* Section 2: Featured Researchers (Horizontal Carousel) */}
        <View style={styles.researchersSection}>
          <View style={styles.sectionHeaderWrapper}>
            <SectionHeader
              title="Researchers to Follow"
              indicatorColor="#FF7145"
              actionLabel="Discover"
              onActionPress={() => router.push('/(tabs)/explore' as any)}
            />
          </View>

          <FlatList
            horizontal
            data={featuredResearchers}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.researchersScrollList}
            renderItem={({ item, index }) => (
              <ResearcherCard
                researcher={item}
                connectionStatus={connectionStates[item.id] || item.connectionStatus || 'none'}
                onPress={() => router.push(`/(profile)/${item.id}` as any)}
                onConnectPress={() => handleToggleConnect(item.id)}
                isOutlineButton={index === 1}
              />
            )}
          />
        </View>

        {/* Section 3: More Research Updates */}
        {filteredWork.length > 3 ? (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderWrapper}>
              <SectionHeader title="More Active Work" />
            </View>

            {filteredWork.slice(3).map((work) => {
              const researcherId = work.userId || work.researcherId || '';
              const author = getResearcherById(researcherId);
              const authorName = author ? author.name : work.authorName || 'CSE Researcher';
              const authorBatch = author ? author.batch || author.designation : work.authorBatch || 'CSE';
              const isLiked = likedWorkIds.has(work.id);
              const isBookmarked = bookmarkedWorkIds.has(work.id);
              const likeDelta = isLiked && !work.isLiked ? 1 : !isLiked && work.isLiked ? -1 : 0;

              return (
                <CurrentWorkCard
                  key={work.id}
                  work={{
                    ...work,
                    likesCount: Math.max(0, (work.likesCount || 0) + likeDelta),
                  }}
                  authorName={authorName}
                  authorBatch={authorBatch}
                  authorAvatar={author?.photoURL || author?.avatar}
                  isLiked={isLiked}
                  isBookmarked={isBookmarked}
                  onPress={() => router.push(`/(research)/${work.id}` as any)}
                  onAuthorPress={() =>
                    router.push(`/(profile)/${researcherId}` as any)
                  }
                  onTopicPress={(topicName) => {
                    const foundTopic = mockTopics.find(
                      (t) => t.name.toLowerCase() === topicName.toLowerCase()
                    );
                    if (foundTopic) setSelectedTopic(foundTopic);
                  }}
                  onLikePress={() => handleToggleLike(work.id)}
                  onBookmarkPress={() => handleToggleBookmark(work.id)}
                  onCommentPress={() => router.push(`/(research)/${work.id}` as any)}
                />
              );
            })}
          </View>
        ) : null}

        {/* Section 4: Recent Publications */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderWrapper}>
            <SectionHeader
              title="Recent Publications"
              actionLabel="Browse archive"
              onActionPress={() => router.push('/(tabs)/explore' as any)}
            />
          </View>

          {recentPublications.map((pub) => (
            <PublicationCard
              key={pub.id}
              publication={pub}
              onPress={() => router.push(`/(research)/${pub.id}` as any)}
              onExternalPress={() => {}}
              onTopicPress={(topicName) => {
                const foundTopic = mockTopics.find(
                  (t) => t.name.toLowerCase() === topicName.toLowerCase()
                );
                if (foundTopic) setSelectedTopic(foundTopic);
              }}
            />
          ))}
        </View>

        {/* Bottom padding */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  topicSection: {
    borderBottomWidth: 1,
    marginBottom: spacing.sm,
  },
  sectionContainer: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  sectionHeaderWrapper: {
    marginBottom: spacing.xs,
  },
  researchersSection: {
    marginTop: spacing.md,
    paddingVertical: spacing.xs,
  },
  researchersScrollList: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  emptyContainer: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.sm,
    ...shadows.subtle,
  },
  emptyTitle: {
    ...typography.titleSmall,
    marginBottom: 4,
  },
  emptySubtitle: {
    ...typography.bodySmall,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  clearFilterButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  clearFilterText: {
    ...typography.caption,
    fontFamily: fontFamilies.sansSemiBold,
  },
  bottomSpacer: {
    height: 40,
  },
});
