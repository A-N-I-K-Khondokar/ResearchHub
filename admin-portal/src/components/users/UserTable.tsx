import React, { useState, useMemo } from 'react';
import { Search, Eye, CheckCircle, XCircle, ShieldAlert, RotateCcw } from 'lucide-react';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import type { UserProfile, ApprovalStatus } from '../../types/user.types';
import type { ActionType } from './ApprovalActionDialog';

interface UserTableProps {
  users: UserProfile[];
  loading: boolean;
  activeFilter?: ApprovalStatus | 'all';
  onFilterChange?: (filter: ApprovalStatus | 'all') => void;
  onInspect: (user: UserProfile) => void;
  onActionClick: (user: UserProfile, action: ActionType) => void;
}

export const UserTable: React.FC<UserTableProps> = ({
  users,
  loading,
  activeFilter = 'all',
  onFilterChange,
  onInspect,
  onActionClick
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // 1. Status Filter
      if (activeFilter !== 'all' && u.approvalStatus !== activeFilter) {
        return false;
      }
      // 2. Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const nameMatch = (u.displayName || '').toLowerCase().includes(query);
        const emailMatch = (u.email || '').toLowerCase().includes(query);
        const deptMatch = (u.department || '').toLowerCase().includes(query);
        return nameMatch || emailMatch || deptMatch;
      }
      return true;
    });
  }, [users, activeFilter, searchQuery]);

  const filterTabs: Array<{ id: ApprovalStatus | 'all'; label: string }> = [
    { id: 'all', label: 'All Users' },
    { id: 'pending', label: 'Pending' },
    { id: 'approved', label: 'Approved' },
    { id: 'rejected', label: 'Rejected' },
    { id: 'suspended', label: 'Suspended' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Top Filter and Search Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}
      >
        {/* Status Filter Buttons */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
          {filterTabs.map((tab) => {
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onFilterChange && onFilterChange(tab.id)}
                className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-secondary'}`}
                style={{
                  borderRadius: 'var(--radius-full)',
                  padding: '6px 14px'
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', width: '260px' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)'
            }}
          />
          <input
            type="text"
            className="input"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '34px' }}
          />
        </div>
      </div>

      {/* Users Data Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Scholar Profile</th>
              <th>Department / Designation</th>
              <th>Program & Batch</th>
              <th>Status</th>
              <th>Submitted</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Loading researcher records...
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  {searchQuery ? 'No matching scholars found for your search query.' : 'No user records in this status.'}
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => {
                const dateStr = u.requestedAt?.toDate
                  ? u.requestedAt.toDate().toLocaleDateString()
                  : (u.createdAt?.toDate ? u.createdAt.toDate().toLocaleDateString() : 'N/A');

                return (
                  <tr key={u.uid}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {u.photoURL ? (
                          <img
                            src={u.photoURL}
                            alt=""
                            style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-full)', objectFit: 'cover' }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: 'var(--radius-full)',
                              background: 'var(--color-brand)',
                              color: '#FFFFFF',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '13px',
                              fontWeight: 700
                            }}
                          >
                            {(u.displayName || 'U')[0].toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.displayName}</div>
                          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{u.department}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{u.designation}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '13px' }}>{u.program || '—'}</div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>{u.batch || '—'}</div>
                    </td>
                    <td>
                      <Badge status={u.approvalStatus} />
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '12.5px' }}>
                      {dateStr}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={<Eye size={13} />}
                          onClick={() => onInspect(u)}
                        >
                          Inspect
                        </Button>

                        {u.approvalStatus === 'pending' && (
                          <>
                            <Button
                              variant="success"
                              size="sm"
                              icon={<CheckCircle size={13} />}
                              onClick={() => onActionClick(u, 'approve')}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              icon={<XCircle size={13} />}
                              onClick={() => onActionClick(u, 'reject')}
                            >
                              Reject
                            </Button>
                          </>
                        )}

                        {u.approvalStatus === 'approved' && (
                          <Button
                            variant="danger"
                            size="sm"
                            icon={<ShieldAlert size={13} />}
                            onClick={() => onActionClick(u, 'suspend')}
                          >
                            Suspend
                          </Button>
                        )}

                        {(u.approvalStatus === 'suspended' || u.approvalStatus === 'rejected') && (
                          <Button
                            variant="primary"
                            size="sm"
                            icon={<RotateCcw size={13} />}
                            onClick={() => onActionClick(u, 'reinstate')}
                          >
                            Reinstate
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

