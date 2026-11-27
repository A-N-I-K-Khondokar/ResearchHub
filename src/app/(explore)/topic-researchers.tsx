import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { COMPACT_FONT_SCALE } from '@/constants/typography';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Filter, ArrowUpDown } from 'lucide-react-native';
import { spacing, radius, typography, fontFamilies, shadows } from '@/constants';
import { useTheme } from '@/context/ThemeContext';
import { SectionHeader } from '@/components/common/SectionHeader';
import { PersonRow } from '@/components/search/SearchRows';
import { CurrentWorkCard } from '@/components/cards/CurrentWorkCard';
import { EmptyState } from '@/components/feedback/EmptyState';
import { getTopicDiscovery } from '@/utils/search';
import { useResearchDirectory } from '@/hooks/useResearchDirectory';
import { useConnections } from '@/hooks/useConnections';
import { useCollaborate } from '@/hooks/useCollaborate';
import { SkeletonList } from '@/components/feedback/Skeleton';
import { useAuth } from '@/context/AuthContext';
import { ActivityIndicator } from 'react-native';
import { tagMatchKey } from '@/utils/researchWork';

type RoleFilter = 'all' | 'faculty' | 'students';
type SortOption = 'relevance' | 'name' | 'activity';

export default function TopicResearchersScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const params = useLocalSearchParams<{ topic?: string }>();
  const topicName = params.topic || 'Machine Learning';

  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const { firebaseUser } = useAuth();
  const directory = useResearchDirectory();
  const { cardStatus, handleConnectPress } = useConnections();
  const collaborate = useCollaborate();

  const discoveryData = useMemo(() => {
    return getTopicDiscovery(topicName, {
      researchers: directory.researchers,
      works: directory.currentWorks,
    });
  }, [topicName, directory.researchers, directory.currentWorks]);

  const openTopic = (t: string) => {
    if (tagMatchKey(t) !== tagMatchKey(discoveryData.topic.name)) {
      router.push({
        pathname: '/(explore)/topic-researchers' as any,
        params: { topic: t },
      });
    }
  };

  const openAuthor = (uid: string) => {
    router.push((uid === firebaseUser?.uid ? '/(tabs)/profile' : `/(profile)/${uid}`) as any);
  };

  // Filter researchers by role (Faculty vs Students)
  const filteredResearchers = useMemo(() => {
    let list = discoveryData.researchers;

    if (roleFilter === 'faculty') {
      list = list.filter(
        (r) => r.batch?.toLowerCase().includes('faculty') || r.designation?.toLowerCase().includes('professor')
      );
    } else if (roleFilter === 'students') {
      list = list.filter(
        (r) => !r.batch?.toLowerCase().includes('faculty') && !r.designation?.toLowerCase().includes('professor')
      );
    }

    if (sortBy === 'name') {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    }

    return list;
  }, [discoveryData.researchers, roleFilter, sortBy]);

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.surface }]}
      edges={['top']}
    >
      {/* Shared inner-screen header */}
      <ScreenHeader
        title="Research topic"
        subtitle={`${discoveryData.researchers.length} researcher${discoveryData.researchers.length === 1 ? '' : 's'} · ${discoveryData.topic.name}`}
      />

      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Topic Title & Description */}
        <View style={styles.topicHero}>
          <Text style={[styles.topicTitle, { color: colors.textPrimary }]}>{discoveryData.topic.name}</Text>
          <Text style={[styles.topicDescription, { color: colors.textSecondary }]}>
            {discoveryData.topic.description ||
              `Researchers and active investigations in ${discoveryData.topic.name} within the CSE department.`}
          </Text>
        </View>

        {/* Sub-Filters & Controls */}
        <View style={styles.controlsBar}>
          <View style={styles.roleFilters}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setRoleFilter('all')}
              style={[
                styles.rolePill,
                {
                  backgroundColor: roleFilter === 'all' ? colors.primaryMuted : colors.surface,
                  borderColor: roleFilter === 'all' ? colors.primary : colors.border,
                },
              ]}
            >
              <Text maxFontSizeMultiplier={COMPACT_FONT_SCALE}
                style={[
                  styles.roleText,
                  {
                    color: roleFilter === 'all' ? colors.primary : colors.textSecondary,
                  },
                  roleFilter === 'all' && styles.roleTextActive,
                ]}
              >
                All ({discoveryData.researchers.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setRoleFilter('faculty')}
              style={[
                styles.rolePill,
                {
                  backgroundColor: roleFilter === 'faculty' ? colors.primaryMuted : colors.surface,
                  borderColor: roleFilter === 'faculty' ? colors.primary : colors.border,
                },
              ]}
            >
              <Text maxFontSizeMultiplier={COMPACT_FONT_SCALE}
                style={[
                  styles.roleText,
                  {
                    color: roleFilter === 'faculty' ? colors.primary : colors.textSecondary,
                  },
                  roleFilter === 'faculty' && styles.roleTextActive,
                ]}
              >
                Faculty
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setRoleFilter('students')}
              style={[
                styles.rolePill,
                {
                  backgroundColor: roleFilter === 'students' ? colors.primaryMuted : colors.surface,
                  borderColor: roleFilter === 'students' ? colors.primary : colors.border,
                },
              ]}
            >
              <Text maxFontSizeMultiplier={COMPACT_FONT_SCALE}
                style={[
                  styles.roleText,
                  {
                    color: roleFilter === 'students' ? colors.primary : colors.textSecondary,
                  },
                  roleFilter === 'students' && styles.roleTextActive,
                ]}
              >
                Students
              </Text>
            </TouchableOpacity>
          </View>

          {/* Sort Switcher Button */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setSortBy((prev) => (prev === 'relevance' ? 'name' : 'relevance'))}
            style={[
              styles.sortButton,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <ArrowUpDown size={14} color={colors.primary} />
            <Text maxFontSizeMultiplier={COMPACT_FONT_SCALE} style={[styles.sortButtonText, { color: colors.primary }]}>
              {sortBy === 'name' ? 'Name (A-Z)' : 'Most Relevant'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 1. RESEARCHERS (Who's Working On This) */}
        <View style={styles.section}>
          <SectionHeader
            title="Who's Working On This?"
            subtitle={`${filteredResearchers.length} researchers exploring this area`}
          />

          {directory.loading ? (
            <SkeletonList count={3} variant="row" />
          ) : filteredResearchers.length === 0 ? (
            <EmptyState
              title="No researchers found"
              description={`No ${roleFilter} currently listed under ${discoveryData.topic.name}.`}
              actionLabel="Show All Researchers"
              onActionPress={() => setRoleFilter('all')}
            />
          ) : (
            filteredResearchers.map((researcher) => {
              const matchingWork =
                discoveryData.currentWorks.find((w) => w.userId === researcher.id) ||
                directory.currentWorks.find((w) => w.id === researcher.currentWorkIds?.[0]) ||
                null;

              return (
                <PersonRow
                  key={researcher.id}
                  person={researcher}
                  terms={[]}
                  reason={matchingWork ? `Working on “${matchingWork.title}”` : `Interested in ${discoveryData.topic.name}`}
                  status={cardStatus(researcher.id)}
                  onPress={() => openAuthor(researcher.id)}
                  onConnect={() => {
                    const profile = directory.profileByUid.get(researcher.id);
                    if (profile) handleConnectPress(profile);
                  }}
                />
              );
            })
          )}
        </View>

        {/* 2. ACTIVE CURRENT WORK IN THIS TOPIC */}
        {discoveryData.currentWorks.length > 0 && (
          <View style={styles.section}>
            <SectionHeader
              title={`Active Projects in ${discoveryData.topic.name}`}
              subtitle={`${discoveryData.currentWorks.length} ongoing studies & thesis projects`}
            />

            {discoveryData.currentWorks.map((work) => (
              <CurrentWorkCard
                key={work.id}
                work={work}
                authorName={work.authorName}
                authorBatch="CSE"
                authorRole={work.authorDesignation}
                authorAvatar={work.authorPhotoURL}
                onPress={() => router.push(`/(research)/${work.id}` as any)}
                onAuthorPress={() => openAuthor(work.userId)}
                {...collaborate(work)}
                onTopicPress={openTopic}
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
  header: {
    borderBottomWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  backButtonText: {
    ...typography.caption,
    fontFamily: fontFamilies.sansSemiBold,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  topicHero: {
    marginBottom: spacing.md,
  },
  topicTitle: {
    ...typography.display,
    marginBottom: 4,
  },
  topicDescription: {
    ...typography.body,
  },
  controlsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  roleFilters: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  rolePill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    minHeight: 32,
    justifyContent: 'center',
  },
  roleText: {
    ...typography.caption,
    fontFamily: fontFamilies.sansMedium,
  },
  roleTextActive: {
    fontFamily: fontFamilies.sansSemiBold,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: radius.button,
    height: spacing.compactButtonHeight,
  },
  sortButtonText: { ...typography.buttonSmall },
  section: {
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  bottomSpacer: {
    height: 48,
  },
});
