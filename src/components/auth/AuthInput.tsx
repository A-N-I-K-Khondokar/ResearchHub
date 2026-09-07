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
import { colors, radius, spacing, typography } from '@/constants';

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
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(!isPassword);

  return (
    <View style={[styles.container, style]}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {rightAction && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={rightAction.onPress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.rightActionLabel}>{rightAction.label}</Text>
          </TouchableOpacity>
        )}
      </View>

      <View
        style={[
          styles.inputWrapper,
          isFocused && styles.inputFocused,
          Boolean(error) && styles.inputError,
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
          style={styles.input}
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
              <EyeOff size={18} color={colors.textSecondary} />
            ) : (
              <Eye size={18} color={colors.textSecondary} />
            )}
          </TouchableOpacity>
        )}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
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
    marginBottom: spacing.xs + 2,
  },
  label: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  rightActionLabel: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  inputWrapper: {
    height: 46,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  inputFocused: {
    borderColor: colors.primary,
    borderWidth: 1.5,
  },
  inputError: {
    borderColor: colors.error,
  },
  leftIconContainer: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    height: '100%',
    ...typography.body,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  passwordToggle: {
    padding: spacing.xs,
    marginLeft: spacing.xs,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    marginTop: spacing.xs,
  },
});
