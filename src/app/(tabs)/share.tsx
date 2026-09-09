import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PlusCircle } from 'lucide-react-native';
import { spacing, radius, typography } from '../../constants';
import { useTheme } from '@/hooks/useTheme';

export default function ShareTab() {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.container}>
        <View style={[styles.iconContainer, { backgroundColor: colors.primaryMuted }]}>
          <PlusCircle size={40} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Share Research</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Publish current research updates, thesis ideas, and ongoing experiments to your CSE peers.
        </Text>
        <View style={[styles.badge, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}>
          <Text style={[styles.badgeText, { color: colors.textSecondary }]}>Phase 2D Feature</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.headline,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  badgeText: {
    ...typography.caption,
  },
});
