import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { UserPlus, Check, Clock } from 'lucide-react-native';
import { UserProfile } from '../../types';
import { spacing, radius, typography, fontFamilies, shadows } from '../../constants';
import { useTheme } from '@/context/ThemeContext';
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
  const { colors } = useTheme();
  const isCompact = variant === 'compact';
  const interests = researcher.interests || researcher.researchInterests || [];

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
        isCompact && styles.cardCompact,
      ]}
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
      <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>
        {researcher.name}
      </Text>

      <Text style={[styles.designation, { color: colors.textSecondary }]} numberOfLines={1}>
        {researcher.batch || researcher.designation || researcher.department}
      </Text>

      {/* Shared Interests or Topics Tag */}
      {sharedInterestsCount !== undefined && sharedInterestsCount > 0 ? (
        <View
          style={[
            styles.sharedBadge,
            { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sharedText, { color: colors.primary }]}>
            {sharedInterestsCount} shared {sharedInterestsCount === 1 ? 'topic' : 'topics'}
          </Text>
        </View>
      ) : interests.length > 0 ? (
        <View
          style={[
            styles.sharedBadge,
            { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sharedText, { color: colors.primary }]} numberOfLines={1}>
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
          { backgroundColor: colors.primary },
          connectionStatus === 'connected' && {
            backgroundColor: colors.secondaryLight,
            borderWidth: 1,
            borderColor: colors.secondary,
          },
          connectionStatus === 'pending' && {
            backgroundColor: colors.surfaceSubtle,
            borderWidth: 1,
            borderColor: colors.border,
          },
        ]}
      >
        {connectionStatus === 'connected' ? (
          <>
            <Check size={14} color={colors.secondary} />
            <Text style={[styles.connectTextConnected, { color: colors.secondary }]}>Connected</Text>
          </>
        ) : connectionStatus === 'pending' ? (
          <>
            <Clock size={14} color={colors.textSecondary} />
            <Text style={[styles.connectTextPending, { color: colors.textSecondary }]}>Pending</Text>
          </>
        ) : (
          <>
            <UserPlus size={14} color={colors.textInverse} />
            <Text style={[styles.connectText, { color: colors.textInverse }]}>Connect</Text>
          </>
        )}
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.md,
    borderWidth: 1,
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
    textAlign: 'center',
    marginBottom: 2,
  },
  designation: {
    ...typography.caption,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  sharedBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
    marginBottom: spacing.sm,
    maxWidth: '100%',
  },
  sharedText: {
    fontSize: 11,
    fontFamily: fontFamilies.sansMedium,
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
    paddingVertical: 7,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    width: '100%',
  },
  connectText: {
    ...typography.caption,
    fontFamily: fontFamilies.sansSemiBold,
  },
  connectTextConnected: {
    ...typography.caption,
    fontFamily: fontFamilies.sansSemiBold,
  },
  connectTextPending: {
    ...typography.caption,
    fontFamily: fontFamilies.sansMedium,
  },
});
