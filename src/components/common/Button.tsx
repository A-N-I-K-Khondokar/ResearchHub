import React from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
  Insets,
  Platform,
} from 'react-native';
import { radius, spacing, typography, fontFamilies, floatingButtonTokens } from '@/constants';
import { useTheme } from '@/context/ThemeContext';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'tertiary' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  hitSlop?: Insets | number;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  style,
  textStyle,
  hitSlop,
}) => {
  const { colors, isDark } = useTheme();
  const isInteractive = !disabled && !loading;

  const getContainerStyles = (pressed: boolean): ViewStyle[] => {
    const list: ViewStyle[] = [styles.base, styles[`size_${size}`]];

    if (fullWidth) {
      list.push(styles.fullWidth);
    }

    switch (variant) {
      case 'primary':
        list.push(
          pressed ? floatingButtonTokens.primaryPressed : floatingButtonTokens.primary
        );
        break;
      case 'secondary':
        list.push(
          {
            backgroundColor: pressed
              ? isDark
                ? colors.surfaceHover
                : colors.surfaceSubtle
              : isDark
              ? colors.surfaceContainer
              : colors.surface,
            borderColor: isDark ? colors.borderSubtle : '#D4D8E2',
          },
          floatingButtonTokens.secondary
        );
        break;
      case 'outline':
        list.push({
          backgroundColor: pressed
            ? isDark
              ? colors.surfaceHover
              : colors.surfaceSubtle
            : 'transparent',
          borderWidth: 1.5,
          borderColor: isDark ? colors.borderSubtle : colors.border,
        });
        break;
      case 'ghost':
      case 'tertiary':
        list.push({
          backgroundColor: pressed
            ? isDark
              ? colors.surfaceHover
              : colors.surfaceSubtle
            : 'transparent',
        });
        break;
      case 'destructive':
        list.push({
          backgroundColor: pressed ? colors.error : colors.error,
          shadowColor: colors.error,
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.25,
          shadowRadius: 6,
          elevation: 2,
        });
        break;
    }

    if (disabled) {
      list.push({
        backgroundColor: isDark ? colors.surfaceContainerLow : colors.surfaceSubtle,
        borderColor: colors.borderSubtle,
        borderWidth: 1,
        opacity: 0.55,
        shadowOpacity: 0,
        elevation: 0,
        ...(Platform.OS === 'web'
          ? ({ backgroundImage: 'none', boxShadow: 'none' } as any)
          : {}),
      });
    }

    if (style) {
      list.push(style);
    }

    return list;
  };

  const getLabelStyles = (): TextStyle[] => {
    const list: TextStyle[] = [styles.baseText, styles[`textSize_${size}`]];

    switch (variant) {
      case 'primary':
        list.push({ color: colors.textInverse });
        break;
      case 'secondary':
        list.push({ color: colors.textPrimary });
        break;
      case 'outline':
        list.push({ color: colors.textPrimary });
        break;
      case 'ghost':
      case 'tertiary':
        list.push({
          color: colors.textSecondary,
          fontFamily: fontFamilies.sansMedium,
          fontWeight: '500',
        });
        break;
      case 'destructive':
        list.push({ color: colors.textInverse });
        break;
    }

    if (disabled) {
      list.push({ color: colors.textMuted });
    }

    if (textStyle) {
      list.push(textStyle);
    }

    return list;
  };

  const getIndicatorColor = (): string => {
    if (variant === 'primary' || variant === 'destructive') {
      return colors.textInverse;
    }
    if (variant === 'secondary') {
      return colors.textPrimary;
    }
    return colors.primary;
  };

  const defaultHitSlop =
    variant === 'ghost' || variant === 'tertiary'
      ? { top: 12, bottom: 12, left: 12, right: 12 }
      : { top: 6, bottom: 6, left: 6, right: 6 };

  return (
    <Pressable
      onPress={onPress}
      disabled={!isInteractive}
      hitSlop={hitSlop ?? defaultHitSlop}
      style={({ pressed }) => [
        ...getContainerStyles(pressed),
        pressed && { opacity: 0.94, transform: [{ scale: 0.985 }] },
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={getIndicatorColor()} />
      ) : (
        <View style={styles.contentRow}>
          {icon && iconPosition === 'left' && <View style={styles.iconLeft}>{icon}</View>}
          <Text style={getLabelStyles()}>{label}</Text>
          {icon && iconPosition === 'right' && <View style={styles.iconRight}>{icon}</View>}
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fullWidth: {
    width: '100%',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeft: {
    marginRight: spacing.sm,
  },
  iconRight: {
    marginLeft: spacing.sm,
  },

  // Sizes
  size_sm: {
    height: 36,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
  },
  size_md: {
    height: 48,
    borderRadius: 14,
    paddingHorizontal: spacing.lg,
  },
  size_lg: {
    height: 50,
    borderRadius: 14,
    paddingHorizontal: spacing.xl,
  },

  // Base text
  baseText: {
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  textSize_sm: {
    ...typography.buttonSmall,
  },
  textSize_md: {
    ...typography.button,
  },
  textSize_lg: {
    ...typography.button,
    fontSize: 15.5,
    fontFamily: fontFamilies.sansSemiBold,
    fontWeight: '600',
  },
});
