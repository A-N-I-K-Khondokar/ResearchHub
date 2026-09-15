import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { User, Mail, Lock, Building, Calendar } from 'lucide-react-native';
import {
  ScreenContainer,
  Button,
  AuthHeader,
  AuthInput,
  SocialAuthButton,
  SuccessModal,
} from '@/components';
import { radius, spacing, typography, fontFamilies } from '@/constants';
import { useTheme } from '@/context/ThemeContext';

export default function SignUpScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [department, setDepartment] = useState('CSE');
  const [batch, setBatch] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: 'Account Created',
    message: 'Your research profile has been registered. Please verify your institutional email to proceed.',
    targetRoute: '/(auth)/verify-email',
  });

  // Errors
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');

  const validate = () => {
    let valid = true;
    setNameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmError('');

    if (!fullName.trim()) {
      setNameError('Full name is required');
      valid = false;
    }

    if (!email.trim()) {
      setEmailError('Institutional email is required');
      valid = false;
    } else if (!email.includes('@')) {
      setEmailError('Please enter a valid academic email');
      valid = false;
    }

    if (!password) {
      setPasswordError('Password is required');
      valid = false;
    } else if (password.length < 6) {
      setPasswordError('At least 6 characters required');
      valid = false;
    }

    if (password !== confirmPassword) {
      setConfirmError('Passwords do not match');
      valid = false;
    }

    return valid;
  };

  const handleSignUp = () => {
    if (!validate()) return;

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setModalConfig({
        title: 'Account Created',
        message: 'Your academic profile has been registered. Please verify your institutional email to proceed.',
        targetRoute: '/(auth)/verify-email',
      });
      setShowSuccessModal(true);
    }, 600);
  };

  const handleGoogleSignUp = () => {
    setModalConfig({
      title: 'Google Sign-In Successful',
      message: 'Your institutional Google account has been connected. Welcome to CSE Research Hub.',
      targetRoute: '/(onboarding)/welcome',
    });
    setShowSuccessModal(true);
  };

  const handleModalClose = () => {
    setShowSuccessModal(false);
    router.push(modalConfig.targetRoute as any);
  };

  return (
    <ScreenContainer scrollable withKeyboardAvoidance>
      <View style={styles.content}>
        {/* Header */}
        <AuthHeader
          title="Create Research Identity"
          subtitle="Join the academic network for structured research data."
        />

        {/* Form Card */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.borderSubtle,
              shadowOpacity: isDark ? 0 : 0.04,
              elevation: isDark ? 0 : 2,
            },
          ]}
        >
          <AuthInput
            label="Full Name"
            value={fullName}
            onChangeText={(text) => {
              setFullName(text);
              if (nameError) setNameError('');
            }}
            placeholder="Dr. Anik Khondokar / Jane Doe"
            error={nameError}
            leftIcon={<User size={18} color={colors.textSecondary} />}
          />

          <AuthInput
            label="Institutional Email"
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

          {/* Vertically Stacked Passwords */}
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
          />

          <AuthInput
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (confirmError) setConfirmError('');
            }}
            placeholder="••••••••"
            isPassword
            error={confirmError}
            leftIcon={<Lock size={18} color={colors.textSecondary} />}
          />

          {/* Academic Affiliation Section - Vertically Stacked */}
          <View
            style={[
              styles.affiliationSection,
              { borderTopColor: colors.borderSubtle },
            ]}
          >
            <Text style={[styles.affiliationTitle, { color: colors.textSecondary }]}>
              Academic Affiliation (Optional)
            </Text>
            <AuthInput
              label="Department"
              value={department}
              onChangeText={setDepartment}
              placeholder="e.g., CSE"
              leftIcon={<Building size={18} color={colors.textSecondary} />}
            />
            <AuthInput
              label="Batch / Designation"
              value={batch}
              onChangeText={setBatch}
              placeholder="e.g., Batch 232"
              leftIcon={<Calendar size={18} color={colors.textSecondary} />}
            />
          </View>

          <Button
            label="Create Account"
            onPress={handleSignUp}
            loading={loading}
            fullWidth
            size="lg"
            style={styles.createButton}
          />

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: colors.borderSubtle }]} />
            <Text style={[styles.dividerText, { color: colors.textSecondary }]}>OR</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.borderSubtle }]} />
          </View>

          <SocialAuthButton onPress={handleGoogleSignUp} />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>Already have an account? </Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push('/(auth)/login' as any)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={[styles.signInText, { color: colors.primary }]}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>

      <SuccessModal
        visible={showSuccessModal}
        title={modalConfig.title}
        message={modalConfig.message}
        onClose={handleModalClose}
      />
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
    shadowRadius: 16,
  },
  affiliationSection: {
    marginTop: spacing.xs,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    marginBottom: spacing.xs,
  },
  affiliationTitle: {
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  createButton: {
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
  signInText: {
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 14.5,
    fontWeight: '600',
  },
});
