import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share } from 'react-native';
import { COMPACT_FONT_SCALE } from '@/constants/typography';
import { Bookmark, BookOpen, Layers, MoreHorizontal, PenLine, Share2, Users } from 'lucide-react-native';
import { CurrentWork } from '../../types';
import { spacing, radius, typography, fontFamilies } from '../../constants';
import { card, cardShadow } from '@/constants/cards';
import { StatusChip } from '@/components/common/StatusChip';
import { useAuth } from '@/context/AuthContext';
import { collabStateIcon } from '@/components/common/collabStateIcon';
import type { CollaborateState } from '@/hooks/useCollaborate';
import { useTheme } from '@/context/ThemeContext';
import { Avatar } from '../common/Avatar';
import { formatRelativeDate } from '@/utils/date';
import { chooseAction } from '@/utils/dialogs';

export interface CurrentWorkCardProps {
  work: CurrentWork;
  authorName: string;
  authorBatch?: string;
  authorAvatar?: string | null;
  authorRole?: string;
  onPress?: () => void;
  onAuthorPress?: () => void;
  onTopicPress?: (topic: string) => void;
  onBookmarkPress?: () => void;
  isBookmarked?: boolean;
  /** Collaboration posts: "I'm interested · Apply" action (see useCollaborate). */
  onCollaboratePress?: () => void;
  collaborateLabel?: string;
  collaborateDisabled?: boolean;
  collaborateState?: CollaborateState;
  /** @deprecated Likes/comments are not part of the data model; kept for call-site compatibility. */
  onLikePress?: () => void;
  /** @deprecated */
  onCommentPress?: () => void;
  /** @deprecated */
  isLiked?: boolean;
}

const MAX_TOPICS = 3;
const MAX_ROLES = 4;

const asTag = (value: string) => (value.startsWith('#') ? value : `#${value.replace(/\s+/g, '')}`);

