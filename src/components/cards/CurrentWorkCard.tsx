import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Heart, MessageSquare, Bookmark } from 'lucide-react-native';
import { CurrentWork } from '../../types';
import { colors, spacing, radius, typography, fontFamilies, shadows } from '../../constants';
import { Avatar } from '../common/Avatar';
import { TopicChip } from '../common/TopicChip';

interface CurrentWorkCardProps {
  work: CurrentWork;
  authorName: string;
  authorBatch?: string;
  authorAvatar?: string | null;
  onPress?: () => void;
  onAuthorPress?: () => void;
  onTopicPress?: (topic: string) => void;
  onLikePress?: () => void;
  onCommentPress?: () => void;
  onBookmarkPress?: () => void;
  isLiked?: boolean;
  isBookmarked?: boolean;
}

export const CurrentWorkCard: React.FC<CurrentWorkCardProps> = ({
  work,
  authorName,
  authorBatch,
  authorAvatar,
  onPress,
  onAuthorPress,
  onTopicPress,
  onLikePress,
  onCommentPress,
  onBookmarkPress,
  isLiked = false,
  isBookmarked = false,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={onPress}
      style={styles.card}
      accessibilityRole="button"
      accessibilityLabel={`Research work: ${work.title} by ${authorName}`}
    >
      {/* Author Header */}
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onAuthorPress}
          style={styles.authorContainer}
        >
          <Avatar name={authorName} uri={authorAvatar} size="md" />
          <View style={styles.authorInfo}>
            <Text style={styles.authorName} numberOfLines={1}>
              {authorName}
            </Text>
            {authorBatch ? (
              <Text style={styles.authorBatch}>{authorBatch}</Text>
            ) : null}
          </View>
        </TouchableOpacity>

        {/* Stage Badge */}
        {work.stage ? (
          <View style={styles.stageBadge}>
            <Text style={styles.stageText}>{work.stage}</Text>
          </View>
        ) : null}
      </View>

      {/* Title */}
      <Text style={styles.title} numberOfLines={2}>
        {work.title}
      </Text>

      {/* Description Snippet */}
      <Text style={styles.description} numberOfLines={3}>
        {work.shortDescription || work.description}
      </Text>

      {/* Topic Chips */}
      {work.topics && work.topics.length > 0 ? (
        <View style={styles.topicsRow}>
          {work.topics.map((topic, index) => (
            <TopicChip
              key={`${topic}-${index}`}
              label={topic}
              variant="default"
              onPress={() => onTopicPress?.(topic)}
              style={styles.topicChip}
            />
          ))}
        </View>
      ) : null}

      {/* Interaction Footer */}
      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <TouchableOpacity
            onPress={onLikePress}
            style={styles.actionButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Heart
              size={16}
              color={isLiked ? colors.error : colors.textSecondary}
              fill={isLiked ? colors.error : 'transparent'}
            />
            <Text style={[styles.actionText, isLiked && styles.actionTextActive]}>
              {work.likesCount || 0}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onCommentPress}
            style={styles.actionButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MessageSquare size={16} color={colors.textSecondary} />
            <Text style={styles.actionText}>{work.commentsCount || 0}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footerRight}>
          <TouchableOpacity
            onPress={onBookmarkPress}
            style={styles.iconOnlyButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Bookmark
              size={16}
              color={isBookmarked ? colors.primary : colors.textSecondary}
              fill={isBookmarked ? colors.primary : 'transparent'}
            />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  authorInfo: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  authorName: {
    ...typography.titleSmall,
    color: colors.textPrimary,
  },
  authorBatch: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 1,
  },
  stageBadge: {
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stageText: {
    ...typography.caption,
    fontFamily: fontFamilies.sansMedium,
    color: colors.primary,
  },
  title: {
    ...typography.headlineSmall,
    color: colors.textPrimary,
    lineHeight: 24,
    marginBottom: spacing.xs,
  },
  description: {
    ...typography.body,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  topicsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  topicChip: {
    marginRight: 0,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  actionTextActive: {
    color: colors.error,
  },
  iconOnlyButton: {
    padding: 2,
  },
});
