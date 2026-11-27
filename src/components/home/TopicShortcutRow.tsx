import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { COMPACT_FONT_SCALE } from '@/constants/typography';
import { Topic } from '../../types';
import { spacing, radius, typography, fontFamilies, shadows } from '../../constants';
import { useTheme } from '@/context/ThemeContext';
import { TopicIcon } from '@/components/common/TopicIcon';

interface TopicShortcutRowProps {
  topics: Topic[];
  selectedTopicId?: string | null;
  onSelectTopic?: (topic: Topic) => void;
  /** Topic ids to highlight (e.g. the user's own interests). */
  markedIds?: Set<string>;
}

export const TopicShortcutRow: React.FC<TopicShortcutRowProps> = ({
  topics,
  selectedTopicId,
  onSelectTopic,
  markedIds,
}) => {
  const { colors } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {topics.map((topic) => {
        const isSelected = selectedTopicId === topic.id;
        const isMarked = !isSelected && Boolean(markedIds?.has(topic.id));
        const count = topic.activeCount ?? topic.currentWorkCount;

        return (
          <TouchableOpacity
            key={topic.id}
            activeOpacity={0.8}
            onPress={() => onSelectTopic?.(topic)}
            style={[
              styles.chip,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderSubtle,
              },
              isMarked && {
                backgroundColor: colors.primaryMuted,
                borderColor: colors.primaryLight,
              },
              isSelected && {
                backgroundColor: colors.primary,
                borderColor: colors.primary,
              },
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`Filter by ${topic.name}${isMarked ? ', one of your interests' : ''}`}
          >
            <View style={styles.icon}>
              <TopicIcon
                iconName={topic.iconName}
                name={topic.name}
                size={14}
                color={isSelected ? colors.textInverse : isMarked ? colors.primary : colors.textSecondary}
              />
            </View>
            <Text maxFontSizeMultiplier={COMPACT_FONT_SCALE}
              style={[
                styles.label,
                { color: isSelected ? colors.textInverse : isMarked ? colors.primary : colors.textPrimary },
                (isSelected || isMarked) && styles.labelSelected,
              ]}
            >
              {topic.name}
            </Text>
            {count !== undefined && count > 0 ? (
              <View
                style={[
                  styles.countBadge,
                  { backgroundColor: colors.surfaceSubtle },
                  isSelected && { backgroundColor: 'rgba(255,255,255,0.22)' },
                ]}
              >
                <Text maxFontSizeMultiplier={COMPACT_FONT_SCALE}
                  style={[
                    styles.countText,
                    { color: isSelected ? colors.textInverse : colors.textSecondary },
                  ]}
                >
                  {count}
                </Text>
              </View>
            ) : null}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
    marginRight: spacing.xs,
    ...shadows.subtle,
  },
  icon: {
    marginRight: 6,
  },
  label: {
    ...typography.caption,
    fontFamily: fontFamilies.sansMedium,
  },
  labelSelected: {
    fontFamily: fontFamilies.sansSemiBold,
  },
  countBadge: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.full,
  },
  countBadgeSelected: {
    // Color set dynamically via inline style on the View
  },
  countText: {
    ...typography.micro,
    fontFamily: fontFamilies.sansBold,
    fontVariant: ['tabular-nums'],
  },
});
