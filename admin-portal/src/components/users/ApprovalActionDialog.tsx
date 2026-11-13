import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { AlertTriangle, CheckCircle, XCircle, ShieldAlert } from 'lucide-react';
import type { UserProfile } from '../../types/user.types';

export type ActionType = 'approve' | 'reject' | 'suspend' | 'reinstate';

interface ApprovalActionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  actionType: ActionType;
  onConfirm: (user: UserProfile, reason?: string) => Promise<void>;
}

export const ApprovalActionDialog: React.FC<ApprovalActionDialogProps> = ({
  isOpen,
  onClose,
  user,
  actionType,
  onConfirm
}) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  const getActionConfig = () => {
    switch (actionType) {
      case 'approve':
        return {
          title: 'Confirm Profile Approval',
          icon: <CheckCircle size={22} color="#16A34A" />,
          btnText: 'Confirm Approval',
          btnVariant: 'success' as const,
          description: `Are you sure you want to approve "${user.displayName}"? The scholar will be granted full access to CSE Research Hub collaboration and discovery features.`
        };
      case 'reject':
        return {
          title: 'Confirm Profile Rejection',
          icon: <XCircle size={22} color="#DC2626" />,
          btnText: 'Confirm Rejection',
          btnVariant: 'danger' as const,
          description: `Are you sure you want to decline the registration for "${user.displayName}"? The user will be barred from access.`
        };
      case 'suspend':
        return {
          title: 'Suspend Scholar Account',
          icon: <ShieldAlert size={22} color="#DC2626" />,
          btnText: 'Suspend Account',
          btnVariant: 'danger' as const,
          description: `Suspending "${user.displayName}" will immediately disable their access to platform features while preserving their profile data.`
        };
      case 'reinstate':
        return {
          title: 'Reinstate Scholar Account',
          icon: <CheckCircle size={22} color="#2563EB" />,
          btnText: 'Reinstate Account',
          btnVariant: 'primary' as const,
          description: `Reinstating "${user.displayName}" will restore their approved status and grant active access to the platform.`
        };
    }
  };

  const config = getActionConfig();

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      await onConfirm(user, reason);
      onClose();
      setReason('');
    } catch (err: any) {
      setError(err.message || 'Operation failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={config.title} maxWidth="500px">
      <div style={{ display: 'flex', gap: '14px', marginBottom: '16px' }}>
        <div style={{ marginTop: '2px' }}>{config.icon}</div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0 }}>
            {config.description}
          </p>
        </div>
      </div>

      {actionType === 'reject' && (
        <div style={{ marginBottom: '20px' }}>
          <label
            htmlFor="rejection-reason"
            style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}
          >
            Rejection Reason / Office Note (Optional, max 500 chars):
          </label>
          <textarea
            id="rejection-reason"
            className="input"
            rows={3}
            maxLength={500}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Enrollment ID could not be verified with department records. Please contact office."
            style={{ resize: 'vertical', width: '100%' }}
          />
        </div>
      )}

      {error && (
        <div
          style={{
            padding: '10px 14px',
            backgroundColor: 'var(--status-rejected-bg)',
            color: 'var(--status-rejected-text)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '13px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant={config.btnVariant} onClick={handleConfirm} loading={loading}>
          {config.btnText}
        </Button>
      </div>
    </Modal>
  );
};

