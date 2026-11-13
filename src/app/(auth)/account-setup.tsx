import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Clock,
  ShieldCheck,
  LogOut,
  User as UserIcon,
  GraduationCap,
  BookOpen,
  Plus,
  X,
  Globe,
  Github,
  Linkedin,
  FileText,
  CircleAlert,
  TriangleAlert,
  CircleCheck,
  RefreshCw,
  Mail,
  Building2,
  Check,
} from 'lucide-react-native';
import { ScreenContainer, Button, Avatar } from '@/components';
import { radius, spacing, typography, fontFamilies } from '@/constants';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { createPendingUserProfile } from '@/services/user.service';
import type {
  CreatePendingUserProfileInput,
  UserSocialLinks,
} from '@/types/user.types';

// ---------------------------------------------------------------------------
// Predefined Academic & Research Domain Suggestions
// ---------------------------------------------------------------------------

const COMMON_DESIGNATIONS = [
  'Undergraduate Student',
  'Graduate Researcher',
  'Lecturer',
  'Assistant Professor',
  'Associate Professor',
  'Professor',
  'Alumni Researcher',
] as const;

const COMMON_PROGRAMS = [
  'B.Sc. in CSE',
  'M.Sc. in CSE',
  'Ph.D. in CSE',
  'Faculty Member',
] as const;

const SUGGESTED_INTERESTS = [
  'Machine Learning',
  'Computer Vision',
  'Natural Language Processing',
  'Artificial Intelligence',
  'Cloud Computing',
  'Cybersecurity',
  'Software Engineering',
  'Distributed Systems',
  'Bioinformatics',
  'Human-Computer Interaction',
  'Robotics',
  'Data Science',
] as const;

// ---------------------------------------------------------------------------
// Date / Timestamp Formatter (Defensive against unresolved serverTimestamp)
// ---------------------------------------------------------------------------

