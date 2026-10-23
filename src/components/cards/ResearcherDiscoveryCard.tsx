import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { UserPlus, Check, Clock, FlaskConical } from 'lucide-react-native';
import { UserProfile, CurrentWork } from '@/types';
import { radius, typography, fontFamilies } from '@/constants';
import { useTheme } from '@/context/ThemeContext';
import { Avatar } from '../common/Avatar';

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
  const { colors, isDark } = useTheme();
  const interests = researcher.interests || researcher.researchInterests || [];

  // Determine status badge (Batch or Faculty)
  const isFaculty =
    researcher.batch === 'Faculty' ||
    Boolean(researcher.designation?.toLowerCase().includes('professor')) ||
    Boolean(researcher.designation?.toLowerCase().includes('faculty'));
  const statusLabel = researcher.batch || (isFaculty ? 'Faculty' : 'CSE');

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.borderSubtle,
        },
      ]}
    >
      {/* Top Section: Avatar (left) + Info Column (right, flex: 1) */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={`View ${researcher.name}'s profile`}
          style={styles.avatarWrapper}
        >
          <Avatar
            name={researcher.name}
            uri={researcher.photoURL || researcher.avatar}
            size="md"
            shape="rounded"
            borderRadius={14}
            style={{ width: 52, height: 52 }}
          />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          {/* Top Row: Name + Status Badge (justify-between, space-between, width: 100%) */}
          <View style={styles.nameRow}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={onPress}
              style={styles.nameTouchable}
            >
              <Text
                style={[styles.name, { color: colors.textPrimary }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {researcher.name}
              </Text>
            </TouchableOpacity>

            {statusLabel ? (
              <View
                style={[
                  styles.statusBadge,
                  isFaculty
                    ? {
                        backgroundColor: colors.surfaceContainerHigh,
                      }
                    : {
                        backgroundColor: isDark ? 'rgba(36, 113, 231, 0.2)' : '#EEF2FF',
                      },
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    {
                      color: isFaculty
                        ? colors.textSecondary
                        : isDark
                        ? '#93C5FD'
                        : '#2563EB',
                    },
                  ]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {statusLabel}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Designation (directly below name row) */}
          <Text
            style={[styles.designation, { color: colors.textSecondary }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {researcher.designation || researcher.department}
          </Text>
        </View>
      </View>

      {/* Solid Topic Tags: Row of compact, borderless solid grey pills */}
      {interests.length > 0 && (
        <View style={styles.tagsRow}>
          {interests.slice(0, 3).map((topic, idx) => {
            const formattedTag = topic.startsWith('#')
              ? topic
              : `#${topic.replace(/\s+/g, '')}`;
            return (
              <TouchableOpacity
                key={`${topic}-${idx}`}
                activeOpacity={0.75}
                onPress={() => onTopicPress?.(topic)}
                style={[
                  styles.tagPill,
                  {
                    backgroundColor: colors.surfaceContainerHigh,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.tagPillText,
                    { color: isDark ? colors.textPrimary : '#475569' },
                  ]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {formattedTag}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Active Research Box */}
      {currentWork ? (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onPress}
          style={[
            styles.activeResearchBox,
            {
              backgroundColor: colors.surfaceContainerLow,
              borderColor: colors.borderSubtle,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Active research: ${currentWork.title}`}
        >
          <View style={styles.activeResearchHeader}>
            <FlaskConical size={14} color={colors.textSecondary} strokeWidth={2} />
            <Text style={[styles.activeResearchLabel, { color: colors.textSecondary }]}>
              ACTIVE RESEARCH
            </Text>
          </View>
          <Text
            style={[styles.activeResearchTitle, { color: colors.textPrimary }]}
            numberOfLines={2}
          >
            {currentWork.title}
          </Text>
        </TouchableOpacity>
      ) : null}

      {/* Action Buttons (Footer: Side-by-side, gap: 8, top separator line) */}
      <View
        style={[
          styles.footerActions,
          { borderTopColor: colors.borderSubtle },
        ]}
      >
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
              backgroundColor: colors.surfaceContainerHigh,
              borderWidth: 1,
              borderColor: colors.borderSubtle,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={
            connectionStatus === 'connected'
              ? 'Connected'
              : connectionStatus === 'pending'
              ? 'Pending connection'
              : 'Connect'
          }
        >
          {connectionStatus === 'connected' ? (
            <>
              <Check size={16} color={colors.secondary} strokeWidth={2.2} />
              <Text
                style={[styles.connectTextConnected, { color: colors.secondary }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                Connected
              </Text>
            </>
          ) : connectionStatus === 'pending' ? (
            <>
              <Clock size={16} color={colors.textSecondary} strokeWidth={2} />
              <Text
                style={[styles.connectTextPending, { color: colors.textSecondary }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                Pending
              </Text>
            </>
          ) : (
            <>
              <UserPlus size={16} color="#FFFFFF" strokeWidth={2.2} />
              <Text
                style={styles.connectText}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                Connect
              </Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onPress}
          style={[
            styles.viewProfileButton,
            {
              backgroundColor: 'transparent',
              borderColor: colors.borderSubtle,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={`View profile of ${researcher.name}`}
        >
          <Text
            style={[styles.viewProfileText, { color: colors.textPrimary }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            View Profile
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarWrapper: {
    marginRight: 14,
    flexShrink: 0,
  },
  headerInfo: {
    flex: 1,
    flexShrink: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    gap: 8,
  },
  nameTouchable: {
    flex: 1,
    flexShrink: 1,
    marginRight: 8,
  },
  name: {
    fontSize: 16,
    fontFamily: fontFamilies.sansBold,
    fontWeight: '700',
    flexShrink: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 0,
    flexShrink: 0,
  },
  statusBadgeText: {
    fontSize: 12,
    fontFamily: fontFamilies.sansSemiBold,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  designation: {
    fontSize: 13,
    fontFamily: fontFamilies.sansRegular,
    marginTop: 2,
    flexShrink: 1,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
  },
  tagPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 9999,
    borderWidth: 0,
    maxWidth: '100%',
    flexShrink: 1,
  },
  tagPillText: {
    fontSize: 12,
    fontFamily: fontFamilies.sansSemiBold,
    fontWeight: '600',
    flexShrink: 1,
  },
  activeResearchBox: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    marginTop: 14,
  },
  activeResearchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  activeResearchLabel: {
    fontSize: 10.5,
    fontFamily: fontFamilies.sansBold,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  activeResearchTitle: {
    fontSize: 13.5,
    fontFamily: fontFamilies.sansSemiBold,
    fontWeight: '600',
    lineHeight: 19,
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    paddingTop: 16,
    marginTop: 16,
  },
  connectButton: {
    flex: 1,
    flexShrink: 1,
    height: 38,
    borderRadius: radius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  connectText: {
    ...typography.caption,
    fontFamily: fontFamilies.sansSemiBold,
    fontWeight: '600',
    color: '#FFFFFF',
    flexShrink: 1,
  },
  connectTextConnected: {
    ...typography.caption,
    fontFamily: fontFamilies.sansSemiBold,
    fontWeight: '600',
    flexShrink: 1,
  },
  connectTextPending: {
    ...typography.caption,
    fontFamily: fontFamilies.sansMedium,
    fontWeight: '500',
    flexShrink: 1,
  },
  viewProfileButton: {
    flex: 1,
    flexShrink: 1,
    height: 38,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewProfileText: {
    ...typography.caption,
    fontFamily: fontFamilies.sansSemiBold,
    fontWeight: '600',
    flexShrink: 1,
  },
});
