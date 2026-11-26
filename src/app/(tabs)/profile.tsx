import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  Linking,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  Settings,
  Edit3,
  GraduationCap,
  Check,
  Users,
  Layers,
  ExternalLink,
  Globe,
  Code2,
  Sun,
  Moon,
  Smartphone,
  X,
  Camera,
  Lock,
  LogOut,
  Linkedin,
  Bookmark,
  ChevronRight,
} from 'lucide-react-native';
import { spacing, radius, typography, fontFamilies, floatingButtonTokens } from '@/constants';
import { useTheme, ThemeMode } from '@/context/ThemeContext';
import { Avatar } from '@/components/common/Avatar';
import { useAuth } from '@/context/AuthContext';
import { updateUserProfile } from '@/services/user.service';
import { subscribeMyResearchWorks, formatWorkDate } from '@/services/research.service';
import type { ResearchWork } from '@/types/research.types';
import type { UserSocialLinks } from '@/types/user.types';
import { useConnections } from '@/hooks/useConnections';
import { useSavedItems } from '@/hooks/useSavedItems';

export default function ProfileTab() {
  const { colors, themeMode, isDark, setThemeMode } = useTheme();
  const insets = useSafeAreaInsets();

  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  const router = useRouter();
  const { userProfile, signOut } = useAuth();

  // Profile Data — authoritative Firestore profile (users/{uid}) via AuthContext
  const profileName = userProfile?.displayName || 'CSE Researcher';
  const profileDepartment = userProfile?.department || '';
  const profileBatch = userProfile?.batch || userProfile?.designation || '';
  const profileBio = userProfile?.bio || '';
  const profilePhotoUri = userProfile?.photoURL || null;
  const researchInterests = userProfile?.researchInterests ?? [];
  const { connected, incomingRequests } = useConnections();
  const { items: savedItems } = useSavedItems();

  // My shared research work (research_works where authorUid == uid)
  const [myWorks, setMyWorks] = useState<ResearchWork[]>([]);
  const [myWorksLoading, setMyWorksLoading] = useState(true);
  const [myWorksError, setMyWorksError] = useState(false);

  useEffect(() => {
    if (!userProfile?.uid) return;
    setMyWorksLoading(true);
    const unsubscribe = subscribeMyResearchWorks(
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
    return unsubscribe;
  }, [userProfile?.uid]);

  // Edit Modal Form State
  const [editName, setEditName] = useState(profileName);
  const [editDepartment, setEditDepartment] = useState(profileDepartment);
  const [editBio, setEditBio] = useState(profileBio);
  const [isSaving, setIsSaving] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleOpenEditModal = () => {
    setEditName(profileName);
    setEditDepartment(profileDepartment);
    setEditBio(profileBio);
    setIsEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!userProfile || isSaving) return;
    const name = editName.trim();
    const bio = editBio.trim();

    if (!name || name.length > 100) {
      Alert.alert('Check your name', 'Full name is required (max 100 characters).');
      return;
    }
    if (bio.length > 2000) {
      Alert.alert('Bio too long', 'Bio must be 2000 characters or less.');
      return;
    }

    setIsSaving(true);
    try {
      // Only allowlisted, user-editable fields; the profile listener refreshes the UI.
      // Department / batch are locked after approval (admin correction only).
      await updateUserProfile(userProfile, {
        displayName: name,
        bio: bio || null,
      });
      setIsEditModalVisible(false);
    } catch (err) {
      console.error('[Profile] Save failed:', err);
      Alert.alert('Save failed', 'Could not update your profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign out?', 'You will need to sign in again to access CSE Research Hub.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          setIsSigningOut(true);
          try {
            setIsSettingsModalVisible(false);
            await signOut();
            // AuthGuard redirects to login once the session clears.
          } catch {
            setIsSigningOut(false);
            Alert.alert('Sign out failed', 'Please try again.');
          }
        },
      },
    ]);
  };

  const handleCancelEdit = () => {
    setIsEditModalVisible(false);
  };

  const handleChangePhoto = () => {
    Alert.alert(
      'Change Photo',
      'Device photo library selection hook triggered. Photo selection will be enabled in future phases.',
      [{ text: 'OK' }]
    );
    console.log('Photo picker requested');
  };

  // Theme Picker Options
  const themeOptions: { mode: ThemeMode; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      mode: 'light',
      label: 'Light',
      icon: <Sun size={18} color={themeMode === 'light' ? '#FFFFFF' : colors.textPrimary} />,
      desc: 'Crisp Scholarly',
    },
    {
      mode: 'dark',
      label: 'Dark',
      icon: <Moon size={18} color={themeMode === 'dark' ? '#FFFFFF' : colors.textPrimary} />,
      desc: 'Deep Slate Navy',
    },
    {
      mode: 'system',
      label: 'System',
      icon: <Smartphone size={18} color={themeMode === 'system' ? '#FFFFFF' : colors.textPrimary} />,
      desc: 'Auto Sync',
    },
  ];

  const handleOpenLink = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Link Error', `Unable to open: ${url}`);
    });
  };

  const LINK_META: { key: keyof UserSocialLinks; name: string; icon: React.ReactNode }[] = [
    { key: 'googleScholar', name: 'Google Scholar', icon: <GraduationCap size={18} color={colors.primary} strokeWidth={2} /> },
    { key: 'researchGate', name: 'ResearchGate', icon: <Globe size={18} color={colors.primary} strokeWidth={2} /> },
    { key: 'github', name: 'GitHub', icon: <Code2 size={18} color={colors.primary} strokeWidth={2} /> },
    { key: 'linkedin', name: 'LinkedIn', icon: <Linkedin size={18} color={colors.primary} strokeWidth={2} /> },
    { key: 'website', name: 'Website', icon: <ExternalLink size={18} color={colors.primary} strokeWidth={2} /> },
  ];

  const socialLinks: UserSocialLinks = userProfile?.socialLinks ?? {};
  const academicLinks = LINK_META.filter((meta) => Boolean(socialLinks[meta.key])).map((meta) => {
    const raw = String(socialLinks[meta.key]);
    return {
      id: meta.key as string,
      name: meta.name,
      url: /^https?:\/\//i.test(raw) ? raw : `https://${raw}`,
      icon: meta.icon,
    };
  });

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top + 16, // CRITICAL: Standardized Top Clearance
        },
      ]}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={colors.background} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ======================================================== */}
        {/* SECTION 1: THE HERO CARD (CENTERED VERTICAL STACK)       */}
        {/* ======================================================== */}
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.borderSubtle,
            },
          ]}
        >
          {/* Centered Top Stack: Avatar -> Info */}
          <View style={styles.heroCenteredTop}>
            {/* Avatar First (88x88 with Verified Badge) */}
            <View style={styles.avatarContainer}>
              <Avatar
                name={profileName}
                uri={profilePhotoUri}
                size="xl"
                style={styles.avatarImage}
              />
              {/* Verified Badge */}
              <View
                style={[
                  styles.verifiedBadge,
                  {
                    backgroundColor: colors.primary,
                    borderColor: colors.surface,
                  },
                ]}
              >
                <Check size={11} color="#FFFFFF" strokeWidth={3} />
              </View>
            </View>

            {/* Info Underneath (Centered Text) */}
            <View style={styles.heroInfoCentered}>
              <Text style={[styles.heroName, { color: colors.textPrimary }]}>
                {profileName}
              </Text>

              <View style={styles.credentialsRow}>
                <GraduationCap
                  size={14}
                  color={colors.textSecondary}
                  strokeWidth={2}
                  style={styles.credentialsIcon}
                />
                <Text
                  style={[styles.credentialsText, { color: colors.textSecondary }]}
                >
                  {profileDepartment ? `${profileDepartment} • ${profileBatch}` : profileBatch}
                </Text>
              </View>

              <Text style={[styles.bioText, { color: colors.textSecondary }]}>
                {profileBio}
              </Text>
            </View>
          </View>

          {/* Middle Row: Self-Profile Action Buttons */}
          <View style={styles.heroActionRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleOpenEditModal}
              style={[
                styles.editProfileButton,
                {
                  borderColor: isDark ? colors.borderSubtle : '#D4D8E2',
                  backgroundColor: isDark ? colors.surfaceContainer : colors.surface,
                },
                floatingButtonTokens.secondary,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Edit Profile"
            >
              <Edit3 size={15} color={colors.textPrimary} strokeWidth={2} />
              <Text style={[styles.editProfileText, { color: colors.textPrimary }]}>
                Edit Profile
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setIsSettingsModalVisible(true)}
              style={[
                styles.settingsButton,
                {
                  borderColor: isDark ? colors.borderSubtle : '#D4D8E2',
                  backgroundColor: isDark ? colors.surfaceContainer : colors.surface,
                },
                floatingButtonTokens.secondary,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Open settings and theme options"
            >
              <Settings size={20} color={colors.textSecondary} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {/* Bottom Row: Stats Strip */}
          <View
            style={[
              styles.statsStrip,
              { borderTopColor: colors.borderSubtle },
            ]}
          >
            <View style={styles.statColumn}>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                {connected.length}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Connections
              </Text>
            </View>

            <View
              style={[
                styles.statDivider,
                { backgroundColor: colors.borderSubtle },
              ]}
            />

            <View style={styles.statColumn}>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                {myWorks.filter((w) => w.status === 'published').length}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Shared Work
              </Text>
            </View>

            <View
              style={[
                styles.statDivider,
                { backgroundColor: colors.borderSubtle },
              ]}
            />

            <View style={styles.statColumn}>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                {researchInterests.length}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Interests
              </Text>
            </View>
          </View>
        </View>

        {/* ======================================================== */}
        {/* SECTION 2: INTERESTS / TOPIC PILLS                       */}
        {/* ======================================================== */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>
            Research Interests
          </Text>
          <View style={styles.topicPillsRow}>
            {researchInterests.length === 0 ? (
              <Text style={[styles.projectMetaText, { color: colors.textMuted }]}>
                No research interests added yet.
              </Text>
            ) : null}
            {researchInterests.map((interest) => `#${interest.replace(/^#/, '').replace(/\s+/g, '')}`).map(
              (topic) => (
                <View
                  key={topic}
                  style={[
                    styles.topicChip,
                    {
                      backgroundColor: colors.surfaceSubtle,
                      borderColor: colors.borderSubtle,
                    },
                  ]}
                >
                  <Text
                    style={[styles.topicChipText, { color: colors.primary }]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {topic}
                  </Text>
                </View>
              )
            )}
          </View>
        </View>

        {/* ======================================================== */}
        {/* SECTION 3: CURRENTLY WORKING ON (LIVE research_works)    */}
        {/* ======================================================== */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>
            Currently Working On
          </Text>

          {myWorksLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.md }} />
          ) : myWorksError ? (
            <Text style={[styles.projectDescription, { color: colors.textSecondary }]}>
              Could not load your shared work. Please try again later.
            </Text>
          ) : myWorks.length === 0 ? (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push('/(tabs)/share' as any)}
              style={[
                styles.projectCard,
                { backgroundColor: colors.surface, borderColor: colors.borderSubtle },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Share your current work"
            >
              <Text style={[styles.projectTitle, { color: colors.textPrimary }]}>
                Nothing shared yet
              </Text>
              <Text style={[styles.projectDescription, { color: colors.textSecondary }]}>
                Tap to share what you are currently researching with the CSE community.
              </Text>
            </TouchableOpacity>
          ) : (
            myWorks.slice(0, 5).map((work) => (
              <TouchableOpacity
                key={work.id}
                activeOpacity={0.85}
                onPress={() => router.push(`/(research)/${work.id}` as any)}
                style={[
                  styles.projectCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.borderSubtle,
                    marginBottom: spacing.sm,
                  },
                ]}
              >
                {/* Card Header: Title + Status Pill */}
                <View style={styles.projectHeaderRow}>
                  <Text
                    style={[styles.projectTitle, { color: colors.textPrimary }]}
                    numberOfLines={2}
                  >
                    {work.title}
                  </Text>
                  <View style={[styles.statusBadge, { backgroundColor: colors.primaryMuted }]}>
                    <View style={[styles.statusIndicatorDot, { backgroundColor: colors.primary }]} />
                    <Text
                      style={[styles.statusBadgeText, { color: colors.primary }]}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {work.status === 'draft' ? 'Draft' : 'Published'}
                    </Text>
                  </View>
                </View>

                <Text
                  style={[styles.projectDescription, { color: colors.textSecondary }]}
                  numberOfLines={3}
                >
                  {work.description}
                </Text>

                {/* Bottom Row: Date & Stage Metadata */}
                <View style={[styles.projectFooterRow, { borderTopColor: colors.borderSubtle }]}>
                  <View style={styles.projectMetaItem}>
                    <Users size={14} color={colors.textSecondary} strokeWidth={2} />
                    <Text style={[styles.projectMetaText, { color: colors.textSecondary }]}>
                      {formatWorkDate(work.createdAt)}
                    </Text>
                  </View>
                  <View style={styles.projectMetaItem}>
                    <Layers size={14} color={colors.textSecondary} strokeWidth={2} />
                    <Text style={[styles.projectMetaText, { color: colors.textSecondary }]}>
                      {work.stage}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* ======================================================== */}
        {/* LIBRARY: SAVED ITEMS & PENDING REQUESTS                  */}
        {/* ======================================================== */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>
            Library
          </Text>
          <View
            style={[
              styles.academicLinksCard,
              { backgroundColor: colors.surface, borderColor: colors.borderSubtle },
            ]}
          >
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push('/(profile)/saved' as any)}
              style={[styles.linkRow, { borderBottomWidth: 1, borderBottomColor: colors.borderSubtle }]}
              accessibilityRole="button"
              accessibilityLabel="Open saved items"
            >
              <View style={styles.linkIconWrapper}>
                <Bookmark size={18} color={colors.primary} strokeWidth={2} />
              </View>
              <Text style={[styles.linkLabel, { color: colors.textPrimary }]}>
                Saved Items ({savedItems.length})
              </Text>
              <ChevronRight size={16} color={colors.textMuted} strokeWidth={2} />
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push('/(tabs)/notifications' as any)}
              style={styles.linkRow}
              accessibilityRole="button"
              accessibilityLabel="Open connection requests"
            >
              <View style={styles.linkIconWrapper}>
                <Users size={18} color={colors.primary} strokeWidth={2} />
              </View>
              <Text style={[styles.linkLabel, { color: colors.textPrimary }]}>
                Pending Connection Requests ({incomingRequests.length})
              </Text>
              <ChevronRight size={16} color={colors.textMuted} strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ======================================================== */}
        {/* SECTION 5: ACADEMIC LINKS (UNIFIED VERTICAL CARD)        */}
        {/* ======================================================== */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>
            Academic Links
          </Text>

          <View
            style={[
              styles.academicLinksCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderSubtle,
              },
            ]}
          >
            {academicLinks.length === 0 ? (
              <Text style={[styles.projectMetaText, { color: colors.textMuted, padding: spacing.md }]}>
                No academic links added yet.
              </Text>
            ) : null}
            {academicLinks.map((link, index) => {
              const isLast = index === academicLinks.length - 1;
              return (
                <TouchableOpacity
                  key={link.id}
                  activeOpacity={0.7}
                  onPress={() => handleOpenLink(link.url)}
                  style={[
                    styles.linkRow,
                    !isLast && {
                      borderBottomWidth: 1,
                      borderBottomColor: colors.borderSubtle,
                    },
                  ]}
                  accessibilityRole="link"
                  accessibilityLabel={`Open ${link.name}`}
                >
                  <View style={styles.linkIconWrapper}>{link.icon}</View>
                  <Text
                    style={[styles.linkLabel, { color: colors.textPrimary }]}
                  >
                    {link.name}
                  </Text>
                  <ExternalLink
                    size={16}
                    color={colors.textMuted}
                    strokeWidth={2}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* ======================================================== */}
      {/* SETTINGS & THEME MODAL                                   */}
      {/* ======================================================== */}
      <Modal
        visible={isSettingsModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsSettingsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderSubtle,
              },
            ]}
          >
            {/* Modal Header */}
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                  Appearance & Settings
                </Text>
                <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                  CSE Research Hub Preferences
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsSettingsModalVisible(false)}
                style={[styles.modalCloseBtn, { backgroundColor: colors.surfaceSubtle }]}
                accessibilityRole="button"
                accessibilityLabel="Close settings modal"
              >
                <X size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Theme Picker Grid */}
            <Text style={[styles.modalSectionLabel, { color: colors.textPrimary }]}>
              Theme Mode
            </Text>
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
                  >
                    <View style={styles.themeIconBox}>{opt.icon}</View>
                    <Text
                      style={[
                        styles.themeOptionTitle,
                        { color: isSelected ? '#FFFFFF' : colors.textPrimary },
                      ]}
                    >
                      {opt.label}
                    </Text>
                    <Text
                      style={[
                        styles.themeOptionDesc,
                        { color: isSelected ? '#FFFFFF' : colors.textMuted },
                      ]}
                    >
                      {opt.desc}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Sign Out */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleSignOut}
              disabled={isSigningOut}
              style={[
                styles.signOutBtn,
                { borderColor: colors.error, backgroundColor: colors.errorLight },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Sign out"
            >
              <LogOut size={16} color={colors.error} strokeWidth={2.2} />
              <Text style={[styles.signOutText, { color: colors.error }]}>
                {isSigningOut ? 'Signing out...' : 'Sign Out'}
              </Text>
            </TouchableOpacity>

            {/* Done Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setIsSettingsModalVisible(false)}
              style={[
                styles.modalDoneBtn,
                floatingButtonTokens.primary,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Done"
            >
              <Check size={16} color="#FFFFFF" strokeWidth={2.4} />
              <Text style={styles.modalDoneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ======================================================== */}
      {/* EDIT PROFILE MODAL                                       */}
      {/* ======================================================== */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCancelEdit}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.editModalOverlay}
        >
          <View
            style={[
              styles.editModalCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderSubtle,
              },
            ]}
          >
            {/* Header: Cancel, Title, Save */}
            <View
              style={[
                styles.editModalHeaderRow,
                { borderBottomColor: colors.borderSubtle },
              ]}
            >
              <TouchableOpacity
                onPress={handleCancelEdit}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityRole="button"
                accessibilityLabel="Cancel editing profile"
              >
                <Text style={[styles.editModalCancelText, { color: colors.textSecondary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <Text style={[styles.editModalTitle, { color: colors.textPrimary }]}>
                Edit Profile
              </Text>

              <TouchableOpacity
                onPress={handleSaveProfile}
                disabled={isSaving}
                activeOpacity={0.8}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={[
                  styles.editModalSaveBtn,
                  floatingButtonTokens.primary,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Save profile changes"
              >
                <Text style={styles.editModalSaveText}>{isSaving ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.editModalScrollContent}
              keyboardShouldPersistTaps="handled"
            >
              {/* Photo Picker Hook */}
              <View style={styles.photoPickerContainer}>
                <View style={styles.photoPickerAvatarWrapper}>
                  <Avatar
                    name={editName || profileName}
                    uri={profilePhotoUri}
                    size="xl"
                    style={styles.avatarImage}
                  />
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={handleChangePhoto}
                    style={[
                      styles.photoPickerBadge,
                      {
                        backgroundColor: colors.primary,
                        borderColor: colors.surface,
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Change profile photo"
                  >
                    <Camera size={13} color="#FFFFFF" strokeWidth={2.2} />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleChangePhoto}
                  style={[
                    styles.changePhotoBtn,
                    {
                      backgroundColor: colors.surfaceSubtle,
                      borderColor: colors.borderSubtle,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Change Photo"
                >
                  <Camera size={13} color={colors.primary} strokeWidth={2} />
                  <Text style={[styles.changePhotoText, { color: colors.primary }]}>
                    Change Photo
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Form Fields */}
              <View style={styles.editFormFields}>
                {/* Field 1: Name */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
                    Full Name
                  </Text>
                  <TextInput
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="Enter your full name"
                    placeholderTextColor={colors.textMuted}
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: colors.surfaceSubtle,
                        borderColor: colors.borderSubtle,
                        color: colors.textPrimary,
                      },
                    ]}
                  />
                </View>

                {/* Field 2: Department (Locked after approval — admin correction only) */}
                <View style={styles.inputGroup}>
                  <View style={styles.inputLabelRow}>
                    <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
                      Department
                    </Text>
                    <View style={styles.lockedBadge}>
                      <Lock size={10} color={colors.textMuted} strokeWidth={2.4} />
                      <Text style={[styles.lockedText, { color: colors.textMuted }]}>
                        Locked
                      </Text>
                    </View>
                  </View>
                  <TextInput
                    value={editDepartment}
                    editable={false}
                    selectTextOnFocus={false}
                    style={[
                      styles.textInput,
                      styles.disabledInput,
                      {
                        backgroundColor: colors.surfaceSubtle,
                        borderColor: colors.borderSubtle,
                        color: colors.textMuted,
                      },
                    ]}
                  />
                  <Text style={[styles.lockedText, { color: colors.textMuted, marginTop: 4 }]}>
                    Department, batch, designation and student ID are verified at approval. Contact the department administrator to change them.
                  </Text>
                </View>

                {/* Field 3: Batch (Locked / Read-only) */}
                <View style={styles.inputGroup}>
                  <View style={styles.inputLabelRow}>
                    <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
                      Batch / Cohort
                    </Text>
                    <View style={styles.lockedBadge}>
                      <Lock size={10} color={colors.textMuted} strokeWidth={2.4} />
                      <Text style={[styles.lockedText, { color: colors.textMuted }]}>
                        Locked
                      </Text>
                    </View>
                  </View>
                  <TextInput
                    value={profileBatch}
                    editable={false}
                    selectTextOnFocus={false}
                    style={[
                      styles.textInput,
                      styles.disabledInput,
                      {
                        backgroundColor: colors.surfaceSubtle,
                        borderColor: colors.borderSubtle,
                        color: colors.textMuted,
                      },
                    ]}
                  />
                </View>

                {/* Field 4: Bio (Multiline) */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
                    Bio & Research Focus
                  </Text>
                  <TextInput
                    value={editBio}
                    onChangeText={setEditBio}
                    placeholder="Write a brief overview of your academic focus..."
                    placeholderTextColor={colors.textMuted}
                    multiline={true}
                    numberOfLines={4}
                    textAlignVertical="top"
                    style={[
                      styles.textInput,
                      styles.bioInput,
                      {
                        backgroundColor: colors.surfaceSubtle,
                        borderColor: colors.borderSubtle,
                        color: colors.textPrimary,
                      },
                    ]}
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
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.md,
  },
  signOutText: {
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 14,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.screenHorizontal,
  },

  // Section 1: Hero Card
  heroCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  heroCenteredTop: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  avatarContainer: {
    position: 'relative',
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroInfoCentered: {
    alignItems: 'center',
    marginTop: 12,
    gap: 4,
    width: '100%',
    paddingHorizontal: spacing.xs,
  },
  heroName: {
    fontSize: 24,
    lineHeight: 30,
    fontFamily: fontFamilies.serifBold,
    textAlign: 'center',
  },
  credentialsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  credentialsIcon: {
    marginRight: 5,
  },
  credentialsText: {
    fontSize: 14,
    fontFamily: fontFamilies.sansMedium,
    lineHeight: 20,
    textAlign: 'center',
  },
  bioText: {
    fontSize: 14,
    fontFamily: fontFamilies.sansRegular,
    lineHeight: 20,
    textAlign: 'center',
    paddingHorizontal: spacing.sm,
    marginTop: 2,
  },

  // Hero Self-Profile Actions
  heroActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
  },
  editProfileButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  editProfileText: {
    fontSize: 14,
    fontFamily: fontFamilies.sansSemiBold,
  },
  settingsButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Hero Stats Strip (Bottom Row)
  statsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 14,
  },
  statColumn: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 17,
    fontFamily: fontFamilies.sansBold,
    lineHeight: 22,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: fontFamilies.sansMedium,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
  },

  // Section Headers
  sectionContainer: {
    marginBottom: spacing.lg,
  },
  sectionHeading: {
    fontSize: 18,
    fontFamily: fontFamilies.serifBold,
    lineHeight: 24,
    marginBottom: 10,
  },

  // Section 2: Interests / Topic Chips
  topicPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  topicChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    maxWidth: '100%',
    flexShrink: 1,
  },
  topicChipText: {
    fontSize: 12.5,
    fontFamily: fontFamilies.sansMedium,
    letterSpacing: 0.1,
    flexShrink: 1,
  },

  // Section 3: Currently Working On
  projectCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: spacing.md,
  },
  projectHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  projectTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: fontFamilies.sansSemiBold,
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    flexShrink: 0,
  },
  statusIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgeText: {
    fontSize: 11,
    fontFamily: fontFamilies.sansSemiBold,
    letterSpacing: 0.2,
  },
  projectDescription: {
    fontSize: 14,
    fontFamily: fontFamilies.sansRegular,
    lineHeight: 20,
    marginVertical: 10,
  },
  projectFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderTopWidth: 1,
    paddingTop: 10,
  },
  projectMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  projectMetaText: {
    fontSize: 12.5,
    fontFamily: fontFamilies.sansMedium,
  },

  // Section 4: Research & Publications
  publicationsList: {
    gap: 10,
  },
  publicationItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 12,
  },
  pubIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  pubInfoColumn: {
    flex: 1,
  },
  pubTitle: {
    fontSize: 14.5,
    fontFamily: fontFamilies.sansSemiBold,
    lineHeight: 20,
  },
  pubSubtitle: {
    fontSize: 12,
    fontFamily: fontFamilies.sansRegular,
    marginTop: 3,
  },
  pubLinkArrow: {
    flexShrink: 0,
  },

  // Section 5: Academic Links (Unified Vertical Card)
  academicLinksCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  linkIconWrapper: {
    marginRight: 12,
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkLabel: {
    fontSize: 14,
    fontFamily: fontFamilies.sansMedium,
    flex: 1,
  },

  // Settings Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  modalCard: {
    width: '100%',
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  modalTitle: {
    ...typography.title,
    fontSize: 18,
    fontFamily: fontFamilies.sansBold,
  },
  modalSubtitle: {
    fontSize: 12,
    fontFamily: fontFamilies.sansRegular,
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSectionLabel: {
    fontSize: 13,
    fontFamily: fontFamilies.sansSemiBold,
    marginBottom: spacing.sm,
  },
  themeOptionsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  themeOptionBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: 4,
    borderRadius: radius.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeIconBox: {
    marginBottom: 6,
  },
  themeOptionTitle: {
    fontSize: 12,
    fontFamily: fontFamilies.sansSemiBold,
  },
  themeOptionDesc: {
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
    fontFamily: fontFamilies.sansRegular,
  },
  modalDoneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
  },
  modalDoneBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: fontFamilies.sansSemiBold,
  },

  // Edit Profile Modal
  editModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  editModalCard: {
    maxHeight: '90%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderBottomWidth: 0,
    overflow: 'hidden',
  },
  editModalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  editModalCancelText: {
    fontSize: 15,
    fontFamily: fontFamilies.sansRegular,
  },
  editModalTitle: {
    fontSize: 17,
    fontFamily: fontFamilies.sansBold,
  },
  editModalSaveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 12,
  },
  editModalSaveText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: fontFamilies.sansSemiBold,
  },
  editModalScrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  photoPickerContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  photoPickerAvatarWrapper: {
    position: 'relative',
    width: 88,
    height: 88,
    marginBottom: 8,
  },
  photoPickerBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  changePhotoText: {
    fontSize: 12.5,
    fontFamily: fontFamilies.sansSemiBold,
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
    fontSize: 13,
    fontFamily: fontFamilies.sansSemiBold,
  },
  lockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  lockedText: {
    fontSize: 11,
    fontFamily: fontFamilies.sansMedium,
  },
  textInput: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 14,
    fontFamily: fontFamilies.sansRegular,
  },
  disabledInput: {
    opacity: 0.7,
  },
  bioInput: {
    minHeight: 88,
    paddingTop: 12,
  },
});
