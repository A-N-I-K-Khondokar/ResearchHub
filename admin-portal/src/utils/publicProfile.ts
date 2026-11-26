/**
 * admin-portal/src/utils/publicProfile.ts
 *
 * Pure builder for the sanitised directory mirror at `public_profiles/{uid}`.
 * Deliberately excludes email, studentId and all review metadata.
 * The rules require every field to equal the approved `users/{uid}` document
 * as it will exist after the batch commits.
 *
 * An identical copy lives in `src/utils/publicProfile.ts` (mobile app)
 * — this portal is a separate Vite project; both are exercised by the emulator test suite.
 */

export interface PublicProfileSource {
  uid: string;
  displayName: string;
  photoURL?: string | null;
  department: string;
  program?: string | null;
  batch?: string | null;
  designation: string;
  bio?: string | null;
  researchInterests?: string[];
  socialLinks?: Record<string, string | undefined> | null;
}

export function buildPublicProfile(
  source: PublicProfileSource,
  timestamp: unknown,
): Record<string, unknown> {
  return {
    uid: source.uid,
    displayName: source.displayName,
    photoURL: source.photoURL ?? null,
    department: source.department,
    program: source.program ?? null,
    batch: source.batch ?? null,
    designation: source.designation,
    bio: source.bio ?? null,
    researchInterests: Array.isArray(source.researchInterests) ? source.researchInterests : [],
    socialLinks: source.socialLinks ?? {},
    updatedAt: timestamp,
  };
}
