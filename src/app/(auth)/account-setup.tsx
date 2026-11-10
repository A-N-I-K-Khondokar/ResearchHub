import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Clock, ShieldCheck, LogOut } from 'lucide-react-native';
import { ScreenContainer, Button } from '@/components';
import { radius, spacing, typography, fontFamilies } from '@/constants';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';

/**
 * Account Setup — Approval Checkpoint (Stage 3.2)
 *
 * Displayed after a successful email verification or Google sign-in.
 * Communicates that authentication succeeded but admin approval is not
 * yet integrated (Stage 3.3 connects Firestore).
 *
 * IMPORTANT: This screen does NOT grant access to protected research features.
 * Access remains blocked until an authoritative approval source confirms the
 * account status (Stage 3.3).
 *
 * No locally fabricated approval state is created here.
 */
export default function AccountSetupScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { firebaseUser, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/(auth)/login' as any);
    } catch {
      // signOut error is non-critical — navigate anyway
      router.replace('/(auth)/login' as any);
    }
  };

  return (
    <ScreenContainer scrollable>
      <View style={styles.container}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          {/* Top accent bar */}
          <View style={[styles.accentBar, { backgroundColor: colors.primary }]} />

          {/* Icon */}
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor: colors.primaryMuted,
                borderColor: colors.primaryLight,
              },
            ]}
          >
            <Clock size={40} color={colors.primary} />
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Account Setup Pending
          </Text>

          {/* Sub-heading: auth success */}
          <View
            style={[
              styles.successBadge,
              { backgroundColor: colors.primaryMuted, borderColor: colors.primaryLight },
            ]}
          >
            <ShieldCheck size={14} color={colors.primary} />
            <Text style={[styles.successText, { color: colors.primary }]}>
              Authentication successful
            </Text>
          </View>

          {/* Identity */}
          {firebaseUser?.displayName || firebaseUser?.email ? (
            <Text style={[styles.identity, { color: colors.textSecondary }]}>
              Signed in as{' '}
              <Text style={{ color: colors.textPrimary, fontFamily: fontFamilies.sansSemiBold }}>
                {firebaseUser.displayName ?? firebaseUser.email}
              </Text>
            </Text>
          ) : null}

          {/* Explanation */}
          <Text style={[styles.body, { color: colors.textSecondary }]}>
            Your identity has been verified, but access to the CSE Research Hub
            requires approval from the App Administrator.
          </Text>

          <Text style={[styles.body, styles.bodySpaced, { color: colors.textSecondary }]}>
            The admin approval integration is not yet active. This feature will
            be enabled in the next development stage.
          </Text>

          {/* Stage note */}
          <View
            style={[
              styles.stageNote,
              { backgroundColor: colors.surfaceSubtle ?? colors.surface, borderColor: colors.borderSubtle },
            ]}
          >
            <Text style={[styles.stageNoteText, { color: colors.textSecondary }]}>
              Stage 3.2 — Firebase Auth connected.{'\n'}
              Stage 3.3 — Firestore profile &amp; admin approval (upcoming).
            </Text>
          </View>

          {/* Sign out */}
          <Button
            label="Sign Out"
            onPress={handleSignOut}
            variant="secondary"
            icon={<LogOut size={16} color={colors.textPrimary} />}
            fullWidth
            style={styles.signOutButton}
          />
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  card: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.cardPadding * 1.4,
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  accentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.headline,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  successText: {
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 12,
    fontWeight: '600',
  },
  identity: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 13,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  body: {
    ...typography.body,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.xs,
  },
  bodySpaced: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  stageNote: {
    borderWidth: 1,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.xl,
    alignSelf: 'stretch',
  },
  stageNoteText: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  signOutButton: {
    marginTop: spacing.xs,
  },
});

