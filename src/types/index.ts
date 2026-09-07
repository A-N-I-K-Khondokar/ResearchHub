export interface Topic {
  id: string;
  name: string;
  slug: string;
  category: string;
  icon?: string;
  iconName?: string;
  researchersCount: number;
  currentWorkCount: number;
  activeCount?: number;
  description?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  department: string;
  batch?: string;
  designation?: string;
  bio?: string;
  photoURL?: string | null;
  avatar?: string | null;
  interests: string[];
  researchInterests?: string[];
  currentWorkIds?: string[];
  publicationIds?: string[];
  googleScholarURL?: string;
  researchGateURL?: string;
  githubURL?: string;
  websiteURL?: string;
  connectionsCount?: number;
  currentWorkCount?: number;
  publicationsCount?: number;
  sharedInterestsCount?: number;
  isConnected?: boolean;
  connectionStatus?: 'none' | 'pending' | 'connected';
}

export interface CurrentWork {
  id: string;
  userId: string;
  researcherId?: string;
  authorName: string;
  authorDepartment?: string;
  authorBatch?: string;
  authorDesignation?: string;
  authorPhotoURL?: string | null;
  authorAvatar?: string | null;
  title: string;
  description: string;
  shortDescription?: string;
  topics: string[];
  stage?: 'Ideation' | 'Data Collection' | 'Experimentation' | 'Drafting' | 'Pre-print' | 'In Review' | 'Model Training' | 'Paper Drafting' | 'System Building' | string;
  externalURL?: string;
  likesCount?: number;
  commentsCount?: number;
  isBookmarked?: boolean;
  isLiked?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ResearchPublication {
  id: string;
  userId: string;
  authorName: string;
  authors?: string[];
  authorDepartment?: string;
  authorBatch?: string;
  authorPhotoURL?: string | null;
  coAuthors?: string[];
  title: string;
  overview: string;
  abstract?: string;
  type: 'Conference' | 'Journal' | 'Workshop' | 'Thesis' | 'Preprint' | string;
  venue: string;
  year: number;
  externalURL?: string;
  externalUrl?: string;
  doi?: string;
  topics: string[];
  isBookmarked?: boolean;
  createdAt?: string;
}

export interface ConnectionRequest {
  id: string;
  senderId: string;
  receiverId: string;
  sender: UserProfile;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  type: 'connection_request' | 'connection_accepted' | 'research_mention' | 'topic_activity';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  sender?: UserProfile;
  targetId?: string;
}
