import React, { useCallback, useEffect, useState } from 'react';
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { UserTable } from '../components/users/UserTable';
import { Button } from '../components/common/Button';
import { PageHeader } from '../components/common/PageHeader';
import { getDashboardCounts, getUsersPage, USERS_PAGE_SIZE } from '../services/admin.service';
import type { UserProfile, ApprovalStatus } from '../types/user.types';
import type { ActionType } from '../components/users/ApprovalActionDialog';

type Filter = ApprovalStatus | 'all';

interface UsersPageProps {
  onInspectUser: (user: UserProfile) => void;
  onActionClick: (user: UserProfile, action: ActionType) => void;
  /** Current status filter (kept in the URL: #/users/rejected). */
  filter: Filter;
  onFilterChange: (filter: Filter) => void;
  /** Changes whenever an admin action modifies a user, triggering a reload. */
  reloadKey?: number;
}

export const UsersPage: React.FC<UsersPageProps> = ({ onInspectUser, onActionClick, filter, onFilterChange, reloadKey = 0 }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [counts, setCounts] = useState<Partial<Record<Filter, number>>>({});

  const loadFirstPage = useCallback(async (f: Filter) => {
    setLoading(true);
    setError(null);
    try {
      const page = await getUsersPage(f, null);
      setUsers(page.users);
      setCursor(page.cursor);
      setHasMore(page.hasMore);
    } catch (err: any) {
      console.error('[UsersPage] Failed to fetch users:', err);
      setError(
        err?.code === 'failed-precondition'
          ? 'The user list index is still being built. Please try again in a few minutes.'
          : 'Could not load users.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = async () => {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await getUsersPage(filter, cursor);
      setUsers((prev) => [...prev, ...page.users]);
      setCursor(page.cursor);
      setHasMore(page.hasMore);
    } catch (err) {
      console.error('[UsersPage] Failed to load more users:', err);
      setError('Could not load more users.');
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadFirstPage(filter);
  }, [filter, reloadKey, loadFirstPage]);

  useEffect(() => {
    getDashboardCounts()
      .then((c) =>
        setCounts({ all: c.totalUsers, pending: c.pendingUsers, approved: c.approvedUsers, rejected: c.rejectedUsers, suspended: c.suspendedUsers })
      )
      .catch(() => setCounts({}));
  }, [reloadKey]);

  return (
    <div className="stack">
      <PageHeader title="Users" subtitle="View accounts, change their status, or correct academic details" />

      {error ? <div role="alert" style={{ fontSize: 13, color: 'var(--status-rejected-text)' }}>{error}</div> : null}

      <UserTable
        users={users}
        loading={loading}
        activeFilter={filter}
        onFilterChange={onFilterChange}
        counts={counts}
        onInspect={onInspectUser}
        onActionClick={onActionClick}
      />

      {!loading && users.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', fontSize: 12.5, color: 'var(--text-secondary)' }}>
          <span>
            Showing {users.length} user{users.length === 1 ? '' : 's'}
            {hasMore ? ` · ${USERS_PAGE_SIZE} per page · search covers loaded users` : ''}
          </span>
          {hasMore && (
            <Button variant="secondary" size="sm" onClick={loadMore} loading={loadingMore}>
              Load more
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
