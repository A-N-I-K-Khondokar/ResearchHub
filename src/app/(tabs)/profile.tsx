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
import { TabHeader, HeaderIconButton } from '@/components/layout/TabHeader';
import { SettingsSheet } from '@/components/profile/SettingsSheet';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Settings,
  Edit3,
  GraduationCap,
  Check,
  Users,
  ExternalLink,
  Globe,
  Code2,
  Lock,
  Linkedin,
  Bookmark,
  IdCard,
  Mail,
  MessageCircle,
} from 'lucide-react-native';
import { spacing, radius, typography, fontFamilies, floatingButtonTokens } from '@/constants';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { Avatar } from '@/components/common/Avatar';
import { TopicChip } from '@/components/common/TopicChip';
import {
  ProfileHero,
  HeroActionButton,
  ProfileSection,
  ProfileEmptyText,
  WorkList,
  ProfileListCard,
  type ProfileListItem,
} from '@/components/profile';
import { updateUserProfile } from '@/services/user.service';
import { subscribeMyResearchWorks, subscribeWorksByIds } from '@/services/research.service';
import { useCollab } from '@/context/CollabContext';
import { useConnections } from '@/hooks/useConnections';
import { useSavedItems } from '@/hooks/useSavedItems';
import { confirmAction } from '@/utils/dialogs';
import { useToast } from '@/context/ToastContext';
import { SkeletonList } from '@/components/feedback/Skeleton';
import { useContactCard } from '@/context/ContactCardContext';
import { TOPIC_TAXONOMY } from '@/utils/search';
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
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { edit: editParam } = useLocalSearchParams<{ edit?: string }>();
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

  // Collaborations I joined as a team member (accepted applications)
  const { myApplications } = useCollab();
  const joined = useMemo(() => myApplications.filter((r) => r.status === 'accepted'), [myApplications]);
  const joinedKey = joined.map((r) => r.workId).sort().join(',');
  const [teamWorks, setTeamWorks] = useState<ResearchWork[]>([]);
  useEffect(() => {
    const ids = joinedKey ? joinedKey.split(',') : [];
    return subscribeWorksByIds(ids, setTeamWorks);
  }, [joinedKey]);
  const roleFor = useMemo(() => new Map(joined.map((r) => [r.workId, r.role] as const)), [joined]);
  const workingOn = useMemo(() => {
    const own = new Set(myWorks.map((w) => w.id));
    return [...myWorks, ...teamWorks.filter((w) => !own.has(w.id))].sort(
      (a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0),
    );
  }, [myWorks, teamWorks]);

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
  const [editInterests, setEditInterests] = useState<string[]>(researchInterests);
  const [interestInput, setInterestInput] = useState('');
  const [editLinks, setEditLinks] = useState<Record<string, string>>({});
  // Contact card (guided editor lives in ContactCardContext)
  const { myCard, hasMyCard, openContactEditor } = useContactCard();
  const toast = useToast();

  const addInterest = (raw: string) => {
    const value = raw.trim();
    if (!value) return;
    setEditInterests((prev) =>
      prev.some((i) => i.toLowerCase() === value.toLowerCase()) || prev.length >= 30 ? prev : [...prev, value],
    );
    setInterestInput('');
  };
  const [isSaving, setIsSaving] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleOpenEditModal = () => {
    setEditName(profileName);
    setEditBio(profileBio);
    setEditInterests(researchInterests);
    setInterestInput('');
    const links = userProfile?.socialLinks ?? {};
    setEditLinks(Object.fromEntries(LINK_META.map((m) => [m.key as string, String(links[m.key] ?? '')])));
    setIsEditModalVisible(true);
  };

  // Deep links: /(tabs)/profile?edit=contact (contact card) | ?edit=profile (edit form)
  useEffect(() => {
    if (!editParam || !userProfile) return;
    if (editParam === 'contact') openContactEditor();
    else if (editParam === 'profile') handleOpenEditModal();
    else return;
    router.setParams({ edit: '' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editParam, userProfile?.uid]);

  const handleSaveProfile = async () => {
    if (!userProfile || isSaving) return;
    const name = editName.trim();
    const bio = editBio.trim();

    if (!name || name.length > 100) {
      toast.show('Full name is required (max 100 characters)', 'error');
      return;
    }
    if (bio.length > 2000) {
      toast.show('Bio must be 2000 characters or less', 'error');
      return;
    }

    setIsSaving(true);
    try {
      // Only presentation fields; the profile listener refreshes the UI.
      // Keep any link keys this screen does not edit, then apply edited ones.
      const socialLinks: Record<string, string> = {};
      Object.entries(userProfile.socialLinks ?? {}).forEach(([k, v]) => {
        if (v && !LINK_META.some((m) => m.key === k)) socialLinks[k] = String(v);
      });
      LINK_META.forEach((m) => {
        const v = (editLinks[m.key as string] ?? '').trim();
        if (v) socialLinks[m.key as string] = v.slice(0, 300);
      });
      const pendingInterest = interestInput.trim();
      const interests = pendingInterest && !editInterests.some((i) => i.toLowerCase() === pendingInterest.toLowerCase())
        ? [...editInterests, pendingInterest].slice(0, 30)
        : editInterests;
      await updateUserProfile(userProfile, {
        displayName: name,
        bio: bio || null,
        researchInterests: interests,
        socialLinks,
      });
      setIsEditModalVisible(false);
      toast.show('Profile updated');
    } catch (err) {
      console.error('[Profile] Save failed:', err);
      toast.show('Could not update your profile. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    if (isSigningOut) return;
    // Close the Settings sheet first so the in-app popup is the only dialog.
    setIsSettingsModalVisible(false);
    await new Promise((r) => setTimeout(r, 250));
    const ok = await confirmAction({
      title: 'Sign out?',
      message: "You'll need to sign in again to use CSE Research Hub on this device.",
      confirmLabel: 'Sign out',
      cancelLabel: 'Stay signed in',
      destructive: true,
      icon: 'signout',
    });
    if (!ok) return;

    setIsSigningOut(true);
    setIsSettingsModalVisible(false);
    try {
      await signOut();
      // AuthGuard routes to the login screen as soon as sign-out starts.
    } catch {
      setIsSigningOut(false);
      toast.show('Sign out failed. Check your connection and try again.', 'error');
    }
  };

  const handleOpenLink = (url: string) => {
    Linking.openURL(url).catch(() => toast.show('Unable to open this link', 'error'));
  };

  const openTopic = (topic: string) =>
    router.push({ pathname: '/(explore)/topic-researchers' as any, params: { topic } });

  // Theme picker options

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

  // Profile completeness (own profile only)
  const completenessChecks = [
    { label: 'Add a profile photo (Google account photo)', done: Boolean(userProfile?.photoURL) },
    { label: 'Write a short bio', done: Boolean(profileBio) },
    { label: 'Add at least 3 research interests', done: researchInterests.length >= 3 },
    { label: 'Add an academic link', done: Object.values(userProfile?.socialLinks ?? {}).some(Boolean) },
    { label: 'Share your current work', done: myWorks.length > 0 },
    { label: 'Add a contact card so collaborators can reach you', done: hasMyCard !== false },
  ];
  const completeness = Math.round((completenessChecks.filter((c) => c.done).length / completenessChecks.length) * 100);
  const nextStep = completenessChecks.find((c) => !c.done);

  const libraryItems: ProfileListItem[] = [
    {
      id: 'saved',
      label: `Saved Items (${savedItems.length})`,
      icon: <Bookmark size={18} color={colors.primary} strokeWidth={2} />,
      onPress: () => router.push('/(profile)/saved' as any),
      trailing: 'chevron',
    },
    {
      id: 'network',
      label: `My Network · ${connected.length} connection${connected.length === 1 ? '' : 's'}${
        incomingRequests.length ? ` · ${incomingRequests.length} request${incomingRequests.length === 1 ? '' : 's'}` : ''
      }`,
      icon: <Users size={18} color={colors.primary} strokeWidth={2} />,
      onPress: () => router.push('/(profile)/network' as any),
      trailing: 'chevron',
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TabHeader
        title="Profile"
        right={
          <HeaderIconButton
            icon={<Settings size={18} color={colors.textPrimary} strokeWidth={2} />}
            onPress={() => setIsSettingsModalVisible(true)}
            label="Open settings and theme options"
          />
        }
      />

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
            <HeroActionButton
              label="Edit Profile"
              icon={<Edit3 size={15} color={colors.textPrimary} strokeWidth={2} />}
              onPress={handleOpenEditModal}
            />
          }
          stats={[
            { label: 'Connections', value: connected.length },
            { label: 'Shared Work', value: myWorks.filter((w) => w.status === 'published').length },
            { label: 'Interests', value: researchInterests.length },
          ]}
        />

        {/* Profile completeness */}
        {completeness < 100 && nextStep ? (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() =>
              nextStep.label.startsWith('Share')
                ? router.push('/(tabs)/share' as any)
                : nextStep.label.startsWith('Add a contact')
                  ? openContactEditor()
                  : handleOpenEditModal()
            }
            style={[styles.meterCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}
            accessibilityRole="button"
            accessibilityLabel={`Profile ${completeness} percent complete. Next: ${nextStep.label}`}
          >
            <View style={styles.meterHeader}>
              <Text style={[styles.meterTitle, { color: colors.textPrimary }]}>Profile strength</Text>
              <Text style={[styles.meterPercent, { color: colors.primary }]}>{completeness}%</Text>
            </View>
            <View style={[styles.meterTrack, { backgroundColor: colors.surfaceSubtle }]}>
              <View style={[styles.meterFill, { width: `${completeness}%`, backgroundColor: colors.primary }]} />
            </View>
            <Text style={[styles.meterNext, { color: colors.textSecondary }]}>
              Next: {nextStep.label} →
            </Text>
          </TouchableOpacity>
        ) : null}

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
            <SkeletonList count={2} variant="row" />
          ) : myWorksError ? (
            <ProfileEmptyText text="Could not load your shared work. Please try again later." />
          ) : workingOn.length === 0 ? (
            <ProfileEmptyText text="Nothing shared yet — tap Share to post what you are researching." />
          ) : (
            <WorkList
              works={workingOn}
              onOpen={(w) => router.push(`/(research)/${w.id}` as any)}
              badgeFor={(w) =>
                w.authorUid !== userProfile?.uid ? `Team member · ${roleFor.get(w.id) ?? ''} · with ${w.authorName.split(' ')[0]}` : undefined
              }
            />
          )}
        </ProfileSection>

        {/* Contact card */}
        <ProfileSection title="Contact Card" actionLabel={hasMyCard ? 'Edit' : undefined} onActionPress={hasMyCard ? openContactEditor : undefined}>
          {hasMyCard ? (
            <ProfileListCard
              items={[
                ...(myCard?.email
                  ? [{ id: 'email', label: myCard.email, icon: <Mail size={18} color={colors.primary} strokeWidth={2} />, onPress: openContactEditor, trailing: 'chevron' as const }]
                  : []),
                ...(myCard?.preferredContact
                  ? [{
                      id: 'preferred',
                      label: myCard.preferredContact,
                      icon: <MessageCircle size={18} color={colors.primary} strokeWidth={2} />,
                      onPress: openContactEditor,
                      trailing: 'chevron' as const,
                    }]
                  : []),
              ]}
            />
          ) : (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={openContactEditor}
              style={[styles.contactCta, { backgroundColor: colors.primaryMuted, borderColor: colors.primaryLight }]}
              accessibilityRole="button"
              accessibilityLabel="Add your contact card"
            >
              <View style={[styles.contactCtaIcon, { backgroundColor: colors.surface }]}>
                <IdCard size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.contactCtaTitle, { color: colors.textPrimary }]}>Add how collaborators can reach you</Text>
                <Text style={[styles.contactCtaSub, { color: colors.textSecondary }]}>
                  WhatsApp, Telegram, phone or email · takes 10 seconds
                </Text>
              </View>
              <Text style={[styles.contactCtaAction, { color: colors.primary }]}>Add</Text>
            </TouchableOpacity>
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

      {/* Settings (bottom sheet) */}
      <SettingsSheet
        visible={isSettingsModalVisible}
        onClose={() => setIsSettingsModalVisible(false)}
        email={userProfile?.email}
        hasContactCard={hasMyCard}
        signingOut={isSigningOut}
        onEditProfile={handleOpenEditModal}
        onContactCard={openContactEditor}
        onSignOut={handleSignOut}
      />

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

                {/* Research interests */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
                    Research Interests ({editInterests.length}/30)
                  </Text>
                  {editInterests.length > 0 ? (
                    <View style={styles.chipsRow}>
                      {editInterests.map((interest) => (
                        <TopicChip
                          key={interest}
                          label={interest}
                          variant="teal"
                          onRemove={() => setEditInterests((prev) => prev.filter((i) => i !== interest))}
                        />
                      ))}
                    </View>
                  ) : null}
                  <TextInput
                    value={interestInput}
                    onChangeText={setInterestInput}
                    onSubmitEditing={() => addInterest(interestInput)}
                    placeholder="Add an interest and press enter"
                    placeholderTextColor={colors.textMuted}
                    returnKeyType="done"
                    style={[styles.textInput, { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderSubtle, color: colors.textPrimary }]}
                  />
                  <View style={styles.chipsRow}>
                    {TOPIC_TAXONOMY.filter((t) => !editInterests.some((i) => i.toLowerCase() === t.name.toLowerCase()))
                      .slice(0, 8)
                      .map((t) => (
                        <TopicChip key={t.id} label={`+ ${t.name}`} variant="outline" onPress={() => addInterest(t.name)} />
                      ))}
                  </View>
                </View>

                {/* Academic links */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Academic Links</Text>
                  {LINK_META.map((m) => (
                    <TextInput
                      key={m.key as string}
                      value={editLinks[m.key as string] ?? ''}
                      onChangeText={(v) => setEditLinks((prev) => ({ ...prev, [m.key as string]: v }))}
                      placeholder={`${m.name} URL`}
                      placeholderTextColor={colors.textMuted}
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="url"
                      style={[styles.textInput, { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderSubtle, color: colors.textPrimary }]}
                    />
                  ))}
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
  contactCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  contactCtaIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  contactCtaTitle: { ...typography.label, fontFamily: fontFamilies.sansSemiBold },
  contactCtaSub: { ...typography.caption, marginTop: 2 },
  contactCtaAction: { ...typography.label, fontFamily: fontFamilies.sansSemiBold },
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  meterCard: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  meterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  meterTitle: {
    ...typography.sectionHeader,
  },
  meterPercent: {
    ...typography.label,
  },
  meterTrack: {
    height: 8,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  meterFill: {
    height: 8,
    borderRadius: radius.full,
  },
  meterNext: {
    ...typography.bodySmall,
    marginTop: spacing.sm,
  },

  // Settings modal

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
