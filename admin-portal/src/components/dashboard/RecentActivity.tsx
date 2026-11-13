import React from 'react';
import { ArrowRight, User } from 'lucide-react';
import { Badge } from '../common/Badge';
import type { UserProfile } from '../../types/user.types';

interface RecentActivityProps {
  users: UserProfile[];
  onViewApplicant: (uid: string) => void;
  onViewAll: () => void;
}

export const RecentActivity: React.FC<RecentActivityProps> = ({
  users,
  onViewApplicant,
  onViewAll
}) => {
  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">
          <User size={18} color="var(--color-brand)" />
          Recent Registration Activity
        </h3>
        <button
          onClick={onViewAll}
          className="btn btn-ghost btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: 'var(--color-brand)' }}
        >
          View All <ArrowRight size={14} />
        </button>
      </div>

      {users.length === 0 ? (
        <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13.5px' }}>
          No registered user profiles found.
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Status</th>
                <th>Registered</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
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
                            style={{ width: '28px', height: '28px', borderRadius: 'var(--radius-full)', objectFit: 'cover' }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: 'var(--radius-full)',
                              background: 'var(--bg-surface-subtle)',
                              color: 'var(--text-secondary)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '12px',
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
                    <td>{u.department}</td>
                    <td>{u.designation}</td>
                    <td><Badge status={u.approvalStatus} /></td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '12.5px' }}>{dateStr}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => onViewApplicant(u.uid)}
                        className="btn btn-secondary btn-sm"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

