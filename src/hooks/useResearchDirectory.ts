/**
 * src/hooks/useResearchDirectory.ts
 *
 * Live discovery data shared by Home, Explore, search and topic pages:
 *  - approved researcher profiles (excluding the signed-in user)
 *  - the latest published research work
 * Mapped onto the UI card types so the existing components render unchanged.
 */

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { subscribeApprovedResearchers } from '@/services/user.service';
import { subscribePublishedFeed, toCurrentWork } from '@/services/research.service';
import type { UserProfile as FirestoreProfile } from '@/types/user.types';
import type { UserProfile as CardProfile, CurrentWork } from '@/types';
import type { ResearchWork } from '@/types/research.types';

export const DIRECTORY_WORK_LIMIT = 50;

/** Maps a Firestore profile to the card shape. Email/student ID are deliberately omitted. */
export function toCardProfile(p: FirestoreProfile, latestWorkId?: string): CardProfile {
  return {
    id: p.uid,
    name: p.displayName || 'CSE Researcher',
    email: '',
    department: p.department,
    batch: p.batch ?? undefined,
    designation: p.designation,
    bio: p.bio ?? undefined,
    photoURL: p.photoURL ?? null,
    interests: p.researchInterests,
    researchInterests: p.researchInterests,
    currentWorkIds: latestWorkId ? [latestWorkId] : [],
    googleScholarURL: p.socialLinks?.googleScholar,
    researchGateURL: p.socialLinks?.researchGate,
    githubURL: p.socialLinks?.github,
    websiteURL: p.socialLinks?.website,
  };
}

export function useResearchDirectory() {
  const { userProfile } = useAuth();
  const myUid = userProfile?.uid ?? '';
  const enabled = userProfile?.approvalStatus === 'approved';

  const [profiles, setProfiles] = useState<FirestoreProfile[]>([]);
  const [works, setWorks] = useState<ResearchWork[]>([]);
  const [loadingPeople, setLoadingPeople] = useState(true);
  const [loadingWorks, setLoadingWorks] = useState(true);
  const [error, setError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    setLoadingPeople(true);
    return subscribeApprovedResearchers(
      (list) => {
        setProfiles(list);
        setLoadingPeople(false);
      },
      () => {
        setLoadingPeople(false);
        setError(true);
      },
    );
  }, [enabled, refreshKey]);

  useEffect(() => {
    if (!enabled) return;
    setLoadingWorks(true);
    return subscribePublishedFeed(
      (list) => {
        setWorks(list);
        setLoadingWorks(false);
      },
      () => {
        setLoadingWorks(false);
        setError(true);
      },
      DIRECTORY_WORK_LIMIT,
    );
  }, [enabled, refreshKey]);

  const value = useMemo(() => {
    const otherProfiles = profiles.filter((p) => p.uid !== myUid);
    const latestWorkByAuthor = new Map<string, ResearchWork>();
    works.forEach((w) => {
      if (!latestWorkByAuthor.has(w.authorUid)) latestWorkByAuthor.set(w.authorUid, w);
    });
    const currentWorks: CurrentWork[] = works.map(toCurrentWork);
    const workById = new Map(works.map((w) => [w.id, w] as const));
    const profileByUid = new Map(profiles.map((p) => [p.uid, p] as const));
    const researchers: CardProfile[] = otherProfiles.map((p) =>
      toCardProfile(p, latestWorkByAuthor.get(p.uid)?.id),
    );
    return {
      profiles: otherProfiles,
      researchers,
      works,
      currentWorks,
      workById,
      profileByUid,
      latestWorkByAuthor,
    };
  }, [profiles, works, myUid]);

  return {
    ...value,
    loading: loadingPeople || loadingWorks,
    error,
    refresh: () => {
      setError(false);
      setRefreshKey((k) => k + 1);
    },
  };
}
