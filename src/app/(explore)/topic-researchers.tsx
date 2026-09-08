import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Users, Sparkles, Filter, ArrowUpDown } from 'lucide-react-native';
import { colors, spacing, radius, typography, fontFamilies, shadows } from '@/constants';
import { SectionHeader } from '@/components/common/SectionHeader';
import { ResearcherDiscoveryCard } from '@/components/cards/ResearcherDiscoveryCard';
import { CurrentWorkCard } from '@/components/cards/CurrentWorkCard';
import { PublicationCard } from '@/components/cards/PublicationCard';
import { EmptyState } from '@/components/feedback/EmptyState';
import { getTopicDiscovery } from '@/utils/search';
import { getCurrentWorkById, getResearcherById, mockResearchers } from '@/data';
import { UserProfile } from '@/types';

type RoleFilter = 'all' | 'faculty' | 'students';
type SortOption = 'relevance' | 'name' | 'activity';

export default function TopicResearchersScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ topic?: string }>();
  const topicName = params.topic || 'Machine Learning';

  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [connectionStates, setConnectionStates] = useState<Record<string, 'none' | 'pending' | 'connected'>>(() => {
    const initial: Record<string, 'none' | 'pending' | 'connected'> = {};
    mockResearchers.forEach((r) => {
      initial[r.id] = r.connectionStatus || 'none';
    });
    return initial;
  });

  const discoveryData = useMemo(() => {
    return getTopicDiscovery(topicName);
  }, [topicName]);

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

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Top App Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityLabel="Back to Explore"
          accessibilityRole="button"
        >
          <ArrowLeft size={22} color={colors.textPrimary} />
          <Text style={styles.backButtonText}>Explore</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Topic Title & Description */}
        <View style={styles.topicHero}>
          <Text style={styles.topicTitle}>{discoveryData.topic.name}</Text>
          <Text style={styles.topicDescription}>
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
              style={[styles.rolePill, roleFilter === 'all' && styles.rolePillActive]}
            >
              <Text style={[styles.roleText, roleFilter === 'all' && styles.roleTextActive]}>
                All ({discoveryData.researchers.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setRoleFilter('faculty')}
              style={[styles.rolePill, roleFilter === 'faculty' && styles.rolePillActive]}
            >
              <Text style={[styles.roleText, roleFilter === 'faculty' && styles.roleTextActive]}>
                Faculty
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setRoleFilter('students')}
              style={[styles.rolePill, roleFilter === 'students' && styles.rolePillActive]}
            >
              <Text style={[styles.roleText, roleFilter === 'students' && styles.roleTextActive]}>
                Students
              </Text>
            </TouchableOpacity>
          </View>

          {/* Sort Switcher Button */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setSortBy((prev) => (prev === 'relevance' ? 'name' : 'relevance'))}
            style={styles.sortButton}
          >
            <ArrowUpDown size={14} color={colors.primary} />
            <Text style={styles.sortButtonText}>
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

          {filteredResearchers.length === 0 ? (
            <EmptyState
              title="No researchers found"
              description={`No ${roleFilter} currently listed under ${discoveryData.topic.name}.`}
              actionLabel="Show All Researchers"
              onActionPress={() => setRoleFilter('all')}
            />
          ) : (
            filteredResearchers.map((researcher) => {
              const matchingWork = discoveryData.currentWorks.find(
                (w) => (w.userId || w.researcherId) === researcher.id
              ) || (researcher.currentWorkIds?.[0] ? getCurrentWorkById(researcher.currentWorkIds[0]) : null);

              return (
                <ResearcherDiscoveryCard
                  key={researcher.id}
                  researcher={researcher}
                  currentWork={matchingWork}
                  connectionStatus={connectionStates[researcher.id] || researcher.connectionStatus || 'none'}
                  onPress={() => router.push(`/(profile)/${researcher.id}` as any)}
                  onConnectPress={() => handleToggleConnect(researcher.id)}
                  onTopicPress={(t) => {
                    if (t.toLowerCase() !== topicName.toLowerCase()) {
                      router.push({
                        pathname: '/(explore)/topic-researchers' as any,
                        params: { topic: t },
                      });
                    }
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

            {discoveryData.currentWorks.map((work) => {
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
                  onTopicPress={(t) => {
                    if (t.toLowerCase() !== topicName.toLowerCase()) {
                      router.push({
                        pathname: '/(explore)/topic-researchers' as any,
                        params: { topic: t },
                      });
                    }
                  }}
                />
              );
            })}
          </View>
        )}

        {/* 3. PREVIOUS PUBLICATIONS IN THIS TOPIC */}
        {discoveryData.publications.length > 0 && (
          <View style={styles.section}>
            <SectionHeader
              title={`Published Research in ${discoveryData.topic.name}`}
              subtitle={`${discoveryData.publications.length} conference & journal records`}
            />

            {discoveryData.publications.map((pub) => (
              <PublicationCard
                key={pub.id}
                publication={pub}
                onPress={() => router.push(`/(research)/${pub.id}` as any)}
                onExternalPress={() => {}}
                onTopicPress={(t) => {
                  if (t.toLowerCase() !== topicName.toLowerCase()) {
                    router.push({
                      pathname: '/(explore)/topic-researchers' as any,
                      params: { topic: t },
                    });
                  }
                }}
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
    backgroundColor: colors.surface,
  },
  header: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
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
    color: colors.primary,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    fontSize: 28,
    lineHeight: 34,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  topicDescription: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 20,
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
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  rolePillActive: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
  },
  roleText: {
    ...typography.caption,
    fontFamily: fontFamilies.sansMedium,
    color: colors.textSecondary,
  },
  roleTextActive: {
    color: colors.primary,
    fontFamily: fontFamilies.sansSemiBold,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: radius.sm,
  },
  sortButtonText: {
    ...typography.caption,
    fontFamily: fontFamilies.sansMedium,
    color: colors.primary,
  },
  section: {
    marginBottom: spacing.lg,
  },
  bottomSpacer: {
    height: 48,
  },
});
