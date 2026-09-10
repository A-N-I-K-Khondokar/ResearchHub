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
import { Eye, EyeOff } from 'lucide-react-native';
import { radius, spacing, typography, fontFamilies } from '@/constants';
import { useTheme } from '@/context/ThemeContext';

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
        <Text style={[styles.label, { color: colors.textPrimary }]}>{label}</Text>
        {rightAction && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={rightAction.onPress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.rightActionLabel, { color: colors.primary }]}>{rightAction.label}</Text>
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
            borderWidth: isFocused ? 1.5 : 1,
          },
          floating && {
            shadowColor: isDark ? 'transparent' : '#071A3E',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isDark ? 0 : 0.04,
            shadowRadius: 12,
            elevation: isDark ? 0 : 1,
          },
          Boolean(error) && { borderColor: colors.error, borderWidth: 1.5 },
          wrapperStyle,
        ]}
      >
        {leftIcon && <View style={styles.leftIconContainer}>{leftIcon}</View>}

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={isPassword && !showPassword}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={[styles.input, { color: colors.textPrimary }]}
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
          >
            {showPassword ? (
              <EyeOff size={18} color={colors.textMuted} />
            ) : (
              <Eye size={18} color={colors.textMuted} />
            )}
          </TouchableOpacity>
        )}
      </View>

      {error ? <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md + 4,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  rightActionLabel: {
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 12.5,
    fontWeight: '600',
  },
  inputWrapper: {
    height: 50,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  leftIconContainer: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    fontFamily: fontFamilies.sansRegular,
    fontSize: 14.5,
    paddingVertical: 0,
  },
  passwordToggle: {
    padding: spacing.xs,
    marginLeft: spacing.xs,
  },
  errorText: {
    fontFamily: fontFamilies.sansMedium,
    fontSize: 12,
    marginTop: 4,
  },
});
