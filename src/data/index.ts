import { mockTopics } from './topics';
import { activeUser, mockResearchers } from './researchers';
import { mockCurrentWorks } from './currentWork';
import { mockPublications } from './publications';
import { mockConnectionRequests, mockConnectedResearchers } from './connections';
import { mockNotifications } from './notifications';
import { UserProfile, CurrentWork, ResearchPublication, Topic } from '@/types';

export * from './topics';
export * from './researchers';
export * from './currentWork';
export * from './publications';
export * from './connections';
export * from './notifications';

export const currentUser: UserProfile = activeUser;

// Helper query functions for components
export function getActiveUser(): UserProfile {
  return activeUser;
}

export function getAllResearchers(): UserProfile[] {
  return mockResearchers;
}

export function getFeaturedResearchers(): UserProfile[] {
  return mockResearchers.slice(0, 4);
}

export function getResearcherById(id: string): UserProfile | undefined {
  if (id === activeUser.id) return activeUser;
  return mockResearchers.find((r) => r.id === id);
}

export function getActiveCurrentWork(): CurrentWork[] {
  return mockCurrentWorks;
}

export function getCurrentWorkById(id: string): CurrentWork | undefined {
  return mockCurrentWorks.find((w) => w.id === id);
}

export function getPublications(): ResearchPublication[] {
  return mockPublications;
}

export function getRecentPublications(): ResearchPublication[] {
  return mockPublications.slice(0, 3);
}

export function getPublicationById(id: string): ResearchPublication | undefined {
  return mockPublications.find((p) => p.id === id);
}

export function getAllTopics(): Topic[] {
  return mockTopics;
}

export function getTopicById(id: string): Topic | undefined {
  return mockTopics.find((t) => t.id === id || t.slug === id);
}

export function getResearchersByTopic(topicName: string): UserProfile[] {
  return mockResearchers.filter((r) => r.interests.includes(topicName));
}

export function getCurrentWorkByTopic(topicName: string): CurrentWork[] {
  return mockCurrentWorks.filter((w) => w.topics.includes(topicName));
}

export function getUnreadNotificationsCount(): number {
  return mockNotifications.filter((n) => !n.read).length;
}
