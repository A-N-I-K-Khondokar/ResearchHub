import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';
import type { AdminNotification, NotificationContextType } from '../types/notification.types';

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{
  children: React.ReactNode;
  onSelectApplicant?: (uid: string) => void;
}> = ({ children, onSelectApplicant }) => {
  const { user, adminRecord } = useAuth();
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [toasts, setToasts] = useState<AdminNotification[]>([]);
  const knownPendingIds = useRef<Set<string>>(new Set());
  const initialLoadCompleted = useRef<boolean>(false);

  useEffect(() => {
    // Only subscribe if authenticated administrator exists
    if (!user || !adminRecord) {
      knownPendingIds.current.clear();
      initialLoadCompleted.current = false;
      setNotifications([]);
      setToasts([]);
      return;
    }

    const q = query(collection(db, 'users'), where('approvalStatus', '==', 'pending'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const isFirstSnapshot = !initialLoadCompleted.current;

        snapshot.docChanges().forEach((change) => {
          const docId = change.doc.id;
          const data = change.doc.data();
          const applicantName = data.displayName || 'Unknown Researcher';

          if (change.type === 'added') {
            if (isFirstSnapshot) {
              // Record initially existing pending document IDs without firing notifications
              knownPendingIds.current.add(docId);
            } else if (!knownPendingIds.current.has(docId)) {
              // Newly discovered pending document while portal is open!
              knownPendingIds.current.add(docId);

              const newNotification: AdminNotification = {
                id: `notif-${docId}-${Date.now()}`,
                type: 'new_application',
                title: 'New Account Request',
                message: `New scholar registration submitted: ${applicantName}`,
                applicantUid: docId,
                applicantName: applicantName,
                timestamp: new Date(),
                read: false
              };

              // Add to in-session notifications list
              setNotifications((prev) => [newNotification, ...prev]);

              // Display active toast
              setToasts((prev) => [newNotification, ...prev]);

              // Automatically dismiss toast after 6 seconds
              setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== newNotification.id));
              }, 6000);
            }
          } else if (change.type === 'removed') {
            knownPendingIds.current.delete(docId);
          }
        });

        if (isFirstSnapshot) {
          initialLoadCompleted.current = true;
        }
      },
      (error) => {
        console.error('[NotificationContext] Real-time listener error:', error);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [user, adminRecord]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const viewApplicant = (uid: string) => {
    if (onSelectApplicant) {
      onSelectApplicant(uid);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearNotifications,
        toasts,
        dismissToast,
        viewApplicant
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export function useNotifications(): NotificationContextType {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

