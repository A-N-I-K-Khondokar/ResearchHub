import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { Home, Compass, Plus, Bell, User } from 'lucide-react-native';
import { fontFamilies, radius } from '@/constants';
import { useTheme } from '@/context/ThemeContext';

export default function TabLayout() {
  const { colors, isDark } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.borderSubtle,
          borderTopWidth: 1,
          height: 68,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: fontFamilies.sansSemiBold,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.iconWrapper,
                focused && {
                  backgroundColor: isDark ? '#152A54' : '#E5EEFF',
                },
              ]}
            >
              <Home size={20} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, focused }) => (
            <Compass size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="share"
        options={{
          title: 'Share',
          tabBarIcon: () => (
            <View
              style={[
                styles.centerButton,
                {
                  backgroundColor: colors.primary,
                  shadowColor: colors.primary,
                },
              ]}
            >
              <Plus size={24} color="#FFFFFF" strokeWidth={2.6} />
            </View>
          ),
          tabBarLabel: ({ color }) => (
            <Text style={[styles.shareLabel, { color }]}>Share</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconWithBadge}>
              <Bell size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
              <View
                style={[
                  styles.notificationDot,
                  { backgroundColor: colors.accent },
                ]}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <User size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  shareLabel: {
    fontSize: 11,
    fontFamily: fontFamilies.sansSemiBold,
    fontWeight: '600',
    marginTop: 2,
  },
  iconWithBadge: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationDot: {
    position: 'absolute',
    top: -1,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