function formatTimestamp(timestamp: unknown): string {
  if (!timestamp) return 'Just now';
  try {
    if (typeof (timestamp as any).toDate === 'function') {
      return (timestamp as any).toDate().toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    if (timestamp instanceof Date) {
      return timestamp.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  } catch {
    return 'Just now';
  }
  return 'Just now';
}

// ---------------------------------------------------------------------------
// Account Setup Screen (Stage 3.5.1)
// ---------------------------------------------------------------------------

export default function AccountSetupScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const {
    firebaseUser,
    userProfile,
    accessState,
    isProfileLoading,
    profileError,
    signOut,
    reloadCurrentUser,
  } = useAuth();

  // -------------------------------------------------------------------------
  // Form State (Section A, B, C)
  // -------------------------------------------------------------------------

  const [displayName, setDisplayName] = useState(
    firebaseUser?.displayName || '',
  );
  const [photoURL, setPhotoURL] = useState(firebaseUser?.photoURL || '');
  const [department, setDepartment] = useState(
    'Computer Science and Engineering',
  );
  const [designation, setDesignation] = useState('');
  const [program, setProgram] = useState('');
  const [batch, setBatch] = useState('');
  const [studentId, setStudentId] = useState('');
  const [bio, setBio] = useState('');
  const [researchInterests, setResearchInterests] = useState<string[]>([]);
  const [customInterestInput, setCustomInterestInput] = useState('');

  // Social Links
  const [website, setWebsite] = useState('');
  const [github, setGithub] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [googleScholar, setGoogleScholar] = useState('');
  const [researchGate, setResearchGate] = useState('');

  // Validation & Submission State
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Sync initial displayName/photoURL if auth user loads later
  useEffect(() => {
    if (firebaseUser?.displayName && !displayName) {
      setDisplayName(firebaseUser.displayName);
    }
    if (firebaseUser?.photoURL && !photoURL) {
      setPhotoURL(firebaseUser.photoURL);
    }
  }, [firebaseUser?.displayName, firebaseUser?.photoURL]);

  // -------------------------------------------------------------------------
  // Common Actions
  // -------------------------------------------------------------------------

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/(auth)/login' as any);
    } catch {
      router.replace('/(auth)/login' as any);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await reloadCurrentUser();
    } catch (err) {
      console.error('[AccountSetup] Refresh error:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // -------------------------------------------------------------------------
  // Research Interest Chip Handlers
  // -------------------------------------------------------------------------

  const toggleInterest = (interest: string) => {
    const trimmed = interest.trim();
    if (!trimmed) return;

    if (researchInterests.some((item) => item.toLowerCase() === trimmed.toLowerCase())) {
      setResearchInterests((prev) =>
        prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase()),
      );
    } else {
      if (researchInterests.length >= 30) {
        setErrors((prev) => ({
          ...prev,
          researchInterests: 'Maximum 30 research interests allowed.',
        }));
        return;
      }
      setResearchInterests((prev) => [...prev, trimmed]);
      setErrors((prev) => {
        const next = { ...prev };
        delete next.researchInterests;
        return next;
      });
    }
  };

  const addCustomInterest = () => {
    const trimmed = customInterestInput.trim();
    if (!trimmed) return;

    if (researchInterests.some((item) => item.toLowerCase() === trimmed.toLowerCase())) {
      setCustomInterestInput('');
      return;
    }

    if (researchInterests.length >= 30) {
      setErrors((prev) => ({
        ...prev,
        researchInterests: 'Maximum 30 research interests allowed.',
      }));
      return;
    }

    setResearchInterests((prev) => [...prev, trimmed]);
    setCustomInterestInput('');
    setErrors((prev) => {
      const next = { ...prev };
      delete next.researchInterests;
      return next;
    });
  };

  const removeInterest = (interest: string) => {
    setResearchInterests((prev) =>
      prev.filter((item) => item.toLowerCase() !== interest.toLowerCase()),
    );
  };

  // -------------------------------------------------------------------------
  // Form Validation & Submission
  // -------------------------------------------------------------------------

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!displayName.trim()) {
      newErrors.displayName = 'Full Name is required.';
    } else if (displayName.trim().length > 100) {
      newErrors.displayName = 'Full Name must be 100 characters or less.';
    }

    if (!department.trim()) {
      newErrors.department = 'Department is required.';
    } else if (department.trim().length > 100) {
      newErrors.department = 'Department must be 100 characters or less.';
    }

    if (!designation.trim()) {
      newErrors.designation = 'Designation is required.';
    } else if (designation.trim().length > 100) {
      newErrors.designation = 'Designation must be 100 characters or less.';
    }

    if (program.trim().length > 100) {
      newErrors.program = 'Program must be 100 characters or less.';
    }

    if (batch.trim().length > 50) {
      newErrors.batch = 'Batch must be 50 characters or less.';
    }

    if (studentId.trim().length > 50) {
      newErrors.studentId = 'Student/Faculty ID must be 50 characters or less.';
    }

    if (bio.trim().length > 2000) {
      newErrors.bio = 'Biography must be 2000 characters or less.';
    }

    if (photoURL.trim().length > 500) {
      newErrors.photoURL = 'Photo URL must be 500 characters or less.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitProfile = async () => {
    if (isSubmittingRef.current) return;
    setSubmitError(null);

    if (!firebaseUser) {
      setSubmitError('You must be signed in to submit your profile.');
      return;
    }

    if (!firebaseUser.emailVerified) {
      setSubmitError('Email verification is required before submitting your profile.');
      return;
    }

    if (!validateForm()) {
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      const socialLinks: UserSocialLinks = {};
      if (website.trim()) socialLinks.website = website.trim();
      if (github.trim()) socialLinks.github = github.trim();
      if (linkedin.trim()) socialLinks.linkedin = linkedin.trim();
      if (googleScholar.trim()) socialLinks.googleScholar = googleScholar.trim();
      if (researchGate.trim()) socialLinks.researchGate = researchGate.trim();

      const input: CreatePendingUserProfileInput = {
        displayName: displayName.trim(),
        photoURL: photoURL.trim() || null,
        department: department.trim(),
        program: program.trim() || null,
        batch: batch.trim() || null,
        studentId: studentId.trim() || null,
        designation: designation.trim(),
        bio: bio.trim() || null,
        researchInterests: researchInterests,
        socialLinks: Object.keys(socialLinks).length > 0 ? socialLinks : undefined,
      };

      await createPendingUserProfile(firebaseUser, input);
      // Success! Real-time snapshot in AuthContext transitions accessState to 'pending'.
    } catch (err: any) {
      console.error('[AccountSetup] Submission failed:', err);
      let errorMsg =
        err?.message ||
        'Failed to submit profile. Please verify your connection and try again.';
      if (errorMsg.includes('permission-denied') || errorMsg.includes('PERMISSION_DENIED')) {
        errorMsg =
          'Permission denied. Please ensure your email is verified and required fields match institutional guidelines.';
      } else if (errorMsg.includes('already exists')) {
        errorMsg = 'A profile already exists for this account.';
      }
      setSubmitError(errorMsg);
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  // =========================================================================
  // VIEW: 1. Loading State (profile-loading)
  // =========================================================================

  if (isProfileLoading || accessState === 'profile-loading') {
    return (
      <ScreenContainer scrollable={false}>
        <View style={styles.centerContainer}>
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                width: '100%',
                maxWidth: 420,
              },
            ]}
          >
            <View style={[styles.accentBar, { backgroundColor: colors.primary }]} />
            <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: spacing.xl }} />
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              Checking Profile Status
            </Text>
            <Text style={[styles.body, { color: colors.textSecondary, marginTop: spacing.xs }]}>
              Retrieving your CSE Research Hub credentials...
            </Text>
          </View>
        </View>
      </ScreenContainer>
    );
  }

  // =========================================================================
  // VIEW: 2. Error State (profile-error)
  // =========================================================================

  if (accessState === 'profile-error') {
    return (
      <ScreenContainer scrollable>
        <View style={styles.centerContainer}>
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                width: '100%',
                maxWidth: 420,
              },
            ]}
          >
            <View style={[styles.accentBar, { backgroundColor: colors.error }]} />

            <View
              style={[
                styles.iconCircle,
                {
                  backgroundColor: colors.errorLight,
                  borderColor: colors.error,
                },
              ]}
            >
              <CircleAlert size={40} color={colors.error} />
            </View>

            <Text style={[styles.title, { color: colors.textPrimary }]}>
              Profile Connection Error
            </Text>

            <Text style={[styles.body, { color: colors.textSecondary, marginVertical: spacing.md }]}>
              {profileError?.message ||
                'Unable to retrieve your user profile from Cloud Firestore. Please check your network connection.'}
            </Text>

            <Button
              label="Retry Connection"
              onPress={handleRefresh}
              variant="primary"
              icon={<RefreshCw size={16} color={colors.textInverse} />}
              loading={isRefreshing}
              fullWidth
              style={{ marginBottom: spacing.sm }}
            />

            <Button
              label="Sign Out"
              onPress={handleSignOut}
              variant="secondary"
              icon={<LogOut size={16} color={colors.textPrimary} />}
              fullWidth
            />
          </View>
        </View>
      </ScreenContainer>
    );
  }

  // =========================================================================
  // VIEW: 3. Pending Review State (pending)
  // =========================================================================

  if (accessState === 'pending') {
    return (
      <ScreenContainer scrollable>
        <View style={styles.centerContainer}>
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                width: '100%',
                maxWidth: 520,
              },
            ]}
          >
            <View style={[styles.accentBar, { backgroundColor: colors.accent }]} />

            <View
              style={[
                styles.iconCircle,
                {
                  backgroundColor: colors.accentLight,
                  borderColor: colors.accent,
                },
              ]}
            >
              <Clock size={40} color={colors.accent} />
            </View>

            <Text style={[styles.title, { color: colors.textPrimary }]}>
              Approval Request Pending
            </Text>

            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: colors.accentLight,
                  borderColor: colors.accent,
                },
              ]}
            >
              <Clock size={13} color={colors.accent} />
              <Text style={[styles.statusBadgeText, { color: colors.accent }]}>
                Awaiting Administrative Review
              </Text>
            </View>

            <Text style={[styles.body, { color: colors.textSecondary, marginBottom: spacing.lg }]}>
              Your profile application has been successfully submitted to the CSE
              Department administration. Once your institutional credentials are
              verified, full access to research discovery and publications will be
              activated.
            </Text>

            {/* Profile Summary Card */}
            {userProfile ? (
              <View
                style={[
                  styles.detailsContainer,
                  {
                    backgroundColor: colors.surfaceSubtle,
                    borderColor: colors.borderSubtle,
                  },
                ]}
              >
                <Text style={[styles.detailsHeader, { color: colors.textPrimary }]}>
                  Submitted Profile Details
                </Text>

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Full Name</Text>
                  <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                    {userProfile.displayName}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Email</Text>
                  <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                    {userProfile.email}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Department</Text>
                  <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                    {userProfile.department}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Designation</Text>
                  <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                    {userProfile.designation}
                  </Text>
                </View>

                {userProfile.program ? (
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Program</Text>
                    <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                      {userProfile.program}
                    </Text>
                  </View>
                ) : null}

                {userProfile.batch ? (
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Batch</Text>
                    <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                      {userProfile.batch}
                    </Text>
                  </View>
                ) : null}

                {userProfile.studentId ? (
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>ID</Text>
                    <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                      {userProfile.studentId}
                    </Text>
                  </View>
                ) : null}

                {userProfile.researchInterests && userProfile.researchInterests.length > 0 ? (
                  <View style={{ marginTop: spacing.sm }}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary, marginBottom: 4 }]}>
                      Research Interests
                    </Text>
                    <View style={styles.chipRow}>
                      {userProfile.researchInterests.map((interest, idx) => (
                        <View
                          key={idx}
                          style={[
                            styles.chip,
                            {
                              backgroundColor: colors.primaryMuted,
                              borderColor: colors.primaryLight,
                            },
                          ]}
                        >
                          <Text style={[styles.chipText, { color: colors.primaryDark }]}>
                            {interest}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : null}

                <View style={[styles.detailRow, { marginTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.borderSubtle, paddingTop: spacing.xs }]}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Submitted</Text>
                  <Text style={[styles.detailValue, { color: colors.textMuted }]}>
                    {formatTimestamp(userProfile.requestedAt)}
                  </Text>
                </View>
              </View>
            ) : null}

            <View
              style={[
                styles.noticeBox,
                {
                  backgroundColor: colors.surfaceSubtle,
                  borderColor: colors.borderSubtle,
                },
              ]}
            >
              <Text style={[styles.noticeText, { color: colors.textSecondary }]}>
                Real-time updates are active. Once approved, the application will
                automatically grant access without requiring resubmission.
              </Text>
            </View>

            <Button
              label="Refresh Status"
              onPress={handleRefresh}
              variant="outline"
              icon={<RefreshCw size={16} color={colors.textPrimary} />}
              loading={isRefreshing}
              fullWidth
              style={{ marginBottom: spacing.sm }}
            />

            <Button
              label="Sign Out"
              onPress={handleSignOut}
              variant="secondary"
              icon={<LogOut size={16} color={colors.textPrimary} />}
              fullWidth
            />
          </View>
        </View>
      </ScreenContainer>
    );
  }

  // =========================================================================
  // VIEW: 4. Rejected State (rejected)
  // =========================================================================

  if (accessState === 'rejected') {
    return (
      <ScreenContainer scrollable>
        <View style={styles.centerContainer}>
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                width: '100%',
                maxWidth: 480,
              },
            ]}
          >
            <View style={[styles.accentBar, { backgroundColor: colors.error }]} />

            <View
              style={[
                styles.iconCircle,
                {
                  backgroundColor: colors.errorLight,
                  borderColor: colors.error,
                },
              ]}
            >
              <CircleAlert size={40} color={colors.error} />
            </View>

            <Text style={[styles.title, { color: colors.textPrimary }]}>
              Application Not Approved
            </Text>

            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: colors.errorLight,
                  borderColor: colors.error,
                },
              ]}
            >
              <CircleAlert size={13} color={colors.error} />
              <Text style={[styles.statusBadgeText, { color: colors.error }]}>
                Status: Application Rejected
              </Text>
            </View>

            <Text style={[styles.body, { color: colors.textSecondary, marginBottom: spacing.md }]}>
              Your account application for the CSE Research Hub was reviewed and
              could not be approved at this time.
            </Text>

            {userProfile?.rejectionReason ? (
              <View
                style={[
                  styles.rejectionReasonBox,
                  {
                    backgroundColor: colors.errorLight,
                    borderColor: colors.error,
                  },
                ]}
              >
                <Text style={[styles.rejectionReasonTitle, { color: colors.error }]}>
                  Reviewer Notes:
                </Text>
                <Text style={[styles.rejectionReasonText, { color: colors.textPrimary }]}>
                  {userProfile.rejectionReason}
                </Text>
              </View>
            ) : null}

            <View
              style={[
                styles.noticeBox,
                {
                  backgroundColor: colors.surfaceSubtle,
                  borderColor: colors.borderSubtle,
                  marginBottom: spacing.xl,
                },
              ]}
            >
              <Text style={[styles.noticeText, { color: colors.textSecondary }]}>
                If you believe this decision was made in error or your institutional
                affiliation needs clarification, please contact the CSE Department
                Administrator directly with proof of enrollment or faculty appointment.
              </Text>
            </View>

            <Button
              label="Sign Out"
              onPress={handleSignOut}
              variant="secondary"
              icon={<LogOut size={16} color={colors.textPrimary} />}
              fullWidth
            />
          </View>
        </View>
      </ScreenContainer>
    );
  }

  // =========================================================================
  // VIEW: 5. Suspended State (suspended)
  // =========================================================================

  if (accessState === 'suspended') {
    return (
      <ScreenContainer scrollable>
        <View style={styles.centerContainer}>
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                width: '100%',
                maxWidth: 480,
              },
            ]}
          >
            <View style={[styles.accentBar, { backgroundColor: colors.error }]} />

            <View
              style={[
                styles.iconCircle,
                {
                  backgroundColor: colors.errorLight,
                  borderColor: colors.error,
                },
              ]}
            >
              <TriangleAlert size={40} color={colors.error} />
            </View>

            <Text style={[styles.title, { color: colors.textPrimary }]}>
              Account Suspended
            </Text>

            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: colors.errorLight,
                  borderColor: colors.error,
                },
              ]}
            >
              <TriangleAlert size={13} color={colors.error} />
              <Text style={[styles.statusBadgeText, { color: colors.error }]}>
                Access Suspended
              </Text>
            </View>

            <Text style={[styles.body, { color: colors.textSecondary, marginBottom: spacing.lg }]}>
              Your access to CSE Research Hub features has been suspended by the
              department administration.
            </Text>

            <View
              style={[
                styles.noticeBox,
                {
                  backgroundColor: colors.surfaceSubtle,
                  borderColor: colors.borderSubtle,
                  marginBottom: spacing.xl,
                },
              ]}
            >
              <Text style={[styles.noticeText, { color: colors.textSecondary }]}>
                Please reach out to the CSE department administrator or research
                committee to resolve this suspension.
              </Text>
            </View>

            <Button
              label="Sign Out"
              onPress={handleSignOut}
              variant="secondary"
              icon={<LogOut size={16} color={colors.textPrimary} />}
              fullWidth
            />
          </View>
        </View>
      </ScreenContainer>
    );
  }

  // =========================================================================
  // VIEW: 6. Approved State Fallback (handled by AuthGuard)
  // =========================================================================

  if (accessState === 'approved') {
    return (
      <ScreenContainer scrollable={false}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.body, { color: colors.textSecondary, marginTop: spacing.md }]}>
            Redirecting to CSE Research Hub...
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  // =========================================================================
  // VIEW: 7. Onboarding Form (profile-required)
  // =========================================================================

  return (
    <ScreenContainer scrollable withKeyboardAvoidance>
      <View style={styles.formContainer}>
        {/* Header Banner */}
        <View style={styles.header}>
          <View
            style={[
              styles.headerBadge,
              {
                backgroundColor: colors.primaryMuted,
                borderColor: colors.primaryLight,
              },
            ]}
          >
            <GraduationCap size={14} color={colors.primary} />
            <Text style={[styles.headerBadgeText, { color: colors.primary }]}>
              CSE Department Onboarding
            </Text>
          </View>

          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            Complete Your Profile
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Provide your academic and scholarly details to submit an application
            for administrative approval.
          </Text>
        </View>

        {/* Authenticated Identity Card */}
        <View
          style={[
            styles.identityCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <Avatar
            uri={photoURL || firebaseUser?.photoURL}
            name={displayName || firebaseUser?.email || 'User'}
            size="lg"
          />
          <View style={styles.identityDetails}>
            <Text style={[styles.identityName, { color: colors.textPrimary }]} numberOfLines={1}>
              {displayName || 'Prospective Researcher'}
            </Text>
            <View style={styles.emailRow}>
              <Mail size={13} color={colors.textSecondary} />
              <Text style={[styles.identityEmail, { color: colors.textSecondary }]} numberOfLines={1}>
                {firebaseUser?.email || 'unverified@example.com'}
              </Text>
            </View>
            <View
              style={[
                styles.verifiedPill,
                {
                  backgroundColor: colors.secondaryLight,
                  borderColor: colors.secondary,
                },
              ]}
            >
              <ShieldCheck size={12} color={colors.secondary} />
              <Text style={[styles.verifiedPillText, { color: colors.secondaryDark }]}>
                Verified Firebase Identity
              </Text>
            </View>
          </View>
        </View>

        {/* ================================================================= */}
        {/* Section A — Personal Information */}
        {/* ================================================================= */}
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionIndicator, { backgroundColor: colors.primary }]} />
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Section A — Personal Information
            </Text>
          </View>

          {/* Display Name */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
              Full Display Name <Text style={{ color: colors.error }}>*</Text>
            </Text>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: colors.surfaceSubtle,
                  borderColor: errors.displayName ? colors.error : colors.borderSubtle,
                },
              ]}
            >
              <UserIcon size={18} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                value={displayName}
                onChangeText={(text) => {
                  setDisplayName(text);
                  if (errors.displayName) {
                    setErrors((prev) => {
                      const next = { ...prev };
                      delete next.displayName;
                      return next;
                    });
                  }
                }}
                placeholder="e.g. John Doe, Ph.D."
                placeholderTextColor={colors.textMuted}
                style={[styles.textInput, { color: colors.textPrimary }]}
                maxLength={100}
              />
            </View>
            {errors.displayName ? (
              <Text style={[styles.errorText, { color: colors.error }]}>
                {errors.displayName}
              </Text>
            ) : null}
          </View>

          {/* Profile Photo URL */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
              Profile Photo URL <Text style={[styles.optionalTag, { color: colors.textMuted }]}>optional</Text>
            </Text>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: colors.surfaceSubtle,
                  borderColor: errors.photoURL ? colors.error : colors.borderSubtle,
                },
              ]}
            >
              <Globe size={18} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                value={photoURL}
                onChangeText={(text) => {
                  setPhotoURL(text);
                  if (errors.photoURL) {
                    setErrors((prev) => {
                      const next = { ...prev };
                      delete next.photoURL;
                      return next;
                    });
                  }
                }}
                placeholder="https://example.com/avatar.jpg"
                placeholderTextColor={colors.textMuted}
                style={[styles.textInput, { color: colors.textPrimary }]}
                autoCapitalize="none"
                keyboardType="url"
                maxLength={500}
              />
            </View>
            {errors.photoURL ? (
              <Text style={[styles.errorText, { color: colors.error }]}>
                {errors.photoURL}
              </Text>
            ) : null}
          </View>
        </View>

        {/* ================================================================= */}
        {/* Section B — Academic Information */}
        {/* ================================================================= */}
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionIndicator, { backgroundColor: colors.secondary }]} />
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Section B — Academic Information
            </Text>
          </View>

          {/* Department */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
              Department <Text style={{ color: colors.error }}>*</Text>
            </Text>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: colors.surfaceSubtle,
                  borderColor: errors.department ? colors.error : colors.borderSubtle,
                },
              ]}
            >
              <Building2 size={18} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                value={department}
                onChangeText={(text) => {
                  setDepartment(text);
                  if (errors.department) {
                    setErrors((prev) => {
                      const next = { ...prev };
                      delete next.department;
                      return next;
                    });
                  }
                }}
                placeholder="e.g. Computer Science and Engineering"
                placeholderTextColor={colors.textMuted}
                style={[styles.textInput, { color: colors.textPrimary }]}
                maxLength={100}
              />
            </View>
            {errors.department ? (
              <Text style={[styles.errorText, { color: colors.error }]}>
                {errors.department}
              </Text>
            ) : null}
          </View>

          {/* Designation */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
              Designation / Academic Role <Text style={{ color: colors.error }}>*</Text>
            </Text>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: colors.surfaceSubtle,
                  borderColor: errors.designation ? colors.error : colors.borderSubtle,
                },
              ]}
            >
              <GraduationCap size={18} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                value={designation}
                onChangeText={(text) => {
                  setDesignation(text);
                  if (errors.designation) {
                    setErrors((prev) => {
                      const next = { ...prev };
                      delete next.designation;
                      return next;
                    });
                  }
                }}
                placeholder="e.g. Undergraduate Student, Assistant Professor"
                placeholderTextColor={colors.textMuted}
                style={[styles.textInput, { color: colors.textPrimary }]}
                maxLength={100}
              />
            </View>
            {errors.designation ? (
              <Text style={[styles.errorText, { color: colors.error }]}>
                {errors.designation}
              </Text>
            ) : null}

            {/* Quick Designation Suggestions */}
            <View style={styles.chipRow}>
              {COMMON_DESIGNATIONS.map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.7}
                  onPress={() => {
                    setDesignation(item);
                    if (errors.designation) {
                      setErrors((prev) => {
                        const next = { ...prev };
                        delete next.designation;
                        return next;
                      });
                    }
                  }}
                  style={[
                    styles.chip,
                    {
                      backgroundColor:
                        designation === item
                          ? colors.primary
                          : colors.surfaceSubtle,
                      borderColor:
                        designation === item
                          ? colors.primary
                          : colors.borderSubtle,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      {
                        color:
                          designation === item
                            ? colors.textInverse
                            : colors.textSecondary,
                        fontFamily:
                          designation === item
                            ? fontFamilies.sansSemiBold
                            : fontFamilies.sansRegular,
                      },
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Program */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
              Program <Text style={[styles.optionalTag, { color: colors.textMuted }]}>optional</Text>
            </Text>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: colors.surfaceSubtle,
                  borderColor: errors.program ? colors.error : colors.borderSubtle,
                },
              ]}
            >
              <BookOpen size={18} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                value={program}
                onChangeText={(text) => setProgram(text)}
                placeholder="e.g. B.Sc. in CSE, M.Sc. in CSE"
                placeholderTextColor={colors.textMuted}
                style={[styles.textInput, { color: colors.textPrimary }]}
                maxLength={100}
              />
            </View>
            {/* Quick Program Suggestions */}
            <View style={styles.chipRow}>
              {COMMON_PROGRAMS.map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.7}
                  onPress={() => setProgram(item)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor:
                        program === item ? colors.secondaryDark : colors.surfaceSubtle,
                      borderColor:
                        program === item ? colors.secondaryDark : colors.borderSubtle,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      {
                        color:
                          program === item
                            ? colors.textInverse
                            : colors.textSecondary,
                      },
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Batch & Student ID Row */}
          <View style={styles.twoColumnRow}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: spacing.sm }]}>
              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
                Batch / Cohort
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: colors.surfaceSubtle,
                    borderColor: colors.borderSubtle,
                  },
                ]}
              >
                <TextInput
                  value={batch}
                  onChangeText={(text) => setBatch(text)}
                  placeholder="e.g. Batch 14"
                  placeholderTextColor={colors.textMuted}
                  style={[styles.textInput, { color: colors.textPrimary }]}
                  maxLength={50}
                />
              </View>
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
                Student / Faculty ID
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: colors.surfaceSubtle,
                    borderColor: colors.borderSubtle,
                  },
                ]}
              >
                <TextInput
                  value={studentId}
                  onChangeText={(text) => setStudentId(text)}
                  placeholder="e.g. 190104001"
                  placeholderTextColor={colors.textMuted}
                  style={[styles.textInput, { color: colors.textPrimary }]}
                  maxLength={50}
                />
              </View>
            </View>
          </View>
        </View>

        {/* ================================================================= */}
        {/* Section C — Research Profile */}
        {/* ================================================================= */}
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionIndicator, { backgroundColor: colors.accent }]} />
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Section C — Research Profile
            </Text>
          </View>

          {/* Biography */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
              Scholarly Biography / Focus Summary <Text style={[styles.optionalTag, { color: colors.textMuted }]}>optional</Text>
            </Text>
            <View
              style={[
                styles.textAreaWrapper,
                {
                  backgroundColor: colors.surfaceSubtle,
                  borderColor: errors.bio ? colors.error : colors.borderSubtle,
                },
              ]}
            >
              <TextInput
                value={bio}
                onChangeText={(text) => setBio(text)}
                placeholder="Share a concise summary of your research experience, ongoing projects, or academic objectives..."
                placeholderTextColor={colors.textMuted}
                style={[styles.textArea, { color: colors.textPrimary }]}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={2000}
              />
            </View>
            <Text style={[styles.charCount, { color: colors.textMuted }]}>
              {bio.length}/2000 characters
            </Text>
          </View>

          {/* Research Interests Tags */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
              Research Interests <Text style={[styles.optionalTag, { color: colors.textMuted }]}>up to 30 tags</Text>
            </Text>

            {/* Custom Tag Input Row */}
            <View style={styles.tagInputRow}>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    flex: 1,
                    backgroundColor: colors.surfaceSubtle,
                    borderColor: colors.borderSubtle,
                    marginRight: spacing.xs,
                  },
                ]}
              >
                <TextInput
                  value={customInterestInput}
                  onChangeText={(text) => setCustomInterestInput(text)}
                  onSubmitEditing={addCustomInterest}
                  placeholder="Type an interest & press Add"
                  placeholderTextColor={colors.textMuted}
                  style={[styles.textInput, { color: colors.textPrimary }]}
                  returnKeyType="done"
                  maxLength={50}
                />
              </View>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={addCustomInterest}
                style={[styles.addTagButton, { backgroundColor: colors.primary }]}
              >
                <Plus size={16} color={colors.textInverse} />
                <Text style={[styles.addTagText, { color: colors.textInverse }]}>
                  Add
                </Text>
              </TouchableOpacity>
            </View>

            {/* Selected Interests Chips */}
            {researchInterests.length > 0 ? (
              <View style={styles.selectedChipsContainer}>
                <Text style={[styles.selectedChipsLabel, { color: colors.textSecondary }]}>
                  Selected ({researchInterests.length}):
                </Text>
                <View style={styles.chipRow}>
                  {researchInterests.map((interest, idx) => (
                    <TouchableOpacity
                      key={idx}
                      activeOpacity={0.7}
                      onPress={() => removeInterest(interest)}
                      style={[
                        styles.chip,
                        styles.selectedInterestChip,
                        {
                          backgroundColor: colors.primaryMuted,
                          borderColor: colors.primaryLight,
                        },
                      ]}
                    >
                      <Text style={[styles.chipText, { color: colors.primaryDark }]}>
                        {interest}
                      </Text>
                      <X size={12} color={colors.primaryDark} style={{ marginLeft: 4 }} />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : null}

            {/* Suggested Interests Grid */}
            <View style={{ marginTop: spacing.sm }}>
              <Text style={[styles.suggestedLabel, { color: colors.textMuted }]}>
                Suggested CSE research domains:
              </Text>
              <View style={styles.chipRow}>
                {SUGGESTED_INTERESTS.map((item, idx) => {
                  const isSelected = researchInterests.some(
                    (i) => i.toLowerCase() === item.toLowerCase(),
                  );
                  return (
                    <TouchableOpacity
                      key={idx}
                      activeOpacity={0.7}
                      onPress={() => toggleInterest(item)}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: isSelected
                            ? colors.primary
                            : colors.surfaceSubtle,
                          borderColor: isSelected
                            ? colors.primary
                            : colors.borderSubtle,
                        },
                      ]}
                    >
                      {isSelected ? (
                        <Check
                          size={12}
                          color={colors.textInverse}
                          style={{ marginRight: 4 }}
                        />
                      ) : null}
                      <Text
                        style={[
                          styles.chipText,
                          {
                            color: isSelected
                              ? colors.textInverse
                              : colors.textSecondary,
                            fontFamily: isSelected
                              ? fontFamilies.sansSemiBold
                              : fontFamilies.sansRegular,
                          },
                        ]}
                      >
                        {item}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Academic & Social Links Sub-section */}
          <View style={{ marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.borderSubtle }}>
            <Text style={[styles.subSectionTitle, { color: colors.textPrimary }]}>
              Academic &amp; Social Links <Text style={[styles.optionalTag, { color: colors.textMuted }]}>optional</Text>
            </Text>

            {/* Website */}
            <View style={styles.inputGroup}>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: colors.surfaceSubtle,
                    borderColor: colors.borderSubtle,
                  },
                ]}
              >
                <Globe size={18} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  value={website}
                  onChangeText={(text) => setWebsite(text)}
                  placeholder="Personal Website (https://...)"
                  placeholderTextColor={colors.textMuted}
                  style={[styles.textInput, { color: colors.textPrimary }]}
                  autoCapitalize="none"
                  keyboardType="url"
                />
              </View>
            </View>

            {/* GitHub */}
            <View style={styles.inputGroup}>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: colors.surfaceSubtle,
                    borderColor: colors.borderSubtle,
                  },
                ]}
              >
                <Github size={18} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  value={github}
                  onChangeText={(text) => setGithub(text)}
                  placeholder="GitHub Profile (https://github.com/...)"
                  placeholderTextColor={colors.textMuted}
                  style={[styles.textInput, { color: colors.textPrimary }]}
                  autoCapitalize="none"
                  keyboardType="url"
                />
              </View>
            </View>

            {/* LinkedIn */}
            <View style={styles.inputGroup}>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: colors.surfaceSubtle,
                    borderColor: colors.borderSubtle,
                  },
                ]}
              >
                <Linkedin size={18} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  value={linkedin}
                  onChangeText={(text) => setLinkedin(text)}
                  placeholder="LinkedIn Profile (https://linkedin.com/in/...)"
                  placeholderTextColor={colors.textMuted}
                  style={[styles.textInput, { color: colors.textPrimary }]}
                  autoCapitalize="none"
                  keyboardType="url"
                />
              </View>
            </View>

            {/* Google Scholar */}
            <View style={styles.inputGroup}>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: colors.surfaceSubtle,
                    borderColor: colors.borderSubtle,
                  },
                ]}
              >
                <BookOpen size={18} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  value={googleScholar}
                  onChangeText={(text) => setGoogleScholar(text)}
                  placeholder="Google Scholar Profile URL"
                  placeholderTextColor={colors.textMuted}
                  style={[styles.textInput, { color: colors.textPrimary }]}
                  autoCapitalize="none"
                  keyboardType="url"
                />
              </View>
            </View>

            {/* ResearchGate */}
            <View style={styles.inputGroup}>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: colors.surfaceSubtle,
                    borderColor: colors.borderSubtle,
                  },
                ]}
              >
                <FileText size={18} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  value={researchGate}
                  onChangeText={(text) => setResearchGate(text)}
                  placeholder="ResearchGate Profile URL"
                  placeholderTextColor={colors.textMuted}
                  style={[styles.textInput, { color: colors.textPrimary }]}
                  autoCapitalize="none"
                  keyboardType="url"
                />
              </View>
            </View>
          </View>
        </View>

        {/* Submit Error Banner */}
        {submitError ? (
          <View
            style={[
              styles.errorBanner,
              {
                backgroundColor: colors.errorLight,
                borderColor: colors.error,
              },
            ]}
          >
            <CircleAlert size={18} color={colors.error} style={{ marginRight: spacing.xs }} />
            <Text style={[styles.errorBannerText, { color: colors.error }]}>
              {submitError}
            </Text>
          </View>
        ) : null}

        {/* Submit Action Buttons */}
        <View style={styles.actionsContainer}>
          <Button
            label="Submit Profile for Approval"
            onPress={handleSubmitProfile}
            variant="primary"
            loading={isSubmitting}
            disabled={isSubmitting}
            icon={<CircleCheck size={18} color={colors.textInverse} />}
            fullWidth
            style={{ marginBottom: spacing.md }}
          />

          <Button
            label="Sign Out"
            onPress={handleSignOut}
            variant="ghost"
            icon={<LogOut size={16} color={colors.textSecondary} />}
            fullWidth
          />
        </View>
      </View>
    </ScreenContainer>
  );
}

