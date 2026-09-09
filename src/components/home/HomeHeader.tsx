import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Sun, Moon, Search, Bell } from 'lucide-react-native';
import { spacing, radius, typography, fontFamilies } from '../../constants';
import { useTheme } from '@/context/ThemeContext';
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
  const { colors, isDark, toggleTheme } = useTheme();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = userName.split(' ')[0] || userName;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderBottomColor: colors.borderSubtle,
        },
      ]}
    >
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
          <Text style={[styles.greetingText, { color: colors.textSecondary }]}>{getGreeting()},</Text>
          <Text style={[styles.nameText, { color: colors.textPrimary }]} numberOfLines={1}>
            {firstName}
          </Text>
        </View>
      </View>

      {/* Action Buttons: Quick Theme Toggle, Search & Notifications */}
      <View style={styles.rightSection}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={toggleTheme}
          style={[styles.iconButton, { backgroundColor: colors.surfaceSubtle }]}
          accessibilityRole="button"
          accessibilityLabel="Toggle Dark Mode"
        >
          {isDark ? (
            <Sun size={18} color={colors.accent} />
          ) : (
            <Moon size={18} color={colors.textPrimary} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onSearchPress}
          style={[styles.iconButton, { backgroundColor: colors.surfaceSubtle }]}
          accessibilityRole="button"
          accessibilityLabel="Search research and people"
        >
          <Search size={18} color={colors.textPrimary} />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onNotificationPress}
          style={[styles.iconButton, { backgroundColor: colors.surfaceSubtle }]}
          accessibilityRole="button"
          accessibilityLabel="Notifications"
        >
          <Bell size={18} color={colors.textPrimary} />
          {unreadNotificationsCount > 0 ? (
            <View style={[styles.badge, { backgroundColor: colors.error }]}>
              <Text style={[styles.badgeText, { color: colors.textInverse }]}>
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
    borderBottomWidth: 1,
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
  },
  nameText: {
    ...typography.headlineSmall,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 5,
    right: 5,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    fontSize: 9,
    fontFamily: fontFamilies.sansBold,
  },
});
