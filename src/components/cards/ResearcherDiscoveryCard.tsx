import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { UserPlus, Check, Clock, ChevronRight } from 'lucide-react-native';
import { UserProfile, CurrentWork } from '@/types';
import { spacing, radius, typography, fontFamilies, shadows } from '@/constants';
import { useTheme } from '@/context/ThemeContext';
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
  const { colors } = useTheme();
  const interests = researcher.interests || researcher.researchInterests || [];

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
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
          <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>
            {researcher.name}
          </Text>
          <Text style={[styles.subhead, { color: colors.textSecondary }]} numberOfLines={1}>
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
          style={[
            styles.workCallout,
            {
              backgroundColor: colors.surfaceSubtle,
              borderLeftColor: colors.primary,
            },
          ]}
        >
          <Text style={[styles.workLabel, { color: colors.primary }]}>CURRENTLY WORKING ON</Text>
          <Text style={[styles.workTitle, { color: colors.textPrimary }]} numberOfLines={2}>
            {currentWork.title}
          </Text>
          {currentWork.description ? (
            <Text style={[styles.workDescription, { color: colors.textSecondary }]} numberOfLines={2}>
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
          style={[
            styles.viewProfileButton,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.viewProfileText, { color: colors.textPrimary }]}>View Profile</Text>
        </TouchableOpacity>

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
              <Check size={16} color={colors.secondary} />
              <Text style={[styles.connectTextConnected, { color: colors.secondary }]}>Connected</Text>
            </>
          ) : connectionStatus === 'pending' ? (
            <>
              <Clock size={16} color={colors.textSecondary} />
              <Text style={[styles.connectTextPending, { color: colors.textSecondary }]}>Pending</Text>
            </>
          ) : (
            <>
              <UserPlus size={16} color={colors.textInverse} />
              <Text style={[styles.connectText, { color: colors.textInverse }]}>Connect</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.md,
    borderWidth: 1,
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
    marginBottom: 2,
  },
  subhead: {
    ...typography.caption,
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
    borderRadius: radius.sm,
    borderLeftWidth: 3,
    padding: spacing.sm + 2,
    marginVertical: spacing.xs,
  },
  workLabel: {
    fontSize: 10,
    fontFamily: fontFamilies.sansBold,
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  workTitle: {
    ...typography.bodyMedium,
    fontWeight: '600',
  },
  workDescription: {
    ...typography.bodySmall,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewProfileText: {
    ...typography.caption,
    fontFamily: fontFamilies.sansSemiBold,
  },
  connectButton: {
    flex: 1,
    height: 40,
    borderRadius: radius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
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
