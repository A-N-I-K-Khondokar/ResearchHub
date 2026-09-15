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
  SuccessModal,
} from '@/components';
import { radius, spacing, typography, fontFamilies, shadows } from '@/constants';
import { useTheme } from '@/context/ThemeContext';

export default function LoginScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [modalContent, setModalContent] = useState({
    title: 'Welcome Back',
    message: 'Your authentication was successful. Welcome back to CSE Research Hub.',
  });

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
      setModalContent({
        title: 'Welcome Back',
        message: 'Your authentication was successful. Redirecting to your academic dashboard.',
      });
      setShowSuccessModal(true);
    }, 600);
  };

  const handleGoogleSignIn = () => {
    setModalContent({
      title: 'Google Sign-In',
      message: 'Institutional Google authentication successful. Welcome back to CSE Research Hub.',
    });
    setShowSuccessModal(true);
  };

  const handleModalClose = () => {
    setShowSuccessModal(false);
    router.push('/(onboarding)/welcome' as any);
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
            size="lg" // Larger, premium button height
          />

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: colors.borderSubtle }]} />
            <Text style={[styles.dividerText, { color: colors.textSecondary }]}>or</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.borderSubtle }]} />
          </View>

          {/* Social Auth */}
          <SocialAuthButton onPress={handleGoogleSignIn} />
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

      <SuccessModal
        visible={showSuccessModal}
        title={modalContent.title}
        message={modalContent.message}
        onClose={handleModalClose}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.sm, // Slightly narrower overall width for a more focused modal feel on tablets/wide screens
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
