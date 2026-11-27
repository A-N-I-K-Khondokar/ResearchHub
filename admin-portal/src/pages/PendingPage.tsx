import React, { useMemo, useState } from 'react';
import { CheckCircle, XCircle, Eye, Radio, CheckCircle2, Clock, CheckSquare } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { Button } from '../components/common/Button';
import { Avatar } from '../components/common/Avatar';
import { PageHeader } from '../components/common/PageHeader';
import { EmptyState } from '../components/common/EmptyState';
import { SkeletonRows } from '../components/common/SkeletonRows';
import { Modal } from '../components/common/Modal';
import { RelativeTime } from '../components/common/RelativeTime';
import { daysSince, toDate } from '../utils/time';
import type { UserProfile } from '../types/user.types';
import type { ActionType } from '../components/users/ApprovalActionDialog';

interface PendingPageProps {
  onInspectUser: (user: UserProfile) => void;
  onActionClick: (user: UserProfile, action: ActionType) => void;
  /** Approves several applicants; resolves with the ones that failed. */
  onBulkApprove: (users: UserProfile[]) => Promise<UserProfile[]>;
}

const requested = (u: UserProfile) => u.requestedAt || u.createdAt;

/** Waiting time chip: amber after 3 days, red after 7. */
const WaitChip: React.FC<{ user: UserProfile }> = ({ user }) => {
  const days = daysSince(requested(user));
  const cls = days >= 7 ? 'is-overdue' : days >= 3 ? 'is-old' : '';
  return (
    <span className={`wait ${cls}`}>
      <Clock size={12} aria-hidden="true" />
      {days === 0 ? 'Today' : `Waiting ${days} day${days === 1 ? '' : 's'}`}
    </span>
  );
};

