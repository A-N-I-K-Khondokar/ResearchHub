import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius, spacing, typography } from '@/constants';

export interface SocialAuthButtonProps {
  onPress: () => void;
  style?: ViewStyle;
}

export const SocialAuthButton: React.FC<SocialAuthButtonProps> = ({ onPress, style }) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[styles.container, style]}
    >
      <View style={styles.googleIconCircle}>
        <Text style={styles.googleIconText}>G</Text>
      </View>
      <Text style={styles.buttonText}>Continue with Google</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 46,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  googleIconCircle: {
    width: 22,
    height: 22,
    borderRadius: radius.full,
    backgroundColor: '#4285F4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  googleIconText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  buttonText: {
    ...typography.button,
    color: colors.textPrimary,
  },
});
