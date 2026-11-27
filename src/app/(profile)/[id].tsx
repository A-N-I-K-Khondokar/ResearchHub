import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { User, UserPlus, Check, Clock, Eye, Star } from 'lucide-react-native';
import { ICON_STROKE } from '@/constants/icons';
import { WorkRow } from '@/components/search/SearchRows';
import { useCollaborate } from '@/hooks/useCollaborate';
import { toCurrentWork } from '@/services/research.service';
import { tagMatchKey } from '@/utils/researchWork';
import { spacing, radius, typography, fontFamilies } from '../../constants';
import { linkIconFor } from '@/components/common/linkIcon';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/context/AuthContext';
import { TopicChip } from '../../components/common/TopicChip';
import { ScreenHeader } from '../../components/layout/ScreenHeader';
import { ProfileSkeleton } from '../../components/feedback/Skeleton';
import {
  ProfileHero,
  HeroActionButton,
  ProfileSection,
  ProfileEmptyText,
  WorkList,
  ProfileListCard,
  type ProfileListItem,
} from '@/components/profile';
import { getPublicProfile } from '@/services/user.service';
import { getPublishedWorksByAuthor } from '@/services/research.service';
import { useConnections } from '@/hooks/useConnections';
import { useToast } from '@/context/ToastContext';
import { getContactCard } from '@/services/collab.service';
import type { ContactCard } from '@/types/collab.types';
import { Mail, MessageCircle, Lock } from 'lucide-react-native';
import { contactActionFor } from '@/utils/contact';
import { copyContact } from '@/components/common/ContactSheet';
import type { PublicProfile } from '@/types/user.types';
import type { ResearchWork } from '@/types/research.types';

type LoadState = 'loading' | 'ready' | 'not-found' | 'error';

const LINK_LABELS: Record<string, string> = {
  googleScholar: 'Google Scholar',
  researchGate: 'ResearchGate',
  github: 'GitHub',
  linkedin: 'LinkedIn',
  website: 'Website',
};

