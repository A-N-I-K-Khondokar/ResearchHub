import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COMPACT_FONT_SCALE } from '@/constants/typography';
import { Link, Stack } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { fontFamilies, radius, spacing, floatingButtonTokens, typography } from '@/constants';
import { FileQuestion, ArrowLeft } from 'lucide-react-native';
import { ICON_STROKE } from '@/constants/icons';

export default function NotFoundScreen() {
  const { colors, isDark } = useTheme();

  return (
    <>
      <Stack.Screen options={{ title: 'Page Not Found', headerShown: false }} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.borderSubtle,
              shadowOpacity: isDark ? 0 : 0.04,
              elevation: isDark ? 0 : 2,
            },
          ]}
        >
          <View style={[styles.iconCircle, { backgroundColor: isDark ? colors.primaryLight : '#EEF3FD' }]}>
            <FileQuestion size={36} color={colors.primary} strokeWidth={ICON_STROKE.light} />
          </View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Route Not Found</Text>
          <Text style={[styles.message, { color: colors.textSecondary }]}>
            The requested research hub route does not exist or has been relocated.
          </Text>

          <Link
            href="/"
            style={[styles.button, floatingButtonTokens.primary as any]}
          >
            <View style={styles.buttonContent}>
              <ArrowLeft size={16} color="#FFFFFF" />
              <Text maxFontSizeMultiplier={COMPACT_FONT_SCALE} style={styles.buttonText}>Back to Research Hub</Text>
            </View>
          </Link>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.xl,
    alignItems: 'center',
    shadowColor: '#071A3E',
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.headline,
    fontFamily: fontFamilies.serifBold,
    fontWeight: '700',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  message: {
    ...typography.bodyCompact,
    fontFamily: fontFamilies.sansRegular,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  button: {
    borderRadius: radius.button,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    ...typography.bodyCompact,
    fontFamily: fontFamilies.sansSemiBold,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
