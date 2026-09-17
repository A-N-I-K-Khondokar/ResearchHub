import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, Linking } from 'react-native';
import { ArrowUpRight, Bookmark, Share2 } from 'lucide-react-native';
import { ResearchPublication } from '../../types';
import { spacing, fontFamilies } from '../../constants';
import { useTheme } from '@/context/ThemeContext';

export interface PublicationCardProps {
  publication: ResearchPublication;
  onPress?: () => void;
  onExternalPress?: () => void;
  onTopicPress?: (topic: string) => void;
  onBookmarkPress?: () => void;
  isBookmarked?: boolean;
}

export const PublicationCard: React.FC<PublicationCardProps> = ({
  publication,
  onPress,
  onExternalPress,
  onTopicPress,
  onBookmarkPress,
  isBookmarked: isBookmarkedProp,
}) => {
  const { colors, isDark } = useTheme();
  const [localBookmarked, setLocalBookmarked] = useState(publication.isBookmarked || false);
  const isBookmarked = isBookmarkedProp !== undefined ? isBookmarkedProp : localBookmarked;

  const authorList =
    publication.authors ||
    (publication.coAuthors
      ? [publication.authorName, ...publication.coAuthors]
      : [publication.authorName]);

  const venueYearString = [
    publication.venue || publication.type,
    publication.year ? String(publication.year) : undefined,
  ]
    .filter(Boolean)
    .join(' • ');

  const hasExternal = Boolean(
    publication.externalUrl || publication.externalURL || publication.doi
  );

  const handleExternalPress = () => {
    if (onExternalPress) {
      onExternalPress();
      return;
    }
    const rawUrl = publication.externalUrl || publication.externalURL || publication.doi;
    if (rawUrl) {
      const url = rawUrl.startsWith('http') ? rawUrl : `https://doi.org/${rawUrl}`;
      Linking.openURL(url).catch(() => {});
    }
  };

  const handleShare = async () => {
    try {
      const rawUrl = publication.externalUrl || publication.externalURL || publication.doi;
      const shareUrl = rawUrl
        ? rawUrl.startsWith('http')
          ? rawUrl
          : `https://doi.org/${rawUrl}`
        : '';
      await Share.share({
        message: `${publication.title}\n${authorList.join(', ')}\n${shareUrl}`,
      });
    } catch {
      // Ignored
    }
  };

  const handleBookmarkToggle = () => {
    if (onBookmarkPress) {
      onBookmarkPress();
    } else {
      setLocalBookmarked((prev) => !prev);
    }
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
          shadowOpacity: isDark ? 0 : 0.04,
          elevation: isDark ? 0 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Publication: ${publication.title}`}
    >
      {/* Top Meta: Clean Inline Venue & Year */}
      <View style={styles.topMeta}>
        <Text
          style={[styles.venueYearText, { color: colors.textSecondary }]}
          numberOfLines={1}
        >
          {venueYearString}
        </Text>
      </View>

      {/* Prominent Academic Title (Source Serif 4, 17px) */}
      <Text
        style={[styles.title, { color: colors.textPrimary }]}
        numberOfLines={2}
      >
        {publication.title}
      </Text>

      {/* Authors List (Inter-Regular, 13px) */}
      <Text
        style={[styles.authors, { color: colors.textSecondary }]}
        numberOfLines={1}
      >
        {authorList.join(', ')}
      </Text>

      {/* Abstract / Overview Snippet */}
      {publication.overview || publication.abstract ? (
        <Text
          style={[styles.overview, { color: colors.textSecondary }]}
          numberOfLines={2}
        >
          {publication.overview || publication.abstract}
        </Text>
      ) : null}

      {/* Faint Horizontal Divider */}
      <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />

      {/* Footer: Unified # Tags on Left, External Link & Actions on Right */}
      <View style={styles.footer}>
        {publication.topics && publication.topics.length > 0 ? (
          <View style={styles.topicsRow}>
            {publication.topics.slice(0, 2).map((topic, index) => {
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
        ) : (
          <View style={styles.flexSpacer} />
        )}

        {/* External Links & Actions */}
        <View style={styles.actionsRight}>
          {hasExternal ? (
            <TouchableOpacity
              onPress={handleExternalPress}
              style={styles.viewLink}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="link"
              accessibilityLabel={`View publication paper: ${publication.title}`}
            >
              <Text style={[styles.viewLinkText, { color: colors.primary }]}>
                View Paper
              </Text>
              <ArrowUpRight size={14} color={colors.primary} />
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            onPress={handleBookmarkToggle}
            style={styles.actionIcon}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Bookmark publication"
          >
            <Bookmark
              size={16}
              color={isBookmarked ? colors.primary : colors.textSecondary}
              fill={isBookmarked ? colors.primary : 'transparent'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleShare}
            style={styles.actionIcon}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Share publication"
          >
            <Share2 size={16} color={colors.textSecondary} />
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
  topMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  venueYearText: {
    fontSize: 12.5,
    fontFamily: fontFamilies.sansSemiBold,
    letterSpacing: 0.2,
  },
  title: {
    fontSize: 17,
    fontFamily: fontFamilies.serifBold,
    fontWeight: '700',
    lineHeight: 23,
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  authors: {
    fontSize: 13,
    fontFamily: fontFamilies.sansRegular,
    lineHeight: 18,
    marginBottom: 6,
  },
  overview: {
    fontSize: 13.5,
    fontFamily: fontFamilies.sansRegular,
    lineHeight: 20,
    marginBottom: spacing.sm + 4,
  },
  divider: {
    height: 1,
    width: '100%',
    marginBottom: spacing.sm + 2,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topicsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
    marginRight: spacing.sm,
  },
  topicPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    borderWidth: 1,
  },
  topicPillText: {
    fontSize: 11.5,
    fontFamily: fontFamilies.sansMedium,
  },
  flexSpacer: {
    flex: 1,
  },
  actionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  viewLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 2,
  },
  viewLinkText: {
    fontSize: 12.5,
    fontFamily: fontFamilies.sansSemiBold,
  },
  actionIcon: {
    padding: 2,
  },
});
