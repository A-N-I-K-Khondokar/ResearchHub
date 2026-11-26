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
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}
