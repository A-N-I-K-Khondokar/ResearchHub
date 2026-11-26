import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BookOpen, Layers, Calendar, ExternalLink, Trash2, Bookmark, Users, UserPlus, Check, Clock, User } from 'lucide-react-native';
import { spacing, radius, typography, fontFamilies } from '../../constants';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { Avatar } from '../../components/common/Avatar';
import { ScreenHeader } from '../../components/layout/ScreenHeader';
import { DetailSkeleton } from '../../components/feedback/Skeleton';
import { Button } from '../../components/common/Button';
import {
  getResearchWork,
  deleteResearchWork,
  formatWorkDate,
  getPublishedWorksByAuthor,
} from '@/services/research.service';
import { getPublicProfile } from '@/services/user.service';
import { RESEARCH_STAGE_IDS, type ResearchWork } from '@/types/research.types';
import type { PublicProfile } from '@/types/user.types';
import { useConnections } from '@/hooks/useConnections';
import { useToast } from '@/context/ToastContext';
import { WorkList } from '@/components/profile';
import { useCollaborate } from '@/hooks/useCollaborate';
import { useSavedItems } from '@/hooks/useSavedItems';
import { confirmAction } from '@/utils/dialogs';

type LoadState = 'loading' | 'ready' | 'not-found' | 'error';

