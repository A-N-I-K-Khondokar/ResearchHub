import React, { useCallback, useEffect, useState } from 'react';
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { UserTable } from '../components/users/UserTable';
import { Button } from '../components/common/Button';
import { getUsersPage, USERS_PAGE_SIZE } from '../services/admin.service';
import type { UserProfile, ApprovalStatus } from '../types/user.types';
import type { ActionType } from '../components/users/ApprovalActionDialog';

interface UsersPageProps {
  onInspectUser: (user: UserProfile) => void;
  onActionClick: (user: UserProfile, action: ActionType) => void;
  initialFilter?: ApprovalStatus | 'all';
  /** Changes whenever an admin action modifies a user, triggering a reload. */
  reloadKey?: number;
}

export const UsersPage: React.FC<UsersPageProps> = ({
  onInspectUser,
  onActionClick,
  initialFilter = 'all',
  reloadKey = 0
}) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [activeFilter, setActiveFilter] = useState<ApprovalStatus | 'all'>(initialFilter);

  // First page for the current filter
  const loadFirstPage = useCallback(async (filter: ApprovalStatus | 'all') => {
    setLoading(true);
    setError(null);
    try {
      const page = await getUsersPage(filter, null);
      setUsers(page.users);
      setCursor(page.cursor);
      setHasMore(page.hasMore);
    } catch (err: any) {
      console.error('[UsersPage] Failed to fetch users:', err);
      setError(
        err?.code === 'failed-precondition'
          ? 'The directory index is still being built. Please try again in a few minutes.'
          : 'Could not load the researcher directory.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = async () => {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await getUsersPage(activeFilter, cursor);
      setUsers((prev) => [...prev, ...page.users]);
      setCursor(page.cursor);
      setHasMore(page.hasMore);
    } catch (err) {
      console.error('[UsersPage] Failed to load more users:', err);
      setError('Could not load more researchers.');
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadFirstPage(activeFilter);
  }, [activeFilter, reloadKey, loadFirstPage]);

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

      {error && (
        <div style={{ fontSize: '13px', color: 'var(--status-rejected-text)' }}>{error}</div>
      )}

      <UserTable
        users={users}
        loading={loading}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        onInspect={onInspectUser}
        onActionClick={onActionClick}
      />

      {!loading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
          <span>
            Showing {users.length} researcher{users.length === 1 ? '' : 's'}
            {hasMore ? ` (${USERS_PAGE_SIZE} per page)` : ''}. Search filters the loaded page(s).
          </span>
          {hasMore && (
            <Button variant="secondary" onClick={loadMore} loading={loadingMore}>
              Load more
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
