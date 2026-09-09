import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ExternalLink, BookOpen } from 'lucide-react-native';
import { ResearchPublication } from '../../types';
import { spacing, radius, typography, fontFamilies, shadows } from '../../constants';
import { useTheme } from '@/context/ThemeContext';
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
  const { colors } = useTheme();
  const authorList = publication.authors || (publication.coAuthors ? [publication.authorName, ...publication.coAuthors] : [publication.authorName]);

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Publication: ${publication.title}`}
    >
      {/* Top Meta: Type & Year */}
      <View style={styles.topMeta}>
        <View style={[styles.typeBadge, { backgroundColor: colors.secondaryLight }]}>
          <BookOpen size={12} color={colors.secondary} />
          <Text style={[styles.typeText, { color: colors.secondaryDark }]}>
            {publication.type.toUpperCase()}
          </Text>
        </View>
        <Text style={[styles.yearText, { color: colors.textSecondary }]}>{publication.year}</Text>
      </View>

      {/* Title */}
      <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={2}>
        {publication.title}
      </Text>

      {/* Authors & Venue */}
      <Text style={[styles.authors, { color: colors.textSecondary }]} numberOfLines={1}>
        {authorList.join(', ')}
      </Text>
      {publication.venue ? (
        <Text style={[styles.venue, { color: colors.textMuted }]} numberOfLines={1}>
          {publication.venue}
        </Text>
      ) : null}

      {/* Abstract Snippet */}
      {publication.overview || publication.abstract ? (
        <Text style={[styles.abstract, { color: colors.textSecondary }]} numberOfLines={2}>
          {publication.overview || publication.abstract}
        </Text>
      ) : null}

      {/* Topics and Actions */}
      <View style={[styles.footer, { borderTopColor: colors.borderSubtle }]}>
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
            <Text style={[styles.externalText, { color: colors.primary }]}>View</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.md,
    borderWidth: 1,
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
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  typeText: {
    fontSize: 10,
    fontFamily: fontFamilies.sansSemiBold,
  },
  yearText: {
    ...typography.caption,
  },
  title: {
    ...typography.title,
    fontFamily: fontFamilies.serifBold,
    lineHeight: 22,
    marginBottom: 4,
  },
  authors: {
    ...typography.caption,
    fontFamily: fontFamilies.sansMedium,
    marginBottom: 2,
  },
  venue: {
    ...typography.caption,
    fontStyle: 'italic',
    marginBottom: spacing.xs,
  },
  abstract: {
    ...typography.bodySmall,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
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
  },
});