export default function ResearchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { firebaseUser } = useAuth();

  const [work, setWork] = useState<ResearchWork | null>(null);
  const [state, setState] = useState<LoadState>('loading');
  const [isDeleting, setIsDeleting] = useState(false);
  const { isSaved, toggleSave } = useSavedItems();
  const { relationship, handleConnectPress, busyUid } = useConnections();
  const toast = useToast();
  const collaborate = useCollaborate();
  const [author, setAuthor] = useState<PublicProfile | null>(null);
  const [moreWorks, setMoreWorks] = useState<ResearchWork[]>([]);

  const load = useCallback(async () => {
    if (!id) {
      setState('not-found');
      return;
    }
    setState('loading');
    try {
      const result = await getResearchWork(id);
      setWork(result);
      setState(result ? 'ready' : 'not-found');
      if (result) {
        // Secondary data (non-blocking): author card + "More from this researcher"
        Promise.all([
          getPublicProfile(result.authorUid).catch(() => null),
          getPublishedWorksByAuthor(result.authorUid).catch(() => [] as ResearchWork[]),
        ]).then(([profile, works]) => {
          setAuthor(profile);
          setMoreWorks(works.filter((w) => w.id !== result.id).slice(0, 3));
        });
      }
    } catch (err: any) {
      // Unknown / legacy IDs and inaccessible drafts are denied by the rules.
      setState(err?.code === 'permission-denied' ? 'not-found' : 'error');
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const isOwner = Boolean(work && firebaseUser && work.authorUid === firebaseUser.uid);

  const handleOpenLink = (url: string) => {
    Linking.openURL(url).catch(() => toast.show('Unable to open this link', 'error'));
  };

  const handleAuthorPress = () => {
    if (!work) return;
    router.push((isOwner ? '/(tabs)/profile' : `/(profile)/${work.authorUid}`) as any);
  };

  const handleDelete = async () => {
    if (!work) return;
    const ok = await confirmAction({
      title: 'Delete research update?',
      message: 'This permanently removes it from the feed.',
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    setIsDeleting(true);
    try {
      await deleteResearchWork(work.id);
      toast.show('Update deleted', 'info');
      router.back();
    } catch {
      setIsDeleting(false);
      toast.show('Could not delete this update. Please try again.', 'error');
    }
  };

  const renderStatus = () => {
    if (state === 'loading') {
      return <DetailSkeleton />;
    }
    return (
      <View style={styles.centered}>
        <View style={[styles.iconContainer, { backgroundColor: colors.primaryMuted }]}>
          <BookOpen size={36} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.textPrimary, textAlign: 'center' }]}>
          {state === 'not-found' ? 'Research not available' : 'Something went wrong'}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {state === 'not-found'
            ? 'This update may have been removed, or it is not shared with you.'
            : 'We could not load this research update. Check your connection and try again.'}
        </Text>
        {state === 'error' ? (
          <Button label="Retry" onPress={load} variant="outline" size="md" />
        ) : null}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <ScreenHeader
        title="Research Details"
        right={
          state === 'ready' && work && work.status === 'published' ? (
            <TouchableOpacity
              onPress={() => toggleSave(work)}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel={isSaved(work.id) ? 'Remove from saved items' : 'Save research'}
            >
              <Bookmark
                size={20}
                color={isSaved(work.id) ? colors.primary : colors.textPrimary}
                fill={isSaved(work.id) ? colors.primary : 'transparent'}
              />
            </TouchableOpacity>
          ) : null
        }
      />

      {state !== 'ready' || !work ? (
        renderStatus()
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Author */}
          <TouchableOpacity activeOpacity={0.8} onPress={handleAuthorPress} style={styles.authorRow}>
            <Avatar name={work.authorName} uri={work.authorPhotoURL} size="md" />
            <View style={styles.authorInfo}>
              <Text style={[styles.authorName, { color: colors.textPrimary }]} numberOfLines={1}>
                {work.authorName}
              </Text>
              <Text style={[styles.authorMeta, { color: colors.textSecondary }]} numberOfLines={1}>
                {[work.authorDesignation, work.authorDepartment].filter(Boolean).join(' • ')}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Title & meta */}
          {work.postType === 'collaboration' ? (
            <View style={[styles.collabBadge, { backgroundColor: colors.primaryMuted }]}>
              <Users size={13} color={colors.primary} />
              <Text style={[styles.collabBadgeText, { color: colors.primary }]}>Looking for collaborators</Text>
            </View>
          ) : null}
          <Text style={[styles.title, { color: colors.textPrimary }]}>{work.title}</Text>

          <View style={styles.metaRow}>
            <View style={[styles.metaPill, { backgroundColor: colors.primaryMuted }]}>
              <Layers size={13} color={colors.primary} />
              <Text style={[styles.metaPillText, { color: colors.primary }]}>{work.stage}</Text>
            </View>
            <View style={styles.metaItem}>
              <Calendar size={13} color={colors.textSecondary} />
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                {formatWorkDate(work.createdAt)}
              </Text>
            </View>
            {work.status === 'draft' ? (
              <View style={[styles.metaPill, { backgroundColor: colors.surfaceSubtle }]}>
                <Text style={[styles.metaPillText, { color: colors.textMuted }]}>Draft</Text>
              </View>
            ) : null}
          </View>

          {/* Stage stepper */}
          <View style={styles.stepper} accessibilityLabel={`Research stage: ${work.stage}`}>
            {RESEARCH_STAGE_IDS.map((stageId, index) => {
              const current = RESEARCH_STAGE_IDS.indexOf(work.stage);
              const reached = index <= current;
              return (
                <React.Fragment key={stageId}>
                  {index > 0 ? (
                    <View style={[styles.stepLine, { backgroundColor: index <= current ? colors.primary : colors.borderSubtle }]} />
                  ) : null}
                  <View style={styles.step}>
                    <View
                      style={[
                        styles.stepDot,
                        reached
                          ? { backgroundColor: colors.primary, borderColor: colors.primary }
                          : { backgroundColor: colors.surface, borderColor: colors.border },
                      ]}
                    >
                      {index < current ? <Check size={11} color="#FFFFFF" strokeWidth={3} /> : null}
                    </View>
                    <Text
                      style={[
                        styles.stepLabel,
                        { color: index === current ? colors.primary : colors.textSecondary },
                        index === current && { fontFamily: fontFamilies.sansSemiBold },
                      ]}
                      numberOfLines={2}
                    >
                      {stageId}
                    </Text>
                  </View>
                </React.Fragment>
              );
            })}
          </View>

          {/* Description */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
            <Text style={[styles.description, { color: colors.textPrimary }]}>{work.description}</Text>
          </View>

          {/* Tags */}
          {work.tags.length > 0 ? (
            <View style={styles.tagsRow}>
              {work.tags.map((tag) => (
                <View
                  key={tag}
                  style={[styles.tag, { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderSubtle }]}
                >
                  <Text style={[styles.tagText, { color: colors.textSecondary }]} numberOfLines={1}>
                    {tag}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          {/* Looking for (collaboration) */}
          {work.postType === 'collaboration' && work.lookingFor.length > 0 ? (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.primaryLight }]}>
              <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>Looking for</Text>
              <View style={styles.tagsRow}>
                {work.lookingFor.map((role) => (
                  <View key={role} style={[styles.tag, { backgroundColor: colors.primaryMuted, borderColor: colors.primaryLight }]}>
                    <Text style={[styles.tagText, { color: colors.primary, fontFamily: fontFamilies.sansSemiBold }]} numberOfLines={1}>
                      {role}
                    </Text>
                  </View>
                ))}
              </View>
              {(() => {
                const action = collaborate(work, author);
                if (isOwner) {
                  return (
                    <Text style={[styles.metaText, { color: colors.textSecondary, marginTop: spacing.sm }]}>
                      This is your collaboration post. Interested researchers will send you a connection request — check Notifications.
                    </Text>
                  );
                }
                if (!action.onCollaboratePress) return null;
                return (
                  <TouchableOpacity
                    onPress={action.onCollaboratePress}
                    disabled={action.collaborateDisabled}
                    style={[
                      styles.authorButton,
                      { marginTop: spacing.md },
                      action.collaborateDisabled
                        ? { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderSubtle }
                        : { backgroundColor: colors.primary, borderColor: colors.primary },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={action.collaborateLabel}
                  >
                    <UserPlus size={15} color={action.collaborateDisabled ? colors.textMuted : '#FFFFFF'} />
                    <Text style={[styles.authorButtonText, { color: action.collaborateDisabled ? colors.textMuted : '#FFFFFF' }]}>
                      {action.collaborateLabel}
                    </Text>
                  </TouchableOpacity>
                );
              })()}
            </View>
          ) : null}

          {/* External link */}
          {work.externalUrl ? (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleOpenLink(work.externalUrl!)}
              style={[styles.linkRow, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}
              accessibilityRole="link"
            >
              <ExternalLink size={16} color={colors.primary} />
              <Text style={[styles.linkText, { color: colors.primary }]} numberOfLines={1}>
                {work.externalUrl}
              </Text>
            </TouchableOpacity>
          ) : null}

          {/* About the researcher */}
          {!isOwner && author ? (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
              <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>About the researcher</Text>
              <View style={styles.authorRow}>
                <Avatar name={author.displayName} uri={author.photoURL} size="md" />
                <View style={styles.authorInfo}>
                  <Text style={[styles.authorName, { color: colors.textPrimary }]} numberOfLines={1}>
                    {author.displayName}
                  </Text>
                  <Text style={[styles.authorMeta, { color: colors.textSecondary }]} numberOfLines={1}>
                    {[author.designation, author.department].filter(Boolean).join(' • ')}
                  </Text>
                </View>
              </View>
              {author.bio ? (
                <Text style={[styles.metaText, { color: colors.textSecondary, marginBottom: spacing.sm }]} numberOfLines={3}>
                  {author.bio}
                </Text>
              ) : null}
              <View style={styles.authorActions}>
                <TouchableOpacity
                  onPress={handleAuthorPress}
                  style={[styles.authorButton, { borderColor: colors.border, backgroundColor: colors.surface }]}
                  accessibilityRole="button"
                >
                  <User size={15} color={colors.textPrimary} />
                  <Text style={[styles.authorButtonText, { color: colors.textPrimary }]}>View profile</Text>
                </TouchableOpacity>
                {(() => {
                  const rel = relationship(author.uid).state;
                  const busy = busyUid === author.uid;
                  const filled = rel === 'none' || rel === 'incoming';
                  const label =
                    rel === 'connected' ? 'Connected'
                    : rel === 'outgoing' ? 'Request sent'
                    : rel === 'incoming' ? 'Respond'
                    : rel === 'rejected' ? 'Declined'
                    : work.postType === 'collaboration' ? "I'm interested" : 'Connect';
                  const Icon = rel === 'connected' ? Check : rel === 'outgoing' || rel === 'rejected' ? Clock : UserPlus;
                  return (
                    <TouchableOpacity
                      onPress={() => handleConnectPress(author)}
                      disabled={busy}
                      style={[
                        styles.authorButton,
                        filled
                          ? { backgroundColor: colors.primary, borderColor: colors.primary }
                          : { backgroundColor: colors.primaryMuted, borderColor: colors.primaryLight },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={label}
                    >
                      <Icon size={15} color={filled ? '#FFFFFF' : colors.primary} />
                      <Text style={[styles.authorButtonText, { color: filled ? '#FFFFFF' : colors.primary }]}>{label}</Text>
                    </TouchableOpacity>
                  );
                })()}
              </View>
            </View>
          ) : null}

          {/* More from this researcher */}
          {moreWorks.length > 0 ? (
            <View style={styles.moreSection}>
              <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>
                More from {isOwner ? 'you' : work.authorName.split(' ')[0]}
              </Text>
              <WorkList works={moreWorks} onOpen={(w) => router.push(`/(research)/${w.id}` as any)} />
            </View>
          ) : null}

          {/* Owner actions */}
          {isOwner ? (
            <View style={styles.ownerActions}>
              <Button
                label="Delete Update"
                onPress={handleDelete}
                variant="destructive"
                size="md"
                fullWidth
                loading={isDeleting}
                disabled={isDeleting}
                icon={<Trash2 size={16} color="#FFFFFF" />}
              />
            </View>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  collabBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    marginBottom: spacing.sm,
  },
  collabBadgeText: {
    ...typography.caption,
    fontFamily: fontFamilies.sansSemiBold,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  step: {
    alignItems: 'center',
    width: 64,
  },
  stepDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLine: {
    flex: 1,
    height: 2,
    marginTop: 9,
    marginHorizontal: -18,
  },
  stepLabel: {
    ...typography.micro,
    textAlign: 'center',
    marginTop: 4,
  },
  sectionLabel: {
    ...typography.sectionHeader,
    marginBottom: spacing.sm,
  },
  authorActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  authorButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: spacing.secondaryButtonHeight,
    borderRadius: radius.button,
    borderWidth: 1,
  },
  authorButtonText: {
    ...typography.label,
  },
  moreSection: {
    marginBottom: spacing.md,
  },
  safeArea: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  authorInfo: {
    flex: 1,
    minWidth: 0,
    marginLeft: spacing.sm,
  },
  authorName: {
    ...typography.titleSmall,
  },
  authorMeta: {
    ...typography.bodySmall,
  },
  title: {
    ...typography.headlineSmall,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  metaPillText: {
    ...typography.caption,
    fontFamily: fontFamilies.sansSemiBold,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    ...typography.caption,
  },
  card: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  description: {
    ...typography.body,
    lineHeight: 22,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: spacing.md,
  },
  tag: {
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    maxWidth: '100%',
    flexShrink: 1,
  },
  tagText: {
    ...typography.caption,
    flexShrink: 1,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  linkText: {
    ...typography.bodySmall,
    flex: 1,
    minWidth: 0,
  },
  ownerActions: {
    marginTop: spacing.sm,
  },
});