export const CurrentWorkCard: React.FC<CurrentWorkCardProps> = ({
  work,
  authorName,
  authorBatch,
  authorAvatar,
  authorRole,
  onPress,
  onAuthorPress,
  onTopicPress,
  onBookmarkPress,
  isBookmarked = false,
  onCollaboratePress,
  collaborateLabel = "I'm interested · Apply",
  collaborateDisabled = false,
  collaborateState,
}) => {
  const { colors, isDark } = useTheme();
  const { firebaseUser } = useAuth();
  const isCollaboration = work.postType === 'collaboration';
  const lookingFor = work.lookingFor ?? [];
  const teamFormed = isCollaboration && work.collabStatus === 'closed';
  const team = work.team ?? [];

  const handleShare = async () => {
    try {
      await Share.share({
        message: isCollaboration
          ? `${authorName} is looking for collaborators: "${work.title}" — CSE Research Hub`
          : `${work.title} — ${authorName} on CSE Research Hub`,
      });
    } catch {
      // Ignored
    }
  };

  const handleMore = () => {
    chooseAction(work.title, [
      ...(onPress ? [{ label: 'View details', onPress }] : []),
      ...(onBookmarkPress ? [{ label: isBookmarked ? 'Remove from Saved' : 'Save', onPress: onBookmarkPress }] : []),
      { label: 'Share', onPress: handleShare },
    ]);
  };

  // Single line under the author: Department • Role
  const CollabIcon = collabStateIcon(collaborateState);
  const dept = authorBatch?.split('•')[0]?.trim() || 'CSE';
  const subtitle = authorRole ? `${dept} • ${authorRole}` : dept;

  const isOwn = Boolean(firebaseUser?.uid) && (work.userId === firebaseUser?.uid);
  const isDraft = work.status === 'draft';
  const edited = Boolean(work.updatedAt && work.createdAt) &&
    new Date(work.updatedAt).getTime() - new Date(work.createdAt).getTime() > 60_000;
  const topics = work.topics ?? [];
  const shownTopics = topics.slice(0, MAX_TOPICS);
  const hasCollabExtras = isCollaboration && (lookingFor.length > 0 || team.length > 0);
  const statusWord = isCollaboration ? (teamFormed ? 'team formed' : 'open') : null;
  const a11y = [
    isDraft ? 'Draft' : null,
    isCollaboration ? 'Collaboration' : 'Research work',
    work.stage || null,
    statusWord,
    `by ${isOwn ? 'you' : authorName}`,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <TouchableOpacity
      activeOpacity={card.pressOpacity}
      onPress={onPress}
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.borderSubtle },
        cardShadow(isDark),
        isDraft && { borderStyle: 'dashed', borderColor: colors.border },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${a11y}: ${work.title}`}
    >
      {/* Author */}
      <View style={styles.header}>
        <TouchableOpacity activeOpacity={0.8} onPress={onAuthorPress} style={styles.authorContainer} accessibilityRole="button" accessibilityLabel={`Open ${authorName}'s profile`}>
          <Avatar name={authorName} uri={authorAvatar} size="md" />
          <View style={styles.authorInfo}>
            <Text style={[styles.authorName, { color: colors.textPrimary }]} numberOfLines={1}>
              {authorName}
            </Text>
            <Text style={[styles.authorSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
              {subtitle}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.moreButton}
          onPress={handleMore}
          accessibilityRole="button"
          accessibilityLabel="More options"
        >
          <MoreHorizontal size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Type · stage · ownership */}
      <View style={styles.chips}>
        {isDraft ? <StatusChip label="Draft" tone="neutral" icon={PenLine} outlined /> : null}
        {isCollaboration ? (
          <StatusChip
            label={teamFormed ? 'Collaboration · Team formed' : 'Collaboration · Open'}
            tone={teamFormed ? 'success' : 'primary'}
            icon={Users}
          />
        ) : (
          <StatusChip label="Research" tone="neutral" icon={BookOpen} />
        )}
        {work.stage ? <StatusChip label={work.stage} tone="neutral" icon={Layers} /> : null}
        {isOwn && !isDraft ? <StatusChip label="Your post" tone="primary" /> : null}
      </View>

      <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={2}>
        {work.title}
      </Text>

      <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={hasCollabExtras ? 2 : 3}>
        {work.shortDescription || work.description}
      </Text>

      {/* Looking for (collaboration) */}
      {isCollaboration && lookingFor.length > 0 && !teamFormed ? (
        <View style={styles.lookingForBlock}>
          <Text style={[styles.lookingForLabel, { color: colors.textPrimary }]}>Looking for</Text>
          <View style={styles.topicsRow}>
            {lookingFor.slice(0, MAX_ROLES).map((role) => (
              <View key={role} style={[styles.rolePill, { backgroundColor: colors.primaryMuted }]}>
                <Text maxFontSizeMultiplier={COMPACT_FONT_SCALE} style={[styles.rolePillText, { color: colors.primary }]} numberOfLines={1}>
                  {role}
                </Text>
              </View>
            ))}
            {lookingFor.length > MAX_ROLES ? (
              <Text style={[styles.moreRoles, { color: colors.textSecondary }]}>+{lookingFor.length - MAX_ROLES}</Text>
            ) : null}
          </View>
        </View>
      ) : null}

      {/* Topic tags (max 3 + N) */}
      {shownTopics.length > 0 ? (
        <View style={styles.topicsRow}>
          {shownTopics.map((topic, index) => (
            <TouchableOpacity
              key={`${topic}-${index}`}
              activeOpacity={0.75}
              onPress={() => onTopicPress?.(topic)}
              style={[styles.topicPill, { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderSubtle }]}
              accessibilityRole="button"
              accessibilityLabel={`Topic ${topic}`}
            >
              <Text maxFontSizeMultiplier={COMPACT_FONT_SCALE} style={[styles.topicPillText, { color: colors.textSecondary }]} numberOfLines={1} ellipsizeMode="tail">
                {asTag(topic)}
              </Text>
            </TouchableOpacity>
          ))}
          {topics.length > MAX_TOPICS ? (
            <Text style={[styles.moreRoles, { color: colors.textMuted }]}>+{topics.length - MAX_TOPICS}</Text>
          ) : null}
        </View>
      ) : null}

      {/* Collaboration CTA */}
      {isCollaboration && onCollaboratePress ? (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onCollaboratePress}
          disabled={collaborateDisabled}
          style={[
            styles.collabButton,
            collaborateDisabled
              ? { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderSubtle }
              : { backgroundColor: colors.primary, borderColor: colors.primary },
          ]}
          accessibilityRole="button"
          accessibilityLabel={collaborateLabel}
        >
          <CollabIcon size={15} color={collaborateDisabled ? colors.textMuted : '#FFFFFF'} />
          <Text maxFontSizeMultiplier={COMPACT_FONT_SCALE} style={[styles.collabButtonText, { color: collaborateDisabled ? colors.textMuted : '#FFFFFF' }]}>
            {collaborateLabel}
          </Text>
        </TouchableOpacity>
      ) : null}

      <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />

      {/* Footer: team · time · actions */}
      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          {isCollaboration && team.length > 0 ? (
            <View style={styles.teamAvatars} accessibilityLabel={`${team.length} on the team`}>
              {team.slice(0, 3).map((m, i) => (
                <View key={m.uid} style={[styles.teamAvatar, { marginLeft: i === 0 ? 0 : -8, borderColor: colors.surface }]}>
                  <Avatar name={m.displayName} uri={m.photoURL} size="xs" />
                </View>
              ))}
              {team.length > 3 ? (
                <Text style={[styles.metaText, { color: colors.textMuted, marginLeft: 4 }]}>+{team.length - 3}</Text>
              ) : null}
            </View>
          ) : null}
          <Text style={[styles.metaText, { color: colors.textMuted }]} numberOfLines={1}>
            {formatRelativeDate(work.createdAt)}
            {edited ? ' · Edited' : ''}
          </Text>
        </View>

        <View style={styles.footerRight}>
          {onBookmarkPress ? (
            <TouchableOpacity
              onPress={onBookmarkPress}
              style={styles.iconOnlyButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel={isBookmarked ? 'Remove from saved' : 'Save'}
            >
              <Bookmark
                size={18}
                color={isBookmarked ? colors.primary : colors.textSecondary}
                fill={isBookmarked ? colors.primary : 'transparent'}
              />
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            onPress={handleShare}
            style={styles.iconOnlyButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Share"
          >
            <Share2 size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: card.radius,
    borderWidth: card.borderWidth,
    padding: card.padding,
    marginBottom: spacing.md,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: spacing.sm,
  },
  collabBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    marginBottom: spacing.sm + 4,
  },
  collabBadgeText: {
    ...typography.caption,
    fontFamily: fontFamilies.sansSemiBold,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm + 2,
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    flexShrink: 1,
    marginRight: spacing.sm,
  },
  authorInfo: {
    marginLeft: spacing.sm + 2,
    flex: 1,
    flexShrink: 1,
  },
  authorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 1,
  },
  authorName: {
    ...typography.titleSmall,
    flexShrink: 1,
  },
  verifiedIcon: {
    marginLeft: 2,
    flexShrink: 0,
  },
  authorSubtitle: {
    ...typography.bodySmall,
    marginTop: 2,
    flexShrink: 1,
  },
  moreButton: {
    padding: 4,
    flexShrink: 0,
  },
  title: {
    ...typography.feedTitle,
    marginBottom: 6,
  },
  description: {
    ...typography.bodyCompact,
    marginBottom: spacing.sm + 4,
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm + 4,
  },
  teamAvatars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamAvatar: {
    borderWidth: 2,
    borderRadius: 999,
  },
  teamText: {
    ...typography.caption,
    flexShrink: 1,
  },
  lookingForBlock: {
    marginBottom: spacing.xs,
  },
  lookingForLabel: {
    ...typography.caption,
    fontFamily: fontFamilies.sansSemiBold,
    marginBottom: 6,
  },
  rolePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    maxWidth: '100%',
    flexShrink: 1,
  },
  rolePillText: {
    ...typography.caption,
    fontFamily: fontFamilies.sansSemiBold,
    flexShrink: 1,
  },
  moreRoles: {
    ...typography.caption,
    alignSelf: 'center',
  },
  topicsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: spacing.sm + 4,
  },
  topicPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    maxWidth: '100%',
    flexShrink: 1,
  },
  topicPillText: {
    ...typography.caption,
    flexShrink: 1,
  },
  collabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    height: spacing.compactButtonHeight,
    borderRadius: radius.button,
    borderWidth: 1,
    marginBottom: spacing.sm + 4,
  },
  collabButtonText: { ...typography.buttonSmall },
  divider: {
    height: 1,
    width: '100%',
    marginBottom: spacing.sm + 4,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 1,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexShrink: 1,
  },
  metaText: {
    ...typography.caption,
    flexShrink: 1,
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md + 4,
    flexShrink: 0,
  },
  iconOnlyButton: {
    padding: 4,
  },
});
