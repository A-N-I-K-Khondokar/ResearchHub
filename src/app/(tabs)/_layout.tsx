import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { Home, Compass, Plus, Bell, User } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { fontFamilies, shadows } from '@/constants';
import { useAuth } from '@/context/AuthContext';
import { subscribeUnreadCount } from '@/services/network.service';
import { Avatar } from '@/components/common/Avatar';

/**
 * Bottom tab bar
 *  - theme colours (light + dark)
 *  - soft pill behind the active icon
 *  - raised round "+" for Share (the app's main action)
 *  - numeric unread badge on Notifications (1–9, then 9+)
 *  - the user's photo as the Profile icon, ringed when active
 *  - hidden while the keyboard is open (Android)
 */
export default function TabLayout() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { userProfile } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  // Live unread in-app notification count for the tab badge
  useEffect(() => {
    if (!userProfile?.uid || userProfile.approvalStatus !== 'approved') {
      setUnreadCount(0);
      return;
    }
    return subscribeUnreadCount(userProfile.uid, setUnreadCount);
  }, [userProfile?.uid, userProfile?.approvalStatus]);

  // 2 top + 64 tab (5px library padding + 28 icon + 4 + 14 label) + gesture area.
  const bottomInset = Math.max(insets.bottom, 8);
  const barHeight = 66 + bottomInset;
  // Strong, readable colours for the CTA and the badge in BOTH themes
  // (the dark theme's primary / error tokens are pale tints).
  const ctaColor = isDark ? '#3A78E6' : colors.primary;
  const badgeColor = '#DC2626';

  // We draw icon + label ourselves (tabBarShowLabel: false): the library's
  // item has a fixed 5px padding that clipped the built-in label.
  const label = (text: string, focused: boolean) => (
    <Text
      numberOfLines={1}
      style={[
        styles.label,
        { color: focused ? colors.primary : colors.textSecondary },
        focused && { fontFamily: fontFamilies.sansSemiBold },
      ]}
    >
      {text}
    </Text>
  );
  // Plain render helper (not a component) so icons are not remounted every render.
  const tab = (text: string, focused: boolean, children: React.ReactNode) => (
    <View style={styles.tab}>
      <View style={[styles.pill, focused && { backgroundColor: colors.primaryMuted }]}>{children}</View>
      {label(text, focused)}
    </View>
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.borderSubtle,
          height: barHeight,
          paddingBottom: bottomInset,
          paddingTop: 2,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarItemStyle: { height: 64 },
        tabBarIconStyle: { width: 80, height: 50 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            tab(
              'Home',
              focused,
              <Home size={21} color={color} strokeWidth={focused ? 2.3 : 1.8} />,
            )
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, focused }) => (
            tab(
              'Explore',
              focused,
              <Compass size={21} color={color} strokeWidth={focused ? 2.3 : 1.8} />,
            )
          ),
        }}
      />
      <Tabs.Screen
        name="share"
        options={{
          title: 'Share',
          tabBarAccessibilityLabel: 'Share your research or find collaborators',
          tabBarIcon: ({ focused }) => (
            <View style={styles.tab}>
            <View
              style={[
                styles.shareButton,
                shadows.elevated,
                {
                  backgroundColor: ctaColor,
                  borderColor: colors.surface,
                  shadowColor: ctaColor,
                  shadowOpacity: isDark ? 0.5 : 0.3,
                  shadowRadius: 10,
                  shadowOffset: { width: 0, height: 4 },
                  elevation: 6,
                  opacity: focused ? 1 : 0.95,
                },
              ]}
            >
              <Plus size={24} color="#FFFFFF" strokeWidth={2.6} />
            </View>
            {label('Share', focused)}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          tabBarAccessibilityLabel: unreadCount ? `Notifications, ${unreadCount} unread` : 'Notifications',
          tabBarIcon: ({ color, focused }) => (
            tab(
              'Notifications',
              focused,
              <View>
                <Bell size={21} color={color} strokeWidth={focused ? 2.3 : 1.8} />
                {unreadCount > 0 ? (
                  <View style={[styles.badge, { backgroundColor: badgeColor, borderColor: colors.surface }]}>
                    <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                  </View>
                ) : null}
              </View>,
            )
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            tab(
              'Profile',
              focused,
              userProfile ? (
                <View
                  style={[
                    styles.avatarRing,
                    { borderColor: focused ? colors.primary : isDark ? colors.border : colors.borderSubtle },
                  ]}
                >
                  <Avatar name={userProfile.displayName || 'You'} uri={userProfile.photoURL} size="xs" />
                </View>
              ) : (
                <User size={21} color={color} strokeWidth={focused ? 2.3 : 1.8} />
              ),
            )
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tab: { width: 80, height: 50, alignItems: 'center', justifyContent: 'flex-start', paddingTop: 2 },
  label: { fontSize: 11, lineHeight: 14, marginTop: 4, fontFamily: fontFamilies.sansMedium, maxWidth: 80, textAlign: 'center' },
  pill: {
    width: 56,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    // Raised above the bar
    // Raised above the bar; the label stays aligned with the other tabs
    marginTop: -22,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#FFFFFF', fontSize: 10, lineHeight: 12, fontFamily: fontFamilies.sansBold },
  avatarRing: { borderWidth: 2, borderRadius: 16, padding: 1 },
});
