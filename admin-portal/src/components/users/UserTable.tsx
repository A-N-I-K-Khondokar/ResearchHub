import React, { useMemo, useState } from 'react';
import { Search, CheckCircle, XCircle, ShieldAlert, RotateCcw, Users, SearchX } from 'lucide-react';
import { Badge } from '../common/Badge';
import { Avatar } from '../common/Avatar';
import { RelativeTime } from '../common/RelativeTime';
import { RowMenu, type RowMenuItem } from '../common/RowMenu';
import { EmptyState } from '../common/EmptyState';
import { SkeletonRows } from '../common/SkeletonRows';
import type { UserProfile, ApprovalStatus } from '../../types/user.types';
import type { ActionType } from './ApprovalActionDialog';

type Filter = ApprovalStatus | 'all';

interface UserTableProps {
  users: UserProfile[];
  loading: boolean;
  activeFilter?: Filter;
  onFilterChange?: (filter: Filter) => void;
  /** Server counts per status (tab badges). */
  counts?: Partial<Record<Filter, number>>;
  onInspect: (user: UserProfile) => void;
  onActionClick: (user: UserProfile, action: ActionType) => void;
}

const TABS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'suspended', label: 'Suspended' }
];

const actionsFor = (u: UserProfile, act: (a: ActionType) => void): RowMenuItem[] => {
  switch (u.approvalStatus) {
    case 'pending':
      return [
        { label: 'Approve', icon: CheckCircle, onSelect: () => act('approve') },
        { label: 'Reject…', icon: XCircle, danger: true, onSelect: () => act('reject') }
      ];
    case 'approved':
      return [{ label: 'Suspend account…', icon: ShieldAlert, danger: true, onSelect: () => act('suspend') }];
    default:
      return [{ label: 'Reinstate', icon: RotateCcw, onSelect: () => act('reinstate') }];
  }
};

export const UserTable: React.FC<UserTableProps> = ({
  users,
  loading,
  activeFilter = 'all',
  onFilterChange,
  counts,
  onInspect,
  onActionClick
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return users.filter((u) => {
      if (activeFilter !== 'all' && u.approvalStatus !== activeFilter) return false;
      if (!q) return true;
      return [u.displayName, u.email, u.department, u.studentId, u.designation].some((f) => (f || '').toLowerCase().includes(q));
    });
  }, [users, activeFilter, searchQuery]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div className="seg" role="tablist" aria-label="Filter by status">
          {TABS.map((tab) => {
            const active = activeFilter === tab.id;
            const count = counts?.[tab.id];
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={active}
                className={`seg-item ${active ? 'is-active' : ''}`}
                onClick={() => onFilterChange?.(tab.id)}
              >
                {tab.label}
                {count !== undefined ? <span className="seg-count">{count}</span> : null}
              </button>
            );
          })}
        </div>

        <div style={{ position: 'relative', width: 280, maxWidth: '100%' }}>
          <Search size={16} aria-hidden="true" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="search"
            className="input"
            placeholder="Search name, email, ID…"
            aria-label="Search loaded users"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: 34 }}
          />
        </div>
      </div>

      <div className="table-container">
        {loading ? (
          <SkeletonRows rows={6} />
        ) : filteredUsers.length === 0 ? (
          searchQuery ? (
            <EmptyState icon={SearchX} title="No matches" text="No loaded users match your search. Try another name, email or ID." />
          ) : (
            <EmptyState icon={Users} title="No users here" text="There are no accounts with this status." />
          )
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">User</th>
                <th scope="col">Role & department</th>
                <th scope="col">Program / batch</th>
                <th scope="col">Status</th>
                <th scope="col">Applied</th>
                <th scope="col"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.uid}>
                  <td>
                    <div className="person">
                      <Avatar name={u.displayName} photoURL={u.photoURL} size={34} />
                      <div style={{ minWidth: 0 }}>
                        <div className="person-name">{u.displayName}</div>
                        <div className="person-sub">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{u.designation}</div>
                    <div className="person-sub">{u.department}</div>
                  </td>
                  <td>
                    <div>{u.program || '—'}</div>
                    <div className="person-sub">{u.batch || ''}</div>
                  </td>
                  <td><Badge status={u.approvalStatus} /></td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 13, whiteSpace: 'nowrap' }}>
                    <RelativeTime value={u.requestedAt || u.createdAt} />
                  </td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => onInspect(u)}>
                        View
                      </button>
                      <RowMenu label={`More actions for ${u.displayName}`} items={actionsFor(u, (a) => onActionClick(u, a))} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
