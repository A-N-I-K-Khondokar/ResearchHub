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
import { radius, spacing, typography } from '@/constants';
import { useTheme } from '@/context/ThemeContext';

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
  const { colors } = useTheme();
  const isInteractive = !disabled && !loading;

  const getContainerStyles = (): ViewStyle[] => {
    const list: ViewStyle[] = [styles.base, styles[`size_${size}`]];

    if (fullWidth) {
      list.push(styles.fullWidth);
    }

    switch (variant) {
      case 'primary':
        list.push({ backgroundColor: colors.primary });
        break;
      case 'secondary':
        list.push({
          backgroundColor: colors.secondaryLight,
          borderWidth: 1,
          borderColor: colors.secondaryLight,
        });
        break;
      case 'outline':
        list.push({
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: colors.border,
        });
        break;
      case 'ghost':
        list.push({ backgroundColor: 'transparent' });
        break;
      case 'destructive':
        list.push({ backgroundColor: colors.error });
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
        list.push({ color: colors.primary });
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
});
