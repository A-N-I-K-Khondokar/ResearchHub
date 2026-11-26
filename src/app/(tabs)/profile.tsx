import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Linking,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import {
  Settings,
  Edit3,
  GraduationCap,
  Check,
  Users,
  ExternalLink,
  Globe,
  Code2,
  Sun,
  Moon,
  Smartphone,
  X,
  Lock,
  LogOut,
  Linkedin,
  Bookmark,
} from 'lucide-react-native';
import { spacing, radius, typography, fontFamilies, floatingButtonTokens } from '@/constants';
import { useTheme, ThemeMode } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { Avatar } from '@/components/common/Avatar';
import { TopicChip } from '@/components/common/TopicChip';
import {
  ProfileHero,
  HeroActionButton,
  HeroIconButton,
  ProfileSection,
  ProfileEmptyText,
  WorkList,
  ProfileListCard,
  type ProfileListItem,
} from '@/components/profile';
import { updateUserProfile } from '@/services/user.service';
import { subscribeMyResearchWorks } from '@/services/research.service';
import { useConnections } from '@/hooks/useConnections';
import { useSavedItems } from '@/hooks/useSavedItems';
import { confirmAction, showMessage } from '@/utils/dialogs';
import type { ResearchWork } from '@/types/research.types';
import type { UserSocialLinks } from '@/types/user.types';

const LINK_META: { key: keyof UserSocialLinks; name: string }[] = [
  { key: 'googleScholar', name: 'Google Scholar' },
  { key: 'researchGate', name: 'ResearchGate' },
  { key: 'github', name: 'GitHub' },
  { key: 'linkedin', name: 'LinkedIn' },
  { key: 'website', name: 'Website' },
];

