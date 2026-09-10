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
} from 'react-native';
import { radius, spacing, typography, fontFamilies } from '@/constants';
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
        list.push({ backgroundColor: pressed ? colors.primaryPressed : colors.primary });
        break;
      case 'secondary':
        list.push({
          backgroundColor: pressed ? colors.surfaceHover : colors.secondaryLight,
          borderWidth: 1,
          borderColor: colors.secondaryLight,
        });
        break;
      case 'outline':
        list.push({
          backgroundColor: pressed ? colors.surfaceSubtle : 'transparent',
          borderWidth: 1.5,
          borderColor: colors.border,
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
        list.push({ backgroundColor: pressed ? colors.error : colors.error });
        break;
    }

    if (disabled) {
      list.push({
        backgroundColor: colors.surfaceSubtle,
        borderColor: colors.border,
        opacity: 0.6,
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
        list.push({ color: colors.secondaryDark });
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
      return colors.secondaryDark;
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
        pressed && { opacity: 0.92, transform: [{ scale: 0.992 }] },
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
    paddingHorizontal: spacing.md,
  },
  size_md: {
    height: 48,
    paddingHorizontal: spacing.lg,
  },
  size_lg: {
    height: 50,
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
