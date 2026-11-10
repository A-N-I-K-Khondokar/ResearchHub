import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  SourceSerif4_600SemiBold,
  SourceSerif4_700Bold,
} from '@expo-google-fonts/source-serif-4';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';

// Keep the native splash screen visible while fonts load
SplashScreen.preventAutoHideAsync().catch(() => {
  /* ignore */
});

// ---------------------------------------------------------------------------
// Route protection — runs inside AuthProvider so useAuth() is available
// ---------------------------------------------------------------------------

/**
 * Auth-aware routing guard.
 *
 * Rules:
 *  1. While auth is loading → render nothing (avoid navigation flicker).
 *  2. Signed out → allow only public (auth) routes; redirect others to login.
 *  3. Signed in + email NOT verified → lock to verify-email screen.
 *  4. Signed in + email verified → route to account-setup (approval checkpoint).
 *     Protected research tabs remain inaccessible (Stage 3.3 approval required).
 *
 * Public segments: (auth), index (redirects to auth/splash).
 * Protected segments: (tabs), (onboarding), (research), (profile), (explore).
 */
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated, emailVerified } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return; // Wait for Firebase session to resolve
    if (!segments) return; // Wait for route segments to resolve

    const inAuthGroup = segments[0] === '(auth)';
    const inTabs = segments[0] === '(tabs)';
    const inOnboarding = segments[0] === '(onboarding)';
    const inResearch = segments[0] === '(research)';
    const inProfile = segments[0] === '(profile)';
    const inExplore = segments[0] === '(explore)';
    const inProtected = inTabs || inOnboarding || inResearch || inProfile || inExplore;

    if (!isAuthenticated) {
      // Signed out: redirect away from protected routes
      if (inProtected) {
        router.replace('/(auth)/login' as any);
      }
      return;
    }

    // Signed in but email not verified: lock to verify-email
    if (!emailVerified) {
      const currentScreen = segments[1];
      const allowedUnverifiedScreens = ['verify-email', 'splash'];
      if (!inAuthGroup || !allowedUnverifiedScreens.includes(currentScreen ?? '')) {
        router.replace('/(auth)/verify-email' as any);
      }
      return;
    }

    // Signed in + email verified: route to account-setup (approval checkpoint).
    // Protected research tabs remain inaccessible until Stage 3.3 approval.
    if (inProtected) {
      router.replace('/(auth)/account-setup' as any);
      return;
    }

    // If on auth screens while fully signed in and verified, go to account-setup
    if (inAuthGroup) {
      const currentScreen = segments[1];
      const allowedVerifiedScreens = ['account-setup'];
      if (!allowedVerifiedScreens.includes(currentScreen ?? '')) {
        router.replace('/(auth)/account-setup' as any);
      }
    }
  }, [isLoading, isAuthenticated, emailVerified, segments, router]);

  // Prevent flash: show nothing while loading auth
  if (isLoading) return null;

  return <>{children}</>;
}

// ---------------------------------------------------------------------------
// Stack navigator
// ---------------------------------------------------------------------------

function RootNavigation() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(research)" />
      <Stack.Screen name="(profile)" />
      <Stack.Screen name="(explore)" />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

// ---------------------------------------------------------------------------
// Root layout
// ---------------------------------------------------------------------------

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    SourceSerif4_600SemiBold,
    SourceSerif4_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {
        /* ignore */
      });
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <AuthGuard>
            <RootNavigation />
          </AuthGuard>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
