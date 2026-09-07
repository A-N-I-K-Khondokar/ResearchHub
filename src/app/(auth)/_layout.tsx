import React from 'react';
import { Stack } from 'expo-router';
import { colors } from '@/constants';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="splash" />
      <Stack.Screen name="login" />
      <Stack.Screen name="sign-up" />
      <Stack.Screen name="verify-email" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="forgot-password-success" />
    </Stack>
  );
}
