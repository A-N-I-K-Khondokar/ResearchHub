import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { colors, radius, spacing, typography } from '@/constants';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
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
}) => {
  const isInteractive = !disabled && !loading;

  const getContainerStyles = (): ViewStyle[] => {
    const list: ViewStyle[] = [styles.base, styles[`size_${size}`]];

    if (fullWidth) {
      list.push(styles.fullWidth);
    }

    switch (variant) {
      case 'primary':
        list.push(styles.variant_primary);
        break;
      case 'secondary':
        list.push(styles.variant_secondary);
        break;
      case 'outline':
        list.push(styles.variant_outline);
        break;
      case 'ghost':
        list.push(styles.variant_ghost);
        break;
      case 'destructive':
        list.push(styles.variant_destructive);
        break;
    }

    if (disabled) {
      list.push(styles.disabled);
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
        list.push(styles.text_primary);
        break;
      case 'secondary':
        list.push(styles.text_secondary);
        break;
      case 'outline':
        list.push(styles.text_outline);
        break;
      case 'ghost':
        list.push(styles.text_ghost);
        break;
      case 'destructive':
        list.push(styles.text_destructive);
        break;
    }

    if (disabled) {
      list.push(styles.disabledText);
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

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      disabled={!isInteractive}
      style={getContainerStyles()}
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
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.sm,
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
    height: 54,
    paddingHorizontal: spacing.xl,
  },

  // Base text
  baseText: {
    textAlign: 'center',
  },
  textSize_sm: {
    ...typography.buttonSmall,
  },
  textSize_md: {
    ...typography.button,
  },
  textSize_lg: {
    ...typography.button,
    fontSize: 16,
  },

  // Variants
  variant_primary: {
    backgroundColor: colors.primary,
  },
  text_primary: {
    color: colors.textInverse,
  },

  variant_secondary: {
    backgroundColor: colors.secondaryLight,
    borderWidth: 1,
    borderColor: colors.secondaryLight,
  },
  text_secondary: {
    color: colors.secondaryDark,
  },

  variant_outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  text_outline: {
    color: colors.textPrimary,
  },

  variant_ghost: {
    backgroundColor: 'transparent',
  },
  text_ghost: {
    color: colors.primary,
  },

  variant_destructive: {
    backgroundColor: colors.error,
  },
  text_destructive: {
    color: colors.textInverse,
  },

  // Disabled states
  disabled: {
    backgroundColor: colors.surfaceSubtle,
    borderColor: colors.border,
    opacity: 0.6,
  },
  disabledText: {
    color: colors.textMuted,
  },
});
