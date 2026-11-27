/**
 * src/context/OnboardingContext.tsx
 *
 * Decides whether a newly approved researcher should see the first-run welcome
 * (src/app/(onboarding)). Shown once per account per device, only for accounts
 * approved within the last 30 days, so long-standing members aren't interrupted.
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { isOnboardingDone, markOnboardingDone } from '@/services/onboarding';

export type OnboardingStatus = 'loading' | 'needed' | 'done';

interface OnboardingContextValue {
  status: OnboardingStatus;
  /** Mark the welcome as finished (or skipped) for this account on this device. */
  complete: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextValue>({ status: 'done', complete: async () => {} });

const RECENT_APPROVAL_MS = 30 * 24 * 60 * 60 * 1000;

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { firebaseUser, userProfile } = useAuth();
  const uid = firebaseUser?.uid ?? null;
  const approved = userProfile?.approvalStatus === 'approved';
  const approvedAtMs = (userProfile as any)?.approvedAt?.toMillis?.() ?? null;
  const [status, setStatus] = useState<OnboardingStatus>('loading');

  useEffect(() => {
    let active = true;
    if (!uid || !approved) {
      setStatus('done');
      return;
    }
    const recentlyApproved = approvedAtMs === null || Date.now() - approvedAtMs < RECENT_APPROVAL_MS;
    if (!recentlyApproved) {
      setStatus('done');
      return;
    }
    setStatus('loading');
    isOnboardingDone(uid).then((done) => active && setStatus(done ? 'done' : 'needed'));
    return () => {
      active = false;
    };
  }, [uid, approved, approvedAtMs]);

  const complete = useCallback(async () => {
    if (uid) await markOnboardingDone(uid);
    setStatus('done');
  }, [uid]);

  const value = useMemo(() => ({ status, complete }), [status, complete]);
  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
};

export const useOnboarding = () => useContext(OnboardingContext);
