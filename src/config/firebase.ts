/**
 * src/config/firebase.ts
 *
 * Firebase client initialisation for CSE Research Hub.
 *
 * Design decisions:
 *  - Firebase JavaScript SDK (modular API) — compatible with Expo SDK 52 / RN 0.76.
 *  - Singleton guard (`getApps()`) ensures a single FirebaseApp across Metro
 *    fast-refresh cycles.
 *  - Auth persistence:
 *      web  → `getAuth()` defaults (IndexedDB / localStorage + popup resolver)
 *      iOS/Android → `getReactNativePersistence(AsyncStorage)`
 *  - Configuration validation at module load time:
 *      • `isFirebaseConfigured` is `true` only when every required env var is
 *        present and non-empty.
 *      • When vars are missing the module still exports safe stubs so that
 *        import order never causes a crash during development.
 *  - Firestore (`db`) is initialized from the singleton Firebase app.
 *  - Credential values are never logged.
 */

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  initializeAuth,
  getAuth,
  getReactNativePersistence,
  type Auth,
} from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// ---------------------------------------------------------------------------
// 1. Configuration — read from Expo public environment variables
// ---------------------------------------------------------------------------

const firebaseConfig = {
  apiKey:            process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// ---------------------------------------------------------------------------
// 2. Validation
// ---------------------------------------------------------------------------

/** `true` only when every required env var is present and non-empty. */
// IMPORTANT: check the statically-read `firebaseConfig` values, never
// `process.env[key]`. Expo only inlines EXPO_PUBLIC_* variables written as
// literal `process.env.EXPO_PUBLIC_X`; dynamic `process.env[key]` is empty in
// release builds (APK), which previously made every build report
// "Firebase is not configured" even though the values were bundled.
export const isFirebaseConfigured: boolean = Object.values(firebaseConfig).every(
  (value) => typeof value === 'string' && value.trim() !== '',
);

if (!isFirebaseConfigured) {
  console.warn(
    '[Firebase] One or more EXPO_PUBLIC_FIREBASE_* environment variables are missing.\n' +
    'Copy .env.example → .env and fill in your Firebase Console credentials.\n' +
    'Firebase features will be unavailable until the app is restarted with valid config.',
  );
}

// Sanity-check the project ID when the config is otherwise complete.
if (
  isFirebaseConfigured &&
  firebaseConfig.projectId !== 'cse-research-hub'
) {
  console.error(
    `[Firebase] Unexpected projectId "${firebaseConfig.projectId}". ` +
    'Expected "cse-research-hub". Verify EXPO_PUBLIC_FIREBASE_PROJECT_ID in your .env file.',
  );
}

// ---------------------------------------------------------------------------
// 3. Firebase App — singleton
// ---------------------------------------------------------------------------

let app: FirebaseApp;

if (isFirebaseConfigured) {
  app = getApps().length === 0
    ? initializeApp(firebaseConfig)
    : getApp();
} else {
  // Provide a placeholder so imports never throw during development without .env.
  // `initializeApp` with an empty projectId would throw, so we guard here.
  app = getApps().length > 0 ? getApp() : (null as unknown as FirebaseApp);
}

// ---------------------------------------------------------------------------
// 4. Auth — platform-aware persistence
// ---------------------------------------------------------------------------

let auth: Auth;

if (isFirebaseConfigured && app) {
  if (Platform.OS === 'web') {
    // `getAuth()` on web registers browser persistence (IndexedDB → localStorage)
    // AND the default `browserPopupRedirectResolver`. A bare
    // `initializeAuth(app, { persistence })` omits the resolver, which makes
    // `signInWithPopup` throw `auth/argument-error`.
    auth = getAuth(app);
  } else {
    try {
      auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
    } catch {
      auth = getAuth(app);
    }
  }
} else {
  // Stub — prevents null-reference crashes while .env is not configured.
  auth = null as unknown as Auth;
}

// ---------------------------------------------------------------------------
// 5. Firestore — initialized with existing Firebase app instance
// ---------------------------------------------------------------------------

/**
 * Firestore database instance.
 * Initialized from the Firebase app singleton.
 * Null when Firebase environment variables are unconfigured.
 */
export const db: Firestore | null = isFirebaseConfigured && app
  ? getFirestore(app)
  : null;

// ---------------------------------------------------------------------------
// 6. Exports
// ---------------------------------------------------------------------------

export { app, auth };
export default app;
