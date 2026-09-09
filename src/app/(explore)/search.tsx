import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Search, Users, Sparkles, BookOpen, Layers } from 'lucide-react-native';
import { spacing, radius, typography, fontFamilies, shadows } from '@/constants';
import { useTheme } from '@/context/ThemeContext';
import { SearchBar } from '@/components/common/SearchBar';
import { SectionHeader } from '@/components/common/SectionHeader';
import { TopicChip } from '@/components/common/TopicChip';
import { ResearcherDiscoveryCard } from '@/components/cards/ResearcherDiscoveryCard';
import { CurrentWorkCard } from '@/components/cards/CurrentWorkCard';
import { PublicationCard } from '@/components/cards/PublicationCard';
import { EmptyState } from '@/components/feedback/EmptyState';
import { searchHub, SearchCategory } from '@/utils/search';
import { getResearcherById, getCurrentWorkById, mockTopics } from '@/data';

export default function GlobalSearchScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const params = useLocalSearchParams<{ q?: string; category?: string }>();

  const [query, setQuery] = useState(params.q || '');
  const [selectedCategory, setSelectedCategory] = useState<SearchCategory>(
    (params.category as SearchCategory) || 'all'
  );

  const [connectionStates, setConnectionStates] = useState<Record<string, 'none' | 'pending' | 'connected'>>({});

  useEffect(() => {
    if (params.q) {
      setQuery(params.q);
    }
    if (params.category) {
      setSelectedCategory(params.category as SearchCategory);
    }
  }, [params.q, params.category]);

  const searchResults = useMemo(() => {
    return searchHub(query, selectedCategory);
  }, [query, selectedCategory]);

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

  const handleTopicPress = (topicName: string) => {
    router.push({
      pathname: '/(explore)/topic-researchers' as any,
      params: { topic: topicName },
    });
  };

  const categories: { key: SearchCategory; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'people', label: 'People' },
    { key: 'currentWork', label: 'Current Work' },
    { key: 'publications', label: 'Research' },
    { key: 'topics', label: 'Topics' },
  ];

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.surface }]}
      edges={['top']}
    >
      {/* Header Search Bar */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.borderSubtle,
          },
        ]}
      >
        <View style={styles.searchRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <ArrowLeft size={22} color={colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.searchContainer}>
            <SearchBar
              value={query}
              onChangeText={setQuery}
              placeholder="Search researchers, topics, or research"
              autoFocus={!params.q}
              onClear={() => setQuery('')}
            />
          </View>
        </View>

        {/* Category Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.key;
            return (
              <TouchableOpacity
                key={cat.key}
                activeOpacity={0.8}
                onPress={() => setSelectedCategory(cat.key)}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: isSelected ? colors.primaryMuted : colors.surface,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
              >
                <Text
                  style={[
                    styles.categoryText,
                    {
                      color: isSelected ? colors.primary : colors.textSecondary,
                    },
                    isSelected && styles.categoryTextSelected,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Results Content */}
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {query.trim().length === 0 ? (
          /* Initial State / Suggested Topics */
          <View
            style={[
              styles.suggestedContainer,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.suggestedTitle, { color: colors.textPrimary }]}>Explore by Research Topic</Text>
            <Text style={[styles.suggestedSubtitle, { color: colors.textSecondary }]}>
              Tap any topic to discover active projects and researchers
            </Text>

            <View style={styles.topicGrid}>
              {mockTopics.map((t) => (
                <TopicChip
                  key={t.id}
                  label={t.name}
                  variant="teal"
                  count={t.researchersCount}
                  onPress={() => handleTopicPress(t.name)}
                  style={styles.topicChip}
                />
              ))}
            </View>
          </View>
        ) : searchResults.totalCount === 0 ? (
          /* Zero Results State */
          <EmptyState
            title="No results found"
            description={`We couldn't find any researchers, current work, or papers matching "${query}". Try checking your spelling or searching for broader keywords.`}
            actionLabel="Clear Search"
            onActionPress={() => setQuery('')}
          />
        ) : (
          /* Results Feed */
          <View style={styles.resultsFeed}>
            {/* Results Summary Counter */}
            <View style={styles.summaryBar}>
              <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
                Showing <Text style={[styles.summaryHighlight, { color: colors.textPrimary }]}>{searchResults.totalCount}</Text> {searchResults.totalCount === 1 ? 'result' : 'results'} for "{query}"
              </Text>
            </View>

            {/* 1. TOPICS MATCHES */}
            {searchResults.topics.length > 0 && (
              <View style={styles.resultSection}>
                <SectionHeader
                  title="Matching Topics"
                  subtitle={`${searchResults.topics.length} related research areas`}
                />
                <View style={styles.topicGrid}>
                  {searchResults.topics.map((t) => (
                    <TopicChip
                      key={t.id}
                      label={t.name}
                      variant="primary"
                      count={t.researchersCount}
                      onPress={() => handleTopicPress(t.name)}
                      style={styles.topicChip}
                    />
                  ))}
                </View>
              </View>
            )}

            {/* 2. PEOPLE / RESEARCHERS */}
            {searchResults.people.length > 0 && (
              <View style={styles.resultSection}>
                <SectionHeader
                  title="Researchers"
                  subtitle={`${searchResults.people.length} found`}
                />
                {searchResults.people.map((person) => {
                  const primaryWorkId = person.currentWorkIds?.[0];
                  const primaryWork = primaryWorkId ? getCurrentWorkById(primaryWorkId) : null;

                  return (
                    <ResearcherDiscoveryCard
                      key={person.id}
                      researcher={person}
                      currentWork={primaryWork}
                      connectionStatus={connectionStates[person.id] || person.connectionStatus || 'none'}
                      onPress={() => router.push(`/(profile)/${person.id}` as any)}
                      onConnectPress={() => handleToggleConnect(person.id)}
                      onTopicPress={(topic) => handleTopicPress(topic)}
                    />
                  );
                })}
              </View>
            )}

            {/* 3. CURRENT WORK */}
            {searchResults.currentWork.length > 0 && (
              <View style={styles.resultSection}>
                <SectionHeader
                  title="Current Research Work"
                  subtitle={`${searchResults.currentWork.length} active projects`}
                />
                {searchResults.currentWork.map((work) => {
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

            {/* 4. PREVIOUS RESEARCH (PUBLICATIONS) */}
            {searchResults.publications.length > 0 && (
              <View style={styles.resultSection}>
                <SectionHeader
                  title="Previous Research & Papers"
                  subtitle={`${searchResults.publications.length} published records`}
                />
                {searchResults.publications.map((pub) => (
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
  header: {
    borderBottomWidth: 1,
    paddingTop: spacing.xs,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.xs,
    gap: spacing.xs,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  categoryScroll: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    gap: spacing.xs,
  },
  categoryChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  categoryText: {
    ...typography.caption,
    fontFamily: fontFamilies.sansMedium,
  },
  categoryTextSelected: {
    fontFamily: fontFamilies.sansSemiBold,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  suggestedContainer: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    ...shadows.card,
  },
  suggestedTitle: {
    ...typography.title,
    marginBottom: 2,
  },
  suggestedSubtitle: {
    ...typography.caption,
    marginBottom: spacing.md,
  },
  topicGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs + 2,
  },
  topicChip: {
    marginBottom: spacing.xs,
  },
  resultsFeed: {
    gap: spacing.md,
  },
  summaryBar: {
    marginBottom: spacing.xs,
  },
  summaryText: {
    ...typography.caption,
  },
  summaryHighlight: {
    fontWeight: '700',
  },
  resultSection: {
    marginBottom: spacing.sm,
  },
  bottomSpacer: {
    height: 48,
  },
});
