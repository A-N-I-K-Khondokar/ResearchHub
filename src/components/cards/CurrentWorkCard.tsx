import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share } from 'react-native';
import { Heart, MessageSquare, Bookmark, Share2, CheckCircle2, MoreHorizontal } from 'lucide-react-native';
import { CurrentWork } from '../../types';
import { spacing, radius, typography, fontFamilies, shadows } from '../../constants';
import { useTheme } from '@/context/ThemeContext';
import { Avatar } from '../common/Avatar';

export interface CurrentWorkCardProps {
  work: CurrentWork;
  authorName: string;
  authorBatch?: string;
  authorAvatar?: string | null;
  authorRole?: string;
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
  authorRole,
  onPress,
  onAuthorPress,
  onTopicPress,
  onLikePress,
  onCommentPress,
  onBookmarkPress,
  isLiked = false,
  isBookmarked = false,
}) => {
  const { colors, isDark } = useTheme();

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${work.title} - CSE Research Hub\nBy ${authorName}`,
      });
    } catch {
      // Ignored
    }
  };

  // Format single line: Department • Lab/Role
  const getAuthorSubtitle = () => {
    let dept = 'CSE';
    if (authorBatch) {
      const parts = authorBatch.split('•');
      dept = parts[0].trim();
      const secondaryPart = parts[1]?.trim();
      if (authorRole) {
        return `${dept} • ${authorRole}`;
      }
      if (secondaryPart) {
        return `${dept} • ${secondaryPart}`;
      }
      return dept;
    }
    if (authorRole) {
      return `${dept} • ${authorRole}`;
    }
    if (work.stage) {
      return `${dept} • ${work.stage}`;
    }
    return dept;
  };

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.borderSubtle,
          shadowOpacity: isDark ? 0 : 0.03,
          elevation: isDark ? 0 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Research work: ${work.title} by ${authorName}`}
    >
      {/* Author Header Row */}
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onAuthorPress}
          style={styles.authorContainer}
        >
          <Avatar name={authorName} uri={authorAvatar} size="md" />
          <View style={styles.authorInfo}>
            <View style={styles.authorNameRow}>
              <Text
                style={[styles.authorName, { color: colors.textPrimary }]}
                numberOfLines={1}
              >
                {authorName}
              </Text>
              <CheckCircle2
                size={14}
                color={colors.primary}
                style={styles.verifiedIcon}
              />
            </View>
            <Text
              style={[styles.authorSubtitle, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {getAuthorSubtitle()}
            </Text>
          </View>
        </TouchableOpacity>

        {/* More Options Icon Button on far right */}
        <TouchableOpacity
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.moreButton}
          onPress={() => {}}
          accessibilityRole="button"
          accessibilityLabel="More options"
        >
          <MoreHorizontal size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Prominent Academic Title (Source Serif 4, 18px) */}
      <Text
        style={[styles.title, { color: colors.textPrimary }]}
        numberOfLines={2}
      >
        {work.title}
      </Text>

      {/* Description Snippet (Inter, 14px / 21px line height) */}
      <Text
        style={[styles.description, { color: colors.textSecondary }]}
        numberOfLines={3}
      >
        {work.shortDescription || work.description}
      </Text>

      {/* Minimalist # Tags (Topics) */}
      {work.topics && work.topics.length > 0 ? (
        <View style={styles.topicsRow}>
          {work.topics.map((topic, index) => {
            const formattedTag = topic.startsWith('#')
              ? topic
              : `#${topic.replace(/\s+/g, '')}`;

            return (
              <TouchableOpacity
                key={`${topic}-${index}`}
                activeOpacity={0.75}
                onPress={() => onTopicPress?.(topic)}
                style={[
                  styles.topicPill,
                  {
                    backgroundColor: colors.surfaceSubtle,
                    borderColor: colors.borderSubtle,
                  },
                ]}
              >
                <Text
                  style={[styles.topicPillText, { color: colors.textSecondary }]}
                >
                  {formattedTag}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : null}

      {/* Faint Horizontal Divider */}
      <View
        style={[styles.divider, { backgroundColor: colors.borderSubtle }]}
      />

      {/* Interaction Footer / Action Row */}
      <View style={styles.footer}>
        {/* Left: Like (Heart) + Count & Comment + Count */}
        <View style={styles.footerLeft}>
          <TouchableOpacity
            onPress={onLikePress}
            style={styles.actionButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={`Like, ${work.likesCount || 0} likes`}
          >
            <Heart
              size={18}
              color={isLiked ? colors.accent : colors.textSecondary}
              fill={isLiked ? colors.accent : 'transparent'}
            />
            <Text
              style={[
                styles.actionText,
                { color: isLiked ? colors.accent : colors.textSecondary },
              ]}
            >
              {work.likesCount || 0}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onCommentPress}
            style={styles.actionButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={`Comments, ${work.commentsCount || 0} comments`}
          >
            <MessageSquare size={18} color={colors.textSecondary} />
            <Text style={[styles.actionText, { color: colors.textSecondary }]}>
              {work.commentsCount || 0}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Right: Bookmark & Share */}
        <View style={styles.footerRight}>
          <TouchableOpacity
            onPress={onBookmarkPress}
            style={styles.iconOnlyButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Bookmark work"
          >
            <Bookmark
              size={18}
              color={isBookmarked ? colors.primary : colors.textSecondary}
              fill={isBookmarked ? colors.primary : 'transparent'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleShare}
            style={styles.iconOnlyButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Share research work"
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
    marginRight: spacing.sm,
  },
  authorInfo: {
    marginLeft: spacing.sm + 2,
    flex: 1,
  },
  authorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  authorName: {
    fontSize: 15,
    fontFamily: fontFamilies.sansSemiBold,
    fontWeight: '600',
  },
  verifiedIcon: {
    marginLeft: 2,
  },
  authorSubtitle: {
    fontSize: 13,
    fontFamily: fontFamilies.sansRegular,
    marginTop: 2,
  },
  moreButton: {
    padding: 4,
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
    fontSize: 14,
    fontFamily: fontFamilies.sansRegular,
    lineHeight: 21,
    marginBottom: spacing.sm + 4,
  },
  topicsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: spacing.sm + 4,
  },
  topicPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 9999,
    borderWidth: 1,
  },
  topicPillText: {
    fontSize: 12,
    fontFamily: fontFamilies.sansMedium,
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
    gap: spacing.lg,
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md + 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 13,
    fontFamily: fontFamilies.sansMedium,
  },
  iconOnlyButton: {
    padding: 4,
  },
});
