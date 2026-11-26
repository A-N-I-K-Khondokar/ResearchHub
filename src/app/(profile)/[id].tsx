import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { User, UserPlus, Check, Clock, GraduationCap, Globe, Code2, Linkedin, ExternalLink } from 'lucide-react-native';
import { spacing, radius, typography, fontFamilies } from '../../constants';
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
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { firebaseUser } = useAuth();
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

  // Your own profile lives in the Profile tab
  useEffect(() => {
    if (id && firebaseUser?.uid === id) {
      router.replace('/(tabs)/profile' as any);
    }
  }, [id, firebaseUser?.uid, router]);

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
    const iconProps = { size: 18, color: colors.primary, strokeWidth: 2 };
    const iconFor = (key: string) =>
      key === 'googleScholar' ? <GraduationCap {...iconProps} />
      : key === 'researchGate' ? <Globe {...iconProps} />
      : key === 'github' ? <Code2 {...iconProps} />
      : key === 'linkedin' ? <Linkedin {...iconProps} />
      : <ExternalLink {...iconProps} />;
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

  const renderConnectAction = () => {
    if (!profile) return null;
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
      <ScreenHeader title="Researcher Profile" />

      {state === 'loading' ? (
        <ProfileSkeleton />
      ) : state !== 'ready' || !profile ? (
        <View style={styles.centered}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primaryMuted }]}>
            <User size={36} color={colors.primary} />
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
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <ProfileHero
            name={profile.displayName}
            photoURL={profile.photoURL}
            credentials={[profile.designation, profile.department, profile.batch].filter(Boolean).join(' • ')}
            bio={profile.bio}
            actions={renderConnectAction()}
            stats={[
              { label: 'Shared Work', value: works.length },
              { label: 'Interests', value: profile.researchInterests.length },
            ]}
          />

          <ProfileSection title="Contact">
            {isConnected ? (
              contact && (contact.email || contact.preferredContact) ? (
                <ProfileListCard
                  items={[
                    ...(contact.email
                      ? [{
                          id: 'email',
                          label: contact.email,
                          icon: <Mail size={18} color={colors.primary} strokeWidth={2} />,
                          trailing: 'external' as const,
                          onPress: () =>
                            Linking.openURL(`mailto:${contact.email}`).catch(() => toast.show('Unable to open email app', 'error')),
                        }]
                      : []),
                    ...(contact.preferredContact
                      ? [{
                          id: 'preferred',
                          label: contact.preferredContact,
                          icon: <MessageCircle size={18} color={colors.primary} strokeWidth={2} />,
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

          <ProfileSection title="Research Interests">
            {profile.researchInterests.length === 0 ? (
              <ProfileEmptyText text="No research interests listed." />
            ) : (
              <View style={styles.chipsRow}>
                {profile.researchInterests.map((interest) => (
                  <TopicChip key={interest} label={interest} variant="teal" onPress={() => openTopic(interest)} />
                ))}
              </View>
            )}
          </ProfileSection>

          <ProfileSection title="Currently Working On">
            {works.length === 0 ? (
              <ProfileEmptyText text="No research shared yet." />
            ) : (
              <WorkList works={works} onOpen={(w) => router.push(`/(research)/${w.id}` as any)} />
            )}
          </ProfileSection>

          {links.length > 0 ? (
            <ProfileSection title="Academic Links">
              <ProfileListCard items={links} />
            </ProfileSection>
          ) : null}
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
  stateTitle: { ...typography.headlineSmall, textAlign: 'center' },
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
});
