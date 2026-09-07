import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Search, Bell } from 'lucide-react-native';
import { colors, spacing, radius, typography, fontFamilies } from '../../constants';
import { Avatar } from '../common/Avatar';

interface HomeHeaderProps {
  userName: string;
  userAvatar?: string | null;
  unreadNotificationsCount?: number;
  onAvatarPress?: () => void;
  onSearchPress?: () => void;
  onNotificationPress?: () => void;
}

export const HomeHeader: React.FC<HomeHeaderProps> = ({
  userName,
  userAvatar,
  unreadNotificationsCount = 0,
  onAvatarPress,
  onSearchPress,
  onNotificationPress,
}) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = userName.split(' ')[0] || userName;

  return (
    <View style={styles.container}>
      {/* User Greeting & Avatar */}
      <View style={styles.leftSection}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onAvatarPress}
          style={styles.avatarTouchable}
          accessibilityRole="button"
          accessibilityLabel="Open profile"
        >
          <Avatar name={userName} uri={userAvatar} size="md" />
        </TouchableOpacity>
        <View style={styles.greetingContainer}>
          <Text style={styles.greetingText}>{getGreeting()},</Text>
          <Text style={styles.nameText} numberOfLines={1}>
            {firstName}
          </Text>
        </View>
      </View>

      {/* Action Buttons: Search & Notifications */}
      <View style={styles.rightSection}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onSearchPress}
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel="Search research and people"
        >
          <Search size={20} color={colors.textPrimary} />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onNotificationPress}
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel="Notifications"
        >
          <Bell size={20} color={colors.textPrimary} />
          {unreadNotificationsCount > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
              </Text>
            </View>
          ) : null}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarTouchable: {
    marginRight: spacing.sm,
  },
  greetingContainer: {
    flex: 1,
  },
  greetingText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  nameText: {
    ...typography.headlineSmall,
    color: colors.textPrimary,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    fontSize: 9,
    fontFamily: fontFamilies.sansBold,
    color: colors.textInverse,
  },
});
