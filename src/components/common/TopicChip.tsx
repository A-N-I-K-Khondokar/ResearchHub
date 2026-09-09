import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, View } from 'react-native';
import { radius, spacing, typography } from '@/constants';
import { useTheme } from '@/context/ThemeContext';

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
  const { colors } = useTheme();
  const isInteractive = Boolean(onPress);

  const getContainerStyles = (): ViewStyle[] => {
    const list: ViewStyle[] = [styles.base];

    if (selected) {
      list.push({
        backgroundColor: colors.primary,
        borderColor: colors.primary,
      });
    } else {
      switch (variant) {
        case 'default':
          list.push({
            backgroundColor: colors.surfaceSubtle,
            borderColor: colors.border,
          });
          break;
        case 'teal':
          list.push({
            backgroundColor: colors.secondaryLight,
            borderColor: colors.secondaryLight,
          });
          break;
        case 'primary':
          list.push({
            backgroundColor: colors.primaryMuted,
            borderColor: colors.primaryLight,
          });
          break;
        case 'outline':
          list.push({
            backgroundColor: 'transparent',
            borderColor: colors.border,
          });
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
      list.push({
        color: colors.textInverse,
        fontWeight: '600',
      });
    } else {
      switch (variant) {
        case 'default':
          list.push({ color: colors.textPrimary });
          break;
        case 'teal':
          list.push({ color: colors.secondaryDark });
          break;
        case 'primary':
          list.push({ color: colors.primaryDark });
          break;
        case 'outline':
          list.push({ color: colors.textSecondary });
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
        <View
          style={[
            styles.countBadge,
            { backgroundColor: selected ? colors.primaryDark : colors.border },
          ]}
        >
          <Text
            style={[
              styles.countText,
              { color: selected ? colors.textInverse : colors.textSecondary },
            ]}
          >
            {count}
          </Text>
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
  countBadge: {
    marginLeft: spacing.xs,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: radius.full,
  },
  countText: {
    fontSize: 10,
    fontWeight: '600',
  },
});
