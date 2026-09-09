import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share } from 'react-native';
import { ThumbsUp, MessageSquare, Bookmark, Share2, Clock } from 'lucide-react-native';
import { CurrentWork } from '../../types';
import { spacing, radius, typography, fontFamilies, shadows } from '../../constants';
import { useTheme } from '@/context/ThemeContext';
import { Avatar } from '../common/Avatar';

interface CurrentWorkCardProps {
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

  // Helper for topic chip color variation
  const getTopicStyles = (topic: string) => {
    const t = topic.toLowerCase();
    if (t.includes('nlp') || t.includes('edge') || t.includes('ai')) {
      return {
        bg: isDark ? '#152A54' : '#EEF3FD',
        border: isDark ? '#244585' : '#D4E2FB',
        text: isDark ? '#82B1FF' : '#2471E7',
      };
    }
    if (t.includes('linguistics') || t.includes('vision') || t.includes('bio')) {
      return {
        bg: isDark ? '#0C2B1C' : '#E8F8F5',
        border: isDark ? '#1B5438' : '#C7EFE6',
        text: isDark ? '#6EDD7C' : '#00755E',
      };
    }
    if (t.includes('security') || t.includes('crypto') || t.includes('cloud')) {
      return {
        bg: isDark ? '#3A140F' : '#FEF0EE',
        border: isDark ? '#6E2519' : '#FCD7D2',
        text: isDark ? '#FFB59F' : '#E04F36',
      };
    }
    // Default Slate
    return {
      bg: isDark ? '#172542' : '#F1F4F9',
      border: isDark ? '#263B66' : '#E2E7F0',
      text: isDark ? '#A5B0C8' : '#334155',
    };
  };

  const timeString = work.updatedAt
    ? '2h ago'
    : 'Recently';

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.borderSubtle,
        },
      ]}
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
            <Text style={[styles.authorName, { color: colors.textPrimary }]} numberOfLines={1}>
              {authorName}
            </Text>
            <View style={styles.authorMetaRow}>
              {authorBatch ? (
                <Text style={[styles.authorBatch, { color: colors.textSecondary }]}>
                  {authorBatch}
                </Text>
              ) : null}
              {authorBatch && (authorRole || work.stage) ? (
                <Text style={[styles.dotSeparator, { color: colors.textMuted }]}>•</Text>
              ) : null}
              {authorRole ? (
                <View
                  style={[
                    styles.roleBadge,
                    {
                      backgroundColor:
                        authorRole.toLowerCase().includes('faculty')
                          ? isDark ? '#152A54' : '#E5EEFF'
                          : isDark ? '#0C2B1C' : '#E8F8F5',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.roleText,
                      {
                        color:
                          authorRole.toLowerCase().includes('faculty')
                            ? isDark ? '#82B1FF' : '#2471E7'
                            : isDark ? '#6EDD7C' : '#00755E',
                      },
                    ]}
                  >
                    {authorRole}
                  </Text>
                </View>
              ) : work.stage ? (
                <Text style={[styles.stageInlineText, { color: colors.primaryDark }]}>
                  {work.stage}
                </Text>
              ) : null}
            </View>
          </View>
        </TouchableOpacity>

        {/* Time Pill Badge */}
        <View
          style={[
            styles.timeBadge,
            {
              backgroundColor: isDark ? '#172542' : '#EAF0FC',
            },
          ]}
        >
          <Clock size={12} color={colors.primary} />
          <Text style={[styles.timeText, { color: colors.primary }]}>{timeString}</Text>
        </View>
      </View>

      {/* Title */}
      <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={2}>
        {work.title}
      </Text>

      {/* Description Snippet */}
      <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={3}>
        {work.shortDescription || work.description}
      </Text>

      {/* Topic Chips */}
      {work.topics && work.topics.length > 0 ? (
        <View style={styles.topicsRow}>
          {work.topics.map((topic, index) => {
            const topicColors = getTopicStyles(topic);
            return (
              <TouchableOpacity
                key={`${topic}-${index}`}
                activeOpacity={0.75}
                onPress={() => onTopicPress?.(topic)}
                style={[
                  styles.topicPill,
                  {
                    backgroundColor: topicColors.bg,
                    borderColor: topicColors.border,
                  },
                ]}
              >
                <Text style={[styles.topicPillText, { color: topicColors.text }]}>{topic}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : null}

      {/* Interaction Footer */}
      <View style={[styles.footer, { borderTopColor: colors.borderSubtle }]}>
        <View style={styles.footerLeft}>
          <TouchableOpacity
            onPress={onLikePress}
            style={styles.actionButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ThumbsUp
              size={16}
              color={isLiked ? colors.primary : colors.textSecondary}
              fill={isLiked ? colors.primary : 'transparent'}
            />
            <Text
              style={[
                styles.actionText,
                { color: isLiked ? colors.primary : colors.textSecondary },
              ]}
            >
              {work.likesCount || 0}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onCommentPress}
            style={styles.actionButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MessageSquare size={16} color={colors.textSecondary} />
            <Text style={[styles.actionText, { color: colors.textSecondary }]}>
              {work.commentsCount || 0} Comments
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footerRight}>
          <TouchableOpacity
            onPress={onBookmarkPress}
            style={styles.iconOnlyButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
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
    ...shadows.card,
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
    marginRight: spacing.sm,
  },
  authorInfo: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  authorName: {
    fontSize: 15,
    fontFamily: fontFamilies.sansBold,
    fontWeight: '700',
  },
  authorMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    flexWrap: 'wrap',
  },
  authorBatch: {
    fontSize: 12,
    fontFamily: fontFamilies.sansRegular,
  },
  dotSeparator: {
    marginHorizontal: 5,
    fontSize: 12,
  },
  roleBadge: {
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    borderRadius: radius.full,
  },
  roleText: {
    fontSize: 11,
    fontFamily: fontFamilies.sansSemiBold,
    fontWeight: '600',
  },
  stageInlineText: {
    fontSize: 11,
    fontFamily: fontFamilies.sansSemiBold,
    fontWeight: '600',
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
    gap: 4,
  },
  timeText: {
    fontSize: 11,
    fontFamily: fontFamilies.sansSemiBold,
    fontWeight: '600',
  },
  title: {
    fontSize: 16,
    fontFamily: fontFamilies.sansBold,
    fontWeight: '700',
    lineHeight: 22,
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  description: {
    fontSize: 13.5,
    fontFamily: fontFamilies.sansRegular,
    lineHeight: 20,
    marginBottom: spacing.sm + 2,
  },
  topicsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: spacing.sm + 2,
  },
  topicPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  topicPillText: {
    fontSize: 12,
    fontFamily: fontFamilies.sansSemiBold,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: spacing.sm,
    marginTop: 2,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md + 4,
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 12.5,
    fontFamily: fontFamilies.sansMedium,
  },
  iconOnlyButton: {
    padding: 2,
  },
});
