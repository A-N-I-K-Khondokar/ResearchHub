/**
 * src/utils/researchWork.ts
 *
 * Pure builder for `research_works/{workId}` documents.
 *
 * Free of React Native / Firebase runtime imports so the Firestore emulator
 * test suite can exercise the exact payload `research.service.ts` writes.
 * `timestamp` is the `serverTimestamp()` sentinel supplied by the caller.
 */

import type { CreateResearchWorkInput } from '@/types/research.types';

/** Author snapshot source — the approved user's `users/{uid}` profile. */
export interface ResearchAuthorSnapshot {
  uid: string;
  displayName: string;
  photoURL?: string | null;
  department: string;
  designation: string;
}

/** Formats free text into a `#CamelTag` (strips leading '#', removes spaces). */
export function formatResearchTag(raw: string): string {
  const cleaned = raw.replace(/^[#\s]+/, '').replace(/\s+/g, '').trim();
  return cleaned ? `#${cleaned}` : '';
}

/** Case-insensitive, whitespace/#-insensitive key for matching tags to topics. */
export function tagMatchKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/** Normalises a list of tags/roles: #CamelCase, no duplicates, capped. */
export function normalizeTagList(raw: string[] | undefined, max: number): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of raw ?? []) {
    const tag = formatResearchTag(item);
    const key = tag.toLowerCase();
    if (tag && !seen.has(key)) {
      seen.add(key);
      out.push(tag);
    }
  }
  return out.slice(0, max);
}

export interface ResearchWorkEditInput {
  title: string;
  description: string;
  tags: string[];
  stage: CreateResearchWorkInput['stage'];
  externalUrl?: string | null;
  /** Collaboration posts only. */
  lookingFor?: string[];
}

/**
 * Author edit of an existing post. Only content fields the rules allow
 * (title, description, tags, stage, externalUrl, lookingFor, updatedAt);
 * author snapshot, postType, team and createdAt are never touched.
 */
export function buildResearchWorkUpdate(
  input: ResearchWorkEditInput,
  isCollaboration: boolean,
  timestamp: unknown,
): Record<string, unknown> {
  const url = input.externalUrl?.trim();
  return {
    title: input.title.trim(),
    description: input.description.trim(),
    tags: normalizeTagList(input.tags, 10),
    stage: input.stage,
    externalUrl: url ? url : null,
    ...(isCollaboration ? { lookingFor: normalizeTagList(input.lookingFor, 10) } : {}),
    updatedAt: timestamp,
  };
}

export function buildResearchWorkDocument(
  author: ResearchAuthorSnapshot,
  input: CreateResearchWorkInput,
  timestamp: unknown,
): Record<string, unknown> {
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const raw of input.tags ?? []) {
    const tag = formatResearchTag(raw);
    const key = tag.toLowerCase();
    if (tag && !seen.has(key)) {
      seen.add(key);
      tags.push(tag);
    }
  }

  const url = input.externalUrl?.trim();

  // Collaboration-only fields are written ONLY for collaboration posts, so plain
  // "work" posts keep the original document shape (backward compatible).
  const collaboration: Record<string, unknown> = {};
  if (input.postType === 'collaboration') {
    const seenRoles = new Set<string>();
    const lookingFor: string[] = [];
    for (const raw of input.lookingFor ?? []) {
      const role = formatResearchTag(raw);
      const key = role.toLowerCase();
      if (role && !seenRoles.has(key)) {
        seenRoles.add(key);
        lookingFor.push(role);
      }
    }
    collaboration.postType = 'collaboration';
    collaboration.lookingFor = lookingFor.slice(0, 10);
    collaboration.collabStatus = 'open';
  }

  return {
    authorUid: author.uid,
    authorName: author.displayName,
    authorPhotoURL: author.photoURL ?? null,
    authorDepartment: author.department,
    authorDesignation: author.designation,
    title: input.title.trim(),
    description: input.description.trim(),
    tags: tags.slice(0, 10),
    stage: input.stage,
    externalUrl: url ? url : null,
    status: input.status ?? 'published',
    ...collaboration,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}
