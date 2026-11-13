import type { User } from 'firebase/auth';

export interface AdminRecord {
  uid: string;
  email: string;
  role?: string;
  addedAt?: any;
  addedBy?: string;
}

export interface AdminAuthContextType {
  user: User | null;
  adminRecord: AdminRecord | null;
  loading: boolean;
  error: string | null;
  setupRequired: boolean;
  attemptedUserUid?: string | null;
  attemptedUserEmail?: string | null;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

