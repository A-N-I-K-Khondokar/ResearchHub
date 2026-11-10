import React, { useState, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { MailCheck, ArrowLeft, RefreshCw, CheckCircle } from 'lucide-react-native';
import { ScreenContainer, Button } from '@/components';
import { radius, spacing, typography, fontFamilies } from '@/constants';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';

/** Resend cooldown in seconds */
const RESEND_COOLDOWN_SECONDS = 60;

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { firebaseUser, emailVerified, sendVerificationEmail, reloadCurrentUser, signOut } = useAuth();

  const [resending, setResending] = useState(false);
  const [checkingVerification, setCheckingVerification] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [resendError, setResendError] = useState('');
  const [checkError, setCheckError] = useState('');
  const cooldownTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // ---------------------------------------------------------------------------
  // Resend verification email with cooldown
  // ---------------------------------------------------------------------------

  const startCooldown = useCallback(() => {
    setCooldownSeconds(RESEND_COOLDOWN_SECONDS);
    if (cooldownTimer.current) clearInterval(cooldownTimer.current);
    cooldownTimer.current = setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev <= 1) {
          if (cooldownTimer.current) clearInterval(cooldownTimer.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const handleResendLink = async () => {
    if (cooldownSeconds > 0 || resending) return;
    setResendError('');
    setResending(true);
    try {
      await sendVerificationEmail();
      startCooldown();
      Alert.alert(
        'Verification Email Sent',
        'A fresh verification link has been sent to your email address. Please check your inbox.',
      );
    } catch (error: any) {
      setResendError(error?.message ?? 'Failed to resend verification email. Please try again.');
    } finally {
      setResending(false);
    }
  };

  // ---------------------------------------------------------------------------
  // "I've verified my email" — reload from Firebase and redirect
  // ---------------------------------------------------------------------------

  const handleCheckVerification = async () => {
    setCheckError('');
    setCheckingVerification(true);
    try {
      await reloadCurrentUser();
      // After reload, emailVerified state is updated via AuthContext.
      // AuthGuard in _layout.tsx will redirect automatically if verified.
      // We also check immediately for a faster UX:
      if (firebaseUser?.emailVerified) {
        // Verified — AuthGuard will route to account-setup
        router.replace('/(auth)/account-setup' as any);
      } else {
        Alert.alert(
          'Not Yet Verified',
          "We couldn't confirm your email verification. Please open the link in your email and try again.",
        );
      }
    } catch (error: any) {
      setCheckError(error?.message ?? 'Could not check verification status. Please try again.');
    } finally {
      setCheckingVerification(false);
    }
  };

  const handleReturnToLogin = async () => {
    try {
      await signOut();
    } catch {
      // ignore
    }
    router.replace('/(auth)/login' as any);
  };

  return (
    <ScreenContainer scrollable>
      <View style={styles.container}>
        {/* Verification Card */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          {/* Icon Badge */}
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor: colors.primaryMuted,
                borderColor: colors.primaryLight,
              },
            ]}
          >
            <MailCheck size={40} color={colors.primary} />
          </View>

          {/* Title and Message */}
          <Text style={[styles.title, { color: colors.textPrimary }]}>Verify your email</Text>

          {firebaseUser?.email ? (
            <Text style={[styles.emailLabel, { color: colors.textSecondary }]}>
              Sent to{' '}
              <Text style={{ color: colors.textPrimary, fontFamily: fontFamilies.sansSemiBold }}>
                {firebaseUser.email}
              </Text>
            </Text>
          ) : null}

          <Text style={[styles.body, { color: colors.textSecondary }]}>
            We've sent a verification link to your email. Click the link to activate your
            research account, then tap the button below.
          </Text>

          {/* Error banners */}
          {checkError ? (
            <View
              style={[
                styles.errorBanner,
                { backgroundColor: colors.errorLight, borderColor: colors.error },
              ]}
            >
              <Text style={[styles.errorText, { color: colors.error }]}>
                {checkError}
              </Text>
            </View>
          ) : null}

          {resendError ? (
            <View
              style={[
                styles.errorBanner,
                { backgroundColor: colors.errorLight, borderColor: colors.error },
              ]}
            >
              <Text style={[styles.errorText, { color: colors.error }]}>
                {resendError}
              </Text>
            </View>
          ) : null}

          {/* Action Buttons */}
          <View style={styles.actions}>
            {/* Primary: check verification */}
            <Button
              label="I've Verified My Email"
              onPress={handleCheckVerification}
              variant="primary"
              loading={checkingVerification}
              disabled={checkingVerification || resending}
              icon={<CheckCircle size={16} color={colors.textInverse} />}
              fullWidth
            />

            {/* Secondary: resend with cooldown */}
            <Button
              label={
                cooldownSeconds > 0
                  ? `Resend in ${cooldownSeconds}s`
                  : resending
                  ? 'Sending...'
                  : 'Resend Link'
              }
              onPress={handleResendLink}
              variant="secondary"
              loading={resending}
              disabled={resending || cooldownSeconds > 0 || checkingVerification}
              icon={<RefreshCw size={16} color={colors.textPrimary} />}
              fullWidth
              style={styles.resendButton}
            />
          </View>

          {/* Return to Login */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleReturnToLogin}
              style={styles.backLink}
            >
              <ArrowLeft size={16} color={colors.textSecondary} />
              <Text style={[styles.backText, { color: colors.textSecondary }]}>
                Return to login
              </Text>
            </TouchableOpacity>
          </View>
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
    padding: spacing.cardPadding * 1.5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.headline,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  emailLabel: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  body: {
    ...typography.body,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.sm,
  },
  errorBanner: {
    borderWidth: 1,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginBottom: spacing.md,
    alignSelf: 'stretch',
  },
  errorText: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 13,
    lineHeight: 18,
  },
  actions: {
    width: '100%',
    gap: spacing.sm,
  },
  resendButton: {
    marginTop: spacing.xs,
  },
  footer: {
    marginTop: spacing.xl,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    width: '100%',
    alignItems: 'center',
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  backText: {
    ...typography.caption,
    fontWeight: '600',
  },
});
