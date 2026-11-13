export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export interface SocialLinks {
  website?: string;
  github?: string;
  linkedin?: string;
  googleScholar?: string;
  researchGate?: string;
  twitter?: string;
  [key: string]: string | undefined;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string | null;
  department: string;
  program?: string | null;
  batch?: string | null;
  studentId?: string | null;
  designation: string;
  bio?: string | null;
  researchInterests: string[];
  socialLinks?: SocialLinks;
  approvalStatus: ApprovalStatus;
  requestedAt?: any;
  approvedAt?: any;
  approvedBy?: string | null;
  rejectionReason?: string | null;
  createdAt?: any;
  updatedAt?: any;
}

