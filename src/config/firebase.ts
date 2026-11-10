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
 *      web  → `browserLocalPersistence` (IndexedDB / localStorage)
 *      iOS/Android → `getReactNativePersistence(AsyncStorage)`
 *  - Configuration validation at module load time:
 *      • `isFirebaseConfigured` is `true` only when every required env var is
 *        present and non-empty.
 *      • When vars are missing the module still exports safe stubs so that
 *        import order never causes a crash during development.
 *  - Firestore (`db`) is deferred — export is `null` until Stage 3.3.
 *  - Credential values are never logged.
 */

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  initializeAuth,
  getAuth,
  browserLocalPersistence,
  getReactNativePersistence,
  type Auth,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// ---------------------------------------------------------------------------
// 1. Configuration — read from Expo public environment variables
// ---------------------------------------------------------------------------

const REQUIRED_KEYS = [
  'EXPO_PUBLIC_FIREBASE_API_KEY',
  'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
  'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'EXPO_PUBLIC_FIREBASE_APP_ID',
] as const;

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
export const isFirebaseConfigured: boolean = REQUIRED_KEYS.every(
  (key) => typeof process.env[key] === 'string' && process.env[key]!.trim() !== '',
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
    try {
      auth = initializeAuth(app, { persistence: browserLocalPersistence });
    } catch {
      // `initializeAuth` throws if auth was already initialised (e.g. fast-refresh).
      auth = getAuth(app);
    }
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
// 5. Firestore — deferred until Stage 3.2
// ---------------------------------------------------------------------------

/**
 * Firestore database instance.
 * Remains `null` until Stage 3.3 (Firestore integration).
 * Import `db` only after checking `isFirebaseConfigured`.
 */
export const db = null;

// ---------------------------------------------------------------------------
// 6. Exports
// ---------------------------------------------------------------------------

export { app, auth };
export default app;