export default function ResearcherProfileScreen() {
  const { id, preview } = useLocalSearchParams<{ id: string; preview?: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { firebaseUser, userProfile } = useAuth();
  const collaborate = useCollaborate();
  const isSelf = Boolean(id && firebaseUser?.uid === id);
  // "View as others" from your own Profile tab
  const previewMode = isSelf && preview === '1';
  const scrollRef = useRef<ScrollView>(null);
  const sectionY = useRef<Record<string, number>>({});
  const trackY = (key: string) => (e: { nativeEvent: { layout: { y: number } } }) => {
    sectionY.current[key] = e.nativeEvent.layout.y;
  };
  const scrollTo = (key: string) => scrollRef.current?.scrollTo({ y: Math.max(0, (sectionY.current[key] ?? 0) - spacing.sm), animated: true });
  const { relationship, handleConnectPress, busyUid } = useConnections();
  const toast = useToast();

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [works, setWorks] = useState<ResearchWork[]>([]);
  const [state, setState] = useState<LoadState>('loading');
  const [contact, setContact] = useState<ContactCard | null>(null);
  const isConnected = Boolean(id) && relationship(id as string).state === 'connected';

  // Contact card is readable only once connected (enforced by the rules)
  useEffect(() => {
    if (!id || !isConnected) {
      setContact(null);
      return;
    }
    getContactCard(id).then(setContact).catch(() => setContact(null));
  }, [id, isConnected]);

  // Your own profile lives in the Profile tab (unless previewing "as others see it")
  useEffect(() => {
    if (isSelf && !previewMode) {
      router.replace('/(tabs)/profile' as any);
    }
  }, [isSelf, previewMode, router]);

  const load = useCallback(async () => {
    if (!id) {
      setState('not-found');
      return;
    }
    setState('loading');
    try {
      // public_profiles only holds APPROVED researchers (sanitised, no email / student ID)
      const [p, w] = await Promise.all([getPublicProfile(id), getPublishedWorksByAuthor(id)]);
      if (!p) {
        setState('not-found');
        return;
      }
      setProfile(p);
      setWorks(w);
      setState('ready');
    } catch (err: any) {
      setState(err?.code === 'permission-denied' ? 'not-found' : 'error');
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const openTopic = (topic: string) =>
    router.push({ pathname: '/(explore)/topic-researchers' as any, params: { topic } });

  const links: ProfileListItem[] = useMemo(() => {
    const iconFor = (key: string) => {
      const Icon = linkIconFor(key);
      return <Icon size={18} color={colors.primary} />;
    };
    return Object.entries(profile?.socialLinks ?? {})
      .filter(([, v]) => Boolean(v))
      .map(([key, value]) => {
        const raw = String(value);
        const url = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
        return {
          id: key,
          label: LINK_LABELS[key] ?? key,
          icon: iconFor(key),
          trailing: 'external' as const,
          onPress: () => Linking.openURL(url).catch(() => toast.show('Unable to open this link', 'error')),
        };
      });
  }, [profile?.socialLinks, colors.primary, toast]);

  // Interests we share (shown under the name)
  const sharedInterests = useMemo(() => {
    if (!profile || isSelf) return [];
    const mine = new Set((userProfile?.researchInterests ?? []).map(tagMatchKey));
    return profile.researchInterests.filter((i) => mine.has(tagMatchKey(i)));
  }, [profile, isSelf, userProfile?.researchInterests]);

  const workPosts = useMemo(() => works.filter((w) => w.postType !== 'collaboration'), [works]);
  const collabPosts = useMemo(
    () =>
      works
        .filter((w) => w.postType === 'collaboration')
        .sort((a, b) => Number(a.collabStatus === 'closed') - Number(b.collabStatus === 'closed')),
    [works],
  );

  const renderConnectAction = () => {
    if (!profile) return null;
    if (previewMode) {
      return <HeroActionButton label="This is how others see you" icon={<Eye size={16} color={colors.primary} />} variant="secondary" onPress={() => router.back()} />;
    }
    const { state: rel } = relationship(profile.uid);
    const busy = busyUid === profile.uid;
    const config = {
      none: { label: 'Connect', icon: <UserPlus size={16} color="#FFFFFF" />, variant: 'primary' as const },
      outgoing: { label: 'Request Sent', icon: <Clock size={16} color={colors.primary} />, variant: 'secondary' as const },
      incoming: { label: 'Respond to Request', icon: <UserPlus size={16} color="#FFFFFF" />, variant: 'primary' as const },
      connected: { label: 'Connected', icon: <Check size={16} color={colors.primary} />, variant: 'secondary' as const },
      rejected: { label: 'Request Declined', icon: <Clock size={16} color={colors.textMuted} />, variant: 'secondary' as const },
    }[rel];
    return (
      <HeroActionButton
        label={config.label}
        icon={config.icon}
        variant={config.variant}
        loading={busy}
        onPress={() => handleConnectPress(profile)}
      />
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <ScreenHeader title={previewMode ? 'Your public profile' : 'Researcher Profile'} />

      {state === 'loading' ? (
        <ProfileSkeleton />
      ) : state !== 'ready' || !profile ? (
        <View style={styles.centered}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primaryMuted }]}>
            <User size={36} color={colors.primary} strokeWidth={ICON_STROKE.light} />
          </View>
          <Text style={[styles.stateTitle, { color: colors.textPrimary }]}>
            {state === 'not-found' ? 'Researcher not available' : 'Something went wrong'}
          </Text>
          <Text style={[styles.stateText, { color: colors.textSecondary }]}>
            {state === 'not-found'
              ? 'This profile is not available in the CSE Research Hub directory.'
              : 'Could not load this profile. Check your connection.'}
          </Text>
          {state === 'error' ? (
            <TouchableOpacity onPress={load} style={[styles.retry, { backgroundColor: colors.primaryMuted }]}>
              <Text style={[styles.retryText, { color: colors.primary }]}>Retry</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : (
        <ScrollView ref={scrollRef} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {previewMode ? (
            <View style={[styles.previewBanner, { backgroundColor: colors.primaryMuted, borderColor: colors.primaryLight }]}>
              <Eye size={16} color={colors.primary} />
              <Text style={[styles.previewText, { color: colors.textPrimary }]}>
                Preview — this is your profile as other researchers see it.
              </Text>
            </View>
          ) : null}

          <ProfileHero
            name={profile.displayName}
            photoURL={profile.photoURL}
            role={profile.designation}
            details={[profile.department, profile.batch ? `Batch ${profile.batch}` : null].filter(Boolean).join(' · ')}
            bio={profile.bio}
            actions={renderConnectAction()}
            stats={[
              { label: 'Posts', value: workPosts.length, onPress: workPosts.length ? () => scrollTo('work') : undefined },
              { label: 'Collaborations', value: collabPosts.length, onPress: collabPosts.length ? () => scrollTo('collabs') : undefined },
              { label: 'Interests', value: profile.researchInterests.length, onPress: () => scrollTo('interests') },
            ]}
          />

          {sharedInterests.length > 0 ? (
            <View style={[styles.sharedLine, { backgroundColor: colors.successLight }]}>
              <Star size={14} color={colors.success} fill={colors.success} />
              <Text style={[styles.sharedText, { color: colors.success }]} numberOfLines={2}>
                You share {sharedInterests.length} interest{sharedInterests.length === 1 ? '' : 's'}: {sharedInterests.slice(0, 3).join(', ')}
                {sharedInterests.length > 3 ? '…' : ''}
              </Text>
            </View>
          ) : null}

          <View onLayout={trackY('interests')}>
            <ProfileSection title="Research Interests">
              {profile.researchInterests.length === 0 ? (
                <ProfileEmptyText text="No research interests listed." />
              ) : (
                <View style={styles.chipsRow}>
                  {profile.researchInterests.map((interest) => (
                    <TopicChip
                      key={interest}
                      label={interest}
                      icon={sharedInterests.includes(interest) ? <Star size={12} color={colors.primary} fill={colors.primary} /> : undefined}
                      variant={sharedInterests.includes(interest) ? 'primary' : 'teal'}
                      onPress={() => openTopic(interest)}
                    />
                  ))}
                </View>
              )}
            </ProfileSection>
          </View>

          <View onLayout={trackY('work')}>
            <ProfileSection title="Currently Working On">
              {workPosts.length === 0 ? (
                <ProfileEmptyText text="No research shared yet." />
              ) : (
                <WorkList works={workPosts} onOpen={(w) => router.push(`/(research)/${w.id}` as any)} />
              )}
            </ProfileSection>
          </View>

          {collabPosts.length > 0 ? (
            <View onLayout={trackY('collabs')}>
              <ProfileSection title="Collaborations">
                <View style={styles.rows}>
                  {collabPosts.map((w) => {
                    const cw = toCurrentWork(w);
                    return (
                      <WorkRow
                        key={w.id}
                        work={cw}
                        terms={[]}
                        reason={null}
                        onPress={() => router.push(`/(research)/${w.id}` as any)}
                        action={previewMode ? undefined : collaborate(cw)}
                      />
                    );
                  })}
                </View>
              </ProfileSection>
            </View>
          ) : null}

          {links.length > 0 ? (
            <ProfileSection title="Academic Links">
              <ProfileListCard items={links} />
            </ProfileSection>
          ) : null}

          <View onLayout={trackY('contact')}>
          <ProfileSection title="Contact">
            {previewMode ? (
              <View style={[styles.lockedContact, { backgroundColor: colors.surfaceSubtle }]}>
                <Lock size={14} color={colors.textMuted} />
                <Text style={[styles.lockedContactText, { color: colors.textSecondary }]}>
                  Your contact card is shown here only to your connections and teammates.
                </Text>
              </View>
            ) : isConnected ? (
              contact && (contact.email || contact.preferredContact) ? (
                <ProfileListCard
                  items={[
                    ...(contact.email
                      ? [{
                          id: 'email',
                          label: contact.email,
                          icon: <Mail size={18} color={colors.primary} />,
                          trailing: 'external' as const,
                          onPress: () =>
                            Linking.openURL(`mailto:${contact.email}`).catch(() => toast.show('Unable to open email app', 'error')),
                        }]
                      : []),
                    ...(contact.preferredContact
                      ? [{
                          id: 'preferred',
                          label: contact.preferredContact,
                          icon: <MessageCircle size={18} color={colors.primary} />,
                          trailing: (contactActionFor(contact.preferredContact) ? 'external' : 'chevron') as 'external' | 'chevron',
                          onPress: () => {
                            const action = contactActionFor(contact.preferredContact);
                            if (action) {
                              Linking.openURL(action.url).catch(() => toast.show('Unable to open this app', 'error'));
                            } else {
                              copyContact(contact.preferredContact ?? '', () => toast.show('Copied', 'success')).catch(() => {});
                            }
                          },
                        }]
                      : []),
                  ]}
                />
              ) : (
                <ProfileEmptyText text={`${profile.displayName.split(' ')[0]} hasn't added contact details yet.`} />
              )
            ) : (
              <View style={[styles.lockedContact, { backgroundColor: colors.surfaceSubtle }]}>
                <Lock size={14} color={colors.textMuted} />
                <Text style={[styles.lockedContactText, { color: colors.textSecondary }]}>
                  Connect (or join one of their collaborations) to see contact details.
                </Text>
              </View>
            )}
          </ProfileSection>
          </View>

        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  stateTitle: { ...typography.title, textAlign: 'center' },
  stateText: { ...typography.bodySmall, textAlign: 'center', marginTop: spacing.xs },
  retry: {
    marginTop: spacing.md,
    minHeight: spacing.secondaryButtonHeight,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderRadius: radius.button,
  },
  retryText: { ...typography.label, fontFamily: fontFamilies.sansSemiBold },
  scrollContent: { padding: spacing.md, paddingBottom: spacing.xl },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  lockedContact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  lockedContactText: { ...typography.bodySmall, flex: 1 },
  previewBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  previewText: { ...typography.bodySmall, flex: 1 },
  sharedLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.md,
  },
  sharedText: { ...typography.caption, fontFamily: fontFamilies.sansSemiBold, flex: 1 },
  rows: { gap: spacing.sm },
});
