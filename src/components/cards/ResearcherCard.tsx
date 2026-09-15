import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { UserPlus, Check, Clock } from 'lucide-react-native';
import { UserProfile } from '../../types';
import { spacing, radius, typography, fontFamilies, shadows } from '../../constants';
import { useTheme } from '@/context/ThemeContext';
import { Avatar } from '../common/Avatar';

export interface ResearcherCardProps {
  researcher: UserProfile;
  sharedInterestsCount?: number;
  connectionStatus?: 'none' | 'pending' | 'connected';
  connectionState?: 'none' | 'pending' | 'connected';
  isPending?: boolean;
  isConnected?: boolean;
  onPress?: () => void;
  onConnectPress?: () => void;
  variant?: 'compact' | 'full';
  isOutlineButton?: boolean;
}

export const ResearcherCard: React.FC<ResearcherCardProps> = ({
  researcher,
  sharedInterestsCount,
  connectionStatus,
  connectionState,
  isPending: isPendingProp,
  isConnected: isConnectedProp,
  onPress,
  onConnectPress,
  variant = 'compact',
  isOutlineButton = false,
}) => {
  const { colors, isDark } = useTheme();
  const isCompact = variant === 'compact';
  const interests = researcher.interests || researcher.researchInterests || [];
  const topicCount = sharedInterestsCount !== undefined && sharedInterestsCount > 0
    ? sharedInterestsCount
    : (interests.length > 0 ? Math.min(interests.length, 3) : 2);

  // Dynamic state resolution strictly driven by props/data
  const effectiveStatus: 'none' | 'pending' | 'connected' =
    connectionState ||
    connectionStatus ||
    (isConnectedProp ? 'connected' : isPendingProp ? 'pending' : (researcher.connectionStatus || 'none'));

  const isConnected = effectiveStatus === 'connected' || isConnectedProp === true;
  const isPending = !isConnected && (effectiveStatus === 'pending' || isPendingProp === true);

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.borderSubtle,
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

      {/* Shared Topics Pill Badge */}
      <View
        style={[
          styles.sharedBadge,
          {
            backgroundColor: isDark ? colors.primaryLight : '#EAF0FC',
            borderColor: isDark ? colors.borderFocus : '#D4E2FB',
          },
        ]}
      >
        <View
          style={[
            styles.sharedDot,
            { backgroundColor: colors.primary },
          ]}
        />
        <Text style={[styles.sharedText, { color: colors.primary }]}>
          {topicCount} shared topics
        </Text>
      </View>

      {/* Connect Button */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onConnectPress}
        style={[
          styles.connectButton,
          // 1. Default state: Solid primary pill
          { backgroundColor: colors.primary },
          // 2. Explicit outline override (only if explicitly enabled for Connect)
          isOutlineButton && !isConnected && !isPending && {
            backgroundColor: colors.surface,
            borderWidth: 1.5,
            borderColor: colors.primary,
          },
          // 3. Pending / Requested state: Outline pill with subtle surface
          isPending && {
            backgroundColor: isDark ? colors.surfaceSubtle : colors.surface,
            borderWidth: 1.5,
            borderColor: colors.border,
          },
          // 4. Connected state: Soft secondary container with mint outline
          isConnected && {
            backgroundColor: colors.secondaryLight,
            borderWidth: 1,
            borderColor: colors.secondary,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={
          isConnected
            ? `Connected with ${researcher.name}`
            : isPending
            ? `Connection request to ${researcher.name} is pending`
            : `Connect with ${researcher.name}`
        }
      >
        {isConnected ? (
          <>
            <Check size={14} color={colors.secondary} strokeWidth={2.5} />
            <Text style={[styles.connectText, { color: colors.secondary }]}>Connected</Text>
          </>
        ) : isPending ? (
          <>
            <Clock size={14} color={colors.textSecondary} strokeWidth={2} />
            <Text style={[styles.connectText, { color: colors.textSecondary }]}>Pending</Text>
          </>
        ) : (
          <>
            <UserPlus
              size={14}
              color={isOutlineButton ? colors.primary : colors.textInverse}
              strokeWidth={2}
            />
            <Text
              style={[
                styles.connectText,
                { color: isOutlineButton ? colors.primary : colors.textInverse },
              ]}
            >
              Connect
            </Text>
          </>
        )}
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: spacing.md,
    alignItems: 'center',
    ...shadows.card,
  },
  cardCompact: {
    width: 172,
    marginRight: spacing.sm + 2,
  },
  avatarContainer: {
    marginBottom: spacing.sm,
  },
  name: {
    fontSize: 15,
    fontFamily: fontFamilies.sansBold,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 3,
  },
  designation: {
    fontSize: 12,
    fontFamily: fontFamilies.sansRegular,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  sharedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  sharedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  sharedText: {
    fontSize: 11.5,
    fontFamily: fontFamilies.sansSemiBold,
    fontWeight: '600',
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 38,
    borderRadius: radius.full,
    width: '100%',
  },
  connectText: {
    fontSize: 12.5,
    fontFamily: fontFamilies.sansSemiBold,
    fontWeight: '600',
  },
});
