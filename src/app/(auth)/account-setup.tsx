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
import { AuthBackground } from '@/components/auth/AuthBackground';
import { COMPACT_FONT_SCALE } from '@/constants/typography';
import { useRouter } from 'expo-router';
import {
  Clock,
  ShieldCheck,
  LogOut,
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
  User as UserIcon,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';
import { ICON_STROKE } from '@/constants/icons';
import { ScreenContainer, Button, Avatar, OnboardingProgress } from '@/components';
import { radius, spacing, typography, fontFamilies } from '@/constants';
import { useTheme } from '@/context/ThemeContext';
import { FieldFrame } from '@/components/common/TextField';
import { useAuth } from '@/context/AuthContext';
import { createPendingUserProfile, resubmitApplication } from '@/services/user.service';
import { Skeleton } from '@/components/feedback/Skeleton';
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
  // Four short steps: 1 About you · 2 Academic · 3 Research · 4 Links (optional)
  const [step, setStep] = useState(1);
  const STEP_TITLES = ['About you', 'Academic', 'Research', 'Links'];
  const STEP_COUNT = STEP_TITLES.length;
  const STEP_FIELDS: Record<number, string[]> = {
    1: ['displayName', 'photoURL'],
    2: ['department', 'designation', 'program', 'batch', 'studentId'],
    3: ['bio', 'researchInterests'],
    4: [],
  };

  // Rejected applicants can correct and resubmit their application (Stage 4)
  const [isResubmitting, setIsResubmitting] = useState(false);
  // Show a short list of suggested topics first (43 is a wall of chips).
  const [showAllSuggestions, setShowAllSuggestions] = useState(false);
  const [showSubmitted, setShowSubmitted] = useState(false);

  const startResubmission = () => {
    if (!userProfile) return;
    setDisplayName(userProfile.displayName || '');
    setPhotoURL(userProfile.photoURL || '');
    setDepartment(userProfile.department || '');
    setDesignation(userProfile.designation || '');
    setProgram(userProfile.program || '');
    setBatch(userProfile.batch || '');
    setStudentId(userProfile.studentId || '');
    setBio(userProfile.bio || '');
    setResearchInterests(userProfile.researchInterests ?? []);
    const links = userProfile.socialLinks ?? {};
    setWebsite(links.website || '');
    setGithub(links.github || '');
    setLinkedin(links.linkedin || '');
    setGoogleScholar(links.googleScholar || '');
    setResearchGate(links.researchGate || '');
    setErrors({});
    setSubmitError(null);
    setStep(1);
    setIsResubmitting(true);
  };

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

  const computeErrors = (): Record<string, string> => {
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

    return newErrors;
  };

  const validateForm = (): boolean => {
    const newErrors = computeErrors();
    setErrors(newErrors);
    // Jump back to the first step that still has a problem
    const firstBadStep = [1, 2, 3, 4].find((n) => STEP_FIELDS[n].some((f) => f in newErrors));
    if (firstBadStep && firstBadStep !== step) setStep(firstBadStep);
    return Object.keys(newErrors).length === 0;
  };

  /** Validate only the current step, then advance. */
  const goNext = () => {
    const all = computeErrors();
    const stepErrors = Object.fromEntries(Object.entries(all).filter(([k]) => STEP_FIELDS[step].includes(k)));
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length === 0) setStep((n) => Math.min(STEP_COUNT, n + 1));
  };

  const goBack = () => {
    setErrors({});
    setStep((n) => Math.max(1, n - 1));
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

      if (isResubmitting && userProfile) {
        await resubmitApplication(firebaseUser, userProfile, input);
        // Snapshot moves accessState rejected -> pending; show the pending view.
        setIsResubmitting(false);
        isSubmittingRef.current = false;
        setIsSubmitting(false);
      } else {
        await createPendingUserProfile(firebaseUser, input);
      }
      // Success! Real-time snapshot in AuthContext transitions accessState to 'pending'.
    } catch (err: any) {
      console.error('[AccountSetup] Submission failed:', err);
      let errorMsg =
        err?.message ||
        'Failed to submit profile. Please verify your connection and try again.';
      if (
        err?.code === 'permission-denied' ||
        errorMsg.includes('permission-denied') ||
        errorMsg.includes('PERMISSION_DENIED') ||
        errorMsg.includes('insufficient permissions')
      ) {
        // The applicant can't read the admin outbox, so the most common causes are
        // listed: an old application record still on file, or a stale sign-in token.
        errorMsg =
          "We couldn't submit your profile. If you applied before with this account, ask a CSE admin to clear the old application, then try again. Otherwise sign out and back in, and retry.";
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
      <ScreenContainer scrollable={false} background={<AuthBackground animated={false} />}>
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
            <View style={{ width: '100%', marginVertical: spacing.lg, gap: 8 }}>
              <Skeleton width="60%" height={16} />
              <Skeleton width="100%" height={12} />
              <Skeleton width="80%" height={12} />
            </View>
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
      <ScreenContainer scrollable background={<AuthBackground animated={false} />}>
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
              <CircleAlert size={40} color={colors.error} strokeWidth={ICON_STROKE.light} />
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
    const submitted = userProfile ? formatTimestamp(userProfile.requestedAt) : '';
    const detailRows: [string, string | null | undefined][] = userProfile
      ? [
          ['Name', userProfile.displayName],
          ['Email', userProfile.email],
          ['Department', userProfile.department],
          ['Role', userProfile.designation],
          ['Program', userProfile.program],
          ['Batch', userProfile.batch],
          ['ID', userProfile.studentId],
        ]
      : [];
    const steps: { label: string; sub: string; state: 'done' | 'current' | 'next' }[] = [
      { label: 'Profile submitted', sub: submitted || 'Done', state: 'done' },
      { label: 'Under review', sub: 'A CSE admin checks your details', state: 'current' },
      { label: 'Access granted', sub: 'The app opens automatically', state: 'next' },
    ];

    return (
      <ScreenContainer scrollable background={<AuthBackground animated={false} />}>
        <View style={styles.pendingWrap}>
          {/* Header */}
          <View style={[styles.pendingIcon, { backgroundColor: colors.warningLight }]}>
            <Clock size={26} color={colors.warning} />
          </View>
          <Text style={[styles.pendingTitle, { color: colors.textPrimary }]} accessibilityRole="header">
            Waiting for approval
          </Text>
          <Text style={[styles.pendingText, { color: colors.textSecondary }]}>
            We’ll let you in as soon as an admin approves your profile. You don’t need to keep this screen open.
          </Text>

          {/* Progress */}
          <View style={[styles.pendingCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
            {steps.map((st, i) => {
              const done = st.state === 'done';
              const current = st.state === 'current';
              return (
                <View key={st.label} style={styles.pStep}>
                  <View style={styles.pRail}>
                    <View
                      style={[
                        styles.pDot,
                        done
                          ? { backgroundColor: colors.success, borderColor: colors.success }
                          : current
                            ? { backgroundColor: colors.warningLight, borderColor: colors.warning }
                            : { backgroundColor: colors.surface, borderColor: colors.border },
                      ]}
                    >
                      {done ? <Check size={12} color="#FFFFFF" strokeWidth={3} /> : current ? <View style={[styles.pCore, { backgroundColor: colors.warning }]} /> : null}
                    </View>
                    {i < steps.length - 1 ? (
                      <View style={[styles.pLine, { backgroundColor: done ? colors.success : colors.border }]} />
                    ) : null}
                  </View>
                  <View style={styles.pBody}>
                    <Text style={[styles.pLabel, { color: st.state === 'next' ? colors.textMuted : colors.textPrimary }]}>{st.label}</Text>
                    <Text style={[styles.pSub, { color: colors.textSecondary }]}>{st.sub}</Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Submitted details (collapsed) */}
          {userProfile ? (
            <View style={[styles.pendingCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle, paddingVertical: 0 }]}>
              <TouchableOpacity
                onPress={() => setShowSubmitted((v) => !v)}
                style={styles.pToggle}
                accessibilityRole="button"
                accessibilityState={{ expanded: showSubmitted }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.pLabel, { color: colors.textPrimary }]}>Your submitted details</Text>
                  <Text style={[styles.pSub, { color: colors.textSecondary }]} numberOfLines={1}>
                    {[userProfile.designation, userProfile.department].filter(Boolean).join(' · ')}
                  </Text>
                </View>
                {showSubmitted ? <ChevronUp size={18} color={colors.textSecondary} /> : <ChevronDown size={18} color={colors.textSecondary} />}
              </TouchableOpacity>
              {showSubmitted ? (
                <View style={[styles.pDetails, { borderTopColor: colors.borderSubtle }]}>
                  {detailRows
                    .filter(([, v]) => Boolean(v))
                    .map(([k, v]) => (
                      <View key={k} style={styles.pRow}>
                        <Text style={[styles.pKey, { color: colors.textSecondary }]}>{k}</Text>
                        <Text style={[styles.pVal, { color: colors.textPrimary }]} numberOfLines={1}>{v}</Text>
                      </View>
                    ))}
                  {userProfile.researchInterests?.length ? (
                    <Text style={[styles.pSub, { color: colors.textSecondary, marginTop: spacing.xs }]} numberOfLines={2}>
                      Interests: {userProfile.researchInterests.join(', ')}
                    </Text>
                  ) : null}
                </View>
              ) : null}
            </View>
          ) : null}

          {/* Actions */}
          <Button
            label="Check status"
            onPress={handleRefresh}
            variant="secondary"
            icon={<RefreshCw size={16} color={colors.textPrimary} />}
            loading={isRefreshing}
            fullWidth
            style={{ marginTop: spacing.sm }}
          />
          <TouchableOpacity onPress={handleSignOut} hitSlop={8} style={styles.pSignOut} accessibilityRole="button">
            <LogOut size={14} color={colors.textSecondary} />
            <Text maxFontSizeMultiplier={COMPACT_FONT_SCALE} style={[styles.topLink, { color: colors.textSecondary }]}>Sign out</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  // =========================================================================
  // VIEW: 4. Rejected State (rejected)
  // =========================================================================

  if (accessState === 'rejected' && !isResubmitting) {
    return (
      <ScreenContainer scrollable background={<AuthBackground animated={false} />}>
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
              <CircleAlert size={40} color={colors.error} strokeWidth={ICON_STROKE.light} />
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
              <Text maxFontSizeMultiplier={COMPACT_FONT_SCALE} style={[styles.statusBadgeText, { color: colors.error }]}>
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
                You can correct your details and resubmit your application for review.
                If you believe this decision was made in error, you may also contact the
                CSE Department Administrator with proof of enrollment or faculty appointment.
              </Text>
            </View>

            <Button
              label="Edit & Resubmit Application"
              onPress={startResubmission}
              variant="primary"
              icon={<RefreshCw size={16} color={colors.textInverse} />}
              fullWidth
              style={{ marginBottom: spacing.md }}
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
  // VIEW: 5. Suspended State (suspended)
  // =========================================================================

  if (accessState === 'suspended') {
    return (
      <ScreenContainer scrollable background={<AuthBackground animated={false} />}>
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
              <TriangleAlert size={40} color={colors.error} strokeWidth={ICON_STROKE.light} />
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
              <Text maxFontSizeMultiplier={COMPACT_FONT_SCALE} style={[styles.statusBadgeText, { color: colors.error }]}>
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
      <ScreenContainer scrollable={false} background={<AuthBackground animated={false} />}>
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
    <ScreenContainer scrollable withKeyboardAvoidance background={<AuthBackground animated={false} />}>
      <View style={styles.formContainer}>
        {/* Header: compact title + top-right links (Sign out / Cancel) */}
        <View style={styles.topLinks}>
          {isResubmitting ? (
            <TouchableOpacity
              onPress={() => {
                setIsResubmitting(false);
                setSubmitError(null);
              }}
              disabled={isSubmitting}
              hitSlop={8}
              accessibilityRole="button"
            >
              <Text maxFontSizeMultiplier={COMPACT_FONT_SCALE} style={[styles.topLink, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
          ) : (
            <View />
          )}
          <TouchableOpacity onPress={handleSignOut} hitSlop={8} style={styles.topLinkRow} accessibilityRole="button" accessibilityLabel="Sign out">
            <LogOut size={14} color={colors.textSecondary} />
            <Text maxFontSizeMultiplier={COMPACT_FONT_SCALE} style={[styles.topLink, { color: colors.textSecondary }]}>Sign out</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            {isResubmitting ? 'Update your application' : 'Complete your profile'}
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {isResubmitting
              ? 'Fix the details mentioned in the review, then resubmit.'
              : 'A CSE admin reviews it before your account is activated.'}
          </Text>
        </View>

        {/* Step progress */}
        <View style={styles.stepHeader}>
          <Text style={[styles.stepCaption, { color: colors.textSecondary }]}>
            Step {step} of {STEP_COUNT} · <Text style={{ color: colors.textPrimary }}>{STEP_TITLES[step - 1]}</Text>
          </Text>
          <View style={[styles.progressTrack, { backgroundColor: colors.borderSubtle }]} accessibilityElementsHidden>
            <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${(step / STEP_COUNT) * 100}%` }]} />
          </View>
        </View>

        {step === 1 ? (
        <>
        {/* Authenticated Identity Card */}
        <View
          style={[
            styles.identityCard,
            { borderBottomColor: colors.borderSubtle },
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
              <Text maxFontSizeMultiplier={COMPACT_FONT_SCALE} style={[styles.verifiedPillText, { color: colors.secondaryDark }]}>
                Email verified
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
          ]}
        >
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionIndicator, { backgroundColor: colors.primary }]} />
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              About you
            </Text>
          </View>

          {/* Display Name */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
              Full Display Name <Text style={{ color: colors.error }}>*</Text>
            </Text>
            <FieldFrame
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
            </FieldFrame>
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
            <FieldFrame
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
            </FieldFrame>
            {errors.photoURL ? (
              <Text style={[styles.errorText, { color: colors.error }]}>
                {errors.photoURL}
              </Text>
            ) : null}
          </View>
        </View>

        </>
        ) : null}

        {step === 2 ? (
        <>
        {/* ================================================================= */}
        {/* Section B — Academic Information */}
        {/* ================================================================= */}
        <View
          style={[
            styles.sectionCard,
          ]}
        >
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionIndicator, { backgroundColor: colors.secondary }]} />
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Academic details
            </Text>
          </View>

          {/* Department */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
              Department <Text style={{ color: colors.error }}>*</Text>
            </Text>
            <FieldFrame
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
            </FieldFrame>
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
            <FieldFrame
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
            </FieldFrame>
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
                  <Text maxFontSizeMultiplier={COMPACT_FONT_SCALE}
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
            <FieldFrame
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
            </FieldFrame>
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
                  <Text maxFontSizeMultiplier={COMPACT_FONT_SCALE}
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
              <FieldFrame
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
              </FieldFrame>
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
                Student / Faculty ID
              </Text>
              <FieldFrame
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
              </FieldFrame>
            </View>
          </View>
        </View>

        </>
        ) : null}

        {step === 3 ? (
        <>
        {/* ================================================================= */}
        {/* Section C — Research Profile */}
        {/* ================================================================= */}
        <View
          style={[
            styles.sectionCard,
          ]}
        >
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionIndicator, { backgroundColor: colors.accent }]} />
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Research profile
            </Text>
          </View>

          {/* Biography */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
              Scholarly Biography / Focus Summary <Text style={[styles.optionalTag, { color: colors.textMuted }]}>optional</Text>
            </Text>
            <FieldFrame
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
            </FieldFrame>
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
              <FieldFrame
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
              </FieldFrame>

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
                <Text maxFontSizeMultiplier={COMPACT_FONT_SCALE} style={[styles.selectedChipsLabel, { color: colors.textSecondary }]}>
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
                      <Text maxFontSizeMultiplier={COMPACT_FONT_SCALE} style={[styles.chipText, { color: colors.primaryDark }]}>
                        {interest}
                      </Text>
                      <X size={12} color={colors.primaryDark} style={{ marginLeft: 4 }} />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : null}

            {/* Suggested Interests Grid */}
            <View style={{ marginTop: spacing.md }}>
              <Text style={[styles.suggestedLabel, { color: colors.textMuted }]}>
                Popular topics — tap to add
              </Text>
              <View style={styles.chipRow}>
                {(showAllSuggestions
                  ? SUGGESTED_INTERESTS
                  : SUGGESTED_INTERESTS.filter(
                      (item, idx) =>
                        idx < 10 || researchInterests.some((i) => i.toLowerCase() === item.toLowerCase()),
                    )
                ).map((item, idx) => {
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
                      <Text maxFontSizeMultiplier={COMPACT_FONT_SCALE}
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
              <TouchableOpacity
                onPress={() => setShowAllSuggestions((v) => !v)}
                hitSlop={8}
                style={{ alignSelf: 'flex-start', marginTop: spacing.sm }}
                accessibilityRole="button"
              >
                <Text maxFontSizeMultiplier={COMPACT_FONT_SCALE} style={[styles.topLink, { color: colors.primary }]}>
                  {showAllSuggestions ? 'Show fewer' : `Show all ${SUGGESTED_INTERESTS.length} topics`}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

        </View>

        </>
        ) : null}

        {step === 4 ? (
        <View
          style={[
            styles.sectionCard,
          ]}
        >
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionIndicator, { backgroundColor: colors.secondary }]} />
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Academic links
            </Text>
          </View>
          <Text style={[styles.sectionHint, { color: colors.textSecondary }]}>
            Optional. Add any profiles you have — you can also do this later from your profile.
          </Text>

          {/* Website */}
          <View style={styles.inputGroup}>
            <FieldFrame
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
            </FieldFrame>
          </View>

          {/* GitHub */}
          <View style={styles.inputGroup}>
            <FieldFrame
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
            </FieldFrame>
          </View>

          {/* LinkedIn */}
          <View style={styles.inputGroup}>
            <FieldFrame
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
            </FieldFrame>
          </View>

          {/* Google Scholar */}
          <View style={styles.inputGroup}>
            <FieldFrame
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
            </FieldFrame>
          </View>

          {/* ResearchGate */}
          <View style={styles.inputGroup}>
            <FieldFrame
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
            </FieldFrame>
          </View>
        </View>
        ) : null}

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

        {/* Actions: Back + Continue / Submit side by side */}
        <View style={styles.actionsRow}>
          {step > 1 ? (
            <Button
              label="Back"
              onPress={goBack}
              variant="secondary"
              disabled={isSubmitting}
              style={styles.actionBack}
            />
          ) : null}
          {step < STEP_COUNT ? (
            <Button
              label={`Next: ${STEP_TITLES[step]}`}
              onPress={goNext}
              variant="primary"
              style={styles.actionMain}
            />
          ) : (
            <Button
              label={isResubmitting ? 'Resubmit' : 'Submit for approval'}
              onPress={handleSubmitProfile}
              variant="primary"
              loading={isSubmitting}
              disabled={isSubmitting}
              icon={<CircleCheck size={18} color={colors.textInverse} />}
              style={styles.actionMain}
            />
          )}
        </View>
      </View>
    </ScreenContainer>
  );
}

// ---------------------------------------------------------------------------
// Stylesheet
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  // Pending (compact)
  pendingWrap: { width: '100%', maxWidth: 480, alignSelf: 'center', paddingTop: spacing.xxl, paddingBottom: spacing.xl, gap: spacing.md },
  pendingIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  pendingTitle: { ...typography.headline, textAlign: 'center' },
  pendingText: { ...typography.body, textAlign: 'center', marginTop: -spacing.xs },
  pendingCard: { borderWidth: 1, borderRadius: radius.md, padding: spacing.md },
  pStep: { flexDirection: 'row', gap: 12 },
  pRail: { alignItems: 'center', width: 22 },
  pDot: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  pCore: { width: 8, height: 8, borderRadius: 4 },
  pLine: { width: 2, flex: 1, minHeight: 18, marginVertical: 2 },
  pBody: { flex: 1, paddingBottom: spacing.sm },
  pLabel: { ...typography.label, fontFamily: fontFamilies.sansSemiBold },
  pSub: { ...typography.caption },
  pToggle: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 14 },
  pDetails: { borderTopWidth: 1, paddingVertical: spacing.sm, gap: 6 },
  pRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  pKey: { ...typography.bodySmall },
  pVal: { ...typography.bodySmall, fontFamily: fontFamilies.sansSemiBold, flexShrink: 1, textAlign: 'right' },
  pSignOut: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: spacing.sm },
  progressTrack: { height: 3, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: 3, borderRadius: 2 },
  topLinks: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  topLinkRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  topLink: { ...typography.buttonSmall },
  sectionHint: { ...typography.bodySmall, marginTop: -spacing.xs, marginBottom: spacing.md },
  actionsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  actionBack: { flex: 1 },
  actionMain: { flex: 2 },
  // Containers
  formContainer: { paddingTop: spacing.md, paddingBottom: spacing.xl, maxWidth: 560, width: '100%', alignSelf: 'center' },
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
  header: { marginBottom: spacing.xl },
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
    ...typography.caption,
    fontFamily: fontFamilies.sansSemiBold,
  },
  headerTitle: { ...typography.title, fontFamily: fontFamilies.sansBold, fontSize: 28, lineHeight: 34, letterSpacing: -0.5, marginBottom: 6 },
  headerSubtitle: { ...typography.body },

  // Identity Card
  identityCard: { flexDirection: 'row', alignItems: 'center', paddingBottom: spacing.lg, marginBottom: spacing.xl, borderBottomWidth: StyleSheet.hairlineWidth },
  identityDetails: {
    marginLeft: spacing.md,
    flex: 1,
  },
  identityName: {
    ...typography.body,
    fontFamily: fontFamilies.sansSemiBold,
    marginBottom: 2,
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  identityEmail: {
    ...typography.bodySmall,
    fontFamily: fontFamilies.sansRegular,
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
    ...typography.micro,
    fontFamily: fontFamilies.sansMedium,
    fontWeight: '600',
  },

  // Sections
  sectionCard: { marginBottom: spacing.xl },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  sectionIndicator: { display: 'none' },
  stepHeader: { marginBottom: spacing.xl, gap: spacing.sm },
  stepCaption: { ...typography.bodySmall, fontFamily: fontFamilies.sansSemiBold },
  sectionTitle: { ...typography.title, fontFamily: fontFamilies.sansBold, fontSize: 20, lineHeight: 26 },
  subSectionTitle: {
    ...typography.bodyCompact,
    fontFamily: fontFamilies.sansSemiBold,
    marginBottom: spacing.sm,
  },

  // Inputs
  inputGroup: { marginBottom: spacing.lg },
  inputLabel: { ...typography.label, fontFamily: fontFamilies.sansSemiBold, marginBottom: 8, lineHeight: undefined },
  optionalTag: {
    ...typography.caption,
    fontFamily: fontFamilies.sansRegular,
  },
  inputWrapper: { height: 48, flexDirection: 'row', alignItems: 'center' },
  inputIcon: {
    marginRight: 8,
  },
  textInput: { ...typography.body, flex: 1, height: '100%', fontFamily: fontFamilies.sansRegular, paddingVertical: 0, lineHeight: undefined },
  textAreaWrapper: { minHeight: 112, flexDirection: 'column', alignItems: 'stretch', paddingVertical: 12 },
  textArea: { ...typography.body, fontFamily: fontFamilies.sansRegular, minHeight: 72, padding: 0 },
  charCount: {
    ...typography.micro,
    fontFamily: fontFamilies.sansRegular,
    textAlign: 'right',
    marginTop: 6,
    fontVariant: ['tabular-nums'],
  },
  errorText: {
    ...typography.caption,
    fontFamily: fontFamilies.sansMedium,
    marginTop: 6,
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
    borderRadius: radius.button,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addTagText: {
    ...typography.bodySmall,
    fontFamily: fontFamilies.sansSemiBold,
  },
  selectedChipsContainer: {
    marginTop: spacing.md,
  },
  selectedChipsLabel: {
    ...typography.caption,
    fontFamily: fontFamilies.sansMedium,
    marginBottom: 6,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: spacing.sm + 4,
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
    ...typography.caption,
    fontFamily: fontFamilies.sansRegular,
  },
  suggestedLabel: {
    ...typography.caption,
    fontFamily: fontFamilies.sansRegular,
    marginBottom: 6,
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
    ...typography.bodySmall,
    flex: 1,
    fontFamily: fontFamilies.sansMedium,
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
    ...typography.caption,
    fontFamily: fontFamilies.sansSemiBold,
  },
  body: {
    ...typography.body,
    textAlign: 'center',
    paddingHorizontal: spacing.sm,
  },
  detailsContainer: {
    width: '100%',
    borderRadius: radius.sm,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  detailsHeader: { ...typography.overline, marginBottom: spacing.sm },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  detailLabel: {
    ...typography.bodySmall,
    fontFamily: fontFamilies.sansRegular,
  },
  detailValue: {
    ...typography.bodySmall,
    fontFamily: fontFamilies.sansSemiBold,
  },
  noticeBox: {
    borderWidth: 1,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.lg,
    width: '100%',
  },
  noticeText: {
    ...typography.caption,
    fontFamily: fontFamilies.sansRegular,
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
    ...typography.caption,
    fontFamily: fontFamilies.sansSemiBold,
    marginBottom: 2,
  },
  rejectionReasonText: {
    ...typography.bodySmall,
    fontFamily: fontFamilies.sansRegular,
  },
});
