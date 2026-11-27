/**
 * src/components/search/SearchRows.tsx
 *
 * Compact, scannable search result rows with the matching words highlighted
 * and a one-line "why it matched" hint.
 */

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, type TextStyle, type StyleProp } from 'react-native';
import { BookOpen, Check, Clock, Layers, UserPlus, Users } from 'lucide-react-native';
import { TopicIcon } from '@/components/common/TopicIcon';
import { useTheme } from '@/context/ThemeContext';
import { Avatar } from '@/components/common/Avatar';
import { highlightParts } from '@/utils/searchRank';
import type { CurrentWork, UserProfile } from '@/types';
import type { CollaborateProps } from '@/hooks/useCollaborate';
import type { CardConnectionStatus } from '@/hooks/useConnections';
import { fontFamilies, radius, spacing, typography } from '@/constants';

export const HighlightText: React.FC<{
  text: string;
  terms: string[];
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}> = ({ text, terms, style, numberOfLines }) => {
  const { colors, isDark } = useTheme();
  return (
    <Text style={style} numberOfLines={numberOfLines}>
      {highlightParts(text, terms).map((p, i) =>
        p.match ? (
          <Text
            key={i}
            style={{
              backgroundColor: isDark ? 'rgba(250, 204, 21, 0.22)' : '#FEF3C7',
              color: colors.textPrimary,
              fontFamily: fontFamilies.sansSemiBold,
            }}
          >
            {p.text}
          </Text>
        ) : (
          <Text key={i}>{p.text}</Text>
        ),
      )}
    </Text>
  );
};

// ---------------------------------------------------------------------------
// People
// ---------------------------------------------------------------------------

