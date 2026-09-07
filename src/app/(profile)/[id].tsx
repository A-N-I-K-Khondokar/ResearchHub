import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, User } from 'lucide-react-native';
import { colors, spacing, radius, typography } from '../../constants';
import { getResearcherById } from '../../data';
import { Avatar } from '../../components/common/Avatar';

export default function ResearcherProfilePlaceholder() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const researcher = id ? getResearcherById(id) : null;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Researcher Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {researcher ? (
          <>
            <Avatar name={researcher.name} uri={researcher.photoURL || researcher.avatar} size="xl" />
            <Text style={styles.name}>{researcher.name}</Text>
            <Text style={styles.batch}>{researcher.batch || researcher.designation}</Text>
            <Text style={styles.department}>{researcher.department}</Text>
            <Text style={styles.bio}>{researcher.bio}</Text>
          </>
        ) : (
          <>
            <View style={styles.iconContainer}>
              <User size={36} color={colors.primary} />
            </View>
            <Text style={styles.name}>Researcher #{id}</Text>
          </>
        )}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Full Profile Route (Ready for Phase 2C)</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    color: colors.textPrimary,
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
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  name: {
    ...typography.headlineSmall,
    color: colors.textPrimary,
    marginTop: spacing.sm,
    marginBottom: 2,
    textAlign: 'center',
  },
  batch: {
    ...typography.caption,
    color: colors.primary,
    marginBottom: 2,
  },
  department: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  bio: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  badge: {
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
