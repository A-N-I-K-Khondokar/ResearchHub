import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, Lock } from 'lucide-react-native';
import {
  ScreenContainer,
  Button,
  AuthHeader,
  AuthInput,
  SocialAuthButton,
} from '@/components';
import { radius, spacing, typography, fontFamilies, shadows } from '@/constants';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';

export default function LoginScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { signInWithEmail, signInWithGoogle } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [globalError, setGlobalError] = useState('');

  const validate = () => {
    let valid = true;
    setEmailError('');
    setPasswordError('');
    setGlobalError('');

    if (!email.trim()) {
      setEmailError('Email is required');
      valid = false;
    } else if (!email.includes('@')) {
      setEmailError('Please enter a valid email address');
      valid = false;
    }

    if (!password) {
      setPasswordError('Password is required');
      valid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      valid = false;
    }

    return valid;
  };

  const handleSignIn = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      await signInWithEmail({ email: email.trim(), password });
      // AuthGuard in _layout.tsx handles navigation based on emailVerified state
    } catch (error: any) {
      setGlobalError(error?.message ?? 'Sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGlobalError('');
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      // AuthGuard handles navigation
    } catch (error: any) {
      // Native Expo Go limitation message
      const isNative = Platform.OS !== 'web';
      if (isNative && error?.code === 'google/client-id-missing') {
        setGlobalError(
          'Google Sign-In on mobile requires a custom development build and Google OAuth configuration. Email/password sign-in is available in Expo Go.',
        );
      } else {
        setGlobalError(error?.message ?? 'Google Sign-In failed. Please try again.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <ScreenContainer scrollable withKeyboardAvoidance>
      <View style={styles.content}>
        {/* Header Branding */}
        <AuthHeader
          title="CSE Research Hub"
          subtitle="Sign in to access research data and networking"
        />

        {/* Card Form */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.borderSubtle,
              shadowOpacity: isDark ? 0 : 0.04,
            },
          ]}
        >
          {/* Global error banner */}
          {globalError ? (
            <View
              style={[
                styles.errorBanner,
                { backgroundColor: colors.errorLight, borderColor: colors.error },
              ]}
            >
              <Text style={[styles.errorBannerText, { color: colors.error }]}>
                {globalError}
              </Text>
            </View>
          ) : null}

          <AuthInput
            label="Email"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (emailError) setEmailError('');
              if (globalError) setGlobalError('');
            }}
            placeholder="researcher@university.edu"
            keyboardType="email-address"
            error={emailError}
            leftIcon={<Mail size={18} color={colors.textSecondary} />}
          />

          <AuthInput
            label="Password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (passwordError) setPasswordError('');
              if (globalError) setGlobalError('');
            }}
            placeholder="••••••••"
            isPassword
            error={passwordError}
            leftIcon={<Lock size={18} color={colors.textSecondary} />}
            rightAction={{
              label: 'Forgot Password?',
              onPress: () => router.push('/(auth)/forgot-password' as any),
            }}
          />

          <Button
            label="Sign In"
            onPress={handleSignIn}
            loading={loading}
            disabled={loading || googleLoading}
            fullWidth
            style={styles.signInButton}
            size="lg"
          />

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: colors.borderSubtle }]} />
            <Text style={[styles.dividerText, { color: colors.textSecondary }]}>or</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.borderSubtle }]} />
          </View>

          {/* Social Auth */}
          <SocialAuthButton
            onPress={handleGoogleSignIn}
            disabled={loading || googleLoading}
          />
        </View>

        {/* Footer Navigation */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            Don't have an account?{' '}
          </Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push('/(auth)/sign-up' as any)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={[styles.createAccountText, { color: colors.primary }]}>
              Create Account
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.sm,
  },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: 24,
    shadowColor: '#071A3E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2,
  },
  errorBanner: {
    borderWidth: 1,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  errorBannerText: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 13,
    lineHeight: 18,
  },
  signInButton: {
    marginTop: spacing.sm,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    ...typography.caption,
    marginHorizontal: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  footerText: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 14.5,
  },
  createAccountText: {
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 14.5,
    fontWeight: '600',
  },
});
