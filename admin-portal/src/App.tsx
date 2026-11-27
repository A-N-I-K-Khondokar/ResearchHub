import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { NotificationProvider, useNotifications } from './context/NotificationContext';
import { AdminLayout } from './components/layout/AdminLayout';
import { LoginPage } from './pages/LoginPage';
import { OverviewPage } from './pages/OverviewPage';
import { PendingPage } from './pages/PendingPage';
import { UsersPage } from './pages/UsersPage';
import { ActivityPage } from './pages/ActivityPage';
import { ApplicantDetailModal } from './components/users/ApplicantDetailModal';
import { ApprovalActionDialog, type ActionType } from './components/users/ApprovalActionDialog';
import { useHashRoute } from './hooks/useHashRoute';
import {
  getUserById,
  approveUser,
  rejectUser,
  suspendUser,
  reinstateUser,
  correctAcademicDetails,
  type AcademicCorrection
} from './services/admin.service';
import type { UserProfile } from './types/user.types';
import { Loader2 } from 'lucide-react';

const AdminPortalContent: React.FC = () => {
  const { user, adminRecord, loading } = useAuth();
  const { route, navigate } = useHashRoute();
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [actionTargetUser, setActionTargetUser] = useState<UserProfile | null>(null);
  const [actionType, setActionType] = useState<ActionType>('approve');
  const { pendingCount } = useNotifications();
  // Bumped after every admin action so lists and counts reload
  const [dataVersion, setDataVersion] = useState(0);

  const handleInspectByUid = async (uid: string) => {
    try {
      const profile = await getUserById(uid);
      if (profile) setSelectedUser(profile);
    } catch (err) {
      console.error('[App] Failed to load profile for uid:', uid, err);
    }
  };

  const handleOpenActionDialog = (target: UserProfile, type: ActionType) => {
    setActionTargetUser(target);
    setActionType(type);
  };

  const refreshSelected = async (uid: string) => {
    if (selectedUser && selectedUser.uid === uid) setSelectedUser(await getUserById(uid));
  };

  const handleExecuteAction = async (target: UserProfile, reason?: string) => {
    if (!user) return;
    switch (actionType) {
      case 'approve':
        await approveUser(target, user.uid);
        break;
      case 'reject':
        await rejectUser(target.uid, user.uid, reason);
        break;
      case 'suspend':
        await suspendUser(target.uid);
        break;
      case 'reinstate':
        await reinstateUser(target, user.uid);
        break;
    }
    setDataVersion((v) => v + 1);
    await refreshSelected(target.uid);
  };

  /** Approve several pending applicants (each its own atomic batch). Returns failures. */
  const handleBulkApprove = async (targets: UserProfile[]): Promise<UserProfile[]> => {
    if (!user) return targets;
    const failed: UserProfile[] = [];
    for (const t of targets) {
      try {
        await approveUser(t, user.uid);
      } catch (err) {
        console.error('[App] Bulk approve failed for', t.uid, err);
        failed.push(t);
      }
    }
    setDataVersion((v) => v + 1);
    return failed;
  };

  const handleCorrectAcademic = async (target: UserProfile, fields: AcademicCorrection) => {
    await correctAcademicDetails(target, fields);
    setSelectedUser(await getUserById(target.uid));
    setDataVersion((v) => v + 1);
  };

  if (loading) {
    return (
      <div
        role="status"
        style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 14, backgroundColor: 'var(--bg-canvas)', color: 'var(--text-secondary)'
        }}
      >
        <Loader2 size={32} color="var(--color-brand)" className="animate-spin" aria-hidden="true" />
        <div style={{ fontSize: 14, fontWeight: 600 }}>Connecting…</div>
      </div>
    );
  }

  if (!user || !adminRecord) {
    return <LoginPage />;
  }

  return (
    <AdminLayout
      currentTab={route.tab}
      onSelectTab={(tab) => navigate(tab)}
      pendingCount={pendingCount}
      onSelectApplicant={handleInspectByUid}
    >
      {route.tab === 'overview' && (
        <OverviewPage
          onNavigateToPending={() => navigate('pending')}
          onNavigateToUsers={(filter) => navigate('users', filter)}
          onInspectUser={handleInspectByUid}
          reloadKey={dataVersion}
        />
      )}

      {route.tab === 'pending' && (
        <PendingPage
          onInspectUser={(u) => setSelectedUser(u)}
          onActionClick={handleOpenActionDialog}
          onBulkApprove={handleBulkApprove}
        />
      )}

      {route.tab === 'users' && (
        <UsersPage
          onInspectUser={(u) => setSelectedUser(u)}
          onActionClick={handleOpenActionDialog}
          filter={route.usersFilter}
          onFilterChange={(f) => navigate('users', f)}
          reloadKey={dataVersion}
        />
      )}

      {route.tab === 'activity' && <ActivityPage onInspectUser={handleInspectByUid} reloadKey={dataVersion} />}

      <ApplicantDetailModal
        isOpen={Boolean(selectedUser)}
        onClose={() => setSelectedUser(null)}
        user={selectedUser}
        onActionClick={handleOpenActionDialog}
        onCorrectAcademic={handleCorrectAcademic}
      />

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

export const App: React.FC = () => (
  <NotificationProvider>
    <AdminPortalContent />
  </NotificationProvider>
);
