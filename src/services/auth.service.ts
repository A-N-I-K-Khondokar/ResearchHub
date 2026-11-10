/**
 * src/services/auth.service.ts
 *
 * Firebase Authentication service layer for CSE Research Hub.
 *
 * All Firebase Auth API calls are centralised here.
 * This file never imports from AuthContext — it only uses the Firebase SDK.
 *
 * Platform strategy:
 *  - Email/password: works on all platforms including Expo Go.
 *  - Google Sign-In (web): Firebase signInWithPopup.
 *  - Google Sign-In (native iOS/Android): expo-auth-session OAuth proxy →
 *    signInWithCredential.  Requires a custom development build (not Expo Go).
 *
 * Stage 3.2 scope:
 *  - No Firestore writes.
 *  - No user profile document creation.
 *  - No admin approval persistence.
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  reload,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential,
  fetchSignInMethodsForEmail,
  type User,
} from 'firebase/auth';
import { Platform } from 'react-native';
import { auth, isFirebaseConfigured } from '@/config/firebase';
import type { SignUpParams, SignInParams, AuthError } from '@/types/auth.types';

// ---------------------------------------------------------------------------
// Error mapping — convert Firebase error codes to user-friendly messages
// ---------------------------------------------------------------------------

const FIREBASE_ERROR_MAP: Record<string, string> = {
  'auth/email-already-in-use':
    'An account with this email already exists. Please sign in instead.',
  'auth/invalid-email':
    'Please enter a valid email address.',
  'auth/operation-not-allowed':
    'This sign-in method is not currently enabled. Please contact support.',
  'auth/weak-password':
    'Your password is too weak. Please choose at least 6 characters.',
  'auth/user-disabled':
    'This account has been disabled. Please contact the administrator.',
  'auth/user-not-found':
    'No account found with this email address.',
  'auth/wrong-password':
    'Incorrect password. Please try again or reset your password.',
  'auth/invalid-credential':
    'Incorrect email or password. Please check your credentials.',
  'auth/too-many-requests':
    'Too many failed attempts. Please wait a moment and try again.',
  'auth/network-request-failed':
    'Network error. Please check your connection and try again.',
  'auth/popup-closed-by-user':
    'Sign-in cancelled. Please try again.',
  'auth/popup-blocked':
    'Sign-in popup was blocked. Please allow popups for this site and try again.',
  'auth/cancelled-popup-request':
    'Another sign-in is in progress. Please wait and try again.',
  'auth/account-exists-with-different-credential':
    'An account already exists with this email using a different sign-in method. Please use your original sign-in method.',
};

export function mapFirebaseError(error: unknown): AuthError {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'string'
  ) {
    const code = (error as { code: string }).code;
    return {
      code,
      message: FIREBASE_ERROR_MAP[code] ?? 'An unexpected error occurred. Please try again.',
    };
  }
  return {
    code: 'unknown',
    message: 'An unexpected error occurred. Please try again.',
  };
}

// ---------------------------------------------------------------------------
// Guard — prevents calling Firebase when not configured
// ---------------------------------------------------------------------------

function requireFirebase(): void {
  if (!isFirebaseConfigured || !auth) {
    throw {
      code: 'firebase/not-configured',
      message:
        'Firebase is not configured. Please set up your .env file with valid credentials.',
    } satisfies AuthError;
  }
}

// ---------------------------------------------------------------------------
// Email & Password — Registration
// ---------------------------------------------------------------------------

/**
 * Creates a new Firebase Auth account, sets the display name, and
 * sends an email verification.
 *
 * Does NOT create a Firestore profile document (Stage 3.3).
 */
export async function registerWithEmail(params: SignUpParams): Promise<User> {
  requireFirebase();

  const { fullName, email, password } = params;

  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const user = credential.user;

  // Update display name in Firebase Auth profile
  await updateProfile(user, { displayName: fullName.trim() });

  // Send verification email
  await sendEmailVerification(user);

  return user;
}

// ---------------------------------------------------------------------------
// Email & Password — Login
// ---------------------------------------------------------------------------

/**
 * Signs in with email and password.
 * Returns the authenticated user; callers must check `emailVerified`.
 */
export async function loginWithEmail(params: SignInParams): Promise<User> {
  requireFirebase();

  const { email, password } = params;
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

// ---------------------------------------------------------------------------
// Email Verification
// ---------------------------------------------------------------------------

/** Sends (or re-sends) a verification email to the current user. */
export async function sendVerificationEmail(user: User): Promise<void> {
  await sendEmailVerification(user);
}

/** Reloads the Firebase user object from the server. */
export async function reloadUser(user: User): Promise<void> {
  await reload(user);
}

// ---------------------------------------------------------------------------
// Password Reset
// ---------------------------------------------------------------------------

/**
 * Sends a password-reset email.
 * Does not distinguish between registered and unregistered addresses
 * to prevent user enumeration.
 */
export async function resetPassword(email: string): Promise<void> {
  requireFirebase();
  // We intentionally swallow auth/user-not-found to avoid user enumeration.
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: unknown) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: string }).code === 'auth/user-not-found'
    ) {
      // Silently succeed — caller shows generic "If an account exists…" message
      return;
    }
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Sign Out
// ---------------------------------------------------------------------------

