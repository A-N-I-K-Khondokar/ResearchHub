import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, User } from 'lucide-react-native';
import { spacing, radius, typography } from '../../constants';
import { getResearcherById } from '../../data';
import { Avatar } from '../../components/common/Avatar';
import { useTheme } from '@/hooks/useTheme';

export default function ResearcherProfilePlaceholder() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const researcher = id ? getResearcherById(id) : null;
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Researcher Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {researcher ? (
          <>
            <Avatar name={researcher.name} uri={researcher.photoURL || researcher.avatar} size="xl" />
            <Text style={[styles.name, { color: colors.textPrimary }]}>{researcher.name}</Text>
            <Text style={[styles.batch, { color: colors.primary }]}>{researcher.batch || researcher.designation}</Text>
            <Text style={[styles.department, { color: colors.textSecondary }]}>{researcher.department}</Text>
            <Text style={[styles.bio, { color: colors.textSecondary }]}>{researcher.bio}</Text>
          </>
        ) : (
          <>
            <View style={[styles.iconContainer, { backgroundColor: colors.primaryMuted }]}>
              <User size={36} color={colors.primary} />
            </View>
            <Text style={[styles.name, { color: colors.textPrimary }]}>Researcher #{id}</Text>
          </>
        )}
        <View style={[styles.badge, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}>
          <Text style={[styles.badgeText, { color: colors.textSecondary }]}>Full Profile Route (Ready for Phase 2C)</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.titleSmall,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  name: {
    ...typography.headlineSmall,
    marginTop: spacing.sm,
    marginBottom: 2,
    textAlign: 'center',
  },
  batch: {
    ...typography.caption,
    marginBottom: 2,
  },
  department: {
    ...typography.caption,
    marginBottom: spacing.md,
  },
  bio: {
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
