import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { GraduationCap, Loader2 } from 'lucide-react-native';
import { ScreenContainer, Button } from '@/components';
import { colors, radius, spacing, typography, shadows } from '@/constants';

export default function SplashScreen() {
  const router = useRouter();
  const spinValue = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();

    // Auto-navigate to login after a brief presentation
    const timer = setTimeout(() => {
      router.replace('/(auth)/login' as any);
    }, 2200);

    return () => clearTimeout(timer);
  }, [router, spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <ScreenContainer style={styles.container}>
      <View style={styles.centerContent}>
        {/* Scholarly Logo Box */}
        <View style={styles.logoCard}>
          <View style={styles.iconInner}>
            <GraduationCap size={56} color={colors.primary} />
          </View>
        </View>

        {/* Product Brand */}
        <Text style={styles.brandTitle}>CSE Research Hub</Text>
        <Text style={styles.tagline}>
          Department of Computer Science & Engineering
        </Text>

        {/* Loading / Initializing Status */}
        <View style={styles.loadingRow}>
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <Loader2 size={18} color={colors.primary} />
          </Animated.View>
          <Text style={styles.loadingText}>Initializing Scholar Network...</Text>
        </View>
      </View>

      {/* Manual skip button for instant preview */}
      <View style={styles.footer}>
        <Button
          label="Enter Research Hub"
          onPress={() => router.replace('/(auth)/login' as any)}
          variant="outline"
          size="sm"
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'space-between',
    paddingVertical: spacing.xxl,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  logoCard: {
    width: 120,
    height: 120,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  iconInner: {
    width: 90,
    height: 90,
    borderRadius: radius.md,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    ...typography.display,
    fontSize: 28,
    lineHeight: 36,
    color: colors.primaryDark,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  tagline: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 4,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  loadingText: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  footer: {
    alignItems: 'center',
  },
});