/** Signs out the current Firebase user. */
export async function signOut(): Promise<void> {
  requireFirebase();
  if (Platform.OS !== 'web') {
    try {
      const { GoogleSignin } = require('@react-native-google-signin/google-signin');
      await GoogleSignin.signOut();
    } catch {
      // Ignore if native module is not present or user was not signed in via Google
    }
  }
  await firebaseSignOut(auth);
}

// ---------------------------------------------------------------------------
// Google Sign-In — Web
// ---------------------------------------------------------------------------

/** Web: Firebase popup flow. */
async function googleSignInWeb(): Promise<User> {
  const provider = new GoogleAuthProvider();
  provider.addScope('profile');
  provider.addScope('email');

  const result = await signInWithPopup(auth, provider);
  return result.user;
}

// ---------------------------------------------------------------------------
// Google Sign-In — Native (iOS / Android)
//
// Uses @react-native-google-signin/google-signin, the officially recommended
// native Google Sign-In library for React Native and Expo.
//
// It uses Google Play Services Credential Manager on Android and the
// GoogleSignIn framework on iOS to perform native OAuth, returning a secure
// OpenID Connect ID token.
//
// The ID token is then exchanged with Firebase Authentication via
// GoogleAuthProvider.credential(idToken) and signInWithCredential().
//
// Development Build Requirement:
// Because this library requires native SDKs, it requires an Expo development
// build (EAS Build or local run:android / run:ios). It is not available in
// pre-compiled Expo Go.
// ---------------------------------------------------------------------------

async function googleSignInNative(): Promise<User> {
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

  if (!webClientId) {
    throw {
      code: 'google/client-id-missing',
      message:
        'Google Sign-In is not configured. Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in your .env file.\n' +
        'This Web Client ID serves as the server audience for native ID token verification.',
    } satisfies AuthError;
  }

  try {
    // Lazy require prevents top-level TurboModuleRegistry.getEnforcing()
    // crashes on Web or inside Expo Go.
    const { GoogleSignin, isSuccessResponse } = require('@react-native-google-signin/google-signin');

    GoogleSignin.configure({
      webClientId,
      iosClientId: iosClientId || undefined,
      scopes: ['profile', 'email'],
    });

    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();

    if (response.type === 'cancelled') {
      throw {
        code: 'auth/popup-closed-by-user',
        message: 'Google Sign-In was cancelled.',
      } satisfies AuthError;
    }

    if (!isSuccessResponse(response) || !response.data?.idToken) {
      throw {
        code: 'google/no-id-token',
        message: 'Google did not return an ID token. Verify your OAuth client configuration.',
      } satisfies AuthError;
    }

    const idToken = response.data.idToken;
    const googleCredential = GoogleAuthProvider.credential(idToken);
    const firebaseResult = await signInWithCredential(auth, googleCredential);
    return firebaseResult.user;
  } catch (error: any) {
    if (error?.code === 'auth/popup-closed-by-user') {
      throw error;
    }

    // Detect if running inside standard Expo Go (native module missing)
    if (
      error?.message?.includes('TurboModuleRegistry') ||
      error?.message?.includes('RNGoogleSignin') ||
      error?.code === 'MODULE_NOT_FOUND'
    ) {
      throw {
        code: 'google/expo-go-unsupported',
        message:
          'Native Google Sign-In requires an Expo development build with @react-native-google-signin/google-signin.\n' +
          'For testing in Expo Go, please use email/password authentication or test in web mode.',
      } satisfies AuthError;
    }

    const mapped = mapFirebaseError(error);
    if (mapped.code !== 'unknown') {
      throw mapped;
    }

    throw {
      code: error?.code ?? 'google/native-sign-in-failed',
      message: error?.message ?? 'Google Sign-In failed on this device.',
    } satisfies AuthError;
  }
}

// ---------------------------------------------------------------------------
// Google Sign-In — unified platform entry point
// ---------------------------------------------------------------------------

/**
 * Initiates Google Sign-In using the appropriate platform strategy:
 *   - Web → Firebase signInWithPopup
 *   - iOS/Android → expo-auth-session PKCE → signInWithCredential
 *
 * On native platforms, requires a custom development build.
 * Will NOT work in Expo Go.
 */
export async function googleSignIn(): Promise<User> {
  requireFirebase();

  if (Platform.OS === 'web') {
    return googleSignInWeb();
  }
  return googleSignInNative();
}

// ---------------------------------------------------------------------------
// Account conflict detection
// ---------------------------------------------------------------------------

/**
 * Checks whether an email address is already registered with a different
 * sign-in provider. Used to surface a friendly error before sign-in fails.
 *
 * Returns the list of sign-in method strings or an empty array.
 */
export async function getSignInMethodsForEmail(email: string): Promise<string[]> {
  if (!isFirebaseConfigured || !auth) return [];
  try {
    return await fetchSignInMethodsForEmail(auth, email);
  } catch {
    return [];
  }
}

