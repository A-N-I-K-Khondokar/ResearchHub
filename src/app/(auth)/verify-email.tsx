import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { MailCheck, ArrowLeft, RefreshCw, ExternalLink } from 'lucide-react-native';
import { ScreenContainer, Button } from '@/components';
import { radius, spacing, typography } from '@/constants';
import { useTheme } from '@/context/ThemeContext';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [resending, setResending] = useState(false);

  const handleOpenEmailApp = () => {
    Alert.alert(
      'Open Email Client',
      'Please check your university inbox. For this preview, you can proceed directly to onboarding.',
      [
        {
          text: 'Proceed to Onboarding',
          onPress: () => router.push('/(onboarding)/welcome' as any),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleResendLink = () => {
    setResending(true);
    setTimeout(() => {
      setResending(false);
      Alert.alert('Link Resent', 'A fresh verification link has been sent to your institutional email.');
    }, 800);
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
          <Text style={[styles.body, { color: colors.textSecondary }]}>
            We've sent a verification link to your institutional email. Please check your inbox to activate your research account.
          </Text>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <Button
              label="Open Email App"
              onPress={handleOpenEmailApp}
              variant="primary"
              icon={<ExternalLink size={16} color={colors.textInverse} />}
              fullWidth
            />

            <Button
              label="Resend Link"
              onPress={handleResendLink}
              variant="secondary"
              loading={resending}
              icon={<RefreshCw size={16} color={colors.secondaryDark} />}
              fullWidth
              style={styles.resendButton}
            />
          </View>

          {/* Return to Login */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.replace('/(auth)/login' as any)}
              style={styles.backLink}
            >
              <ArrowLeft size={16} color={colors.textSecondary} />
              <Text style={[styles.backText, { color: colors.textSecondary }]}>Return to login</Text>
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
    marginBottom: spacing.sm,
  },
  body: {
    ...typography.body,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.sm,
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
