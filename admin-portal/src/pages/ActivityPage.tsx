import React, { useEffect, useState } from 'react';
import { Bell, CheckCheck, Trash2, History, RefreshCw } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Avatar } from '../components/common/Avatar';
import { PageHeader } from '../components/common/PageHeader';
import { EmptyState } from '../components/common/EmptyState';
import { SkeletonRows } from '../components/common/SkeletonRows';
import { RelativeTime } from '../components/common/RelativeTime';
import { getAdminDirectory, getRecentDecisions } from '../services/admin.service';
import type { UserProfile } from '../types/user.types';

interface ActivityPageProps {
  onInspectUser: (uid: string) => void;
  reloadKey?: number;
}

const VERB: Record<string, string> = {
  approved: 'Approved',
  rejected: 'Rejected',
  suspended: 'Suspended'
};

export const ActivityPage: React.FC<ActivityPageProps> = ({ onInspectUser, reloadKey = 0 }) => {
  const { user: me } = useAuth();
  const { notifications, unreadCount, markAllAsRead, clearNotifications, markAsRead } = useNotifications();
  const [decisions, setDecisions] = useState<UserProfile[]>([]);
  const [admins, setAdmins] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, dir] = await Promise.all([getRecentDecisions(30), getAdminDirectory()]);
      setDecisions(list);
      setAdmins(dir);
    } catch (err) {
      console.error('[ActivityPage] Failed to load decisions:', err);
      setError('Could not load recent decisions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey]);

  const by = (uid?: string | null) => (!uid ? '' : uid === me?.uid ? ' by you' : ` by ${admins.get(uid) || 'another admin'}`);

  return (
    <div className="stack">
      <PageHeader
        title="Activity"
        subtitle="Recent account decisions and live alerts"
        actions={
          <Button variant="secondary" size="sm" icon={<RefreshCw size={14} aria-hidden="true" />} onClick={load} loading={loading}>
            Refresh
          </Button>
        }
      />

      {/* Recent decisions (persistent, from stored account fields) */}
      <section className="card" style={{ padding: 0, overflow: 'hidden' }} aria-labelledby="decisions-title">
        <div className="card-header" style={{ padding: '16px 20px', marginBottom: 0 }}>
          <h2 id="decisions-title" className="card-title">
            <History size={17} color="var(--color-brand)" aria-hidden="true" /> Recent decisions
          </h2>
        </div>
        {error ? (
          <div role="alert" style={{ padding: 16, fontSize: 13, color: 'var(--status-rejected-text)' }}>{error}</div>
        ) : loading ? (
          <SkeletonRows rows={5} />
        ) : decisions.length === 0 ? (
          <EmptyState icon={History} title="No decisions yet" text="Approvals, rejections and suspensions will be listed here." />
        ) : (
          <ul className="list" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {decisions.map((u) => (
              <li key={u.uid} className="list-row">
                <div className="person" style={{ flex: 1 }}>
                  <Avatar name={u.displayName} photoURL={u.photoURL} size={34} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13.5 }}>
                      <b>{VERB[u.approvalStatus] ?? 'Updated'}</b> {u.displayName}
                      <span style={{ color: 'var(--text-secondary)' }}>{u.approvalStatus === 'suspended' ? '' : by(u.approvedBy)}</span>
                    </div>
                    <div className="person-sub">
                      <RelativeTime value={u.approvalStatus === 'approved' ? u.approvedAt || u.updatedAt : u.updatedAt} />
                      {u.approvalStatus === 'rejected' && u.rejectionReason ? ` · “${u.rejectionReason}”` : ''}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Badge status={u.approvalStatus} />
                  <button className="btn btn-secondary btn-sm" onClick={() => onInspectUser(u.uid)}>View</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Live alerts (this browser session) */}
      <section className="card" style={{ padding: 0, overflow: 'hidden' }} aria-labelledby="alerts-title">
        <div className="card-header" style={{ padding: '16px 20px', marginBottom: 0, gap: 8, flexWrap: 'wrap' }}>
          <div>
            <h2 id="alerts-title" className="card-title">
              <Bell size={17} color="var(--color-brand)" aria-hidden="true" /> Live alerts
            </h2>
            <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 2 }}>
              New applications that arrived while this page was open. Cleared when you reload.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {unreadCount > 0 && (
              <Button variant="secondary" size="sm" icon={<CheckCheck size={14} aria-hidden="true" />} onClick={markAllAsRead}>
                Mark all read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button variant="ghost" size="sm" icon={<Trash2 size={14} aria-hidden="true" />} onClick={clearNotifications}>
                Clear
              </Button>
            )}
          </div>
        </div>
        {notifications.length === 0 ? (
          <EmptyState icon={Bell} title="No live alerts" text="Nothing new since you opened the portal. The Pending queue always has every waiting application." />
        ) : (
          <ul className="list" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {notifications.map((item) => (
              <li key={item.id} className="list-row" style={{ background: item.read ? 'transparent' : 'var(--color-brand-light)' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700 }}>{item.title}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{item.message}</div>
                  <RelativeTime value={item.timestamp} style={{ fontSize: 12, color: 'var(--text-muted)' }} />
                </div>
                {item.applicantUid && (
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      markAsRead(item.id);
                      onInspectUser(item.applicantUid);
                    }}
                  >
                    Review
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};
