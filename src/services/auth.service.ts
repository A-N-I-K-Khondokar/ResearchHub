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
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';
import { auth, isFirebaseConfigured } from '@/config/firebase';
import type { SignUpParams, SignInParams, AuthError } from '@/types/auth.types';

// Allow expo-web-browser to handle OAuth redirect on mobile
WebBrowser.maybeCompleteAuthSession();

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
// Uses expo-auth-session to perform an OAuth PKCE flow through the
// Google authorization endpoint, then exchanges the ID token with Firebase.
//
// IMPORTANT: This flow does NOT work in Expo Go because Expo Go cannot
// handle the custom URL scheme redirect (`cseresearchhub://`).
// A development build (EAS Build) is required.
//
// Required manual configuration — see Section F of the Stage 3.2 report.
// ---------------------------------------------------------------------------

async function googleSignInNative(): Promise<User> {
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

  if (!webClientId) {
    throw {
      code: 'google/client-id-missing',
      message:
        'Google Sign-In is not configured. Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in your .env file.\n' +
        'See the Stage 3.2 OAuth Configuration Guide for instructions.',
    } satisfies AuthError;
  }

  // Generate PKCE code verifier and challenge
  const codeVerifier = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    Math.random().toString(36) + Date.now().toString(36),
  );

  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'cseresearchhub',
    path: 'auth/google',
  });

  const discovery = {
    authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenEndpoint: 'https://oauth2.googleapis.com/token',
  };

  const request = new AuthSession.AuthRequest({
    clientId: webClientId,
    scopes: ['openid', 'profile', 'email'],
    redirectUri,
    usePKCE: true,
    codeChallenge: codeVerifier,
    codeChallengeMethod: AuthSession.CodeChallengeMethod.Plain,
  });

  const result = await request.promptAsync(discovery, {
    showInRecents: true,
  });

  if (result.type === 'cancel' || result.type === 'dismiss') {
    throw {
      code: 'auth/popup-closed-by-user',
      message: 'Google Sign-In was cancelled.',
    } satisfies AuthError;
  }

  if (result.type === 'error') {
    throw {
      code: 'google/oauth-error',
      message: result.error?.message ?? 'Google Sign-In failed. Please try again.',
    } satisfies AuthError;
  }

  if (result.type !== 'success' || !result.params.code) {
    throw {
      code: 'google/no-auth-code',
      message: 'Google Sign-In did not return an authorization code.',
    } satisfies AuthError;
  }

  // Exchange authorization code for tokens using PKCE
  const tokenResponse = await fetch(discovery.tokenEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code: result.params.code,
      client_id: webClientId,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
      code_verifier: request.codeVerifier ?? codeVerifier,
    }).toString(),
  });

  if (!tokenResponse.ok) {
    throw {
      code: 'google/token-exchange-failed',
      message: 'Failed to exchange Google authorization code for tokens.',
    } satisfies AuthError;
  }

  const tokens = await tokenResponse.json() as { id_token?: string };

  if (!tokens.id_token) {
    throw {
      code: 'google/no-id-token',
      message: 'Google did not return an ID token. Verify your OAuth client configuration.',
    } satisfies AuthError;
  }

  // Exchange the Google ID token for a Firebase credential
  const googleCredential = GoogleAuthProvider.credential(tokens.id_token);
  const firebaseResult = await signInWithCredential(auth, googleCredential);
  return firebaseResult.user;
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

