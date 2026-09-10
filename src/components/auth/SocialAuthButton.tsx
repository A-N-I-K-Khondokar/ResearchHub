import React from 'react';
import { Pressable, Text, View, StyleSheet, ViewStyle, Image, Insets } from 'react-native';
import { radius, spacing, typography, fontFamilies } from '@/constants';
import { useTheme } from '@/context/ThemeContext';

export interface SocialAuthButtonProps {
  onPress: () => void;
  style?: ViewStyle;
  hitSlop?: Insets | number;
}

export const SocialAuthButton: React.FC<SocialAuthButtonProps> = ({ onPress, style, hitSlop }) => {
  const { colors, isDark } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      hitSlop={hitSlop ?? { top: 8, bottom: 8, left: 8, right: 8 }}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: pressed
            ? isDark
              ? colors.surfaceHover
              : colors.surfaceSubtle
            : colors.surface,
          borderColor: colors.borderSubtle,
          shadowColor: isDark ? 'transparent' : '#071A3E',
          shadowOpacity: isDark ? 0 : 0.03,
          elevation: isDark ? 0 : 1,
          opacity: pressed ? 0.92 : 1,
          transform: [{ scale: pressed ? 0.992 : 1 }],
        },
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel="Continue with Google"
    >
      <View style={styles.contentRow}>
        <View style={styles.iconContainer}>
          <Image
            source={require('../../../assets/images/google-icon.png')}
            style={styles.googleImage}
            resizeMode="contain"
          />
        </View>
        <Text style={[styles.buttonText, { color: colors.textPrimary }]}>Continue with Google</Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 50,
    width: '100%',
    borderWidth: 1,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 20,
    height: 20,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleImage: {
    width: 20,
    height: 20,
  },
  buttonText: {
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
});


