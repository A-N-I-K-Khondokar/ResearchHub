import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { AdminLayout } from './components/layout/AdminLayout';
import type { NavTab } from './components/layout/Sidebar';
import { LoginPage } from './pages/LoginPage';
import { OverviewPage } from './pages/OverviewPage';
import { PendingPage } from './pages/PendingPage';
import { UsersPage } from './pages/UsersPage';
import { ActivityPage } from './pages/ActivityPage';
import { ApplicantDetailModal } from './components/users/ApplicantDetailModal';
import { ApprovalActionDialog, type ActionType } from './components/users/ApprovalActionDialog';
import {
  getUserById,
  approveUser,
  rejectUser,
  suspendUser,
  reinstateUser
} from './services/admin.service';
import type { UserProfile } from './types/user.types';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from './config/firebase';
import { Loader2 } from 'lucide-react';

const AdminPortalContent: React.FC = () => {
  const { user, adminRecord, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavTab>('overview');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [actionTargetUser, setActionTargetUser] = useState<UserProfile | null>(null);
  const [actionType, setActionType] = useState<ActionType>('approve');
  const [pendingCount, setPendingCount] = useState<number>(0);

  // Live pending count listener for the sidebar badge
  useEffect(() => {
    if (!user || !adminRecord) {
      setPendingCount(0);
      return;
    }

    const q = query(collection(db, 'users'), where('approvalStatus', '==', 'pending'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPendingCount(snapshot.size);
    });

    return () => unsubscribe();
  }, [user, adminRecord]);

  // Handle direct UID lookup (from notification or search)
  const handleInspectByUid = async (uid: string) => {
    try {
      const profile = await getUserById(uid);
      if (profile) {
        setSelectedUser(profile);
      }
    } catch (err) {
      console.error('[App] Failed to load profile for uid:', uid, err);
    }
  };

  const handleOpenActionDialog = (target: UserProfile, type: ActionType) => {
    setActionTargetUser(target);
    setActionType(type);
  };

  const handleExecuteAction = async (target: UserProfile, reason?: string) => {
    if (!user) return;

    switch (actionType) {
      case 'approve':
        await approveUser(target.uid, user.uid);
        break;
      case 'reject':
        await rejectUser(target.uid, user.uid, reason);
        break;
      case 'suspend':
        await suspendUser(target.uid);
        break;
      case 'reinstate':
        await reinstateUser(target.uid, user.uid);
        break;
    }

    // Refresh selectedUser if detail modal is open
    if (selectedUser && selectedUser.uid === target.uid) {
      const refreshed = await getUserById(target.uid);
      setSelectedUser(refreshed);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          backgroundColor: 'var(--bg-canvas)',
          color: 'var(--text-secondary)'
        }}
      >
        <Loader2 size={36} color="var(--color-brand)" className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
        <div style={{ fontSize: '14px', fontWeight: 600 }}>
          Connecting to CSE Research Hub Gateway...
        </div>
      </div>
    );
  }

  if (!user || !adminRecord) {
    return <LoginPage />;
  }

  return (
    <AdminLayout
      currentTab={currentTab}
      onSelectTab={setCurrentTab}
      pendingCount={pendingCount}
      onSelectApplicant={handleInspectByUid}
    >
      {currentTab === 'overview' && (
        <OverviewPage
          onNavigateToPending={() => setCurrentTab('pending')}
          onNavigateToUsers={() => setCurrentTab('users')}
          onInspectUser={handleInspectByUid}
        />
      )}

      {currentTab === 'pending' && (
        <PendingPage
          onInspectUser={(u) => setSelectedUser(u)}
          onActionClick={handleOpenActionDialog}
        />
      )}

      {currentTab === 'users' && (
        <UsersPage
          onInspectUser={(u) => setSelectedUser(u)}
          onActionClick={handleOpenActionDialog}
        />
      )}

      {currentTab === 'activity' && (
        <ActivityPage onInspectUser={handleInspectByUid} />
      )}

      {/* Inspect Detail Modal */}
      <ApplicantDetailModal
        isOpen={Boolean(selectedUser)}
        onClose={() => setSelectedUser(null)}
        user={selectedUser}
        onActionClick={(u, act) => {
          handleOpenActionDialog(u, act);
        }}
      />

      {/* Action Confirmation Dialog */}
      <ApprovalActionDialog
        isOpen={Boolean(actionTargetUser)}
        onClose={() => setActionTargetUser(null)}
        user={actionTargetUser}
        actionType={actionType}
        onConfirm={handleExecuteAction}
      />
    </AdminLayout>
  );
};

export const App: React.FC = () => {
  return (
    <NotificationProvider>
      <AdminPortalContent />
    </NotificationProvider>
  );
};
