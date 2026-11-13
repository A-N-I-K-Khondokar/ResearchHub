import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, googleAuthProvider } from '../config/firebase';
import { isAuthorizedAdminEmail, ENV } from '../config/env';
import type { AdminAuthContextType, AdminRecord } from '../types/auth.types';

const AuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [adminRecord, setAdminRecord] = useState<AdminRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [setupRequired, setSetupRequired] = useState<boolean>(false);
  const [attemptedUserUid, setAttemptedUserUid] = useState<string | null>(null);
  const [attemptedUserEmail, setAttemptedUserEmail] = useState<string | null>(null);

  /**
   * Validates an authenticated Firebase user against Firestore /admins/{uid}
   */
  async function validateAdminDocument(firebaseUser: User): Promise<AdminRecord | null> {
    const userEmail = (firebaseUser.email || '').toLowerCase().trim();

    // 1. Check authorized administrator email allowlist
    if (!isAuthorizedAdminEmail(userEmail)) {
      throw new Error(
        `Unauthorized account: ${firebaseUser.email}. Only the configured administrator account (${ENV.adminEmail}) is permitted to access this portal.`
      );
    }

    // 2. Query Firestore /admins/{uid}
    try {
      const adminDocRef = doc(db, 'admins', firebaseUser.uid);
      const adminSnap = await getDoc(adminDocRef);

      if (!adminSnap.exists()) {
        setAttemptedUserUid(firebaseUser.uid);
        setAttemptedUserEmail(firebaseUser.email);
        setSetupRequired(true);
        throw new Error(
          `Administrator record missing: Your Google account (${firebaseUser.email}) is authenticated, but no administrator document was found at /admins/${firebaseUser.uid} in Cloud Firestore. Access denied until provisioned.`
        );
      }

      const data = adminSnap.data();
      const docEmail = (data.email || '').toLowerCase().trim();

      if (docEmail !== userEmail) {
        throw new Error(
          `Administrator email mismatch: The record in /admins/${firebaseUser.uid} lists "${data.email}", which does not match your signed-in identity "${firebaseUser.email}".`
        );
      }

      const record: AdminRecord = {
        uid: firebaseUser.uid,
        email: data.email,
        role: data.role || 'admin',
        addedAt: data.addedAt,
        addedBy: data.addedBy
      };

      setSetupRequired(false);
      return record;
    } catch (err: any) {
      if (err.code === 'permission-denied') {
        setAttemptedUserUid(firebaseUser.uid);
        setAttemptedUserEmail(firebaseUser.email);
        setSetupRequired(true);
        throw new Error(
          `Firestore permission denied: Your account is not authorized as an administrator. Document /admins/${firebaseUser.uid} must exist to grant admin privileges.`
        );
      }
      throw err;
    }
  }

  // Restore session on load via onAuthStateChanged
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      setError(null);

      if (!firebaseUser) {
        setUser(null);
        setAdminRecord(null);
        setLoading(false);
        return;
      }

      try {
        const record = await validateAdminDocument(firebaseUser);
        setUser(firebaseUser);
        setAdminRecord(record);
      } catch (err: any) {
        console.error('[AuthContext] Session validation failed:', err.message);
        setError(err.message || 'Authorization failed.');
        setUser(null);
        setAdminRecord(null);
        await signOut(auth).catch(() => {});
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setLoading(true);
    setError(null);
    setSetupRequired(false);
    setAttemptedUserUid(null);
    setAttemptedUserEmail(null);

    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      const record = await validateAdminDocument(result.user);
      setUser(result.user);
      setAdminRecord(record);
    } catch (err: any) {
      console.error('[AuthContext] Sign-in error:', err);
      // Clean up Firebase Auth state on failure
      await signOut(auth).catch(() => {});
      setUser(null);
      setAdminRecord(null);

      let msg = err.message || 'Authentication failed.';
      if (err.code === 'auth/popup-closed-by-user') {
        msg = 'Sign-in cancelled. The popup was closed before completing.';
      } else if (err.code === 'auth/popup-blocked') {
        msg = 'Sign-in popup was blocked by your browser. Please allow popups for this site.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      setUser(null);
      setAdminRecord(null);
      setError(null);
      setSetupRequired(false);
    } catch (err: any) {
      console.error('[AuthContext] Logout error:', err);
      setError(err.message || 'Logout failed.');
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
    setSetupRequired(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        adminRecord,
        loading,
        error,
        setupRequired,
        attemptedUserUid,
        attemptedUserEmail,
        signInWithGoogle,
        logout,
        clearError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AdminAuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

