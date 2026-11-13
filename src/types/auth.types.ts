/**
 * src/types/auth.types.ts
 *
 * Authentication and account lifecycle types for CSE Research Hub.
 * These types define the full auth state machine across all stages.
 *
 * Stage 3.2: Auth identity (Firebase Auth) + approval lifecycle scaffold.
 * Stage 3.3: Firestore user profile + actual admin approval mechanism.
 */

import type { User } from 'firebase/auth';
import type { ApprovalStatus, UserProfile } from './user.types';

export type { ApprovalStatus };

// ---------------------------------------------------------------------------
// Access State Model (Client-side Session & Onboarding Lifecycle)
// ---------------------------------------------------------------------------

/**
 * Authoritative high-level access state representing the user's current session & onboarding phase.
 * Derived from Firebase Authentication identity and the Cloud Firestore `users/{uid}` document.
 */
export type AccessState =
  | 'unauthenticated'
  | 'email-unverified'
  | 'profile-loading'
  | 'profile-required'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'suspended'
  | 'profile-error';

// ---------------------------------------------------------------------------
// Auth error types
// ---------------------------------------------------------------------------

export interface AuthError {
  code: string;
  message: string;
}

// ---------------------------------------------------------------------------
// AuthContext state
// ---------------------------------------------------------------------------

export interface AuthState {
  /** The raw Firebase Auth user object. `null` = signed out. */
  firebaseUser: User | null;

  /** Authoritative Firestore user profile document from `users/{uid}`. `null` if no profile exists or unauthenticated. */
  userProfile: UserProfile | null;

  /** `true` while the initial auth observer or profile subscription is loading. */
  isLoading: boolean;

  /** `true` specifically while the Firestore profile subscription is actively resolving. */
  isProfileLoading: boolean;

  /** `true` when `firebaseUser` is non-null. */
  isAuthenticated: boolean;

  /**
   * Whether the authenticated user has verified their email address.
   * Always `false` when `isAuthenticated` is `false`.
   * Always `true` for Google sign-in accounts (Google verifies email ownership).
   */
  emailVerified: boolean;

  /**
   * Account approval status from the authoritative Firestore user profile document.
   * `null` when user profile is not loaded or does not exist.
   *
   * Protected research features MUST NOT be accessible unless this is `approved`.
   */
  approvalStatus: ApprovalStatus | null;

  /**
   * Authoritative client-side access state derived from Firebase Auth & Firestore profile.
   */
  accessState: AccessState;

  /** Most recent authentication error, if any. `null` when there is no error. */
  authError: AuthError | null;

  /** Error encountered while subscribing to or fetching user profile, if any. */
  profileError: Error | null;
}

// ---------------------------------------------------------------------------
// AuthContext actions
// ---------------------------------------------------------------------------

export interface AuthActions {
  /** Register a new account with email and password. */
  signUpWithEmail: (params: SignUpParams) => Promise<void>;

  /** Sign in with an existing email/password account. */
  signInWithEmail: (params: SignInParams) => Promise<void>;

  /**
   * Initiate Google Sign-In.
   * - Web: popup flow via Firebase `signInWithPopup`.
   * - iOS/Android: OAuth via `expo-auth-session` + `signInWithCredential`.
   */
  signInWithGoogle: () => Promise<void>;

  /** Sign out the current user and clear auth state. */
  signOut: () => Promise<void>;

  /** Send (or re-send) the email verification message to the current user. */
  sendVerificationEmail: () => Promise<void>;

  /**
   * Reload the current Firebase user from the server.
   * Use after the user taps "I've verified my email" to refresh `emailVerified`.
   */
  reloadCurrentUser: () => Promise<void>;

  /** Send a password-reset email. Never reveals whether the address is registered. */
  sendPasswordReset: (email: string) => Promise<void>;
}

// ---------------------------------------------------------------------------
// Parameter types for actions
// ---------------------------------------------------------------------------

export interface SignUpParams {
  fullName: string;
  email: string;
  password: string;
  department?: string;
  batch?: string;
}

export interface SignInParams {
  email: string;
  password: string;
}

// ---------------------------------------------------------------------------
// Combined context type
// ---------------------------------------------------------------------------

export type AuthContextType = AuthState & AuthActions;

