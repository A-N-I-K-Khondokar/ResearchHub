import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Calendar, Layers, ChevronRight, ExternalLink, Users } from 'lucide-react-native';
import { spacing, radius, typography, fontFamilies } from '@/constants';
import { useTheme } from '@/context/ThemeContext';
import { SectionHeader } from '../common/SectionHeader';
import { formatWorkDate } from '@/services/research.service';
import type { ResearchWork } from '@/types/research.types';

/** A profile section using the app-wide SectionHeader (sans 15 bold). */
export const ProfileSection: React.FC<{
  title: string;
  actionLabel?: string;
  onActionPress?: () => void;
  children: React.ReactNode;
}> = ({ title, actionLabel, onActionPress, children }) => (
  <View style={styles.section}>
    <SectionHeader title={title} actionLabel={actionLabel} onActionPress={onActionPress} />
    {children}
  </View>
);

/** Muted one-line empty text for a section. */
export const ProfileEmptyText: React.FC<{ text: string }> = ({ text }) => {
  const { colors } = useTheme();
  return <Text style={[styles.emptyText, { color: colors.textMuted }]}>{text}</Text>;
};

// ---------------------------------------------------------------------------
// Compact research-work rows (3 shown, "Show all" expands)
// ---------------------------------------------------------------------------

export const WorkListItem: React.FC<{ work: ResearchWork; onPress: () => void; badge?: string }> = ({
  work,
  onPress,
  badge,
}) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.workRow, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}
      accessibilityRole="button"
      accessibilityLabel={`Open ${work.title}`}
    >
      <View style={styles.workBody}>
        {badge ? (
          <View style={[styles.collabTag, { backgroundColor: colors.successLight }]}>
            <Users size={11} color={colors.success} />
            <Text style={[styles.collabTagText, { color: colors.success }]} numberOfLines={1}>
              {badge}
            </Text>
          </View>
        ) : work.postType === 'collaboration' ? (
          <View style={[styles.collabTag, { backgroundColor: colors.primaryMuted }]}>
            <Users size={11} color={colors.primary} />
            <Text style={[styles.collabTagText, { color: colors.primary }]}>
              Looking for {work.lookingFor.slice(0, 2).join(', ')}{work.lookingFor.length > 2 ? '…' : ''}
            </Text>
          </View>
        ) : null}
        <Text style={[styles.workTitle, { color: colors.textPrimary }]} numberOfLines={2}>
          {work.title}
        </Text>
        <Text style={[styles.workDescription, { color: colors.textSecondary }]} numberOfLines={2}>
          {work.description}
        </Text>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Calendar size={13} color={colors.textSecondary} />
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>{formatWorkDate(work.createdAt)}</Text>
          </View>
          <View style={styles.metaItem}>
            <Layers size={13} color={colors.textSecondary} />
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>{work.stage}</Text>
          </View>
          {work.status === 'draft' ? (
            <View style={[styles.draftTag, { backgroundColor: colors.surfaceSubtle }]}>
              <Text style={[styles.metaText, { color: colors.textMuted }]}>Draft</Text>
            </View>
          ) : null}
        </View>
      </View>
      <ChevronRight size={18} color={colors.textMuted} />
    </TouchableOpacity>
  );
};

export const WorkList: React.FC<{
  works: ResearchWork[];
  onOpen: (work: ResearchWork) => void;
  initialCount?: number;
  /** Optional per-item badge, e.g. "Team member · #MLEngineer". */
  badgeFor?: (work: ResearchWork) => string | undefined;
}> = ({ works, onOpen, initialCount = 3, badgeFor }) => {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? works : works.slice(0, initialCount);
  return (
    <View style={styles.workList}>
      {visible.map((work) => (
        <WorkListItem key={work.id} work={work} onPress={() => onOpen(work)} badge={badgeFor?.(work)} />
      ))}
      {works.length > initialCount ? (
        <TouchableOpacity
          onPress={() => setExpanded((v) => !v)}
          style={styles.showAll}
          accessibilityRole="button"
        >
          <Text style={[styles.showAllText, { color: colors.primary }]}>
            {expanded ? 'Show less' : `Show all (${works.length})`}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

// ---------------------------------------------------------------------------
// List card (Library rows, academic links) — 48px rows
// ---------------------------------------------------------------------------

export interface ProfileListItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
  /** 'external' shows an external-link glyph, 'chevron' a navigation chevron. */
  trailing?: 'external' | 'chevron';
}

export const ProfileListCard: React.FC<{ items: ProfileListItem[] }> = ({ items }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.listCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
      {items.map((item, index) => (
        <TouchableOpacity
          key={item.id}
          activeOpacity={0.7}
          onPress={item.onPress}
          style={[
            styles.listRow,
            index < items.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.borderSubtle },
          ]}
          accessibilityRole={item.trailing === 'external' ? 'link' : 'button'}
          accessibilityLabel={item.label}
        >
          <View style={styles.listIcon}>{item.icon}</View>
          <Text style={[styles.listLabel, { color: colors.textPrimary }]} numberOfLines={1}>
            {item.label}
          </Text>
          {item.trailing === 'external' ? (
            <ExternalLink size={16} color={colors.textMuted} />
          ) : (
            <ChevronRight size={16} color={colors.textMuted} />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  collabTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
    marginBottom: 6,
    maxWidth: '100%',
  },
  collabTagText: {
    ...typography.micro,
    fontFamily: fontFamilies.sansSemiBold,
    flexShrink: 1,
  },
  section: {
    marginBottom: spacing.lg,
  },
  emptyText: {
    ...typography.bodySmall,
  },
  workList: {
    gap: spacing.sm,
  },
  workRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  workBody: {
    flex: 1,
    minWidth: 0,
  },
  workTitle: {
    ...typography.titleSmall,
  },
  workDescription: {
    ...typography.bodySmall,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    ...typography.caption,
  },
  draftTag: {
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
  },
  showAll: {
    alignSelf: 'center',
    minHeight: spacing.minTouchTarget,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  showAllText: {
    ...typography.label,
    fontFamily: fontFamilies.sansSemiBold,
  },
  listCard: {
    borderWidth: 1,
    borderRadius: radius.md,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: spacing.buttonHeight,
    paddingHorizontal: spacing.md,
  },
  listIcon: {
    width: 24,
    alignItems: 'center',
  },
  listLabel: {
    ...typography.bodyCompact,
    fontFamily: fontFamilies.sansMedium,
    flex: 1,
  },
});
