import React, { useEffect, useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Avatar } from '../common/Avatar';
import { AlertTriangle } from 'lucide-react';
import type { UserProfile } from '../../types/user.types';

export type ActionType = 'approve' | 'reject' | 'suspend' | 'reinstate';

interface ApprovalActionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  actionType: ActionType;
  onConfirm: (user: UserProfile, reason?: string) => Promise<void>;
}

const REJECT_TEMPLATES: { label: string; text: string }[] = [
  { label: 'ID not verified', text: 'Your student / faculty ID could not be verified with department records. Please contact the CSE office and apply again.' },
  { label: 'Not a CSE member', text: 'CSE Research Hub is limited to members of the CSE department.' },
  { label: 'Incomplete profile', text: 'Your profile is missing required academic details. Please complete it and submit again.' },
  { label: 'Duplicate account', text: 'An account already exists for you. Please sign in with your existing account.' }
];

const REASON_MAX = 500;

export const ApprovalActionDialog: React.FC<ApprovalActionDialogProps> = ({ isOpen, onClose, user, actionType, onConfirm }) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setReason('');
      setError(null);
    }
  }, [isOpen, user?.uid, actionType]);

  if (!user) return null;
  const name = user.displayName;

  const config = {
    approve: {
      title: `Approve ${name}?`,
      btnText: 'Approve',
      btnVariant: 'success' as const,
      description: 'They’ll get full access to CSE Research Hub and appear in the researcher directory.'
    },
    reject: {
      title: `Reject ${name}’s application?`,
      btnText: 'Reject application',
      btnVariant: 'danger' as const,
      description: 'They won’t be able to use the app. They can correct their details and apply again. The reason below is shown to them.'
    },
    suspend: {
      title: `Suspend ${name}?`,
      btnText: 'Suspend account',
      btnVariant: 'danger' as const,
      description: 'Their access is blocked right away and they’re removed from the researcher directory. Their data is kept, and you can reinstate them later.'
    },
    reinstate: {
      title: `Reinstate ${name}?`,
      btnText: 'Reinstate',
      btnVariant: 'primary' as const,
      description: 'Their account becomes approved again and they reappear in the researcher directory.'
    }
  }[actionType];

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      await onConfirm(user, reason);
      onClose();
    } catch (err: any) {
      setError(err?.code === 'permission-denied' ? 'Permission denied by security rules.' : err?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !loading && onClose()}
      title={config.title}
      maxWidth="520px"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant={config.btnVariant} onClick={handleConfirm} loading={loading}>{config.btnText}</Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="person" style={{ padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--bg-surface-subtle)' }}>
          <Avatar name={user.displayName} photoURL={user.photoURL} size={36} />
          <div style={{ minWidth: 0 }}>
            <div className="person-name">{user.displayName}</div>
            <div className="person-sub">
              {user.designation} · {user.department}
              {user.studentId ? ` · ID ${user.studentId}` : ''}
            </div>
          </div>
        </div>

        <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0 }}>{config.description}</p>

        {actionType === 'reject' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label htmlFor="rejection-reason" style={{ fontSize: 13, fontWeight: 600 }}>
              Reason <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(optional, shown to the applicant)</span>
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }} role="group" aria-label="Common reasons">
              {REJECT_TEMPLATES.map((t) => (
                <button
                  key={t.label}
                  type="button"
                  className={`chip ${reason === t.text ? 'is-active' : ''}`}
                  onClick={() => setReason(t.text)}
                  aria-pressed={reason === t.text}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <textarea
              id="rejection-reason"
              className="input"
              rows={3}
              maxLength={REASON_MAX}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Pick a reason above or write your own."
              style={{ resize: 'vertical' }}
            />
            <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
              {reason.length}/{REASON_MAX}
            </div>
          </div>
        )}

        {error && (
          <div role="alert" style={{ padding: '10px 14px', backgroundColor: 'var(--status-rejected-bg)', color: 'var(--status-rejected-text)', borderRadius: 'var(--radius-sm)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={16} aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </Modal>
  );
};
