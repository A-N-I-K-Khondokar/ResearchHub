/**
 * src/types/research.types.ts
 *
 * Cloud Firestore data model for shared research work (`research_works/{workId}`).
 *
 * The UI-facing `CurrentWork` type in `src/types/index.ts` is still what the
 * existing cards render; `research.service.ts` maps this persisted model onto it.
 */

import type { Timestamp } from 'firebase/firestore';

/** Project progression stages offered by the Share Current Work screen. */
export const RESEARCH_STAGE_IDS = ['Idea', 'Literature Review', 'Experiment', 'Writing'] as const;

/** Common roles people look for in collaboration posts. */
export const SUGGESTED_COLLAB_ROLES = [
  '#MLEngineer',
  '#DataAnnotation',
  '#BackendDeveloper',
  '#FrontendDeveloper',
  '#UIUXDesigner',
  '#ResearchWriter',
  '#Statistician',
  '#HardwareEngineer',
];
export type ResearchStage = (typeof RESEARCH_STAGE_IDS)[number];

/**
 * `published` — visible to every approved researcher.
 * `draft`     — visible only to the author (and administrators).
 */
export type ResearchWorkStatus = 'published' | 'draft';

/**
 * `work`          — sharing current research (default; legacy docs have no field).
 * `collaboration` — looking for collaborators; carries `lookingFor` skills/roles.
 */
export type ResearchPostType = 'work' | 'collaboration';

/** Persisted document at `research_works/{workId}`. */
export interface ResearchWork {
  id: string;

  /** Firebase Auth UID of the author (immutable). */
  authorUid: string;

  /**
   * Author snapshot copied from `users/{authorUid}` at creation time so the feed
   * needs no per-card profile reads. Validated against the profile by the rules.
   */
  authorName: string;
  authorPhotoURL: string | null;
  authorDepartment: string;
  authorDesignation: string;

  title: string;
  description: string;
  /** Hashtag-style topic tags, e.g. `#MachineLearning` (max 10). */
  tags: string[];
  stage: ResearchStage;
  externalUrl: string | null;
  status: ResearchWorkStatus;

  /** Post kind; documents written before this field existed are `work`. */
  postType: ResearchPostType;
  /** Skills / roles wanted (collaboration posts only, max 10), e.g. `#BackendDeveloper`. */
  lookingFor: string[];
  /** Collaboration lifecycle: 'open' accepts applications; 'closed' = team formed. */
  collabStatus: 'open' | 'closed';
  /** Accepted collaborators (author-managed, max 20). */
  team: { uid: string; displayName: string; photoURL: string | null; role: string }[];

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/** User-supplied fields when sharing a new piece of work. */
export interface CreateResearchWorkInput {
  title: string;
  description: string;
  tags: string[];
  stage: ResearchStage;
  externalUrl?: string | null;
  status?: ResearchWorkStatus;
  postType?: ResearchPostType;
  lookingFor?: string[];
}

/** Validation limits shared by the UI, the payload builder and the rules. */
export const RESEARCH_LIMITS = {
  titleMin: 3,
  titleMax: 200,
  descriptionMin: 20,
  descriptionMax: 5000,
  tagsMax: 10,
  tagMax: 40,
  urlMax: 500,
  lookingForMax: 10,
} as const;
