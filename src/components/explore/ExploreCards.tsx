/**
 * src/components/explore/ExploreCards.tsx
 *
 * Cards used by the Explore tab:
 *  - SectionTitle      consistent header with icon, subtitle and "See all →"
 *  - CollabCard        swipeable open-collaboration card with Apply
 *  - PersonCard        swipeable "people like you" card with Connect
 *  - TopicCard         topic tile with live counts (your topics marked ★)
 *  - PromptCard        friendly empty state with one action
 */

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Check, ChevronRight, Clock, FileText, Star, UserPlus, Users } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { Avatar } from '@/components/common/Avatar';
import type { CurrentWork, UserProfile } from '@/types';
import type { CollaborateProps } from '@/hooks/useCollaborate';
import type { CardConnectionStatus } from '@/hooks/useConnections';
import { fontFamilies, radius, spacing, typography } from '@/constants';

// ---------------------------------------------------------------------------
// Section header
// ---------------------------------------------------------------------------

export const SectionTitle: React.FC<{
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}> = ({ icon, title, subtitle, actionLabel = 'See all', onAction }) => {
  const { colors } = useTheme();
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionLeft}>
        <View style={styles.sectionTitleRow}>
          {icon}
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]} numberOfLines={1}>
            {title}
          </Text>
        </View>
        {subtitle ? (
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {onAction ? (
        <TouchableOpacity onPress={onAction} hitSlop={8} style={styles.seeAll} accessibilityRole="button" accessibilityLabel={`${actionLabel}: ${title}`}>
          <Text style={[styles.seeAllText, { color: colors.primary }]}>{actionLabel}</Text>
          <ChevronRight size={15} color={colors.primary} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

// ---------------------------------------------------------------------------
// Open collaboration card (horizontal)
// ---------------------------------------------------------------------------

export const CollabCard: React.FC<{
  work: CurrentWork;
  /** e.g. "Matches your interest #NLP" */
  hint?: string | null;
  action: CollaborateProps;
  onPress: () => void;
}> = ({ work, hint, action, onPress }) => {
  const { colors } = useTheme();
  const team = work.team ?? [];
  const canApply = Boolean(action.onCollaboratePress && !action.collaborateDisabled);
  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      style={[styles.collabCard, { backgroundColor: colors.surface, borderColor: colors.primaryLight }]}
      accessibilityRole="button"
      accessibilityLabel={`Collaboration: ${work.title}`}
    >
      <View style={styles.collabTop}>
        <View style={[styles.badge, { backgroundColor: colors.primaryMuted }]}>
          <Users size={12} color={colors.primary} />
          <Text style={[styles.badgeText, { color: colors.primary }]}>Open</Text>
        </View>
        {work.stage ? (
          <Text style={[styles.micro, { color: colors.textMuted }]} numberOfLines={1}>
            {work.stage}
          </Text>
        ) : null}
      </View>

      <Text style={[styles.cardTitle, { color: colors.textPrimary }]} numberOfLines={2}>
        {work.title}
      </Text>

      <View style={styles.authorLine}>
        <Avatar name={work.authorName} uri={work.authorPhotoURL ?? null} size="xs" />
        <Text style={[styles.caption, { color: colors.textSecondary, flex: 1 }]} numberOfLines={1}>
          {work.authorName}
        </Text>
      </View>

      <View style={styles.roles}>
        {(work.lookingFor ?? []).slice(0, 3).map((role) => (
          <View key={role} style={[styles.role, { backgroundColor: colors.primaryMuted }]}>
            <Text style={[styles.roleText, { color: colors.primary }]} numberOfLines={1}>
              {role}
            </Text>
          </View>
        ))}
        {(work.lookingFor?.length ?? 0) > 3 ? (
          <Text style={[styles.micro, { color: colors.textMuted }]}>+{(work.lookingFor?.length ?? 0) - 3}</Text>
        ) : null}
      </View>

      {hint ? (
        <Text style={[styles.hint, { color: colors.success }]} numberOfLines={1}>
          ✓ {hint}
        </Text>
      ) : null}

      <View style={styles.collabBottom}>
        <View style={styles.teamLine}>
          <View style={styles.stack}>
            {team.slice(0, 3).map((m, i) => (
              <View key={m.uid} style={[styles.stackItem, i > 0 && { marginLeft: -8 }, { borderColor: colors.surface }]}>
                <Avatar name={m.displayName} uri={m.photoURL} size="xs" />
              </View>
            ))}
          </View>
          <Text style={[styles.micro, { color: colors.textMuted }]} numberOfLines={1}>
            {team.length ? `${team.length} on team` : 'Be the first'}
          </Text>
        </View>
        <TouchableOpacity
          onPress={action.onCollaboratePress}
          disabled={!canApply}
          hitSlop={6}
          style={[
            styles.smallBtn,
            canApply
              ? { backgroundColor: colors.primary, borderColor: colors.primary }
              : { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderSubtle },
          ]}
          accessibilityRole="button"
          accessibilityLabel={action.collaborateLabel}
        >
          <Text style={[styles.smallBtnText, { color: canApply ? '#FFFFFF' : colors.textMuted }]} numberOfLines={1}>
            {canApply ? 'Apply' : action.collaborateLabel?.replace(' · Tap to withdraw', '')}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

// ---------------------------------------------------------------------------
// Person card (horizontal)
// ---------------------------------------------------------------------------

export const PersonCard: React.FC<{
  person: UserProfile;
  shared: string[];
  status: CardConnectionStatus;
  onPress: () => void;
  onConnect: () => void;
}> = ({ person, shared, status, onPress, onConnect }) => {
  const { colors } = useTheme();
  const connected = status === 'connected';
  const pending = status === 'pending';
  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      style={[styles.personCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}
      accessibilityRole="button"
      accessibilityLabel={`${person.name}, ${shared.length} shared interests`}
    >
      <Avatar name={person.name} uri={person.photoURL} size="lg" />
      <Text style={[styles.personName, { color: colors.textPrimary }]} numberOfLines={1}>
        {person.name}
      </Text>
      <Text style={[styles.caption, { color: colors.textSecondary, textAlign: 'center' }]} numberOfLines={1}>
        {person.designation || person.department}
      </Text>
      <View style={[styles.badge, { backgroundColor: colors.successLight, marginTop: spacing.xs }]}>
        <Star size={11} color={colors.success} />
        <Text style={[styles.badgeText, { color: colors.success }]}>
          {shared.length} shared interest{shared.length === 1 ? '' : 's'}
        </Text>
      </View>
      <Text style={[styles.micro, { color: colors.textMuted, textAlign: 'center', marginTop: 4 }]} numberOfLines={2}>
        {shared.slice(0, 2).join(' · ')}
      </Text>
      <TouchableOpacity
        onPress={onConnect}
        disabled={connected || pending}
        style={[
          styles.connectBtn,
          connected || pending
            ? { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderSubtle }
            : { backgroundColor: colors.primary, borderColor: colors.primary },
        ]}
        accessibilityRole="button"
        accessibilityLabel={connected ? 'Connected' : pending ? 'Request pending' : `Connect with ${person.name}`}
      >
        {connected ? <Check size={14} color={colors.success} /> : pending ? <Clock size={14} color={colors.textMuted} /> : <UserPlus size={14} color="#FFFFFF" />}
        <Text style={[styles.smallBtnText, { color: connected ? colors.success : pending ? colors.textMuted : '#FFFFFF' }]}>
          {connected ? 'Connected' : pending ? 'Pending' : 'Connect'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

// ---------------------------------------------------------------------------
// Topic tile
// ---------------------------------------------------------------------------

export const TopicCard: React.FC<{
  name: string;
  researchers: number;
  posts: number;
  mine: boolean;
  onPress: () => void;
}> = ({ name, researchers, posts, mine, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[
        styles.topicCard,
        mine
          ? { backgroundColor: colors.primaryMuted, borderColor: colors.primaryLight }
          : { backgroundColor: colors.surface, borderColor: colors.borderSubtle },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${name}${mine ? ', one of your interests' : ''}: ${researchers} researchers, ${posts} posts`}
    >
      <View style={styles.topicTop}>
        <Text style={[styles.topicName, { color: mine ? colors.primary : colors.textPrimary }]} numberOfLines={2}>
          {name}
        </Text>
        {mine ? <Star size={13} color={colors.primary} fill={colors.primary} /> : null}
      </View>
      <View style={styles.topicCounts}>
        <Users size={12} color={colors.textMuted} />
        <Text style={[styles.micro, { color: colors.textSecondary }]}>{researchers}</Text>
        <FileText size={12} color={colors.textMuted} style={{ marginLeft: 6 }} />
        <Text style={[styles.micro, { color: colors.textSecondary }]}>{posts}</Text>
      </View>
    </TouchableOpacity>
  );
};

// ---------------------------------------------------------------------------
// Prompt / empty state card
// ---------------------------------------------------------------------------

export const PromptCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  text: string;
  actionLabel: string;
  onAction: () => void;
}> = ({ icon, title, text, actionLabel, onAction }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.prompt, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
      <View style={[styles.promptIcon, { backgroundColor: colors.primaryMuted }]}>{icon}</View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[styles.promptTitle, { color: colors.textPrimary }]}>{title}</Text>
        <Text style={[styles.caption, { color: colors.textSecondary }]}>{text}</Text>
      </View>
      <TouchableOpacity
        onPress={onAction}
        style={[styles.smallBtn, { backgroundColor: colors.primary, borderColor: colors.primary }]}
        accessibilityRole="button"
      >
        <Text style={[styles.smallBtnText, { color: '#FFFFFF' }]}>{actionLabel}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: spacing.sm, gap: spacing.sm },
  sectionLeft: { flex: 1, minWidth: 0 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionTitle: { ...typography.title, fontSize: 18 },
  sectionSubtitle: { ...typography.caption, marginTop: 2 },
  seeAll: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingBottom: 2 },
  seeAllText: { ...typography.label, fontFamily: fontFamilies.sansSemiBold },

  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full, alignSelf: 'flex-start' },
  badgeText: { ...typography.micro, fontFamily: fontFamilies.sansSemiBold },
  micro: { ...typography.micro },
  caption: { ...typography.caption },
  hint: { ...typography.micro, fontFamily: fontFamilies.sansSemiBold },

  collabCard: { width: 264, borderWidth: 1, borderRadius: radius.md, padding: spacing.md, gap: spacing.xs },
  collabTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { ...typography.label, fontFamily: fontFamilies.sansSemiBold, fontSize: 15, lineHeight: 20, minHeight: 40 },
  authorLine: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  roles: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 4, minHeight: 24 },
  role: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full, maxWidth: 140 },
  roleText: { ...typography.micro, fontFamily: fontFamilies.sansSemiBold },
  collabBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.xs, gap: spacing.xs },
  teamLine: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 },
  stack: { flexDirection: 'row' },
  stackItem: { borderWidth: 2, borderRadius: 14 },
  smallBtn: { paddingHorizontal: 12, height: 32, borderRadius: radius.full, borderWidth: 1, alignItems: 'center', justifyContent: 'center', maxWidth: 150 },
  smallBtnText: { ...typography.caption, fontFamily: fontFamilies.sansSemiBold },

  personCard: { width: 176, borderWidth: 1, borderRadius: radius.md, padding: spacing.md, alignItems: 'center' },
  personName: { ...typography.label, fontFamily: fontFamilies.sansSemiBold, marginTop: spacing.sm, textAlign: 'center' },
  connectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    alignSelf: 'stretch',
    height: 34,
    borderRadius: radius.button,
    borderWidth: 1,
    marginTop: spacing.sm,
  },

  topicCard: { flexBasis: '48%', flexGrow: 1, borderWidth: 1, borderRadius: radius.md, padding: spacing.sm, minHeight: 72, justifyContent: 'space-between' },
  topicTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 4 },
  topicName: { ...typography.label, fontFamily: fontFamilies.sansSemiBold, flex: 1 },
  topicCounts: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: spacing.xs },

  prompt: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderWidth: 1, borderRadius: radius.md, padding: spacing.md },
  promptIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  promptTitle: { ...typography.label, fontFamily: fontFamilies.sansSemiBold },
});