export const PersonRow: React.FC<{
  person: UserProfile;
  terms: string[];
  reason: string | null;
  status: CardConnectionStatus;
  onPress: () => void;
  onConnect: () => void;
}> = ({ person, terms, reason, status, onPress, onConnect }) => {
  const { colors } = useTheme();
  const connected = status === 'connected';
  const pending = status === 'pending';
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}
      accessibilityRole="button"
      accessibilityLabel={`${person.name}, ${person.designation ?? ''}`}
    >
      <Avatar name={person.name} uri={person.photoURL} size="md" />
      <View style={styles.body}>
        <HighlightText text={person.name} terms={terms} style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1} />
        <Text style={[styles.meta, { color: colors.textSecondary }]} numberOfLines={1}>
          {[person.designation, person.department].filter(Boolean).join(' · ')}
        </Text>
        {reason ? (
          <HighlightText text={reason} terms={terms} style={[styles.reason, { color: colors.textMuted }]} numberOfLines={1} />
        ) : null}
      </View>
      <TouchableOpacity
        onPress={onConnect}
        disabled={connected || pending}
        hitSlop={6}
        style={[
          styles.pill,
          connected || pending
            ? { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderSubtle }
            : { backgroundColor: colors.primary, borderColor: colors.primary },
        ]}
        accessibilityRole="button"
        accessibilityLabel={connected ? 'Connected' : pending ? 'Request pending' : `Connect with ${person.name}`}
      >
        {connected ? (
          <Check size={13} color={colors.success} />
        ) : pending ? (
          <Clock size={13} color={colors.textMuted} />
        ) : (
          <UserPlus size={13} color="#FFFFFF" />
        )}
        <Text
          style={[
            styles.pillText,
            { color: connected ? colors.success : pending ? colors.textMuted : '#FFFFFF' },
          ]}
        >
          {connected ? 'Connected' : pending ? 'Pending' : 'Connect'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

// ---------------------------------------------------------------------------
// Research work & collaboration posts
// ---------------------------------------------------------------------------

export const WorkRow: React.FC<{
  work: CurrentWork;
  terms: string[];
  reason: string | null;
  onPress: () => void;
  /** Collaboration action (from useCollaborate); omitted for work posts. */
  action?: CollaborateProps;
}> = ({ work, terms, reason, onPress, action }) => {
  const { colors } = useTheme();
  const isCollab = work.postType === 'collaboration';
  const closed = isCollab && work.collabStatus === 'closed';
  const canApply = Boolean(action?.onCollaboratePress && !action.collaborateDisabled);
  const Icon = isCollab ? Users : BookOpen;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.row, styles.workRow, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}
      accessibilityRole="button"
      accessibilityLabel={`${isCollab ? 'Collaboration' : 'Research work'}: ${work.title}`}
    >
      <View style={[styles.iconBox, { backgroundColor: isCollab ? colors.primaryMuted : colors.surfaceSubtle }]}>
        <Icon size={18} color={isCollab ? colors.primary : colors.textSecondary} />
      </View>
      <View style={styles.body}>
        <HighlightText text={work.title} terms={terms} style={[styles.title, { color: colors.textPrimary }]} numberOfLines={2} />
        <View style={styles.metaLine}>
          <Text style={[styles.meta, { color: colors.textSecondary, flexShrink: 1 }]} numberOfLines={1}>
            {work.authorName}
          </Text>
          {work.stage ? (
            <>
              <Layers size={11} color={colors.textMuted} />
              <Text style={[styles.meta, { color: colors.textMuted }]} numberOfLines={1}>{work.stage}</Text>
            </>
          ) : null}
        </View>
        {reason ? (
          <HighlightText text={reason} terms={terms} style={[styles.reason, { color: colors.textMuted }]} numberOfLines={1} />
        ) : isCollab && (work.lookingFor?.length ?? 0) > 0 ? (
          <HighlightText
            text={`Looking for ${work.lookingFor!.slice(0, 3).join(', ')}`}
            terms={terms}
            style={[styles.reason, { color: colors.textMuted }]}
            numberOfLines={1}
          />
        ) : null}

        {isCollab ? (
          <View style={styles.collabLine}>
            <View style={[styles.status, { backgroundColor: closed ? colors.successLight : colors.primaryMuted }]}>
              <Text style={[styles.statusText, { color: closed ? colors.success : colors.primary }]}>
                {closed ? 'Team formed' : 'Open'}
              </Text>
            </View>
            {action?.collaborateLabel ? (
              <TouchableOpacity
                onPress={action.onCollaboratePress}
                disabled={!canApply}
                hitSlop={6}
                style={[
                  styles.pill,
                  canApply
                    ? { backgroundColor: colors.primary, borderColor: colors.primary }
                    : { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderSubtle },
                ]}
                accessibilityRole="button"
                accessibilityLabel={action.collaborateLabel}
              >
                <Text style={[styles.pillText, { color: canApply ? '#FFFFFF' : colors.textMuted }]} numberOfLines={1}>
                  {canApply ? 'Apply' : action.collaborateLabel}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

// ---------------------------------------------------------------------------
// Topics
// ---------------------------------------------------------------------------

export const TopicRow: React.FC<{
  name: string;
  terms: string[];
  researchers: number;
  works: number;
  onPress: () => void;
}> = ({ name, terms, researchers, works, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}
      accessibilityRole="button"
      accessibilityLabel={`Topic ${name}`}
    >
      <View style={[styles.iconBox, { backgroundColor: colors.successLight }]}>
        <TopicIcon name={name} size={18} color={colors.success} />
      </View>
      <View style={styles.body}>
        <HighlightText text={name} terms={terms} style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1} />
        <Text style={[styles.meta, { color: colors.textSecondary }]}>
          {researchers} researcher{researchers === 1 ? '' : 's'} · {works} post{works === 1 ? '' : 's'}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.sm,
    paddingRight: spacing.md,
  },
  workRow: { alignItems: 'flex-start' },
  body: { flex: 1, minWidth: 0, gap: 2 },
  title: { ...typography.label, fontFamily: fontFamilies.sansSemiBold },
  meta: { ...typography.caption },
  metaLine: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  reason: { ...typography.caption, fontStyle: 'italic' },
  iconBox: { width: 40, height: 40, borderRadius: radius.button, alignItems: 'center', justifyContent: 'center' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    height: 30,
    borderRadius: radius.full,
    borderWidth: 1,
    maxWidth: 170,
  },
  pillText: { ...typography.caption, fontFamily: fontFamilies.sansSemiBold },
  collabLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: 6 },
  status: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full },
  statusText: { ...typography.micro, fontFamily: fontFamilies.sansSemiBold },
});
