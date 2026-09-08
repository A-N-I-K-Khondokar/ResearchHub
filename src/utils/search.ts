import {
  mockResearchers,
  mockCurrentWorks,
  mockPublications,
  mockTopics,
  activeUser,
} from '@/data';
import { UserProfile, CurrentWork, ResearchPublication, Topic } from '@/types';

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
 * Searches across researchers, current work, publications, and topics.
 * Deterministic, case-insensitive, local multi-field search.
 */
export function searchHub(query: string, category: SearchCategory = 'all'): SearchResults {
  const cleanQuery = query.trim().toLowerCase();

  if (!cleanQuery) {
    return {
      query: '',
      people: [],
      currentWork: [],
      publications: [],
      topics: [],
      totalCount: 0,
    };
  }

  const allResearchers = [activeUser, ...mockResearchers];

  // 1. Search People (Researchers)
  const matchingPeople = category === 'all' || category === 'people'
    ? allResearchers.filter((r) => {
        const nameMatch = r.name.toLowerCase().includes(cleanQuery);
        const bioMatch = r.bio ? r.bio.toLowerCase().includes(cleanQuery) : false;
        const deptMatch = r.department.toLowerCase().includes(cleanQuery);
        const batchMatch = r.batch ? r.batch.toLowerCase().includes(cleanQuery) : false;
        const interestMatch = (r.interests || []).some((i) => i.toLowerCase().includes(cleanQuery));
        return nameMatch || bioMatch || deptMatch || batchMatch || interestMatch;
      })
    : [];

  // 2. Search Current Work
  const matchingCurrentWork = category === 'all' || category === 'currentWork'
    ? mockCurrentWorks.filter((w) => {
        const titleMatch = w.title.toLowerCase().includes(cleanQuery);
        const descMatch = w.description.toLowerCase().includes(cleanQuery);
        const authorMatch = w.authorName.toLowerCase().includes(cleanQuery);
        const topicMatch = (w.topics || []).some((t) => t.toLowerCase().includes(cleanQuery));
        const stageMatch = w.stage ? w.stage.toLowerCase().includes(cleanQuery) : false;
        return titleMatch || descMatch || authorMatch || topicMatch || stageMatch;
      })
    : [];

  // 3. Search Publications
  const matchingPublications = category === 'all' || category === 'publications'
    ? mockPublications.filter((p) => {
        const titleMatch = p.title.toLowerCase().includes(cleanQuery);
        const overviewMatch = (p.overview || p.abstract || '').toLowerCase().includes(cleanQuery);
        const venueMatch = p.venue.toLowerCase().includes(cleanQuery);
        const authorMatch = p.authorName.toLowerCase().includes(cleanQuery);
        const coAuthorMatch = (p.coAuthors || []).some((a) => a.toLowerCase().includes(cleanQuery));
        const topicMatch = (p.topics || []).some((t) => t.toLowerCase().includes(cleanQuery));
        return titleMatch || overviewMatch || venueMatch || authorMatch || coAuthorMatch || topicMatch;
      })
    : [];

  // 4. Search Topics
  const matchingTopics = category === 'all' || category === 'topics'
    ? mockTopics.filter((t) => {
        const nameMatch = t.name.toLowerCase().includes(cleanQuery);
        const slugMatch = t.slug.toLowerCase().includes(cleanQuery);
        const catMatch = t.category.toLowerCase().includes(cleanQuery);
        const descMatch = t.description ? t.description.toLowerCase().includes(cleanQuery) : false;
        return nameMatch || slugMatch || catMatch || descMatch;
      })
    : [];

  const totalCount =
    matchingPeople.length +
    matchingCurrentWork.length +
    matchingPublications.length +
    matchingTopics.length;

  return {
    query,
    people: matchingPeople,
    currentWork: matchingCurrentWork,
    publications: matchingPublications,
    topics: matchingTopics,
    totalCount,
  };
}

/**
 * Aggregates researchers and active work associated with a specific research topic.
 * Powers "Who's Working On This?"
 */
export function getTopicDiscovery(topicSlugOrName: string) {
  const cleanTarget = topicSlugOrName.trim().toLowerCase();

  const matchedTopic = mockTopics.find(
    (t) => t.name.toLowerCase() === cleanTarget || t.slug.toLowerCase() === cleanTarget || t.id.toLowerCase() === cleanTarget
  ) || {
    id: `topic-${cleanTarget.replace(/\s+/g, '-')}`,
    name: topicSlugOrName,
    slug: cleanTarget.replace(/\s+/g, '-'),
    category: 'Computer Science',
    researchersCount: 0,
    currentWorkCount: 0,
    description: `Researchers and projects in ${topicSlugOrName}.`,
  };

  const allResearchers = [activeUser, ...mockResearchers];

  const researchers = allResearchers.filter((r) =>
    (r.interests || []).some((i) => i.toLowerCase() === matchedTopic.name.toLowerCase())
  );

  const currentWorks = mockCurrentWorks.filter((w) =>
    (w.topics || []).some((t) => t.toLowerCase() === matchedTopic.name.toLowerCase())
  );

  const publications = mockPublications.filter((p) =>
    (p.topics || []).some((t) => t.toLowerCase() === matchedTopic.name.toLowerCase())
  );

  return {
    topic: matchedTopic,
    researchers,
    currentWorks,
    publications,
  };
}
