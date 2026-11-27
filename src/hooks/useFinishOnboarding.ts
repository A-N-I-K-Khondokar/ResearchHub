/**
 * Finish (or skip) the first-run welcome, then go Home — optionally opening a
 * follow-up screen (e.g. Share) on top of it.
 */
import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useOnboarding } from '@/context/OnboardingContext';

export function useFinishOnboarding() {
  const router = useRouter();
  const { complete } = useOnboarding();
  return useCallback(
    async (next?: { pathname: string; params?: Record<string, string> }) => {
      await complete();
      router.replace('/(tabs)' as any);
      if (next) setTimeout(() => router.push(next as any), 350);
    },
    [complete, router],
  );
}
