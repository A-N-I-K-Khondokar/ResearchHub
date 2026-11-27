/**
 * Deep link: cseresearchhub://research/<id>  (used by "Share" on a post).
 * Route groups like (research) are not part of the URL, so this tiny route
 * forwards to the real post screen. AuthGuard still applies (sign-in first).
 */
import { Redirect, useLocalSearchParams } from 'expo-router';

export default function ResearchDeepLink() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Redirect href={(id ? `/(research)/${id}` : '/(tabs)') as any} />;
}
