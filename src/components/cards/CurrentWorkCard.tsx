import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share } from 'react-native';
import {
  Bookmark,
  Share2,
  CheckCircle2,
  MoreHorizontal,
  Calendar,
  Layers,
  Users,
  UserPlus,
} from 'lucide-react-native';
import { CurrentWork } from '../../types';
import { spacing, radius, typography, fontFamilies } from '../../constants';
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
  /** Collaboration posts: "I'm interested" action (e.g. send a connection request). */
  onCollaboratePress?: () => void;
  collaborateLabel?: string;
  collaborateDisabled?: boolean;
  /** @deprecated Likes/comments are not part of the data model; kept for call-site compatibility. */
  onLikePress?: () => void;
  /** @deprecated */
  onCommentPress?: () => void;
  /** @deprecated */
  isLiked?: boolean;
}

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
  collaborateLabel = "I'm interested · Connect",
  collaborateDisabled = false,
}) => {
  const { colors, isDark } = useTheme();
  const isCollaboration = work.postType === 'collaboration';
  const lookingFor = work.lookingFor ?? [];

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
  const dept = authorBatch?.split('•')[0]?.trim() || 'CSE';
  const subtitle = authorRole ? `${dept} • ${authorRole}` : dept;

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: isCollaboration ? colors.primaryLight : colors.borderSubtle,
          shadowOpacity: isDark ? 0 : 0.03,
          elevation: isDark ? 0 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${isCollaboration ? 'Collaboration post' : 'Research work'}: ${work.title} by ${authorName}`}
    >
      {/* Collaboration badge */}
      {isCollaboration ? (
        <View style={[styles.collabBadge, { backgroundColor: colors.primaryMuted }]}>
          <Users size={13} color={colors.primary} strokeWidth={2.2} />
          <Text style={[styles.collabBadgeText, { color: colors.primary }]}>Looking for collaborators</Text>
        </View>
      ) : null}

      {/* Author header */}
      <View style={styles.header}>
        <TouchableOpacity activeOpacity={0.8} onPress={onAuthorPress} style={styles.authorContainer}>
          <Avatar name={authorName} uri={authorAvatar} size="md" />
          <View style={styles.authorInfo}>
            <View style={styles.authorNameRow}>
              <Text style={[styles.authorName, { color: colors.textPrimary }]} numberOfLines={1}>
                {authorName}
              </Text>
              <CheckCircle2 size={14} color={colors.primary} style={styles.verifiedIcon} />
            </View>
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

      <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={2}>
        {work.title}
      </Text>

      <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>
        {work.shortDescription || work.description}
      </Text>

      {/* Looking for (collaboration) */}
      {isCollaboration && lookingFor.length > 0 ? (
        <View style={styles.lookingForBlock}>
          <Text style={[styles.lookingForLabel, { color: colors.textPrimary }]}>Looking for</Text>
          <View style={styles.topicsRow}>
            {lookingFor.slice(0, 4).map((role) => (
              <View key={role} style={[styles.rolePill, { backgroundColor: colors.primaryMuted }]}>
                <Text style={[styles.rolePillText, { color: colors.primary }]} numberOfLines={1}>
                  {asTag(role)}
                </Text>
              </View>
            ))}
            {lookingFor.length > 4 ? (
              <Text style={[styles.moreRoles, { color: colors.textSecondary }]}>+{lookingFor.length - 4}</Text>
            ) : null}
          </View>
        </View>
      ) : null}

      {/* Topic tags */}
      {work.topics && work.topics.length > 0 ? (
        <View style={styles.topicsRow}>
          {work.topics.map((topic, index) => (
            <TouchableOpacity
              key={`${topic}-${index}`}
              activeOpacity={0.75}
              onPress={() => onTopicPress?.(topic)}
              style={[styles.topicPill, { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderSubtle }]}
            >
              <Text style={[styles.topicPillText, { color: colors.textSecondary }]} numberOfLines={1} ellipsizeMode="tail">
                {asTag(topic)}
              </Text>
            </TouchableOpacity>
          ))}
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
          <UserPlus size={15} color={collaborateDisabled ? colors.textMuted : '#FFFFFF'} />
          <Text style={[styles.collabButtonText, { color: collaborateDisabled ? colors.textMuted : '#FFFFFF' }]}>
            {collaborateLabel}
          </Text>
        </TouchableOpacity>
      ) : null}

      <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />

      {/* Footer: real metadata + actions */}
      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <View style={styles.metaItem}>
            <Calendar size={14} color={colors.textSecondary} strokeWidth={2} />
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>{formatRelativeDate(work.createdAt)}</Text>
          </View>
          {work.stage ? (
            <View style={styles.metaItem}>
              <Layers size={14} color={colors.textSecondary} strokeWidth={2} />
              <Text style={[styles.metaText, { color: colors.textSecondary }]} numberOfLines={1}>
                {work.stage}
              </Text>
            </View>
          ) : null}
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
    borderRadius: 20,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#071A3E',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
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
    marginBottom: spacing.sm + 4,
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
    fontSize: 18,
    fontFamily: fontFamilies.serifBold,
    fontWeight: '700',
    lineHeight: 24,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  description: {
    ...typography.bodyCompact,
    lineHeight: 21,
    marginBottom: spacing.sm + 4,
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
    gap: spacing.sm,
    height: spacing.compactButtonHeight,
    borderRadius: radius.button,
    borderWidth: 1,
    marginBottom: spacing.sm + 4,
  },
  collabButtonText: {
    ...typography.label,
  },
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
    gap: spacing.md,
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
