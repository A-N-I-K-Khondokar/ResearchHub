/**
 * src/components/common/SoftDangerButton.tsx
 *
 * A gentle, light-red gradient button for destructive actions that should be
 * available but not shout (e.g. "Delete research work" at the bottom of a post).
 * The gradient is drawn with react-native-svg (already a dependency), so no
 * extra library is needed.
 */

import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { Trash2 } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { fontFamilies, radius, spacing, typography } from '@/constants';

interface SoftDangerButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export const SoftDangerButton: React.FC<SoftDangerButtonProps> = ({ label, onPress, loading, disabled }) => {
  const { isDark } = useTheme();
  const palette = isDark
    ? { from: '#3B1A1C', to: '#2A1416', border: '#5C2B2E', text: '#FFB4AB' }
    : { from: '#FFF4F2', to: '#FFDCD7', border: '#F7C4BD', text: '#B3261E' };
  const gradientId = 'softDangerGradient';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.75}
      style={[styles.button, { borderColor: palette.border, opacity: disabled ? 0.6 : 1 }]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: Boolean(disabled || loading), busy: Boolean(loading) }}
    >
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width="100%" height="100%" preserveAspectRatio="none">
          <Defs>
            <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={palette.from} />
              <Stop offset="1" stopColor={palette.to} />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${gradientId})`} />
        </Svg>
      </View>
      {loading ? (
        <ActivityIndicator size="small" color={palette.text} />
      ) : (
        <Trash2 size={16} color={palette.text} />
      )}
      <Text style={[styles.label, { color: palette.text }]}>{loading ? 'Deleting…' : label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    minHeight: spacing.secondaryButtonHeight,
    borderRadius: radius.button,
    borderWidth: 1,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  label: { ...typography.button },
});
