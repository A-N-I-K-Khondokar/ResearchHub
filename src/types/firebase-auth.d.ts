/**
 * Module augmentation for `firebase/auth`.
 *
 * The TypeScript compiler resolves `firebase/auth` to the web/browser
 * typings (`dist/auth/index.d.ts`), which do not include
 * `getReactNativePersistence`.  At runtime Metro resolves the React Native
 * bundle (`dist/rn/`) where the function is present.
 *
 * This declaration teaches the compiler about the export so that
 * `src/config/firebase.ts` can import it without `@ts-ignore`.
 *
 * References:
 *  - https://github.com/firebase/firebase-js-sdk/issues/7584
 *  - https://docs.expo.dev/guides/using-firebase/
 */
import type { Persistence } from 'firebase/auth';
import type AsyncStorage from '@react-native-async-storage/async-storage';

declare module 'firebase/auth' {
  /**
   * Returns a {@link Persistence} instance that uses
   * React Native's AsyncStorage as the backing store.
   *
   * Pass this to `initializeAuth({ persistence: … })` on iOS / Android.
   */
  export function getReactNativePersistence(
    storage: typeof AsyncStorage,
  ): Persistence;
}

