import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextInputProps,
} from 'react-native';
import { COMPACT_FONT_SCALE } from '@/constants/typography';
import { AlertCircle, Eye, EyeOff } from 'lucide-react-native';
import { radius, spacing, typography, fontFamilies } from '@/constants';
import { useTheme } from '@/context/ThemeContext';
import { noWebOutline } from '@/components/common/TextField';

export interface AuthInputProps extends Omit<TextInputProps, 'style'> {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  isPassword?: boolean;
  leftIcon?: React.ReactNode;
  rightAction?: {
    label: string;
    onPress: () => void;
  };
  style?: ViewStyle;
  wrapperStyle?: ViewStyle;
  floating?: boolean;
}

export const AuthInput: React.FC<AuthInputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  isPassword = false,
  leftIcon,
  rightAction,
  style,
  wrapperStyle,
  floating = false,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(!isPassword);
  const { colors, isDark } = useTheme();

  return (
    <View style={[styles.container, style]}>
      <View style={styles.labelRow}>
        <Text maxFontSizeMultiplier={COMPACT_FONT_SCALE} style={[styles.label, { color: colors.textPrimary }]}>{label}</Text>
        {rightAction && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={rightAction.onPress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text maxFontSizeMultiplier={COMPACT_FONT_SCALE} style={[styles.rightActionLabel, { color: colors.primary }]}>{rightAction.label}</Text>
          </TouchableOpacity>
        )}
      </View>

      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: floating
              ? colors.surface
              : isFocused
              ? colors.surface
              : colors.surfaceSubtle,
            borderColor: isFocused ? colors.primary : colors.borderSubtle,
          },
          floating && {
            shadowColor: isDark ? 'transparent' : '#071A3E',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isDark ? 0 : 0.04,
            shadowRadius: 12,
            elevation: isDark ? 0 : 1,
          },
          Boolean(error) && { borderColor: colors.error },
          wrapperStyle,
        ]}
      >
        {leftIcon && <View style={styles.leftIconContainer}>{leftIcon}</View>}

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          selectionColor={colors.primary}
          maxFontSizeMultiplier={COMPACT_FONT_SCALE}
          cursorColor={colors.primary}
          accessibilityLabel={label}
          accessibilityHint={error || undefined}
          secureTextEntry={isPassword && !showPassword}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={[styles.input, { color: colors.textPrimary }, noWebOutline]}
          autoCapitalize="none"
          autoCorrect={false}
          {...rest}
        />

        {isPassword && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setShowPassword(!showPassword)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.passwordToggle}
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff size={18} color={colors.textMuted} />
            ) : (
              <Eye size={18} color={colors.textMuted} />
            )}
          </TouchableOpacity>
        )}
      </View>

      {error ? (
        <View style={styles.errorRow}>
          <AlertCircle size={13} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    ...typography.bodySmall,
    fontFamily: fontFamilies.sansSemiBold,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  rightActionLabel: {
    ...typography.bodySmall,
    fontFamily: fontFamilies.sansSemiBold,
    fontWeight: '600',
  },
  inputWrapper: {
    height: spacing.inputHeight,
    borderRadius: radius.button,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  leftIconContainer: {
    marginRight: 10,
  },
  input: {
    ...typography.body,
    flex: 1,
    height: '100%',
    fontFamily: fontFamilies.sansRegular,
    paddingVertical: 0,
    lineHeight: undefined,
  },
  passwordToggle: {
    padding: spacing.xs,
    marginLeft: spacing.xs,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  errorText: {
    ...typography.caption,
    fontFamily: fontFamilies.sansMedium,
    flexShrink: 1,
  },
});
