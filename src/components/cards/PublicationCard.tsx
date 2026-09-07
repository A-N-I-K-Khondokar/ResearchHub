import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ExternalLink, BookOpen } from 'lucide-react-native';
import { ResearchPublication } from '../../types';
import { colors, spacing, radius, typography, fontFamilies, shadows } from '../../constants';
import { TopicChip } from '../common/TopicChip';

interface PublicationCardProps {
  publication: ResearchPublication;
  onPress?: () => void;
  onExternalPress?: () => void;
  onTopicPress?: (topic: string) => void;
}

export const PublicationCard: React.FC<PublicationCardProps> = ({
  publication,
  onPress,
  onExternalPress,
  onTopicPress,
}) => {
  const authorList = publication.authors || (publication.coAuthors ? [publication.authorName, ...publication.coAuthors] : [publication.authorName]);

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={onPress}
      style={styles.card}
      accessibilityRole="button"
      accessibilityLabel={`Publication: ${publication.title}`}
    >
      {/* Top Meta: Type & Year */}
      <View style={styles.topMeta}>
        <View style={styles.typeBadge}>
          <BookOpen size={12} color={colors.secondary} />
          <Text style={styles.typeText}>{publication.type.toUpperCase()}</Text>
        </View>
        <Text style={styles.yearText}>{publication.year}</Text>
      </View>

      {/* Title */}
      <Text style={styles.title} numberOfLines={2}>
        {publication.title}
      </Text>

      {/* Authors & Venue */}
      <Text style={styles.authors} numberOfLines={1}>
        {authorList.join(', ')}
      </Text>
      {publication.venue ? (
        <Text style={styles.venue} numberOfLines={1}>
          {publication.venue}
        </Text>
      ) : null}

      {/* Abstract Snippet */}
      {publication.overview || publication.abstract ? (
        <Text style={styles.abstract} numberOfLines={2}>
          {publication.overview || publication.abstract}
        </Text>
      ) : null}

      {/* Topics and Actions */}
      <View style={styles.footer}>
        <View style={styles.topicsRow}>
          {publication.topics && publication.topics.slice(0, 2).map((topic, index) => (
            <TopicChip
              key={`${topic}-${index}`}
              label={topic}
              variant="teal"
              onPress={() => onTopicPress?.(topic)}
            />
          ))}
        </View>

        {publication.externalUrl || publication.externalURL || publication.doi ? (
          <TouchableOpacity
            onPress={onExternalPress}
            style={styles.externalButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ExternalLink size={14} color={colors.primary} />
            <Text style={styles.externalText}>View</Text>
          </TouchableOpacity>
        ) : null}
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
  topMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.secondaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  typeText: {
    fontSize: 10,
    fontFamily: fontFamilies.sansSemiBold,
    color: colors.secondaryDark,
  },
  yearText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  title: {
    ...typography.title,
    fontFamily: fontFamilies.serifBold,
    color: colors.textPrimary,
    lineHeight: 22,
    marginBottom: 4,
  },
  authors: {
    ...typography.caption,
    fontFamily: fontFamilies.sansMedium,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  venue: {
    ...typography.caption,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginBottom: spacing.xs,
  },
  abstract: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    paddingTop: spacing.xs,
    marginTop: spacing.xs,
  },
  topicsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    flex: 1,
  },
  externalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: spacing.xs,
  },
  externalText: {
    ...typography.caption,
    fontFamily: fontFamilies.sansSemiBold,
    color: colors.primary,
  },
});
