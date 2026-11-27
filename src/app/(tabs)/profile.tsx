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
  Check,
  Users,
  Lock,
  Bookmark,
  IdCard,
  Mail,
  MessageCircle,
  Eye,
  Send,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  CheckCircle2,
  Circle,
  Pencil,
} from 'lucide-react-native';
import { spacing, radius, typography, fontFamilies, floatingButtonTokens } from '@/constants';
import { linkIconFor } from '@/components/common/linkIcon';
import { ICON_STROKE } from '@/constants/icons';
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

type ActivityFilter = 'posts' | 'collaborations' | 'drafts' | 'teams';
const ACTIVITY_FILTERS: { key: ActivityFilter; label: string }[] = [
  { key: 'posts', label: 'Posts' },
  { key: 'collaborations', label: 'Collaborations' },
  { key: 'drafts', label: 'Drafts' },
  { key: 'teams', label: 'Teams' },
];
const ACTIVITY_EMPTY: Record<ActivityFilter, string> = {
  posts: 'No research updates yet.',
  collaborations: "You haven't posted a collaboration yet.",
  drafts: 'No drafts. Use "Save draft" on the Share page to finish a post later.',
  teams: "You haven't joined a team yet.",
};

export default function ProfileTab() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { edit: editParam } = useLocalSearchParams<{ edit?: string }>();
  const { userProfile, firebaseUser, signOut } = useAuth();
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
    const Icon = linkIconFor(String(key));
    return <Icon size={18} color={colors.primary} />;
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
  // Photo comes from the Google account; email-password accounts can't set one
  // yet, so that step only counts for Google sign-ins (everyone can reach 100%).
  const isGoogleAccount = Boolean(firebaseUser?.providerData?.some((p) => p.providerId === 'google.com'));
  const completenessChecks: { label: string; done: boolean; fix?: () => void }[] = [
    ...(isGoogleAccount ? [{ label: 'Profile photo (from your Google account)', done: Boolean(userProfile?.photoURL) }] : []),
    { label: 'Write a short bio', done: Boolean(profileBio), fix: handleOpenEditModal },
    { label: 'Add at least 3 research interests', done: researchInterests.length >= 3, fix: handleOpenEditModal },
    { label: 'Add an academic link', done: Object.values(userProfile?.socialLinks ?? {}).some(Boolean), fix: handleOpenEditModal },
    { label: 'Share your current work', done: myWorks.length > 0, fix: () => router.push('/(tabs)/share' as any) },
    { label: 'Add a contact card so collaborators can reach you', done: hasMyCard !== false, fix: openContactEditor },
  ];
  const completeness = Math.round((completenessChecks.filter((c) => c.done).length / completenessChecks.length) * 100);
  const nextStep = completenessChecks.find((c) => !c.done);

  // Activity / About tabs
  const [profileTab, setProfileTab] = useState<'activity' | 'about'>('activity');
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>('posts');
  const [showChecklist, setShowChecklist] = useState(false);
  const showActivity = (f: ActivityFilter) => {
    setProfileTab('activity');
    setActivityFilter(f);
  };
  const activityLists: Record<ActivityFilter, ResearchWork[]> = useMemo(
    () => ({
      posts: myWorks.filter((w) => w.status === 'published' && w.postType !== 'collaboration'),
      collaborations: myWorks.filter((w) => w.status === 'published' && w.postType === 'collaboration'),
      drafts: myWorks.filter((w) => w.status === 'draft'),
      teams: teamWorks.filter((w) => w.authorUid !== userProfile?.uid),
    }),
    [myWorks, teamWorks, userProfile?.uid],
  );
  const publishedCount = activityLists.posts.length + activityLists.collaborations.length;
  const appCounts = useMemo(
    () => ({
      pending: myApplications.filter((a) => a.status === 'pending').length,
      accepted: myApplications.filter((a) => a.status === 'accepted').length,
      declined: myApplications.filter((a) => a.status === 'declined').length,
    }),
    [myApplications],
  );

  const libraryItems: ProfileListItem[] = [
    {
      id: 'saved',
      label: `Saved Items (${savedItems.length})`,
      icon: <Bookmark size={18} color={colors.primary} />,
      onPress: () => router.push('/(profile)/saved' as any),
      trailing: 'chevron',
    },
    {
      id: 'network',
      label: `My Network · ${connected.length} connection${connected.length === 1 ? '' : 's'}${
        incomingRequests.length ? ` · ${incomingRequests.length} request${incomingRequests.length === 1 ? '' : 's'}` : ''
      }`,
      icon: <Users size={18} color={colors.primary} />,
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
            icon={<Settings size={18} color={colors.textPrimary} />}
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
          role={userProfile?.designation}
          details={[profileDepartment, profileBatch ? `Batch ${profileBatch}` : null].filter(Boolean).join(' · ')}
          bio={profileBio}
          emptyBioPrompt="Add a short bio about your research focus"
          onEmptyBioPress={handleOpenEditModal}
          actions={
            <>
              <HeroActionButton
                label="Edit profile"
                icon={<Pencil size={15} color={colors.textPrimary} />}
                onPress={handleOpenEditModal}
              />
              <HeroActionButton
                label="Public view"
                icon={<Eye size={15} color={colors.textPrimary} />}
                onPress={() =>
                  userProfile?.uid &&
                  router.push({ pathname: `/(profile)/${userProfile.uid}` as any, params: { preview: '1' } })
                }
              />
            </>
          }
          stats={[
            { label: 'Connections', value: connected.length, onPress: () => router.push('/(profile)/network' as any) },
            { label: 'Posts', value: publishedCount, onPress: () => showActivity('posts') },
            { label: 'Teams', value: teamWorks.length, onPress: () => showActivity('teams') },
          ]}
        />

        {/* Profile strength — expandable checklist */}
        {completeness < 100 ? (
          <View style={[styles.meterCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setShowChecklist((v) => !v)}
              accessibilityRole="button"
              accessibilityState={{ expanded: showChecklist }}
              accessibilityLabel={`Profile ${completeness} percent complete. ${showChecklist ? 'Hide' : 'Show'} checklist`}
            >
              <View style={styles.meterHeader}>
                <Text style={[styles.meterTitle, { color: colors.textPrimary }]}>Profile strength</Text>
                <View style={styles.meterRight}>
                  <Text style={[styles.meterPercent, { color: colors.primary }]}>{completeness}%</Text>
                  {showChecklist ? <ChevronUp size={18} color={colors.textMuted} /> : <ChevronDown size={18} color={colors.textMuted} />}
                </View>
              </View>
              <View style={[styles.meterTrack, { backgroundColor: colors.surfaceSubtle }]}>
                <View style={[styles.meterFill, { width: `${completeness}%`, backgroundColor: colors.primary }]} />
              </View>
              {!showChecklist && nextStep ? (
                <View style={styles.meterNextRow}>
                  <Text style={[styles.meterNext, { color: colors.textSecondary }]}>Next: {nextStep.label}</Text>
                  <ChevronRight size={15} color={colors.textSecondary} />
                </View>
              ) : null}
            </TouchableOpacity>
            {showChecklist ? (
              <View style={styles.checklist}>
                {completenessChecks.map((c) => (
                  <TouchableOpacity
                    key={c.label}
                    disabled={c.done || !c.fix}
                    onPress={c.fix}
                    style={styles.checkRow}
                    accessibilityRole="button"
                    accessibilityState={{ checked: c.done }}
                  >
                    {c.done ? <CheckCircle2 size={16} color={colors.success} /> : <Circle size={16} color={colors.textMuted} />}
                    <Text style={[styles.checkText, { color: c.done ? colors.textSecondary : colors.textPrimary }, c.done && styles.checkDone]}>
                      {c.label}
                    </Text>
                    {!c.done && c.fix ? <ChevronRight size={16} color={colors.primary} /> : null}
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Activity | About */}
        <View style={[styles.tabs, { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderSubtle }]} accessibilityRole="tablist">
          {(['activity', 'about'] as const).map((t) => {
            const active = profileTab === t;
            return (
              <TouchableOpacity
                key={t}
                onPress={() => setProfileTab(t)}
                style={[styles.tabBtn, active && { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
              >
                <Text style={[styles.tabText, { color: active ? colors.textPrimary : colors.textSecondary }, active && { fontFamily: fontFamilies.sansSemiBold }]}>
                  {t === 'activity' ? 'Activity' : 'About'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {profileTab === 'activity' ? (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.activityChips}>
              {ACTIVITY_FILTERS.map((f) => {
                const active = activityFilter === f.key;
                return (
                  <TouchableOpacity
                    key={f.key}
                    onPress={() => setActivityFilter(f.key)}
                    style={[
                      styles.activityChip,
                      active
                        ? { backgroundColor: colors.primary, borderColor: colors.primary }
                        : { backgroundColor: colors.surface, borderColor: colors.borderSubtle },
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                  >
                    <Text style={[styles.activityChipText, { color: active ? '#FFFFFF' : colors.textSecondary }, active && { fontFamily: fontFamilies.sansSemiBold }]}>
                      {f.label} {activityLists[f.key].length}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {myWorksLoading ? (
              <SkeletonList count={2} variant="row" />
            ) : myWorksError ? (
              <ProfileEmptyText text="Could not load your work. Please try again later." />
            ) : activityLists[activityFilter].length === 0 ? (
              <View style={[styles.activityEmpty, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
                <Text style={[styles.activityEmptyText, { color: colors.textSecondary }]}>{ACTIVITY_EMPTY[activityFilter]}</Text>
                {activityFilter !== 'teams' ? (
                  <TouchableOpacity
                    onPress={() =>
                      router.push({
                        pathname: '/(tabs)/share' as any,
                        params: { mode: activityFilter === 'collaborations' ? 'collaboration' : 'work' },
                      })
                    }
                    style={[styles.activityEmptyBtn, { backgroundColor: colors.primaryMuted }]}
                  >
                    <Text style={[styles.activityEmptyBtnText, { color: colors.primary }]}>
                      {activityFilter === 'collaborations' ? 'Post collaboration' : 'Share update'}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={() => router.push({ pathname: '/(explore)/search' as any, params: { category: 'collaborations' } })}
                    style={[styles.activityEmptyBtn, { backgroundColor: colors.primaryMuted }]}
                  >
                    <Text style={[styles.activityEmptyBtnText, { color: colors.primary }]}>Browse open collaborations</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <>
                {activityFilter === 'drafts' ? (
                  <Text style={[styles.activityHint, { color: colors.textMuted }]}>Only you can see drafts — open one to publish it.</Text>
                ) : null}
                <WorkList
                  works={activityLists[activityFilter]}
                  initialCount={5}
                  onOpen={(w) => router.push(`/(research)/${w.id}` as any)}
                  badgeFor={(w) =>
                    w.authorUid !== userProfile?.uid
                      ? `Team member · ${roleFor.get(w.id) ?? ''} · with ${w.authorName.split(' ')[0]}`
                      : undefined
                  }
                />
              </>
            )}

            {/* My applications summary */}
            {myApplications.length > 0 ? (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => router.push({ pathname: '/(profile)/network' as any, params: { tab: 'teams' } })}
                style={[styles.appsRow, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}
                accessibilityRole="button"
              >
                <View style={[styles.appsIcon, { backgroundColor: colors.primaryMuted }]}>
                  <Send size={16} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.appsTitle, { color: colors.textPrimary }]}>My applications</Text>
                  <Text style={[styles.appsSub, { color: colors.textSecondary }]}>
                    {[
                      appCounts.pending ? `${appCounts.pending} pending` : null,
                      appCounts.accepted ? `${appCounts.accepted} accepted` : null,
                      appCounts.declined ? `${appCounts.declined} declined` : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </Text>
                </View>
                <ChevronRight size={18} color={colors.textMuted} />
              </TouchableOpacity>
            ) : null}
          </>
        ) : (
          <View style={styles.aboutContent}>
            {/* Research interests */}
            <ProfileSection title="Research Interests" actionLabel="+ Add" onActionPress={handleOpenEditModal}>
              {researchInterests.length === 0 ? (
                <ProfileEmptyText text="Add interests to get better suggestions in Explore and Home." />
              ) : (
                <View style={styles.chipsRow}>
                  {researchInterests.map((interest) => (
                    <TopicChip key={interest} label={interest} variant="teal" onPress={() => openTopic(interest)} />
                  ))}
                </View>
              )}
            </ProfileSection>

            {/* Contact card */}
            <ProfileSection title="Contact Card" actionLabel={hasMyCard ? 'Edit' : undefined} onActionPress={hasMyCard ? openContactEditor : undefined}>
              {hasMyCard ? (
                <ProfileListCard
                  items={[
                    ...(myCard?.email
                      ? [{ id: 'email', label: myCard.email, icon: <Mail size={18} color={colors.primary} />, onPress: openContactEditor, trailing: 'chevron' as const }]
                      : []),
                    ...(myCard?.preferredContact
                      ? [{
                          id: 'preferred',
                          label: myCard.preferredContact,
                          icon: <MessageCircle size={18} color={colors.primary} />,
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

            {/* Academic links */}
            <ProfileSection title="Academic Links" actionLabel="+ Add" onActionPress={handleOpenEditModal}>
              {academicLinks.length === 0 ? (
                <ProfileEmptyText text="Add Google Scholar, GitHub, LinkedIn or your website." />
              ) : (
                <ProfileListCard items={academicLinks} />
              )}
            </ProfileSection>

            {/* Library */}
            <ProfileSection title="Library">
              <ProfileListCard items={libraryItems} />
            </ProfileSection>
          </View>
        )}
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
                        <Lock size={10} color={colors.textMuted} strokeWidth={ICON_STROKE.emphasis} />
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
  meterRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  aboutContent: { marginTop: spacing.lg },
  checklist: { marginTop: spacing.sm, gap: 2 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 36 },
  checkText: { fontSize: 13, lineHeight: 18, fontFamily: fontFamilies.sansMedium, flex: 1 },
  checkDone: { textDecorationLine: 'line-through' },
  tabs: { flexDirection: 'row', borderWidth: 1, borderRadius: radius.button, padding: 3, gap: 3, marginTop: spacing.md },
  tabBtn: { flex: 1, height: 38, borderRadius: radius.button - 3, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'transparent' },
  tabText: { fontSize: 14, fontFamily: fontFamilies.sansMedium },
  activityChips: { gap: spacing.xs, paddingVertical: spacing.md },
  activityChip: { paddingHorizontal: 14, height: 34, borderRadius: radius.full, borderWidth: 1, justifyContent: 'center' },
  activityChipText: { fontSize: 13, fontFamily: fontFamilies.sansMedium },
  activityHint: { fontSize: 12, marginBottom: spacing.xs },
  activityEmpty: { borderWidth: 1, borderRadius: radius.md, padding: spacing.lg, alignItems: 'center', gap: spacing.sm },
  activityEmptyText: { fontSize: 13, textAlign: 'center' },
  activityEmptyBtn: { paddingHorizontal: spacing.md, height: 36, borderRadius: radius.button, justifyContent: 'center' },
  activityEmptyBtnText: { fontSize: 13, fontFamily: fontFamilies.sansSemiBold },
  appsRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderWidth: 1, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.md },
  appsIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  appsTitle: { fontSize: 14, fontFamily: fontFamilies.sansSemiBold },
  appsSub: { fontSize: 12, marginTop: 2 },
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
  meterNextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: spacing.sm,
  },
  meterNext: {
    ...typography.bodySmall,
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
