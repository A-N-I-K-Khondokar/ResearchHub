import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/constants';

export type TopicChipVariant = 'default' | 'teal' | 'primary' | 'outline';

export interface TopicChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  onRemove?: () => void;
  variant?: TopicChipVariant;
  icon?: React.ReactNode;
  count?: number;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const TopicChip: React.FC<TopicChipProps> = ({
  label,
  selected = false,
  onPress,
  onRemove,
  variant = 'default',
  icon,
  count,
  style,
  textStyle,
}) => {
  const isInteractive = Boolean(onPress);

  const getContainerStyles = (): ViewStyle[] => {
    const list: ViewStyle[] = [styles.base];

    if (selected) {
      list.push(styles.selectedContainer);
    } else {
      switch (variant) {
        case 'default':
          list.push(styles.variant_default);
          break;
        case 'teal':
          list.push(styles.variant_teal);
          break;
        case 'primary':
          list.push(styles.variant_primary);
          break;
        case 'outline':
          list.push(styles.variant_outline);
          break;
      }
    }

    if (style) {
      list.push(style);
    }

    return list;
  };

  const getLabelStyles = (): TextStyle[] => {
    const list: TextStyle[] = [styles.baseLabel];

    if (selected) {
      list.push(styles.selectedLabel);
    } else {
      switch (variant) {
        case 'default':
          list.push(styles.label_default);
          break;
        case 'teal':
          list.push(styles.label_teal);
          break;
        case 'primary':
          list.push(styles.label_primary);
          break;
        case 'outline':
          list.push(styles.label_outline);
          break;
      }
    }

    if (textStyle) {
      list.push(textStyle);
    }

    return list;
  };

  const Content = (
    <View style={styles.contentRow}>
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text style={getLabelStyles()}>{label}</Text>
      {count !== undefined && (
        <View style={[styles.countBadge, selected && styles.countBadgeSelected]}>
          <Text style={[styles.countText, selected && styles.countTextSelected]}>{count}</Text>
        </View>
      )}
    </View>
  );

  if (isInteractive) {
    return (
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={onPress}
        style={getContainerStyles()}
      >
        {Content}
      </TouchableOpacity>
    );
  }

  return <View style={getContainerStyles()}>{Content}</View>;
};

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
    alignSelf: 'flex-start',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: spacing.xs,
  },
  baseLabel: {
    ...typography.caption,
    fontWeight: '500',
  },

  // Default (subtle scholarly gray)
  variant_default: {
    backgroundColor: colors.surfaceSubtle,
    borderColor: colors.border,
  },
  label_default: {
    color: colors.textPrimary,
  },

  // Research Teal
  variant_teal: {
    backgroundColor: colors.secondaryLight,
    borderColor: colors.secondaryLight,
  },
  label_teal: {
    color: colors.secondaryDark,
  },

  // Primary Tint
  variant_primary: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primaryLight,
  },
  label_primary: {
    color: colors.primaryDark,
  },

  // Outline
  variant_outline: {
    backgroundColor: 'transparent',
    borderColor: colors.border,
  },
  label_outline: {
    color: colors.textSecondary,
  },

  // Selected State
  selectedContainer: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  selectedLabel: {
    color: colors.textInverse,
    fontWeight: '600',
  },

  // Count badge
  countBadge: {
    marginLeft: spacing.xs,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: radius.full,
    backgroundColor: colors.border,
  },
  countBadgeSelected: {
    backgroundColor: colors.primaryDark,
  },
  countText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  countTextSelected: {
    color: colors.textInverse,
  },
});