// ---------------------------------------------------------------------------
// Stylesheet
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  // Containers
  formContainer: {
    paddingVertical: spacing.lg,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  card: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.cardPadding * 1.3,
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
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
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },

  // Headers
  header: {
    marginBottom: spacing.lg,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
    marginBottom: spacing.xs + 4,
  },
  headerBadgeText: {
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 12,
  },
  headerTitle: {
    ...typography.headline,
    fontSize: 24,
    marginBottom: 4,
  },
  headerSubtitle: {
    ...typography.subhead,
    lineHeight: 20,
  },

  // Identity Card
  identityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  identityDetails: {
    marginLeft: spacing.md,
    flex: 1,
  },
  identityName: {
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 16,
    marginBottom: 2,
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  identityEmail: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 13,
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  verifiedPillText: {
    fontFamily: fontFamilies.sansMedium,
    fontSize: 11,
    fontWeight: '600',
  },

  // Sections
  sectionCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.cardPadding,
    marginBottom: spacing.lg,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionIndicator: {
    width: 4,
    height: 18,
    borderRadius: radius.full,
    marginRight: spacing.sm,
  },
  sectionTitle: {
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 15,
  },
  subSectionTitle: {
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 14,
    marginBottom: spacing.sm,
  },

  // Inputs
  inputGroup: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontFamily: fontFamilies.sansMedium,
    fontSize: 13,
    marginBottom: 6,
  },
  optionalTag: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 12,
  },
  inputWrapper: {
    height: 48,
    borderRadius: radius.sm,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    height: '100%',
    fontFamily: fontFamilies.sansRegular,
    fontSize: 14,
    paddingVertical: 0,
  },
  textAreaWrapper: {
    borderRadius: radius.sm,
    borderWidth: 1,
    padding: 12,
    minHeight: 96,
  },
  textArea: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 14,
    lineHeight: 20,
    minHeight: 72,
    padding: 0,
  },
  charCount: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 11,
    textAlign: 'right',
    marginTop: 4,
  },
  errorText: {
    fontFamily: fontFamilies.sansMedium,
    fontSize: 12,
    marginTop: 4,
  },
  twoColumnRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  // Tags & Chips
  tagInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addTagButton: {
    height: 48,
    paddingHorizontal: 16,
    borderRadius: radius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addTagText: {
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 13,
  },
  selectedChipsContainer: {
    marginTop: spacing.sm,
  },
  selectedChipsLabel: {
    fontFamily: fontFamilies.sansMedium,
    fontSize: 12,
    marginBottom: 6,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedInterestChip: {
    paddingRight: 8,
  },
  chipText: {
    fontSize: 12,
    fontFamily: fontFamilies.sansRegular,
  },
  suggestedLabel: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 12,
    marginBottom: 4,
  },

  // Banner & Feedback
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  errorBannerText: {
    flex: 1,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 13,
    lineHeight: 18,
  },

  // Actions
  actionsContainer: {
    marginTop: spacing.sm,
    marginBottom: spacing.xxl,
  },

  // Status Views (Pending, Rejected, Suspended)
  title: {
    ...typography.headline,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.full,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  statusBadgeText: {
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 12,
  },
  body: {
    ...typography.body,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.sm,
  },
  detailsContainer: {
    width: '100%',
    borderRadius: radius.sm,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  detailsHeader: {
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 13,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  detailLabel: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 13,
  },
  detailValue: {
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 13,
  },
  noticeBox: {
    borderWidth: 1,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.lg,
    width: '100%',
  },
  noticeText: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  rejectionReasonBox: {
    width: '100%',
    borderRadius: radius.sm,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  rejectionReasonTitle: {
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 12,
    marginBottom: 2,
  },
  rejectionReasonText: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 13,
    lineHeight: 18,
  },
});
