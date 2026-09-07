import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { UserPlus, Check, Clock } from 'lucide-react-native';
import { UserProfile } from '../../types';
import { colors, spacing, radius, typography, fontFamilies, shadows } from '../../constants';
import { Avatar } from '../common/Avatar';

interface ResearcherCardProps {
  researcher: UserProfile;
  sharedInterestsCount?: number;
  connectionStatus?: 'none' | 'pending' | 'connected';
  onPress?: () => void;
  onConnectPress?: () => void;
  variant?: 'compact' | 'full';
}

export const ResearcherCard: React.FC<ResearcherCardProps> = ({
  researcher,
  sharedInterestsCount,
  connectionStatus = 'none',
  onPress,
  onConnectPress,
  variant = 'compact',
}) => {
  const isCompact = variant === 'compact';
  const interests = researcher.interests || researcher.researchInterests || [];

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={[styles.card, isCompact && styles.cardCompact]}
      accessibilityRole="button"
      accessibilityLabel={`Researcher profile: ${researcher.name}`}
    >
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        <Avatar
          name={researcher.name}
          uri={researcher.photoURL || researcher.avatar}
          size={isCompact ? 'lg' : 'xl'}
        />
      </View>

      {/* Info */}
      <Text style={styles.name} numberOfLines={1}>
        {researcher.name}
      </Text>

      <Text style={styles.designation} numberOfLines={1}>
        {researcher.batch || researcher.designation || researcher.department}
      </Text>

      {/* Shared Interests or Topics Tag */}
      {sharedInterestsCount !== undefined && sharedInterestsCount > 0 ? (
        <View style={styles.sharedBadge}>
          <Text style={styles.sharedText}>
            {sharedInterestsCount} shared {sharedInterestsCount === 1 ? 'topic' : 'topics'}
          </Text>
        </View>
      ) : interests.length > 0 ? (
        <View style={styles.sharedBadge}>
          <Text style={styles.sharedText} numberOfLines={1}>
            {interests[0]}
          </Text>
        </View>
      ) : (
        <View style={styles.badgePlaceholder} />
      )}

      {/* Connect Button */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onConnectPress}
        style={[
          styles.connectButton,
          connectionStatus === 'connected' && styles.connectButtonConnected,
          connectionStatus === 'pending' && styles.connectButtonPending,
        ]}
      >
        {connectionStatus === 'connected' ? (
          <>
            <Check size={14} color={colors.secondary} />
            <Text style={styles.connectTextConnected}>Connected</Text>
          </>
        ) : connectionStatus === 'pending' ? (
          <>
            <Clock size={14} color={colors.textSecondary} />
            <Text style={styles.connectTextPending}>Pending</Text>
          </>
        ) : (
          <>
            <UserPlus size={14} color={colors.textInverse} />
            <Text style={styles.connectText}>Connect</Text>
          </>
        )}
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'center',
    ...shadows.card,
  },
  cardCompact: {
    width: 160,
    marginRight: spacing.sm,
  },
  avatarContainer: {
    marginBottom: spacing.sm,
  },
  name: {
    ...typography.titleSmall,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 2,
  },
  designation: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  sharedBadge: {
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    marginBottom: spacing.sm,
    maxWidth: '100%',
  },
  sharedText: {
    fontSize: 11,
    fontFamily: fontFamilies.sansMedium,
    color: colors.primary,
  },
  badgePlaceholder: {
    height: 20,
    marginBottom: spacing.sm,
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingVertical: 7,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    width: '100%',
  },
  connectButtonConnected: {
    backgroundColor: colors.secondaryLight,
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  connectButtonPending: {
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
  },
  connectText: {
    ...typography.caption,
    fontFamily: fontFamilies.sansSemiBold,
    color: colors.textInverse,
  },
  connectTextConnected: {
    ...typography.caption,
    fontFamily: fontFamilies.sansSemiBold,
    color: colors.secondary,
  },
  connectTextPending: {
    ...typography.caption,
    fontFamily: fontFamilies.sansMedium,
    color: colors.textSecondary,
  },
});