export const PendingPage: React.FC<PendingPageProps> = ({ onInspectUser, onActionClick, onBulkApprove }) => {
  // Single shared real-time listener (NotificationContext)
  const { pendingUsers, pendingLoading: loading } = useNotifications();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmBulk, setConfirmBulk] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkResult, setBulkResult] = useState<string | null>(null);

  // Oldest first: whoever has waited longest is reviewed first.
  const queue = useMemo(
    () =>
      [...pendingUsers].sort(
        (a, b) => (toDate(requested(a))?.getTime() ?? 0) - (toDate(requested(b))?.getTime() ?? 0)
      ),
    [pendingUsers]
  );
  // Drop selections that left the queue (approved elsewhere, etc.)
  const selectedUsers = queue.filter((u) => selected.has(u.uid));
  const allSelected = queue.length > 0 && selectedUsers.length === queue.length;

  const toggle = (uid: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(uid) ? next.delete(uid) : next.add(uid);
      return next;
    });

  const runBulk = async () => {
    setBulkBusy(true);
    const failed = await onBulkApprove(selectedUsers);
    setBulkBusy(false);
    setConfirmBulk(false);
    setSelected(new Set(failed.map((f) => f.uid)));
    const ok = selectedUsers.length - failed.length;
    setBulkResult(
      failed.length
        ? `${ok} approved. ${failed.length} could not be approved and are still selected.`
        : `${ok} applicant${ok === 1 ? '' : 's'} approved.`
    );
  };

  return (
    <div className="stack">
      <PageHeader
        title={`Pending review${queue.length ? ` (${queue.length})` : ''}`}
        subtitle="Oldest applications first. Applicants can't use the app until approved."
        actions={
          <span className="wait" style={{ background: 'var(--status-approved-bg)', color: 'var(--status-approved-text)' }}>
            <Radio size={13} className="animate-pulse" aria-hidden="true" /> Live
          </span>
        }
      />

      {bulkResult ? (
        <div role="status" className="callout" style={{ padding: '10px 14px', fontSize: 13 }}>
          {bulkResult}
          <button className="btn btn-ghost btn-sm" onClick={() => setBulkResult(null)}>Dismiss</button>
        </div>
      ) : null}

      {queue.length > 1 && (
        <div className={selectedUsers.length ? 'bulk-bar' : ''} style={selectedUsers.length ? undefined : { display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <input
              type="checkbox"
              className="checkbox"
              style={{ marginTop: 0 }}
              checked={allSelected}
              onChange={() => setSelected(allSelected ? new Set() : new Set(queue.map((u) => u.uid)))}
            />
            {selectedUsers.length ? `${selectedUsers.length} selected` : 'Select all'}
          </label>
          {selectedUsers.length ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())} style={{ color: '#CBD5E1' }}>
                Clear
              </Button>
              <Button variant="success" size="sm" icon={<CheckSquare size={14} aria-hidden="true" />} onClick={() => setConfirmBulk(true)}>
                Approve {selectedUsers.length}
              </Button>
            </div>
          ) : null}
        </div>
      )}

      {loading ? (
        <div className="card" style={{ padding: 0 }}>
          <SkeletonRows rows={4} />
        </div>
      ) : queue.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={CheckCircle2}
            tone="success"
            title="All caught up"
            text="No applications are waiting. New ones appear here automatically."
          />
        </div>
      ) : (
        <ul className="queue" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {queue.map((u) => {
            const isSel = selected.has(u.uid);
            return (
              <li key={u.uid} className={`queue-card ${isSel ? 'is-selected' : ''}`}>
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={isSel}
                  onChange={() => toggle(u.uid)}
                  aria-label={`Select ${u.displayName}`}
                />
                <div style={{ minWidth: 0 }}>
                  <div className="person">
                    <Avatar name={u.displayName} photoURL={u.photoURL} size={40} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span className="person-name" style={{ fontSize: 15 }}>{u.displayName}</span>
                        <WaitChip user={u} />
                      </div>
                      <div className="person-sub">{u.email}</div>
                    </div>
                  </div>
                  <div className="queue-facts">
                    <span>Role <b>{u.designation || '—'}</b></span>
                    <span>Department <b>{u.department || '—'}</b></span>
                    {u.program ? <span>Program <b>{u.program}</b></span> : null}
                    {u.batch ? <span>Batch <b>{u.batch}</b></span> : null}
                    <span>ID <b>{u.studentId || 'Not given'}</b></span>
                    <span>
                      Applied <RelativeTime value={requested(u)} style={{ fontWeight: 600, color: 'var(--text-primary)' }} />
                    </span>
                  </div>
                </div>
                <div className="queue-actions">
                  <Button variant="ghost" size="sm" icon={<Eye size={14} aria-hidden="true" />} onClick={() => onInspectUser(u)}>
                    Details
                  </Button>
                  <Button variant="soft-danger" size="sm" icon={<XCircle size={14} aria-hidden="true" />} onClick={() => onActionClick(u, 'reject')}>
                    Reject
                  </Button>
                  <Button variant="success" size="sm" icon={<CheckCircle size={14} aria-hidden="true" />} onClick={() => onActionClick(u, 'approve')}>
                    Approve
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Modal
        isOpen={confirmBulk}
        onClose={() => !bulkBusy && setConfirmBulk(false)}
        title={`Approve ${selectedUsers.length} applicant${selectedUsers.length === 1 ? '' : 's'}?`}
        maxWidth="480px"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmBulk(false)} disabled={bulkBusy}>Cancel</Button>
            <Button variant="success" onClick={runBulk} loading={bulkBusy}>Approve all</Button>
          </>
        }
      >
        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
          They'll get full access to CSE Research Hub and appear in the researcher directory.
        </p>
        <ul style={{ margin: '12px 0 0', paddingLeft: 18, fontSize: 13.5, maxHeight: 200, overflowY: 'auto' }}>
          {selectedUsers.map((u) => (
            <li key={u.uid}>
              <b>{u.displayName}</b> · {u.designation} · ID {u.studentId || 'not given'}
            </li>
          ))}
        </ul>
      </Modal>
    </div>
  );
};
