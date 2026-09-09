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
} from '@/components';
import { radius, spacing, typography } from '@/constants';
import { useTheme } from '@/context/ThemeContext';

export default function SignUpScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [department, setDepartment] = useState('CSE');
  const [batch, setBatch] = useState('');
  const [loading, setLoading] = useState(false);

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
      router.push('/(auth)/verify-email' as any);
    }, 600);
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
              borderColor: colors.border,
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

          <View style={styles.row}>
            <View style={styles.halfCol}>
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
            </View>

            <View style={styles.halfCol}>
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
            </View>
          </View>

          {/* Academic Affiliation Section */}
          <View
            style={[
              styles.affiliationSection,
              { borderTopColor: colors.border },
            ]}
          >
            <Text style={[styles.affiliationTitle, { color: colors.textSecondary }]}>
              Academic Affiliation (Optional)
            </Text>
            <View style={styles.row}>
              <View style={styles.halfCol}>
                <AuthInput
                  label="Department"
                  value={department}
                  onChangeText={setDepartment}
                  placeholder="e.g., CSE"
                  leftIcon={<Building size={18} color={colors.textSecondary} />}
                />
              </View>
              <View style={styles.halfCol}>
                <AuthInput
                  label="Batch / Designation"
                  value={batch}
                  onChangeText={setBatch}
                  placeholder="e.g., 2024 / Batch 14"
                  leftIcon={<Calendar size={18} color={colors.textSecondary} />}
                />
              </View>
            </View>
          </View>

          <Button
            label="Create Account"
            onPress={handleSignUp}
            loading={loading}
            fullWidth
            style={styles.createButton}
          />

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.textSecondary }]}>OR</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          <SocialAuthButton onPress={() => router.push('/(onboarding)/welcome' as any)} />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>Already have an account? </Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push('/(auth)/login' as any)}
          >
            <Text style={[styles.signInText, { color: colors.primary }]}>Sign In</Text>
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
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.cardPadding,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  halfCol: {
    flex: 1,
  },
  affiliationSection: {
    marginTop: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    marginBottom: spacing.xs,
  },
  affiliationTitle: {
    ...typography.caption,
    fontWeight: '600',
    marginBottom: spacing.xs + 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  createButton: {
    marginTop: spacing.sm,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    ...typography.caption,
    marginHorizontal: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  footerText: {
    ...typography.body,
  },
  signInText: {
    ...typography.body,
    fontWeight: '600',
  },
});
