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
import { colors, spacing, radius, typography, fontFamilies, shadows } from '../../constants';
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
    <SafeAreaView style={styles.safeArea} edges={['top']}>
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
        style={styles.container}
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
        <View style={styles.topicSection}>
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
              actionLabel={selectedTopic ? 'Clear filter' : 'View all'}
              onActionPress={
                selectedTopic
                  ? () => setSelectedTopic(null)
                  : () => router.push('/(tabs)/explore' as any)
              }
            />
          </View>

          {filteredWork.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No research found</Text>
              <Text style={styles.emptySubtitle}>
                No current work matches "{selectedTopic?.name}".
              </Text>
              <TouchableOpacity
                onPress={() => setSelectedTopic(null)}
                style={styles.clearFilterButton}
              >
                <Text style={styles.clearFilterText}>Show all research</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredWork.slice(0, 3).map((work) => {
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
            })
          )}
        </View>

        {/* Section 2: Featured Researchers (Horizontal Carousel) */}
        <View style={styles.researchersSection}>
          <View style={styles.sectionHeaderWrapper}>
            <SectionHeader
              title="Researchers to Follow"
              actionLabel="See all"
              onActionPress={() => router.push('/(tabs)/explore' as any)}
            />
          </View>

          <FlatList
            horizontal
            data={featuredResearchers}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.researchersScrollList}
            renderItem={({ item }) => (
              <ResearcherCard
                researcher={item}
                connectionStatus={connectionStates[item.id] || item.connectionStatus || 'none'}
                onPress={() => router.push(`/(profile)/${item.id}` as any)}
                onConnectPress={() => handleToggleConnect(item.id)}
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
    backgroundColor: colors.surface,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  topicSection: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
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
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.sm,
    ...shadows.subtle,
  },
  emptyTitle: {
    ...typography.titleSmall,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  emptySubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  clearFilterButton: {
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  clearFilterText: {
    ...typography.caption,
    fontFamily: fontFamilies.sansSemiBold,
    color: colors.primary,
  },
  bottomSpacer: {
    height: 40,
  },
});
