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

export interface NotificationContextType {
  notifications: AdminNotification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  toasts: AdminNotification[];
  dismissToast: (id: string) => void;
  viewApplicant: (uid: string) => void;
}

