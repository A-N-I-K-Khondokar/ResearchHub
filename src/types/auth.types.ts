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

// ---------------------------------------------------------------------------
// Account approval lifecycle
// ---------------------------------------------------------------------------

/**
 * Approval status for a registered CSE Research Hub account.
 *
 * The authoritative source will be a server-side Firestore user profile
 * document (Stage 3.3). Until then, the status is `not-configured`.
 *
 * IMPORTANT: This value is NEVER determined client-side. It must come from
 * a trusted server-side source verified by Firebase Security Rules.
 */
export type ApprovalStatus =
  | 'not-configured' // Stage 3.2 placeholder — Firestore not yet integrated
  | 'pending'        // Account created; awaiting App Admin review
  | 'approved'       // App Admin has explicitly approved this account
  | 'rejected'       // App Admin has rejected this account
  | 'suspended';     // Previously approved account; access revoked

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

  /** `true` while the initial `onAuthStateChanged` callback has not yet fired. */
  isLoading: boolean;

  /** `true` when `firebaseUser` is non-null. */
  isAuthenticated: boolean;

  /**
   * Whether the authenticated user has verified their email address.
   * Always `false` when `isAuthenticated` is `false`.
   * Always `true` for Google sign-in accounts (Google verifies email ownership).
   */
  emailVerified: boolean;

  /**
   * Account approval status from the trusted Firestore profile service.
   * `not-configured` during Stage 3.2 until Stage 3.3 connects Firestore.
   *
   * Protected research features MUST NOT be accessible unless this is `approved`.
   */
  approvalStatus: ApprovalStatus;

  /** Most recent authentication error, if any. `null` when there is no error. */
  authError: AuthError | null;
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

