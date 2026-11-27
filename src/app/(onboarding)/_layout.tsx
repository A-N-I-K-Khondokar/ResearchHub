import React from 'react';
import { Stack } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';

export default function OnboardingLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    >
      {/* One-time welcome after approval (see OnboardingContext) */}
      <Stack.Screen name="welcome" options={{ gestureEnabled: false }} />
      <Stack.Screen name="topics" />
      <Stack.Screen name="contact" />
      <Stack.Screen name="start" />
    </Stack>
  );
}
