export interface AdminNotification {
  id: string;
  type: 'new_application' | 'info';
  title: string;
  message: string;
  applicantUid: string;
  applicantName: string;
  timestamp: Date;
  read: boolean;
}

import type { UserProfile } from './user.types';

export interface NotificationContextType {
  /** Live pending applications (single shared listener for badge, page and toasts). */
  pendingUsers: UserProfile[];
  pendingCount: number;
  pendingLoading: boolean;
  notifications: AdminNotification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  toasts: AdminNotification[];
  dismissToast: (id: string) => void;
}

