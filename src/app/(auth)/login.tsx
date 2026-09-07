import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, Lock } from 'lucide-react-native';
import {
  ScreenContainer,
  Button,
  AuthHeader,
  AuthInput,
  SocialAuthButton,
} from '@/components';
import { colors, radius, spacing, typography, shadows } from '@/constants';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validate = () => {
    let valid = true;
    setEmailError('');
    setPasswordError('');

    if (!email.trim()) {
      setEmailError('Institutional email is required');
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

  const handleSignIn = () => {
    if (!validate()) return;

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      // Direct to Onboarding Welcome
      router.push('/(onboarding)/welcome' as any);
    }, 600);
  };

  const handleGoogleSignIn = () => {
    Alert.alert(
      'Google Sign-In',
      'Google authentication UI simulated. Proceeding to Onboarding...',
      [
        {
          text: 'Continue',
          onPress: () => router.push('/(onboarding)/welcome' as any),
        },
      ]
    );
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
        <View style={styles.card}>
          <AuthInput
            label="Email"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (emailError) setEmailError('');
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
            fullWidth
            style={styles.signInButton}
          />

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Auth */}
          <SocialAuthButton onPress={handleGoogleSignIn} />
        </View>

        {/* Footer Navigation */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push('/(auth)/sign-up' as any)}
          >
            <Text style={styles.createAccountText}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingVertical: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.cardPadding,
    ...shadows.card,
  },
  signInButton: {
    marginTop: spacing.xs,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginHorizontal: spacing.md,
    textTransform: 'uppercase',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  footerText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  createAccountText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
});
