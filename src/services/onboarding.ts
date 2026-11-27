/**
 * src/services/onboarding.ts
 *
 * "Has this account seen the first-run welcome on this device?"
 * Stored locally (AsyncStorage, per uid) — nothing is written to Firestore.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const keyFor = (uid: string) => `cse_onboarding_done_v1:${uid}`;

export async function isOnboardingDone(uid: string): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(keyFor(uid))) === '1';
  } catch {
    return true; // never block the app on a storage error
  }
}

export async function markOnboardingDone(uid: string): Promise<void> {
  try {
    await AsyncStorage.setItem(keyFor(uid), '1');
  } catch {
    /* ignore */
  }
}
