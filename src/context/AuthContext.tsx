/**
 * src/context/AuthContext.tsx
 *
 * Centralized authentication context for CSE Research Hub.
 *
 * Architecture:
 *  - Single `onAuthStateChanged` subscription owned by `AuthProvider`.
 *  - Firebase Auth user is the authoritative session source — no duplicate state.
 *  - Approval status is scaffolded as `not-configured` until Stage 3.3
 *    connects the Firestore user profile service.
 *  - Google Sign-In on native requires a custom development build.
 *
 * Usage:
 *   const { isAuthenticated, signInWithEmail, signOut } = useAuth();
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '@/config/firebase';
import {
  registerWithEmail,
  loginWithEmail,
  googleSignIn,
  signOut as serviceSignOut,
  sendVerificationEmail,
  reloadUser,
  resetPassword,
  mapFirebaseError,
} from '@/services/auth.service';
import type {
  AuthContextType,
  AuthState,
  ApprovalStatus,
  SignUpParams,
  SignInParams,
} from '@/types/auth.types';

// ---------------------------------------------------------------------------
// Context default (un-mounted guard)
// ---------------------------------------------------------------------------

const DEFAULT_STATE: AuthState = {
  firebaseUser: null,
  isLoading: true,
  isAuthenticated: false,
  emailVerified: false,
  approvalStatus: 'not-configured',
  authError: null,
};

const AuthContext = createContext<AuthContextType>({
  ...DEFAULT_STATE,
  signUpWithEmail: async () => {},
  signInWithEmail: async () => {},
  signInWithGoogle: async () => {},
  signOut: async () => {},
  sendVerificationEmail: async () => {},
  reloadCurrentUser: async () => {},
  sendPasswordReset: async () => {},
});

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [approvalStatus] = useState<ApprovalStatus>('not-configured');
  const [authError, setAuthError] = useState<{ code: string; message: string } | null>(null);

  // Guard against state updates after unmount
  const isMounted = useRef(true);
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Single onAuthStateChanged subscription
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      // Firebase not configured — immediately settle as signed out
      if (isMounted.current) setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        if (!isMounted.current) return;
        setFirebaseUser(user);
        setIsLoading(false);
        // Clear any stale auth errors when the session changes
        setAuthError(null);
      },
      (error) => {
        if (!isMounted.current) return;
        const mapped = mapFirebaseError(error);
        console.error('[AuthContext] onAuthStateChanged error:', mapped.code);
        setIsLoading(false);
        setAuthError(mapped);
      },
    );

    return unsubscribe; // cleanup on unmount
  }, []);

  // ---------------------------------------------------------------------------
  // Derived state
  // ---------------------------------------------------------------------------

  const isAuthenticated = firebaseUser !== null;
  const emailVerified = firebaseUser?.emailVerified ?? false;

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  const clearError = useCallback(() => {
    if (isMounted.current) setAuthError(null);
  }, []);

  const signUpWithEmail = useCallback(async (params: SignUpParams): Promise<void> => {
    clearError();
    try {
      await registerWithEmail(params);
      // onAuthStateChanged will update firebaseUser automatically.
    } catch (error) {
      const mapped = mapFirebaseError(error);
      if (isMounted.current) setAuthError(mapped);
      throw mapped;
    }
  }, [clearError]);

  const signInWithEmail = useCallback(async (params: SignInParams): Promise<void> => {
    clearError();
    try {
      await loginWithEmail(params);
      // onAuthStateChanged will update firebaseUser automatically.
    } catch (error) {
      const mapped = mapFirebaseError(error);
      if (isMounted.current) setAuthError(mapped);
      throw mapped;
    }
  }, [clearError]);

  const signInWithGoogle = useCallback(async (): Promise<void> => {
    clearError();
    try {
      await googleSignIn();
      // onAuthStateChanged will update firebaseUser automatically.
    } catch (error) {
      const mapped = mapFirebaseError(error);
      if (isMounted.current) setAuthError(mapped);
      throw mapped;
    }
  }, [clearError]);

  const signOut = useCallback(async (): Promise<void> => {
    clearError();
    try {
      await serviceSignOut();
      // onAuthStateChanged fires → sets firebaseUser = null automatically.
    } catch (error) {
      const mapped = mapFirebaseError(error);
      if (isMounted.current) setAuthError(mapped);
      throw mapped;
    }
  }, [clearError]);

  const sendVerificationEmailAction = useCallback(async (): Promise<void> => {
    if (!firebaseUser) return;
    clearError();
    try {
      await sendVerificationEmail(firebaseUser);
    } catch (error) {
      const mapped = mapFirebaseError(error);
      if (isMounted.current) setAuthError(mapped);
      throw mapped;
    }
  }, [firebaseUser, clearError]);

  const reloadCurrentUser = useCallback(async (): Promise<void> => {
    if (!firebaseUser) return;
    try {
      await reloadUser(firebaseUser);
      // After reload, force a local state refresh from the updated user object.
      if (isMounted.current) {
        // auth.currentUser now has updated emailVerified — trigger a re-render
        setFirebaseUser(auth.currentUser);
      }
    } catch (error) {
      const mapped = mapFirebaseError(error);
      if (isMounted.current) setAuthError(mapped);
      throw mapped;
    }
  }, [firebaseUser]);

  const sendPasswordReset = useCallback(async (email: string): Promise<void> => {
    clearError();
    try {
      await resetPassword(email);
    } catch (error) {
      const mapped = mapFirebaseError(error);
      if (isMounted.current) setAuthError(mapped);
      throw mapped;
    }
  }, [clearError]);

  // ---------------------------------------------------------------------------
  // Context value — memoised to prevent unnecessary re-renders
  // ---------------------------------------------------------------------------

  const value = useMemo<AuthContextType>(
    () => ({
      firebaseUser,
      isLoading,
      isAuthenticated,
      emailVerified,
      approvalStatus,
      authError,
      signUpWithEmail,
      signInWithEmail,
      signInWithGoogle,
      signOut,
      sendVerificationEmail: sendVerificationEmailAction,
      reloadCurrentUser,
      sendPasswordReset,
    }),
    [
      firebaseUser,
      isLoading,
      isAuthenticated,
      emailVerified,
      approvalStatus,
      authError,
      signUpWithEmail,
      signInWithEmail,
      signInWithGoogle,
      signOut,
      sendVerificationEmailAction,
      reloadCurrentUser,
      sendPasswordReset,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Access the authentication context.
 * Must be used within `<AuthProvider>`.
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;

