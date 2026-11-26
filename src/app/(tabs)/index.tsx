import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { spacing, radius, typography, fontFamilies, shadows } from '../../constants';
import { useTheme } from '@/context/ThemeContext';
import { Topic } from '../../types';
import { TOPIC_TAXONOMY, topicCounts } from '@/utils/search';
import { useResearchDirectory } from '@/hooks/useResearchDirectory';
import { useConnections } from '@/hooks/useConnections';
import { useSavedItems } from '@/hooks/useSavedItems';
import { useAuth } from '@/context/AuthContext';
import { subscribePublishedFeed, toCurrentWork } from '@/services/research.service';
import { tagMatchKey } from '@/utils/researchWork';
import type { ResearchWork } from '@/types/research.types';
import { HomeHeader } from '../../components/home/HomeHeader';
import { TopicShortcutRow } from '../../components/home/TopicShortcutRow';
import { CurrentWorkCard } from '../../components/cards/CurrentWorkCard';
import { ResearcherCard } from '../../components/cards/ResearcherCard';
import { SectionHeader } from '../../components/common/SectionHeader';

export default function HomeFeedScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { firebaseUser, userProfile } = useAuth();
  // Feed listener only runs for an approved session (stops cleanly on sign-out)
  const feedEnabled = userProfile?.approvalStatus === 'approved';
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);

  // Live feed of published research work (Firestore `research_works`)
  const [feedWorks, setFeedWorks] = useState<ResearchWork[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [feedKey, setFeedKey] = useState(0);

  useEffect(() => {
    if (!feedEnabled) return;
    setFeedLoading(true);
    setFeedError(null);
    const unsubscribe = subscribePublishedFeed(
      (works) => {
        setFeedWorks(works);
        setFeedLoading(false);
        setFeedError(null);
        setRefreshing(false);
      },
      (err: any) => {
        setFeedLoading(false);
        setRefreshing(false);
        setFeedError(
          err?.code === 'failed-precondition'
            ? 'The feed index is still being prepared. Please try again shortly.'
            : 'Could not load the research feed. Pull down to retry.',
        );
      },
    );
    return unsubscribe;
  }, [feedKey, feedEnabled]);

  // Likes are local-only (no likes model in scope); bookmarks persist as Saved Items
  const [likedWorkIds, setLikedWorkIds] = useState<Set<string>>(() => new Set());
  const { isSaved, toggleSave } = useSavedItems();
  const directory = useResearchDirectory();
  const { cardStatus, handleConnectPress } = useConnections();

  // Researchers to follow: approved researchers you are not yet connected with
  const featuredResearchers = useMemo(
    () => directory.researchers.filter((r) => cardStatus(r.id) !== 'connected').slice(0, 10),
    [directory.researchers, cardStatus],
  );

  // Topic shortcuts with live counts from the loaded directory
  const liveTopics = useMemo(
    () =>
      TOPIC_TAXONOMY.map((t) =>
        topicCounts(t, { researchers: directory.researchers, works: directory.currentWorks }),
      ),
    [directory.researchers, directory.currentWorks],
  );

  // Filtered current work based on selected topic (tags like `#BanglaNLP` match "Bangla NLP")
  const filteredWork = useMemo(() => {
    if (!selectedTopic) return feedWorks;
    const topicKey = tagMatchKey(selectedTopic.name);
    return feedWorks.filter((work) => work.tags.some((t) => tagMatchKey(t) === topicKey));
  }, [feedWorks, selectedTopic]);

  // Re-subscribe to fetch a fresh snapshot
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setFeedKey((k) => k + 1);
  }, []);

  const handleAuthorPress = (authorUid: string) => {
    if (authorUid && authorUid === firebaseUser?.uid) {
      router.push('/(tabs)/profile' as any);
    } else {
      router.push(`/(profile)/${authorUid}` as any);
    }
  };

  const findTopicByTag = (tag: string) => {
    const key = tagMatchKey(tag);
    return liveTopics.find((t) => tagMatchKey(t.name) === key);
  };

  const renderWorkCard = (work: ResearchWork) => {
    const isLiked = likedWorkIds.has(work.id);
    const isBookmarked = isSaved(work.id);
    const dept = /computer science/i.test(work.authorDepartment) ? 'CSE' : work.authorDepartment || 'CSE';
    const card = toCurrentWork(work);
    return (
      <CurrentWorkCard
        key={work.id}
        work={{ ...card, likesCount: isLiked ? 1 : 0 }}
        authorName={work.authorName}
        authorBatch={dept}
        authorAvatar={work.authorPhotoURL}
        authorRole={work.authorDesignation || undefined}
        isLiked={isLiked}
        isBookmarked={isBookmarked}
        onPress={() => router.push(`/(research)/${work.id}` as any)}
        onAuthorPress={() => handleAuthorPress(work.authorUid)}
        onTopicPress={(tag) => {
          const foundTopic = findTopicByTag(tag);
          if (foundTopic) setSelectedTopic(foundTopic);
        }}
        onLikePress={() => handleToggleLike(work.id)}
        onBookmarkPress={() => toggleSave(work)}
        onCommentPress={() => router.push(`/(research)/${work.id}` as any)}
      />
    );
  };

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

  const handleTopicSelect = (topic: Topic) => {
    if (selectedTopic?.id === topic.id) {
      setSelectedTopic(null); // Deselect filter
    } else {
      setSelectedTopic(topic);
    }
  };

  return (
    <View style={[styles.safeArea, { backgroundColor: colors.surface }]}>
      {/* Header */}
      <HomeHeader
        onSearchPress={() => router.push('/(explore)/search' as any)}
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
            topics={liveTopics}
            selectedTopicId={selectedTopic?.id}
            onSelectTopic={handleTopicSelect}
          />
        </View>

        {/* Section 1: People are working on (Momentum Feed) */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderWrapper}>
            <SectionHeader
              title="People Are Working On"
              badge={{ text: 'Live feed', dotColor: colors.secondary }}
              actionLabel={selectedTopic ? 'Clear filter' : undefined}
              onActionPress={selectedTopic ? () => setSelectedTopic(null) : undefined}
            />
          </View>

          {feedLoading ? (
            <View style={[styles.emptyContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <ActivityIndicator color={colors.primary} />
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary, marginTop: spacing.sm, marginBottom: 0 }]}>
                Loading the research feed...
              </Text>
            </View>
          ) : feedError ? (
            <View style={[styles.emptyContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Feed unavailable</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>{feedError}</Text>
              <TouchableOpacity
                onPress={handleRefresh}
                style={[styles.clearFilterButton, { backgroundColor: colors.primaryMuted }]}
              >
                <Text style={[styles.clearFilterText, { color: colors.primary }]}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : filteredWork.length === 0 ? (
            <View
              style={[
                styles.emptyContainer,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                {selectedTopic ? 'No research found' : 'No research shared yet'}
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                {selectedTopic
                  ? `No current work matches "${selectedTopic.name}".`
                  : 'Be the first to share what you are working on.'}
              </Text>
              <TouchableOpacity
                onPress={() =>
                  selectedTopic ? setSelectedTopic(null) : router.push('/(tabs)/share' as any)
                }
                style={[styles.clearFilterButton, { backgroundColor: colors.primaryMuted }]}
              >
                <Text style={[styles.clearFilterText, { color: colors.primary }]}>
                  {selectedTopic ? 'Show all research' : 'Share your work'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredWork.slice(0, 3).map(renderWorkCard)
          )}
        </View>

        {/* Section 2: Featured Researchers (Horizontal Carousel) */}
        <View style={styles.researchersSection}>
          <View style={styles.sectionHeaderWrapper}>
            <SectionHeader
              title="Researchers To Follow"
              indicatorColor="#FF7145"
              actionLabel="Discover"
              onActionPress={() => router.push('/(tabs)/explore' as any)}
            />
          </View>

          {directory.loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.md }} />
          ) : featuredResearchers.length === 0 ? (
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary, paddingHorizontal: spacing.md }]}>
              {directory.researchers.length === 0
                ? 'No other approved researchers yet.'
                : "You're connected with everyone in the directory."}
            </Text>
          ) : (
            <FlatList
              horizontal
              data={featuredResearchers}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.researchersScrollList}
              renderItem={({ item }) => (
                <ResearcherCard
                  researcher={item}
                  connectionStatus={cardStatus(item.id)}
                  onPress={() => router.push(`/(profile)/${item.id}` as any)}
                  onConnectPress={() => {
                    const profile = directory.profileByUid.get(item.id);
                    if (profile) handleConnectPress(profile);
                  }}
                />
              )}
            />
          )}
        </View>

        {/* Section 3: More Research Updates */}
        {!feedLoading && !feedError && filteredWork.length > 3 ? (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderWrapper}>
              <SectionHeader title="More Active Work" />
            </View>

            {filteredWork.slice(3).map(renderWorkCard)}
          </View>
        ) : null}

        {/* Bottom padding */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
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
    paddingBottom: 32,
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
    marginBottom: 0,
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
    height: 16,
  },
});
