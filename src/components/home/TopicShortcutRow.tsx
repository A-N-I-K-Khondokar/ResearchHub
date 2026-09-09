import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Topic } from '../../types';
import { spacing, radius, typography, fontFamilies, shadows } from '../../constants';
import { useTheme } from '@/context/ThemeContext';

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
  const { colors } = useTheme();

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
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
              isSelected && {
                backgroundColor: colors.primary,
                borderColor: colors.primary,
              },
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
                { color: isSelected ? colors.textInverse : colors.textPrimary },
                isSelected && styles.labelSelected,
              ]}
            >
              {topic.name}
            </Text>
            {count !== undefined && count > 0 ? (
              <View
                style={[
                  styles.countBadge,
                  { backgroundColor: colors.surfaceSubtle },
                  isSelected && styles.countBadgeSelected,
                ]}
              >
                <Text
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
    fontSize: 14,
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
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  countText: {
    fontSize: 10,
    fontFamily: fontFamilies.sansBold,
  },
});
