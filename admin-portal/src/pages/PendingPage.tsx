import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { CheckCircle, XCircle, Eye, Radio, Sparkles } from 'lucide-react';
import type { UserProfile } from '../types/user.types';
import type { ActionType } from '../components/users/ApprovalActionDialog';

interface PendingPageProps {
  onInspectUser: (user: UserProfile) => void;
  onActionClick: (user: UserProfile, action: ActionType) => void;
}

export const PendingPage: React.FC<PendingPageProps> = ({
  onInspectUser,
  onActionClick
}) => {
  const [pendingUsers, setPendingUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'users'), where('approvalStatus', '==', 'pending'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: UserProfile[] = [];
        snapshot.forEach((d) => {
          list.push({ uid: d.id, ...d.data() } as UserProfile);
        });

        // Client-side sort by requestedAt descending
        list.sort((a, b) => {
          const timeA = a.requestedAt?.toMillis ? a.requestedAt.toMillis() : (a.createdAt?.toMillis ? a.createdAt.toMillis() : 0);
          const timeB = b.requestedAt?.toMillis ? b.requestedAt.toMillis() : (b.createdAt?.toMillis ? b.createdAt.toMillis() : 0);
          return timeB - timeA;
        });

        setPendingUsers(list);
        setLoading(false);
      },
      (error) => {
        console.error('[PendingPage] Real-time listener error:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header with live status badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Pending Account Reviews ({pendingUsers.length})
          </h2>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Applications in this queue cannot sign in until approved
          </div>
        </div>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            backgroundColor: 'rgba(22, 163, 74, 0.12)',
            color: '#16A34A',
            borderRadius: 'var(--radius-full)',
            fontSize: '12px',
            fontWeight: 600
          }}
        >
          <Radio size={14} className="animate-pulse" style={{ animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
          <span>Live Updates Active</span>
        </div>
      </div>

      {/* Main Content Table / List */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Connecting to Firestore real-time pending stream...
          </div>
        ) : pendingUsers.length === 0 ? (
          <div style={{ padding: '60px 24px', textAlign: 'center' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--status-approved-bg)',
                color: 'var(--status-approved-text)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto'
              }}
            >
              <Sparkles size={24} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
              All Caught Up!
            </h3>
            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto' }}>
              There are currently zero pending registration applications. When a student or faculty member submits their profile, it will appear here in real time.
            </p>
          </div>
        ) : (
          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Applicant</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Program / Batch</th>
                  <th>Requested Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingUsers.map((u) => {
                  const dateStr = u.requestedAt?.toDate
                    ? u.requestedAt.toDate().toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
                    : (u.createdAt?.toDate ? u.createdAt.toDate().toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A');

                  return (
                    <tr key={u.uid}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {u.photoURL ? (
                            <img
                              src={u.photoURL}
                              alt=""
                              style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-full)', objectFit: 'cover' }}
                            />
                          ) : (
                            <div
                              style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: 'var(--radius-full)',
                                background: 'var(--color-brand)',
                                color: '#FFFFFF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '14px',
                                fontWeight: 700
                              }}
                            >
                              {(u.displayName || 'U')[0].toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{u.displayName}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>{u.department}</td>
                      <td>{u.designation}</td>
                      <td>
                        <div>{u.program || '—'}</div>
                        <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>{u.batch || '—'}</div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '12.5px' }}>{dateStr}</td>
                      <td><Badge status={u.approvalStatus} /></td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={<Eye size={13} />}
                            onClick={() => onInspectUser(u)}
                          >
                            Inspect
                          </Button>
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
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
