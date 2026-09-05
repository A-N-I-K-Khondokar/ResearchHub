export interface UserProfile {
  id: string;
  name: string;
  email: string;
  department: string;
  batch?: string;
  designation?: string;
  bio?: string;
  photoURL?: string | null;
  interests: string[];
  googleScholarURL?: string;
  researchGateURL?: string;
  githubURL?: string;
  websiteURL?: string;
  connectionsCount?: number;
  currentWorkCount?: number;
  publicationsCount?: number;
}

export interface CurrentWork {
  id: string;
  userId: string;
  authorName: string;
  authorDepartment: string;
  authorPhotoURL?: string | null;
  title: string;
  description: string;
  topics: string[];
  stage?: 'Ideation' | 'Data Collection' | 'Experimentation' | 'Drafting' | 'Pre-print' | 'In Review';
  externalURL?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ResearchPublication {
  id: string;
  userId: string;
  authorName: string;
  authorDepartment: string;
  authorPhotoURL?: string | null;
  coAuthors?: string[];
  title: string;
  overview: string;
  type: 'Conference' | 'Journal' | 'Workshop' | 'Thesis' | 'Preprint';
  venue: string;
  year: number;
  externalURL: string;
  doi?: string;
  topics: string[];
  createdAt: string;
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
