import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  User,
  UserPlus,
  Check,
  Clock,
  GraduationCap,
  ExternalLink,
} from 'lucide-react-native';
import { spacing, radius, typography, fontFamilies } from '../../constants';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/context/AuthContext';
import { Avatar } from '../../components/common/Avatar';
import { TopicChip } from '../../components/common/TopicChip';
import { CurrentWorkCard } from '../../components/cards/CurrentWorkCard';
import { getUserProfile } from '@/services/user.service';
import { getPublishedWorksByAuthor, toCurrentWork } from '@/services/research.service';
import { useConnections } from '@/hooks/useConnections';
import type { UserProfile } from '@/types/user.types';
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

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [works, setWorks] = useState<ResearchWork[]>([]);
  const [state, setState] = useState<LoadState>('loading');

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
      const [p, w] = await Promise.all([getUserProfile(id), getPublishedWorksByAuthor(id)]);
      if (!p || p.approvalStatus !== 'approved') {
        setState('not-found');
        return;
      }
      setProfile(p);
      setWorks(w);
      setState('ready');
    } catch (err: any) {
      // Rules deny reads of unapproved / unknown researchers.
      setState(err?.code === 'permission-denied' ? 'not-found' : 'error');
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const openTopic = (topic: string) =>
    router.push({ pathname: '/(explore)/topic-researchers' as any, params: { topic } });

  const openLink = (raw: string) => {
    const url = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    Linking.openURL(url).catch(() => Alert.alert('Link Error', `Unable to open: ${url}`));
  };

  const renderConnectButton = () => {
    if (!profile) return null;
    const { state: rel } = relationship(profile.uid);
    const busy = busyUid === profile.uid;
    const config = {
      none: { label: 'Connect', icon: <UserPlus size={16} color="#FFFFFF" />, filled: true },
      outgoing: { label: 'Request Sent', icon: <Clock size={16} color={colors.primary} />, filled: false },
      incoming: { label: 'Respond to Request', icon: <UserPlus size={16} color="#FFFFFF" />, filled: true },
      connected: { label: 'Connected', icon: <Check size={16} color={colors.primary} />, filled: false },
      rejected: { label: 'Request Declined', icon: <Clock size={16} color={colors.textMuted} />, filled: false },
    }[rel];

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        disabled={busy}
        onPress={() => handleConnectPress(profile)}
        style={[
          styles.connectButton,
          config.filled
            ? { backgroundColor: colors.primary, borderColor: colors.primary }
            : { backgroundColor: colors.primaryMuted, borderColor: colors.primaryLight },
        ]}
        accessibilityRole="button"
        accessibilityLabel={config.label}
      >
        {busy ? <ActivityIndicator size="small" color={config.filled ? '#FFFFFF' : colors.primary} /> : config.icon}
        <Text style={[styles.connectText, { color: config.filled ? '#FFFFFF' : colors.primary }]}>
          {config.label}
        </Text>
      </TouchableOpacity>
    );
  };

  const links = Object.entries(profile?.socialLinks ?? {}).filter(([, v]) => Boolean(v)) as [string, string][];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} accessibilityLabel="Go back">
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Researcher Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      {state === 'loading' ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : state !== 'ready' || !profile ? (
        <View style={styles.centered}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primaryMuted }]}>
            <User size={36} color={colors.primary} />
          </View>
          <Text style={[styles.name, { color: colors.textPrimary }]}>
            {state === 'not-found' ? 'Researcher not available' : 'Something went wrong'}
          </Text>
          <Text style={[styles.bio, { color: colors.textSecondary }]}>
            {state === 'not-found'
              ? 'This profile is not available in the CSE Research Hub directory.'
              : 'Could not load this profile. Check your connection.'}
          </Text>
          {state === 'error' ? (
            <TouchableOpacity onPress={load} style={[styles.retry, { backgroundColor: colors.primaryMuted }]}>
              <Text style={{ color: colors.primary, fontFamily: fontFamilies.sansSemiBold }}>Retry</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Hero */}
          <View style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
            <Avatar name={profile.displayName} uri={profile.photoURL} size="xl" />
            <Text style={[styles.name, { color: colors.textPrimary }]}>{profile.displayName}</Text>
            <View style={styles.credentialsRow}>
              <GraduationCap size={14} color={colors.textSecondary} />
              <Text style={[styles.credentials, { color: colors.textSecondary }]} numberOfLines={2}>
                {[profile.designation, profile.department, profile.batch].filter(Boolean).join(' • ')}
              </Text>
            </View>
            {profile.bio ? (
              <Text style={[styles.bio, { color: colors.textSecondary }]}>{profile.bio}</Text>
            ) : null}
            {renderConnectButton()}
          </View>

          {/* Interests */}
          {profile.researchInterests.length > 0 ? (
            <View style={styles.section}>
              <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>Research Interests</Text>
              <View style={styles.chipsRow}>
                {profile.researchInterests.map((interest) => (
                  <TopicChip key={interest} label={interest} variant="teal" onPress={() => openTopic(interest)} />
                ))}
              </View>
            </View>
          ) : null}

          {/* Shared work */}
          <View style={styles.section}>
            <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>Currently Working On</Text>
            {works.length === 0 ? (
              <Text style={[styles.muted, { color: colors.textMuted }]}>No research shared yet.</Text>
            ) : (
              works.map((work) => (
                <CurrentWorkCard
                  key={work.id}
                  work={toCurrentWork(work)}
                  authorName={work.authorName}
                  authorBatch="CSE"
                  authorRole={work.authorDesignation}
                  authorAvatar={work.authorPhotoURL}
                  onPress={() => router.push(`/(research)/${work.id}` as any)}
                  onTopicPress={openTopic}
                />
              ))
            )}
          </View>

          {/* Academic links */}
          {links.length > 0 ? (
            <View style={styles.section}>
              <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>Academic Links</Text>
              <View style={[styles.linksCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
                {links.map(([key, value], index) => (
                  <TouchableOpacity
                    key={key}
                    onPress={() => openLink(value)}
                    style={[
                      styles.linkRow,
                      index < links.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.borderSubtle },
                    ]}
                    accessibilityRole="link"
                  >
                    <Text style={[styles.linkLabel, { color: colors.textPrimary }]}>{LINK_LABELS[key] ?? key}</Text>
                    <ExternalLink size={16} color={colors.textMuted} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { ...typography.titleSmall },
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
  retry: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  scrollContent: { padding: spacing.md, paddingBottom: spacing.xl },
  heroCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  name: { ...typography.headlineSmall, marginTop: spacing.sm, textAlign: 'center' },
  credentialsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    paddingHorizontal: spacing.md,
  },
  credentials: { ...typography.bodySmall, textAlign: 'center', flexShrink: 1 },
  bio: { ...typography.body, textAlign: 'center', marginTop: spacing.sm, lineHeight: 20 },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginTop: spacing.md,
    minWidth: 180,
  },
  connectText: { fontFamily: fontFamilies.sansSemiBold, fontSize: 14 },
  section: { marginBottom: spacing.lg },
  sectionHeading: { ...typography.sectionHeader, marginBottom: spacing.sm },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  muted: { ...typography.bodySmall },
  linksCard: { borderWidth: 1, borderRadius: radius.md },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  linkLabel: { ...typography.body },
});
