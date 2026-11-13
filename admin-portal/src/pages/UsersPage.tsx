import React, { useEffect, useState } from 'react';
import { UserTable } from '../components/users/UserTable';
import { getUsers } from '../services/admin.service';
import type { UserProfile, ApprovalStatus } from '../types/user.types';
import type { ActionType } from '../components/users/ApprovalActionDialog';

interface UsersPageProps {
  onInspectUser: (user: UserProfile) => void;
  onActionClick: (user: UserProfile, action: ActionType) => void;
  initialFilter?: ApprovalStatus | 'all';
}

export const UsersPage: React.FC<UsersPageProps> = ({
  onInspectUser,
  onActionClick,
  initialFilter = 'all'
}) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeFilter, setActiveFilter] = useState<ApprovalStatus | 'all'>(initialFilter);

  const fetchUsers = async (filter: ApprovalStatus | 'all') => {
    setLoading(true);
    try {
      const data = await getUsers(filter, 150);
      setUsers(data);
    } catch (err) {
      console.error('[UsersPage] Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(activeFilter);
  }, [activeFilter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
          Scholar Directory & Account States
        </h2>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          Inspect academic profiles, adjust approval statuses, or suspend accounts
        </div>
      </div>

      <UserTable
        users={users}
        loading={loading}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        onInspect={onInspectUser}
        onActionClick={onActionClick}
      />
    </div>
  );
};