export default function ProfileTab() {
  const { colors, themeMode, isDark, setThemeMode } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { userProfile, signOut } = useAuth();
  const { connected, incomingRequests } = useConnections();
  const { items: savedItems } = useSavedItems();

  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  // Profile data — authoritative Firestore profile (users/{uid}) via AuthContext
  const profileName = userProfile?.displayName || 'CSE Researcher';
  const profileDepartment = userProfile?.department || '';
  const profileBatch = userProfile?.batch || '';
  const profileBio = userProfile?.bio || '';
  const researchInterests = userProfile?.researchInterests ?? [];
  const credentials = [userProfile?.designation, profileDepartment, profileBatch].filter(Boolean).join(' • ');

  // My shared research work (research_works where authorUid == uid)
  const [myWorks, setMyWorks] = useState<ResearchWork[]>([]);
  const [myWorksLoading, setMyWorksLoading] = useState(true);
  const [myWorksError, setMyWorksError] = useState(false);

  useEffect(() => {
    if (!userProfile?.uid) return;
    setMyWorksLoading(true);
    return subscribeMyResearchWorks(
      userProfile.uid,
      (works) => {
        setMyWorks(works);
        setMyWorksLoading(false);
        setMyWorksError(false);
      },
      () => {
        setMyWorksLoading(false);
        setMyWorksError(true);
      },
    );
  }, [userProfile?.uid]);

  // Edit modal form state (identity fields are locked after approval)
  const [editName, setEditName] = useState(profileName);
  const [editBio, setEditBio] = useState(profileBio);
  const [isSaving, setIsSaving] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleOpenEditModal = () => {
    setEditName(profileName);
    setEditBio(profileBio);
    setIsEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!userProfile || isSaving) return;
    const name = editName.trim();
    const bio = editBio.trim();

    if (!name || name.length > 100) {
      showMessage('Check your name', 'Full name is required (max 100 characters).');
      return;
    }
    if (bio.length > 2000) {
      showMessage('Bio too long', 'Bio must be 2000 characters or less.');
      return;
    }

    setIsSaving(true);
    try {
      // Only presentation fields; the profile listener refreshes the UI.
      await updateUserProfile(userProfile, { displayName: name, bio: bio || null });
      setIsEditModalVisible(false);
    } catch (err) {
      console.error('[Profile] Save failed:', err);
      showMessage('Save failed', 'Could not update your profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    if (isSigningOut) return;
    // Works on iOS, Android AND web (RN-Web's Alert.alert is a no-op).
    const ok = await confirmAction({
      title: 'Sign out?',
      message: 'You will need to sign in again to access CSE Research Hub.',
      confirmLabel: 'Sign Out',
      destructive: true,
    });
    if (!ok) return;

    setIsSigningOut(true);
    setIsSettingsModalVisible(false);
    try {
      await signOut();
      // AuthGuard routes to the login screen as soon as sign-out starts.
    } catch {
      setIsSigningOut(false);
      showMessage('Sign out failed', 'Please check your connection and try again.');
    }
  };

  const handleOpenLink = (url: string) => {
    Linking.openURL(url).catch(() => showMessage('Link Error', `Unable to open: ${url}`));
  };

  const openTopic = (topic: string) =>
    router.push({ pathname: '/(explore)/topic-researchers' as any, params: { topic } });

  // Theme picker options
  const themeOptions: { mode: ThemeMode; label: string; icon: React.ReactNode; desc: string }[] = [
    { mode: 'light', label: 'Light', icon: <Sun size={18} color={themeMode === 'light' ? '#FFFFFF' : colors.textPrimary} />, desc: 'Crisp Scholarly' },
    { mode: 'dark', label: 'Dark', icon: <Moon size={18} color={themeMode === 'dark' ? '#FFFFFF' : colors.textPrimary} />, desc: 'Deep Slate Navy' },
    { mode: 'system', label: 'System', icon: <Smartphone size={18} color={themeMode === 'system' ? '#FFFFFF' : colors.textPrimary} />, desc: 'Auto Sync' },
  ];

  const linkIcon = (key: keyof UserSocialLinks) => {
    const props = { size: 18, color: colors.primary, strokeWidth: 2 };
    if (key === 'googleScholar') return <GraduationCap {...props} />;
    if (key === 'researchGate') return <Globe {...props} />;
    if (key === 'github') return <Code2 {...props} />;
    if (key === 'linkedin') return <Linkedin {...props} />;
    return <ExternalLink {...props} />;
  };

  const academicLinks: ProfileListItem[] = useMemo(() => {
    const links: UserSocialLinks = userProfile?.socialLinks ?? {};
    return LINK_META.filter((m) => Boolean(links[m.key])).map((m) => {
      const raw = String(links[m.key]);
      const url = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
      return { id: m.key as string, label: m.name, icon: linkIcon(m.key), onPress: () => handleOpenLink(url), trailing: 'external' as const };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile?.socialLinks, colors.primary]);

  const libraryItems: ProfileListItem[] = [
    {
      id: 'saved',
      label: `Saved Items (${savedItems.length})`,
      icon: <Bookmark size={18} color={colors.primary} strokeWidth={2} />,
      onPress: () => router.push('/(profile)/saved' as any),
      trailing: 'chevron',
    },
    {
      id: 'requests',
      label: `Pending Connection Requests (${incomingRequests.length})`,
      icon: <Users size={18} color={colors.primary} strokeWidth={2} />,
      onPress: () => router.push('/(tabs)/notifications' as any),
      trailing: 'chevron',
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 16 }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={colors.background} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <ProfileHero
          name={profileName}
          photoURL={userProfile?.photoURL}
          credentials={credentials}
          bio={profileBio}
          emptyBioPrompt="Add a short bio about your research focus"
          onEmptyBioPress={handleOpenEditModal}
          actions={
            <>
              <HeroActionButton
                label="Edit Profile"
                icon={<Edit3 size={15} color={colors.textPrimary} strokeWidth={2} />}
                onPress={handleOpenEditModal}
              />
              <HeroIconButton
                label="Open settings and theme options"
                icon={<Settings size={20} color={colors.textSecondary} strokeWidth={2} />}
                onPress={() => setIsSettingsModalVisible(true)}
              />
            </>
          }
          stats={[
            { label: 'Connections', value: connected.length },
            { label: 'Shared Work', value: myWorks.filter((w) => w.status === 'published').length },
            { label: 'Interests', value: researchInterests.length },
          ]}
        />

        {/* Research interests */}
        <ProfileSection title="Research Interests">
          {researchInterests.length === 0 ? (
            <ProfileEmptyText text="No research interests added yet." />
          ) : (
            <View style={styles.chipsRow}>
              {researchInterests.map((interest) => (
                <TopicChip key={interest} label={interest} variant="teal" onPress={() => openTopic(interest)} />
              ))}
            </View>
          )}
        </ProfileSection>

        {/* Currently working on (live research_works) */}
        <ProfileSection
          title="Currently Working On"
          actionLabel="Share"
          onActionPress={() => router.push('/(tabs)/share' as any)}
        >
          {myWorksLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.md }} />
          ) : myWorksError ? (
            <ProfileEmptyText text="Could not load your shared work. Please try again later." />
          ) : myWorks.length === 0 ? (
            <ProfileEmptyText text="Nothing shared yet — tap Share to post what you are researching." />
          ) : (
            <WorkList works={myWorks} onOpen={(w) => router.push(`/(research)/${w.id}` as any)} />
          )}
        </ProfileSection>

        {/* Library */}
        <ProfileSection title="Library">
          <ProfileListCard items={libraryItems} />
        </ProfileSection>

        {/* Academic links */}
        <ProfileSection title="Academic Links">
          {academicLinks.length === 0 ? (
            <ProfileEmptyText text="No academic links added yet." />
          ) : (
            <ProfileListCard items={academicLinks} />
          )}
        </ProfileSection>
      </ScrollView>

      {/* Settings & theme modal */}
      <Modal
        visible={isSettingsModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setIsSettingsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Appearance & Settings</Text>
                <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>CSE Research Hub Preferences</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsSettingsModalVisible(false)}
                hitSlop={8}
                style={[styles.modalCloseBtn, { backgroundColor: colors.surfaceSubtle }]}
                accessibilityRole="button"
                accessibilityLabel="Close settings"
              >
                <X size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalSectionLabel, { color: colors.textPrimary }]}>Theme Mode</Text>
            <View style={styles.themeOptionsGrid}>
              {themeOptions.map((opt) => {
                const isSelected = themeMode === opt.mode;
                return (
                  <TouchableOpacity
                    key={opt.mode}
                    activeOpacity={0.8}
                    onPress={() => setThemeMode(opt.mode)}
                    style={[
                      styles.themeOptionBtn,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.surfaceSubtle,
                        borderColor: isSelected ? colors.primary : colors.borderSubtle,
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                  >
                    <View style={styles.themeIconBox}>{opt.icon}</View>
                    <Text style={[styles.themeOptionTitle, { color: isSelected ? '#FFFFFF' : colors.textPrimary }]}>
                      {opt.label}
                    </Text>
                    <Text style={[styles.themeOptionDesc, { color: isSelected ? '#FFFFFF' : colors.textMuted }]}>
                      {opt.desc}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleSignOut}
              disabled={isSigningOut}
              style={[styles.modalButton, styles.signOutBtn, { borderColor: colors.error, backgroundColor: colors.errorLight }]}
              accessibilityRole="button"
              accessibilityLabel="Sign out"
            >
              <LogOut size={16} color={colors.error} strokeWidth={2.2} />
              <Text style={[styles.modalButtonText, { color: colors.error }]}>
                {isSigningOut ? 'Signing out...' : 'Sign Out'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setIsSettingsModalVisible(false)}
              style={[styles.modalButton, floatingButtonTokens.primary]}
              accessibilityRole="button"
              accessibilityLabel="Done"
            >
              <Check size={16} color="#FFFFFF" strokeWidth={2.4} />
              <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Edit profile modal */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.editModalOverlay}
        >
          <View style={[styles.editModalCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
            <View style={[styles.editModalHeaderRow, { borderBottomColor: colors.borderSubtle }]}>
              <TouchableOpacity
                onPress={() => setIsEditModalVisible(false)}
                style={styles.editHeaderSide}
                accessibilityRole="button"
                accessibilityLabel="Cancel editing profile"
              >
                <Text style={[styles.editModalCancelText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>

              <Text style={[styles.editModalTitle, { color: colors.textPrimary }]}>Edit Profile</Text>

              <View style={[styles.editHeaderSide, { alignItems: 'flex-end' }]}>
                <TouchableOpacity
                  onPress={handleSaveProfile}
                  disabled={isSaving}
                  activeOpacity={0.8}
                  style={[styles.editModalSaveBtn, floatingButtonTokens.primary]}
                  accessibilityRole="button"
                  accessibilityLabel="Save profile changes"
                >
                  <Text style={styles.editModalSaveText}>{isSaving ? 'Saving...' : 'Save'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.editModalScrollContent}
              keyboardShouldPersistTaps="handled"
            >
              {/* Current photo (upload is not available yet) */}
              <View style={styles.photoPreview}>
                <Avatar name={editName || profileName} uri={userProfile?.photoURL} size="xl" />
              </View>

              <View style={styles.editFormFields}>
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Full Name</Text>
                  <TextInput
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="Enter your full name"
                    placeholderTextColor={colors.textMuted}
                    maxLength={100}
                    style={[styles.textInput, { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderSubtle, color: colors.textPrimary }]}
                  />
                </View>

                {[
                  { label: 'Department', value: profileDepartment },
                  { label: 'Batch / Cohort', value: profileBatch || 'Not specified' },
                ].map((field) => (
                  <View key={field.label} style={styles.inputGroup}>
                    <View style={styles.inputLabelRow}>
                      <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>{field.label}</Text>
                      <View style={styles.lockedBadge}>
                        <Lock size={10} color={colors.textMuted} strokeWidth={2.4} />
                        <Text style={[styles.lockedText, { color: colors.textMuted }]}>Locked</Text>
                      </View>
                    </View>
                    <TextInput
                      value={field.value}
                      editable={false}
                      selectTextOnFocus={false}
                      style={[styles.textInput, styles.disabledInput, { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderSubtle, color: colors.textMuted }]}
                    />
                  </View>
                ))}
                <Text style={[styles.lockedText, { color: colors.textMuted }]}>
                  Department, batch, designation and student ID are verified at approval. Contact the department administrator to change them.
                </Text>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Bio & Research Focus</Text>
                  <TextInput
                    value={editBio}
                    onChangeText={setEditBio}
                    placeholder="Write a brief overview of your academic focus..."
                    placeholderTextColor={colors.textMuted}
                    multiline
                    numberOfLines={4}
                    maxLength={2000}
                    textAlignVertical="top"
                    style={[styles.textInput, styles.bioInput, { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderSubtle, color: colors.textPrimary }]}
                  />
                </View>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingBottom: spacing.xl,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },

  // Settings modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  modalCard: {
    width: '100%',
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  modalTitle: {
    ...typography.title,
  },
  modalSubtitle: {
    ...typography.caption,
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSectionLabel: {
    ...typography.label,
    marginBottom: spacing.sm,
  },
  themeOptionsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  themeOptionBtn: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.button,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  themeIconBox: {
    marginBottom: 6,
  },
  themeOptionTitle: {
    ...typography.caption,
    fontFamily: fontFamilies.sansSemiBold,
  },
  themeOptionDesc: {
    ...typography.micro,
    marginTop: 2,
  },
  modalButton: {
    height: spacing.secondaryButtonHeight,
    borderRadius: radius.button,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  signOutBtn: {
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  modalButtonText: {
    ...typography.label,
  },

  // Edit modal
  editModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  editModalCard: {
    maxHeight: '90%',
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderWidth: 1,
    paddingBottom: spacing.xl,
  },
  editModalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  editHeaderSide: {
    minWidth: 80,
    minHeight: spacing.minTouchTarget,
    justifyContent: 'center',
  },
  editModalCancelText: {
    ...typography.body,
  },
  editModalTitle: {
    ...typography.title,
  },
  editModalSaveBtn: {
    minHeight: spacing.compactButtonHeight,
    paddingHorizontal: spacing.md,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editModalSaveText: {
    ...typography.label,
    color: '#FFFFFF',
  },
  editModalScrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
  },
  photoPreview: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  editFormFields: {
    gap: spacing.md,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputLabel: {
    ...typography.bodySmall,
    fontFamily: fontFamilies.sansSemiBold,
  },
  lockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  lockedText: {
    ...typography.micro,
  },
  textInput: {
    ...typography.bodyCompact,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    minHeight: spacing.inputHeight,
  },
  disabledInput: {
    opacity: 0.8,
  },
  bioInput: {
    minHeight: 110,
    paddingTop: 12,
  },
});
