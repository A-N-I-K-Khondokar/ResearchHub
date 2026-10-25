import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { Home, Compass, PlusCircle, Bell, User } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { fontFamilies } from '@/constants';

export default function TabLayout() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const bottomInset = insets.bottom > 0 ? insets.bottom : 6;
  const barHeight = 60 + bottomInset;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarLabelPosition: 'below-icon',
        tabBarActiveTintColor: '#2563EB', // Academic Cobalt
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.borderSubtle,
          borderWidth: 0,
          height: barHeight,
          paddingBottom: bottomInset,
          paddingTop: 4,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: fontFamilies.sansMedium,
          fontWeight: '500',
          lineHeight: 14,
          marginTop: 2,
          marginBottom: 0,
        },
        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
          paddingVertical: 2,
        },
        tabBarIconStyle: {
          width: 24,
          height: 24,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.tabIconWrapper}>
              <Home size={22} color={color} strokeWidth={focused ? 2.3 : 1.8} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.tabIconWrapper}>
              <Compass size={22} color={color} strokeWidth={focused ? 2.3 : 1.8} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="share"
        options={{
          title: 'Share',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.tabIconWrapper}>
              <PlusCircle size={22} color={color} strokeWidth={focused ? 2.3 : 1.8} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.tabIconWrapper}>
              <View style={styles.iconWithBadge}>
                <Bell size={22} color={color} strokeWidth={focused ? 2.3 : 1.8} />
                <View
                  style={[
                    styles.notificationDot,
                    { backgroundColor: colors.accent },
                  ]}
                />
              </View>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.tabIconWrapper}>
              <User size={22} color={color} strokeWidth={focused ? 2.3 : 1.8} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIconWrapper: {
    width: 28,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
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
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
});
