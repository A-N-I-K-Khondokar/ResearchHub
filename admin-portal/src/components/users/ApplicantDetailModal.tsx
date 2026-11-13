import React from 'react';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import {
  Globe,
  Github,
  Linkedin,
  GraduationCap,
  BookOpen,
  Calendar,
  CheckCircle,
  XCircle,
  ShieldAlert,
  RotateCcw
} from 'lucide-react';
import type { UserProfile } from '../../types/user.types';
import type { ActionType } from './ApprovalActionDialog';

interface ApplicantDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onActionClick: (user: UserProfile, action: ActionType) => void;
}

export const ApplicantDetailModal: React.FC<ApplicantDetailModalProps> = ({
  isOpen,
  onClose,
  user,
  onActionClick
}) => {
  if (!user) return null;

  const formatDate = (ts: any) => {
    if (!ts) return 'N/A';
    if (ts.toDate) return ts.toDate().toLocaleString();
    if (ts instanceof Date) return ts.toLocaleString();
    return String(ts);
  };

  const socialLinks = user.socialLinks || {};

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Scholar Profile Inspection" maxWidth="640px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Header Summary */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt=""
              style={{ width: '56px', height: '56px', borderRadius: 'var(--radius-full)', objectFit: 'cover' }}
            />
          ) : (
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--color-brand)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                fontWeight: 700
              }}
            >
              {(user.displayName || 'U')[0].toUpperCase()}
            </div>
          )}

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {user.displayName}
              </h3>
              <Badge status={user.approvalStatus} />
            </div>
            <div style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {user.email}
            </div>
          </div>
        </div>

        {/* Academic Profile Details Table */}
        <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
            <tbody>
              <tr>
                <td style={{ width: '130px', padding: '10px 14px', background: 'var(--bg-surface-subtle)', color: 'var(--text-secondary)', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>Department</td>
                <td style={{ padding: '10px 14px', color: 'var(--text-primary)', borderBottom: '1px solid var(--border)' }}>{user.department}</td>
              </tr>
              <tr>
                <td style={{ padding: '10px 14px', background: 'var(--bg-surface-subtle)', color: 'var(--text-secondary)', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>Designation</td>
                <td style={{ padding: '10px 14px', color: 'var(--text-primary)', borderBottom: '1px solid var(--border)' }}>{user.designation}</td>
              </tr>
              <tr>
                <td style={{ padding: '10px 14px', background: 'var(--bg-surface-subtle)', color: 'var(--text-secondary)', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>Program</td>
                <td style={{ padding: '10px 14px', color: 'var(--text-primary)', borderBottom: '1px solid var(--border)' }}>{user.program || 'Not specified'}</td>
              </tr>
              <tr>
                <td style={{ padding: '10px 14px', background: 'var(--bg-surface-subtle)', color: 'var(--text-secondary)', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>Batch</td>
                <td style={{ padding: '10px 14px', color: 'var(--text-primary)', borderBottom: '1px solid var(--border)' }}>{user.batch || 'Not specified'}</td>
              </tr>
              <tr>
                <td style={{ padding: '10px 14px', background: 'var(--bg-surface-subtle)', color: 'var(--text-secondary)', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>Student / Faculty ID</td>
                <td style={{ padding: '10px 14px', color: 'var(--text-primary)', borderBottom: '1px solid var(--border)' }}>{user.studentId || 'Not specified'}</td>
              </tr>
              <tr>
                <td style={{ padding: '10px 14px', background: 'var(--bg-surface-subtle)', color: 'var(--text-secondary)', fontWeight: 600 }}>Firebase UID</td>
                <td style={{ padding: '10px 14px', color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '12px' }}>{user.uid}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Bio */}
        {user.bio && (
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Biography & Research Focus:
            </div>
            <div style={{ fontSize: '13.5px', color: 'var(--text-primary)', lineHeight: '1.5', background: 'var(--bg-surface-subtle)', padding: '12px 14px', borderRadius: 'var(--radius-sm)' }}>
              {user.bio}
            </div>
          </div>
        )}

        {/* Research Interests */}
        <div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Research Domain Interests:
          </div>
          {user.researchInterests && user.researchInterests.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {user.researchInterests.map((interest, idx) => (
                <span
                  key={idx}
                  style={{
                    background: 'var(--color-brand-light)',
                    color: 'var(--color-brand-dark)',
                    fontSize: '12px',
                    fontWeight: 600,
                    padding: '3px 9px',
                    borderRadius: 'var(--radius-full)'
                  }}
                >
                  {interest}
                </span>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              No research domain tags listed.
            </div>
          )}
        </div>

        {/* Academic Links */}
        <div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Academic & Web Presence:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {socialLinks.website && (
              <a href={socialLinks.website} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
                <Globe size={14} /> Website
              </a>
            )}
            {socialLinks.github && (
              <a href={socialLinks.github} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
                <Github size={14} /> GitHub
              </a>
            )}
            {socialLinks.linkedin && (
              <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
                <Linkedin size={14} /> LinkedIn
              </a>
            )}
            {socialLinks.googleScholar && (
              <a href={socialLinks.googleScholar} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
                <GraduationCap size={14} /> Google Scholar
              </a>
            )}
            {socialLinks.researchGate && (
              <a href={socialLinks.researchGate} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
                <BookOpen size={14} /> ResearchGate
              </a>
            )}
            {!socialLinks.website && !socialLinks.github && !socialLinks.linkedin && !socialLinks.googleScholar && !socialLinks.researchGate && (
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                No external links provided.
              </div>
            )}
          </div>
        </div>

        {/* History / Audit Timestamps */}
        <div style={{ background: 'var(--bg-surface-subtle)', padding: '12px 14px', borderRadius: 'var(--radius-sm)', fontSize: '12px', color: 'var(--text-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <Calendar size={13} />
            <span>Requested: {formatDate(user.requestedAt || user.createdAt)}</span>
          </div>
          {user.approvedAt && (
            <div>Approved: {formatDate(user.approvedAt)} (by {user.approvedBy || 'Admin'})</div>
          )}
          {user.rejectionReason && (
            <div style={{ color: 'var(--status-rejected-text)', marginTop: '4px' }}>
              <strong>Rejection note:</strong> {user.rejectionReason}
            </div>
          )}
        </div>

        {/* Contextual Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
          {user.approvalStatus === 'pending' && (
            <>
              <Button
                variant="danger"
                icon={<XCircle size={15} />}
                onClick={() => onActionClick(user, 'reject')}
              >
                Reject Application
              </Button>
              <Button
                variant="success"
                icon={<CheckCircle size={15} />}
                onClick={() => onActionClick(user, 'approve')}
              >
                Approve Scholar
              </Button>
            </>
          )}

          {user.approvalStatus === 'approved' && (
            <Button
              variant="danger"
              icon={<ShieldAlert size={15} />}
              onClick={() => onActionClick(user, 'suspend')}
            >
              Suspend Account
            </Button>
          )}

          {(user.approvalStatus === 'suspended' || user.approvalStatus === 'rejected') && (
            <Button
              variant="primary"
              icon={<RotateCcw size={15} />}
              onClick={() => onActionClick(user, 'reinstate')}
            >
              Reinstate to Approved
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

