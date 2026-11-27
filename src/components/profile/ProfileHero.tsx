import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Check } from 'lucide-react-native';
import { ICON_STROKE } from '@/constants/icons';
import { spacing, radius, typography, fontFamilies } from '@/constants';
import { useTheme } from '@/context/ThemeContext';
import { Avatar } from '../common/Avatar';

export interface ProfileStat {
  label: string;
  value: string | number;
  /** Makes the stat tappable (e.g. Connections → My Network). */
  onPress?: () => void;
}

export interface ProfileHeroProps {
  name: string;
  photoURL?: string | null;
  /** Role shown as a pill under the name, e.g. "Undergraduate Student". */
  role?: string | null;
  /** Second line, e.g. "Computer Science and Engineering · Batch 14". */
  details?: string;
  /** Legacy single-line credentials (used only when role/details are absent). */
  credentials?: string;
  bio?: string | null;
  /** Shown (tappable) when there is no bio — own profile only. */
  emptyBioPrompt?: string;
  onEmptyBioPress?: () => void;
  /** Row of equal-height (44px) actions, e.g. Edit + Settings or Connect. */
  actions?: React.ReactNode;
  stats?: ProfileStat[];
  verified?: boolean;
}

/** Shared hero card for the own Profile tab and other researchers' profiles. */
export const ProfileHero: React.FC<ProfileHeroProps> = ({
  name,
  photoURL,
  role,
  details,
  credentials,
  bio,
  emptyBioPrompt,
  onEmptyBioPress,
  actions,
  stats,
  verified = true,
}) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
      <View style={styles.avatarWrap}>
        <Avatar name={name} uri={photoURL} size="xl" />
        {verified ? (
          <View style={[styles.verifiedBadge, { backgroundColor: colors.primary, borderColor: colors.surface }]}>
            <Check size={11} color="#FFFFFF" strokeWidth={ICON_STROKE.emphasis} />
          </View>
        ) : null}
      </View>

      <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={2}>
        {name}
      </Text>

      {role ? (
        <View style={[styles.rolePill, { backgroundColor: colors.primaryMuted }]}>
          <Text style={[styles.roleText, { color: colors.primary }]} numberOfLines={1}>
            {role}
          </Text>
        </View>
      ) : null}

      {details || (!role && credentials) ? (
        <Text style={[styles.details, { color: colors.textSecondary }]} numberOfLines={2}>
          {details || credentials}
        </Text>
      ) : null}

      {bio ? (
        <View style={[styles.bioBox, { borderTopColor: colors.borderSubtle }]}>
          <Text style={[styles.bio, { color: colors.textPrimary }]} numberOfLines={4}>
            {bio}
          </Text>
        </View>
      ) : emptyBioPrompt ? (
        <TouchableOpacity
          onPress={onEmptyBioPress}
          disabled={!onEmptyBioPress}
          hitSlop={8}
          style={[styles.bioBox, { borderTopColor: colors.borderSubtle }]}
        >
          <Text style={[styles.bio, { color: colors.textMuted, fontStyle: 'italic' }]}>{emptyBioPrompt}</Text>
        </TouchableOpacity>
      ) : null}

      {actions ? <View style={styles.actionsRow}>{actions}</View> : null}

      {stats && stats.length > 0 ? (
        <View style={[styles.statsStrip, { borderTopColor: colors.borderSubtle }]}>
          {stats.map((stat, index) => (
            <React.Fragment key={stat.label}>
              {index > 0 ? <View style={[styles.statDivider, { backgroundColor: colors.borderSubtle }]} /> : null}
              {stat.onPress ? (
                <TouchableOpacity
                  style={styles.statColumn}
                  onPress={stat.onPress}
                  hitSlop={4}
                  accessibilityRole="button"
                  accessibilityLabel={`${stat.value} ${stat.label}`}
                >
                  <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stat.value}</Text>
                  <Text style={[styles.statLabel, { color: colors.primary }]} numberOfLines={1}>
                    {stat.label} ›
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.statColumn}>
                  <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stat.value}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]} numberOfLines={1}>
                    {stat.label}
                  </Text>
                </View>
              )}
            </React.Fragment>
          ))}
        </View>
      ) : null}
    </View>
  );
};

// ---------------------------------------------------------------------------
// Hero action buttons — one height (44) and radius for every profile action
// ---------------------------------------------------------------------------

export interface HeroActionButtonProps {
  label: string;
  icon?: React.ReactNode;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  loading?: boolean;
  disabled?: boolean;
}

export const HeroActionButton: React.FC<HeroActionButtonProps> = ({
  label,
  icon,
  onPress,
  variant = 'secondary',
  loading = false,
  disabled = false,
}) => {
  const { colors } = useTheme();
  const primary = variant === 'primary';
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.actionButton,
        primary
          ? { backgroundColor: colors.primary, borderColor: colors.primary }
          : { backgroundColor: colors.surface, borderColor: colors.border },
        (disabled || loading) && { opacity: 0.7 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {loading ? <ActivityIndicator size="small" color={primary ? '#FFFFFF' : colors.primary} /> : icon}
      <Text style={[styles.actionText, { color: primary ? '#FFFFFF' : colors.textPrimary }]} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

export const HeroIconButton: React.FC<{ icon: React.ReactNode; onPress: () => void; label: string }> = ({
  icon,
  onPress,
  label,
}) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.iconButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {icon}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  avatarWrap: {
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    ...typography.headline,
    textAlign: 'center',
  },
  rolePill: {
    marginTop: spacing.sm,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radius.full,
    maxWidth: '90%',
  },
  roleText: {
    ...typography.caption,
    fontFamily: fontFamilies.sansSemiBold,
  },
  details: {
    ...typography.bodySmall,
    textAlign: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    lineHeight: 20,
  },
  bioBox: {
    alignSelf: 'stretch',
    borderTopWidth: 1,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  bio: {
    ...typography.bodyCompact,
    textAlign: 'center',
    lineHeight: 22,
  },
  actionsRow: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionButton: {
    flex: 1,
    height: spacing.secondaryButtonHeight,
    borderRadius: radius.button,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  actionText: { ...typography.button },
  iconButton: {
    width: spacing.secondaryButtonHeight,
    height: spacing.secondaryButtonHeight,
    borderRadius: radius.button,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    borderTopWidth: 1,
    marginTop: spacing.md,
    paddingTop: spacing.md,
  },
  statColumn: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...typography.title,
    fontFamily: fontFamilies.sansBold,
  },
  statLabel: {
    ...typography.caption,
  },
  statDivider: {
    width: 1,
    height: 24,
  },
});
