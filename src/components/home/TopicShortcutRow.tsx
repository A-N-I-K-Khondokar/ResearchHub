import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Topic } from '../../types';
import { colors, spacing, radius, typography, fontFamilies, shadows } from '../../constants';

interface TopicShortcutRowProps {
  topics: Topic[];
  selectedTopicId?: string | null;
  onSelectTopic?: (topic: Topic) => void;
}

export const TopicShortcutRow: React.FC<TopicShortcutRowProps> = ({
  topics,
  selectedTopicId,
  onSelectTopic,
}) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {topics.map((topic) => {
        const isSelected = selectedTopicId === topic.id;
        const count = topic.activeCount ?? topic.currentWorkCount;

        return (
          <TouchableOpacity
            key={topic.id}
            activeOpacity={0.8}
            onPress={() => onSelectTopic?.(topic)}
            style={[
              styles.chip,
              isSelected && styles.chipSelected,
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`Filter by ${topic.name}`}
          >
            {topic.icon ? (
              <Text style={styles.icon}>{topic.icon}</Text>
            ) : null}
            <Text
              style={[
                styles.label,
                isSelected && styles.labelSelected,
              ]}
            >
              {topic.name}
            </Text>
            {count !== undefined && count > 0 ? (
              <View
                style={[
                  styles.countBadge,
                  isSelected && styles.countBadgeSelected,
                ]}
              >
                <Text
                  style={[
                    styles.countText,
                    isSelected && styles.countTextSelected,
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
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.xs,
    ...shadows.subtle,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  icon: {
    fontSize: 14,
    marginRight: 6,
  },
  label: {
    ...typography.caption,
    fontFamily: fontFamilies.sansMedium,
    color: colors.textPrimary,
  },
  labelSelected: {
    color: colors.textInverse,
    fontFamily: fontFamilies.sansSemiBold,
  },
  countBadge: {
    marginLeft: 6,
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.full,
  },
  countBadgeSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  countText: {
    fontSize: 10,
    fontFamily: fontFamilies.sansBold,
    color: colors.textSecondary,
  },
  countTextSelected: {
    color: colors.textInverse,
  },
});
