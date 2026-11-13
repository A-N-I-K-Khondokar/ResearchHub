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
import { subscribeUserProfile } from '@/services/user.service';
import type { UserProfile } from '@/types/user.types';
import type {
  AuthContextType,
  AuthState,
  ApprovalStatus,
  AccessState,
  SignUpParams,
  SignInParams,
} from '@/types/auth.types';

// ---------------------------------------------------------------------------
// Context default (un-mounted guard)
// ---------------------------------------------------------------------------

const DEFAULT_STATE: AuthState = {
  firebaseUser: null,
  userProfile: null,
  isLoading: true,
  isProfileLoading: false,
  isAuthenticated: false,
  emailVerified: false,
  approvalStatus: null,
  accessState: 'unauthenticated',
  authError: null,
  profileError: null,
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
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [authError, setAuthError] = useState<{ code: string; message: string } | null>(null);
  const [profileError, setProfileError] = useState<Error | null>(null);

  // References for active Firestore profile subscription & stale snapshot prevention
  const profileUnsubscribeRef = useRef<(() => void) | null>(null);
  const activeSubscribedUidRef = useRef<string | null>(null);

  // Guard against state updates after unmount
  const isMounted = useRef(true);
  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (profileUnsubscribeRef.current) {
        profileUnsubscribeRef.current();
        profileUnsubscribeRef.current = null;
      }
      activeSubscribedUidRef.current = null;
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Single onAuthStateChanged subscription (Identity & Session Persistence)
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
  // Firestore Profile Subscription (Authoritative Onboarding & Approval State)
  // ---------------------------------------------------------------------------

  useEffect(() => {
    // 1. Guard: If no user or email is unverified, do not subscribe
    if (!firebaseUser || !firebaseUser.emailVerified) {
      if (profileUnsubscribeRef.current) {
        profileUnsubscribeRef.current();
        profileUnsubscribeRef.current = null;
      }
      activeSubscribedUidRef.current = null;
      if (isMounted.current) {
        setUserProfile(null);
        setIsProfileLoading(false);
        setProfileError(null);
      }
      return;
    }

    const currentUid = firebaseUser.uid;

    // 2. Unsubscribe previous listener if UID changed
    if (profileUnsubscribeRef.current && activeSubscribedUidRef.current !== currentUid) {
      profileUnsubscribeRef.current();
      profileUnsubscribeRef.current = null;
    }

    // 3. Mark profile loading and register listener for current verified UID
    activeSubscribedUidRef.current = currentUid;
    if (isMounted.current) {
      setIsProfileLoading(true);
      setProfileError(null);
    }

    const unsubscribe = subscribeUserProfile(
      currentUid,
      (profile) => {
        if (!isMounted.current) return;
        // Stale snapshot guard: Ensure snapshot matches active subscribed UID
        if (activeSubscribedUidRef.current !== currentUid) return;

        setUserProfile(profile);
        setIsProfileLoading(false);
        setProfileError(null);
      },
      (error) => {
        if (!isMounted.current) return;
        // Stale error guard: Ensure error matches active subscribed UID
        if (activeSubscribedUidRef.current !== currentUid) return;

        console.error(`[AuthContext] Profile subscription error for ${currentUid}:`, error);
        setProfileError(error);
        setIsProfileLoading(false);
      },
    );

    profileUnsubscribeRef.current = unsubscribe;

    return () => {
      if (profileUnsubscribeRef.current) {
        profileUnsubscribeRef.current();
        profileUnsubscribeRef.current = null;
      }
      activeSubscribedUidRef.current = null;
    };
  }, [firebaseUser?.uid, firebaseUser?.emailVerified]);

  // ---------------------------------------------------------------------------
  // Derived state & Access State Model
  // ---------------------------------------------------------------------------

  const isAuthenticated = firebaseUser !== null;
  const emailVerified = firebaseUser?.emailVerified ?? false;
  const approvalStatus: ApprovalStatus | null = userProfile?.approvalStatus ?? null;

  const accessState = useMemo<AccessState>(() => {
    if (!firebaseUser) {
      return 'unauthenticated';
    }
    if (!emailVerified) {
      return 'email-unverified';
    }
    if (profileError) {
      return 'profile-error';
    }
    if (isProfileLoading) {
      return 'profile-loading';
    }
    if (!userProfile) {
      return 'profile-required';
    }
    switch (userProfile.approvalStatus) {
      case 'approved':
        return 'approved';
      case 'pending':
        return 'pending';
      case 'rejected':
        return 'rejected';
      case 'suspended':
        return 'suspended';
      default:
        return 'pending';
    }
  }, [firebaseUser, emailVerified, profileError, isProfileLoading, userProfile]);

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
    if (profileUnsubscribeRef.current) {
      profileUnsubscribeRef.current();
      profileUnsubscribeRef.current = null;
    }
    activeSubscribedUidRef.current = null;
    if (isMounted.current) {
      setUserProfile(null);
      setIsProfileLoading(false);
      setProfileError(null);
    }
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
      if (isMounted.current && auth) {
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
      userProfile,
      isLoading,
      isProfileLoading,
      isAuthenticated,
      emailVerified,
      approvalStatus,
      accessState,
      authError,
      profileError,
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
      userProfile,
      isLoading,
      isProfileLoading,
      isAuthenticated,
      emailVerified,
      approvalStatus,
      accessState,
      authError,
      profileError,
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

