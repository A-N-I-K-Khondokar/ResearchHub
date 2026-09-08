import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { UserPlus, Check, Clock, ChevronRight } from 'lucide-react-native';
import { UserProfile, CurrentWork } from '@/types';
import { colors, spacing, radius, typography, fontFamilies, shadows } from '@/constants';
import { Avatar } from '../common/Avatar';
import { TopicChip } from '../common/TopicChip';

interface ResearcherDiscoveryCardProps {
  researcher: UserProfile;
  currentWork?: CurrentWork | null;
  connectionStatus?: 'none' | 'pending' | 'connected';
  onPress?: () => void;
  onConnectPress?: () => void;
  onTopicPress?: (topic: string) => void;
}

export const ResearcherDiscoveryCard: React.FC<ResearcherDiscoveryCardProps> = ({
  researcher,
  currentWork,
  connectionStatus = 'none',
  onPress,
  onConnectPress,
  onTopicPress,
}) => {
  const interests = researcher.interests || researcher.researchInterests || [];

  return (
    <View style={styles.card}>
      {/* Top Researcher Row */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        style={styles.researcherHeader}
        accessibilityRole="button"
        accessibilityLabel={`View ${researcher.name}'s profile`}
      >
        <Avatar
          name={researcher.name}
          uri={researcher.photoURL || researcher.avatar}
          size="lg"
        />
        <View style={styles.headerInfo}>
          <Text style={styles.name} numberOfLines={1}>
            {researcher.name}
          </Text>
          <Text style={styles.subhead} numberOfLines={1}>
            {researcher.batch || researcher.designation || researcher.department}
          </Text>
          {interests.length > 0 && (
            <View style={styles.chipsRow}>
              {interests.slice(0, 3).map((topic, idx) => (
                <TopicChip
                  key={`${topic}-${idx}`}
                  label={topic}
                  variant="default"
                  onPress={() => onTopicPress?.(topic)}
                  style={styles.chip}
                />
              ))}
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* Currently Working On Callout Block */}
      {currentWork ? (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onPress}
          style={styles.workCallout}
        >
          <Text style={styles.workLabel}>CURRENTLY WORKING ON</Text>
          <Text style={styles.workTitle} numberOfLines={2}>
            {currentWork.title}
          </Text>
          {currentWork.description ? (
            <Text style={styles.workDescription} numberOfLines={2}>
              {currentWork.description}
            </Text>
          ) : null}
        </TouchableOpacity>
      ) : null}

      {/* Footer Action Buttons */}
      <View style={styles.footerActions}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onPress}
          style={styles.viewProfileButton}
        >
          <Text style={styles.viewProfileText}>View Profile</Text>
        </TouchableOpacity>

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
              <Check size={16} color={colors.secondary} />
              <Text style={styles.connectTextConnected}>Connected</Text>
            </>
          ) : connectionStatus === 'pending' ? (
            <>
              <Clock size={16} color={colors.textSecondary} />
              <Text style={styles.connectTextPending}>Pending</Text>
            </>
          ) : (
            <>
              <UserPlus size={16} color={colors.textInverse} />
              <Text style={styles.connectText}>Connect</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  researcherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  headerInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  name: {
    ...typography.title,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  subhead: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
  },
  workCallout: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    padding: spacing.sm + 2,
    marginVertical: spacing.xs,
  },
  workLabel: {
    fontSize: 10,
    fontFamily: fontFamilies.sansBold,
    color: colors.primary,
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  workTitle: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  workDescription: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
  },
  viewProfileButton: {
    flex: 1,
    height: 40,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewProfileText: {
    ...typography.caption,
    fontFamily: fontFamilies.sansSemiBold,
    color: colors.textPrimary,
  },
  connectButton: {
    flex: 1,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
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
