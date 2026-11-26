import { mockTopics } from '@/data';
import { UserProfile, CurrentWork, ResearchPublication, Topic } from '@/types';
import { tagMatchKey } from '@/utils/researchWork';

export type SearchCategory = 'all' | 'people' | 'currentWork' | 'publications' | 'topics';

export interface SearchResults {
  query: string;
  people: UserProfile[];
  currentWork: CurrentWork[];
  publications: ResearchPublication[];
  topics: Topic[];
  totalCount: number;
}

/**
 * Live data the search operates on (loaded once by `useResearchDirectory`).
 * Search runs locally on the device — no external search service.
 */
export interface SearchDataset {
  researchers: UserProfile[];
  works: CurrentWork[];
  publications?: ResearchPublication[];
}

/** Static CSE topic taxonomy used for chips and topic pages. */
export const TOPIC_TAXONOMY: Topic[] = mockTopics;

const includes = (value: string | undefined | null, q: string) =>
  Boolean(value && value.toLowerCase().includes(q));

/** True when a tag / interest list mentions the topic (ignores '#', spaces, case). */
export function matchesTopic(values: string[] | undefined, topicName: string): boolean {
  const key = tagMatchKey(topicName);
  return (values || []).some((v) => tagMatchKey(v) === key);
}

/**
 * Searches across researchers, current work, publications, and topics.
 * Deterministic, case-insensitive, local multi-field search.
 */
export function searchHub(
  query: string,
  category: SearchCategory = 'all',
  data: SearchDataset = { researchers: [], works: [] },
): SearchResults {
  const cleanQuery = query.trim().toLowerCase();

  if (!cleanQuery) {
    return { query: '', people: [], currentWork: [], publications: [], topics: [], totalCount: 0 };
  }

  const tagQuery = tagMatchKey(cleanQuery);

  const people = category === 'all' || category === 'people'
    ? data.researchers.filter((r) =>
        includes(r.name, cleanQuery) ||
        includes(r.bio, cleanQuery) ||
        includes(r.department, cleanQuery) ||
        includes(r.designation, cleanQuery) ||
        includes(r.batch, cleanQuery) ||
        (r.interests || []).some((i) => includes(i, cleanQuery) || (tagQuery && tagMatchKey(i).includes(tagQuery))),
      )
    : [];

  const currentWork = category === 'all' || category === 'currentWork'
    ? data.works.filter((w) =>
        includes(w.title, cleanQuery) ||
        includes(w.description, cleanQuery) ||
        includes(w.authorName, cleanQuery) ||
        includes(w.stage, cleanQuery) ||
        (w.topics || []).some((t) => includes(t, cleanQuery) || (tagQuery && tagMatchKey(t).includes(tagQuery))),
      )
    : [];

  const publications = category === 'all' || category === 'publications'
    ? (data.publications || []).filter((p) =>
        includes(p.title, cleanQuery) ||
        includes(p.overview || p.abstract, cleanQuery) ||
        includes(p.venue, cleanQuery) ||
        includes(p.authorName, cleanQuery) ||
        (p.topics || []).some((t) => includes(t, cleanQuery)),
      )
    : [];

  const topics = category === 'all' || category === 'topics'
    ? TOPIC_TAXONOMY.filter((t) =>
        includes(t.name, cleanQuery) ||
        includes(t.slug, cleanQuery) ||
        includes(t.category, cleanQuery) ||
        includes(t.description, cleanQuery),
      )
    : [];

  return {
    query,
    people,
    currentWork,
    publications,
    topics,
    totalCount: people.length + currentWork.length + publications.length + topics.length,
  };
}

/** Live researcher / work counts per topic, computed from the loaded dataset. */
export function topicCounts(topic: Topic, data: SearchDataset): Topic {
  const researchersCount = data.researchers.filter((r) => matchesTopic(r.interests, topic.name)).length;
  const currentWorkCount = data.works.filter((w) => matchesTopic(w.topics, topic.name)).length;
  return { ...topic, researchersCount, currentWorkCount, activeCount: currentWorkCount };
}

/**
 * Aggregates researchers and active work associated with a specific research topic.
 * Powers "Who's Working On This?"
 */
export function getTopicDiscovery(topicSlugOrName: string, data: SearchDataset) {
  const cleanTarget = topicSlugOrName.trim().toLowerCase();
  const targetKey = tagMatchKey(topicSlugOrName);

  const matchedTopic: Topic = TOPIC_TAXONOMY.find(
    (t) =>
      t.name.toLowerCase() === cleanTarget ||
      t.slug.toLowerCase() === cleanTarget ||
      t.id.toLowerCase() === cleanTarget ||
      tagMatchKey(t.name) === targetKey,
  ) || {
    id: `topic-${cleanTarget.replace(/\s+/g, '-')}`,
    name: topicSlugOrName.replace(/^#/, ''),
    slug: cleanTarget.replace(/\s+/g, '-'),
    category: 'Computer Science',
    researchersCount: 0,
    currentWorkCount: 0,
    description: `Researchers and projects in ${topicSlugOrName}.`,
  };

  const currentWorks = data.works.filter((w) => matchesTopic(w.topics, matchedTopic.name));
  const workAuthorIds = new Set(currentWorks.map((w) => w.userId));

  // Researchers who list the topic as an interest OR have shared work tagged with it
  const researchers = data.researchers.filter(
    (r) => matchesTopic(r.interests, matchedTopic.name) || workAuthorIds.has(r.id),
  );

  const publications = (data.publications || []).filter((p) => matchesTopic(p.topics, matchedTopic.name));

  return {
    topic: topicCounts(matchedTopic, data),
    researchers,
    currentWorks,
    publications,
  };
}
