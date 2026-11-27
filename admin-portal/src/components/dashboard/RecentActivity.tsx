import React from 'react';
import { ArrowRight, UserPlus } from 'lucide-react';
import { Badge } from '../common/Badge';
import { Avatar } from '../common/Avatar';
import { RelativeTime } from '../common/RelativeTime';
import { EmptyState } from '../common/EmptyState';
import { SkeletonRows } from '../common/SkeletonRows';
import type { UserProfile } from '../../types/user.types';

interface RecentActivityProps {
  users: UserProfile[];
  loading?: boolean;
  onViewApplicant: (uid: string) => void;
  onViewAll: () => void;
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ users, loading, onViewApplicant, onViewAll }) => (
  <section className="card" style={{ padding: 0, overflow: 'hidden' }} aria-labelledby="recent-reg-title">
    <div className="card-header" style={{ padding: '16px 20px', marginBottom: 0 }}>
      <h2 id="recent-reg-title" className="card-title">Recent registrations</h2>
      <button onClick={onViewAll} className="btn btn-ghost btn-sm" style={{ color: 'var(--color-brand)' }}>
        View all <ArrowRight size={14} />
      </button>
    </div>

    {loading ? (
      <SkeletonRows rows={5} />
    ) : users.length === 0 ? (
      <EmptyState icon={UserPlus} title="No registrations yet" text="New sign-ups will appear here." />
    ) : (
      <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Applicant</th>
              <th scope="col">Department</th>
              <th scope="col">Status</th>
              <th scope="col">Registered</th>
              <th scope="col"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.uid}>
                <td>
                  <div className="person">
                    <Avatar name={u.displayName} photoURL={u.photoURL} size={32} />
                    <div style={{ minWidth: 0 }}>
                      <div className="person-name">{u.displayName}</div>
                      <div className="person-sub">{u.designation}</div>
                    </div>
                  </div>
                </td>
                <td>{u.department}</td>
                <td><Badge status={u.approvalStatus} /></td>
                <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                  <RelativeTime value={u.requestedAt || u.createdAt} />
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button onClick={() => onViewApplicant(u.uid)} className="btn btn-secondary btn-sm">
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </section>
);
