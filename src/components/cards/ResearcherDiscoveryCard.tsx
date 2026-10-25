import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { UserPlus, Check, Clock, FlaskConical } from 'lucide-react-native';
import { UserProfile, CurrentWork } from '@/types';
import { typography, fontFamilies } from '@/constants';
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

  // Academic role (e.g., Graduate Researcher, Associate Professor, CSE, Undergraduate Researcher)
  const academicRole = researcher.designation || researcher.department || 'Researcher';

  // Research summary / short description
  const researchSummary = currentWork?.shortDescription || currentWork?.description;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.borderSubtle,
          shadowOpacity: isDark ? 0 : 0.04,
          elevation: isDark ? 0 : 1,
        },
      ]}
    >
      {/* 1. Researcher Identity Row: Avatar (left) + Name (beside it, vertically aligned) */}
      <View style={styles.identityRow}>
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
            borderRadius={12}
            style={{ width: 44, height: 44 }}
          />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onPress}
          style={styles.nameTouchable}
          accessibilityRole="button"
          accessibilityLabel={`View ${researcher.name}'s profile`}
        >
          <Text
            style={[styles.name, { color: colors.textPrimary }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {researcher.name}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 2. Academic Information Row: Status/Batch badge on left, Academic role beside it */}
      <View style={styles.academicRow}>
        {statusLabel ? (
          <View
            style={[
              styles.statusBadge,
              isFaculty
                ? {
                    backgroundColor: isDark ? 'rgba(255, 113, 69, 0.16)' : '#FFF0EB',
                  }
                : {
                    backgroundColor: isDark ? 'rgba(36, 113, 231, 0.18)' : '#EEF4FF',
                  },
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                {
                  color: isFaculty
                    ? isDark
                      ? '#FFB59F'
                      : '#CB4C23'
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

        <Text
          style={[styles.academicRoleText, { color: colors.textSecondary }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {academicRole}
        </Text>
      </View>

      {/* 3. Active Research Panel: pale blue-tinted bg, subtle blue border, icon + uppercase label, title, summary */}
      {currentWork ? (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onPress}
          style={[
            styles.activeResearchBox,
            {
              backgroundColor: isDark ? 'rgba(36, 113, 231, 0.08)' : '#F4F7FD',
              borderColor: isDark ? 'rgba(36, 113, 231, 0.18)' : '#E0EAFC',
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Active research: ${currentWork.title}`}
        >
          <View style={styles.activeResearchHeader}>
            <FlaskConical
              size={13}
              color={isDark ? '#93C5FD' : colors.primary}
              strokeWidth={2.2}
            />
            <Text
              style={[
                styles.activeResearchLabel,
                { color: isDark ? '#93C5FD' : colors.primary },
              ]}
            >
              ACTIVE RESEARCH
            </Text>
          </View>
          <Text
            style={[styles.activeResearchTitle, { color: colors.textPrimary }]}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {currentWork.title}
          </Text>
          {researchSummary ? (
            <Text
              style={[styles.activeResearchSummary, { color: colors.textSecondary }]}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {researchSummary}
            </Text>
          ) : null}
        </TouchableOpacity>
      ) : null}

      {/* 4. Research Tags: Moved below the active research panel, pale-blue filled pills with blue text */}
      {interests.length > 0 && (
        <View style={styles.tagsRow}>
          {interests.slice(0, 4).map((topic, idx) => {
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
                    backgroundColor: isDark
                      ? 'rgba(36, 113, 231, 0.16)'
                      : '#EEF4FF',
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Research topic: ${formattedTag}`}
              >
                <Text
                  style={[
                    styles.tagPillText,
                    { color: isDark ? '#93C5FD' : '#1D4ED8' },
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

      {/* 5. Action Buttons: Connect (primary blue) & View Profile (outlined) at the bottom */}
      <View
        style={[
          styles.footerActions,
          { borderTopColor: colors.borderSubtle },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onConnectPress}
          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
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
          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
          style={[
            styles.viewProfileButton,
            {
              backgroundColor: 'transparent',
              borderColor: isDark ? colors.borderSubtle : '#D4D8E2',
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
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#071A3E',
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    marginRight: 12,
    flexShrink: 0,
  },
  nameTouchable: {
    flex: 1,
    flexShrink: 1,
  },
  name: {
    fontSize: 16.5,
    fontFamily: fontFamilies.sansBold,
    fontWeight: '700',
    flexShrink: 1,
  },
  academicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 9999,
    borderWidth: 0,
    flexShrink: 0,
  },
  statusBadgeText: {
    fontSize: 11.5,
    fontFamily: fontFamilies.sansSemiBold,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  academicRoleText: {
    fontSize: 13,
    fontFamily: fontFamilies.sansRegular,
    lineHeight: 17,
    flex: 1,
    flexShrink: 1,
  },
  activeResearchBox: {
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 10,
  },
  activeResearchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  activeResearchLabel: {
    fontSize: 10.5,
    fontFamily: fontFamilies.sansBold,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  activeResearchTitle: {
    fontSize: 13.5,
    fontFamily: fontFamilies.sansSemiBold,
    fontWeight: '600',
    lineHeight: 18,
  },
  activeResearchSummary: {
    fontSize: 12.5,
    fontFamily: fontFamilies.sansRegular,
    lineHeight: 17,
    marginTop: 3,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 10,
  },
  tagPill: {
    paddingHorizontal: 10,
    paddingVertical: 3.5,
    borderRadius: 9999,
    borderWidth: 0,
    maxWidth: '100%',
    flexShrink: 1,
  },
  tagPillText: {
    fontSize: 11.5,
    fontFamily: fontFamilies.sansSemiBold,
    fontWeight: '600',
    flexShrink: 1,
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 12,
  },
  connectButton: {
    flex: 1,
    flexShrink: 1,
    minHeight: 38,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  connectText: {
    ...typography.caption,
    fontFamily: fontFamilies.sansSemiBold,
    fontWeight: '600',
    fontSize: 13,
    color: '#FFFFFF',
    flexShrink: 1,
  },
  connectTextConnected: {
    ...typography.caption,
    fontFamily: fontFamilies.sansSemiBold,
    fontWeight: '600',
    fontSize: 13,
    flexShrink: 1,
  },
  connectTextPending: {
    ...typography.caption,
    fontFamily: fontFamilies.sansMedium,
    fontWeight: '500',
    fontSize: 13,
    flexShrink: 1,
  },
  viewProfileButton: {
    flex: 1,
    flexShrink: 1,
    minHeight: 38,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewProfileText: {
    ...typography.caption,
    fontFamily: fontFamilies.sansSemiBold,
    fontWeight: '600',
    fontSize: 13,
    flexShrink: 1,
  },
});
