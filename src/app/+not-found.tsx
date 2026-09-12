import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Link, Stack } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { fontFamilies, radius, spacing } from '@/constants';
import { FileQuestion, ArrowLeft } from 'lucide-react-native';

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
            <FileQuestion size={36} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Route Not Found</Text>
          <Text style={[styles.message, { color: colors.textSecondary }]}>
            The requested research hub route does not exist or has been relocated.
          </Text>

          <Link href="/" style={[styles.button, { backgroundColor: colors.primary }]}>
            <View style={styles.buttonContent}>
              <ArrowLeft size={16} color="#FFFFFF" />
              <Text style={styles.buttonText}>Back to Research Hub</Text>
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
    fontFamily: fontFamilies.serifBold,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  message: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  button: {
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
