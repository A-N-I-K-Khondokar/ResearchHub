import React, { useEffect, useState } from 'react';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Avatar } from '../common/Avatar';
import {
  Globe,
  Github,
  Linkedin,
  GraduationCap,
  FlaskConical,
  CheckCircle,
  XCircle,
  ShieldAlert,
  RotateCcw,
  Pencil,
  Copy,
  Check,
  Send,
  type LucideIcon
} from 'lucide-react';
import { getAdminDirectory, type AcademicCorrection } from '../../services/admin.service';
import { useAuth } from '../../context/AuthContext';
import { exactTime, relativeTime } from '../../utils/time';
import type { UserProfile } from '../../types/user.types';
import type { ActionType } from './ApprovalActionDialog';

interface ApplicantDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onActionClick: (user: UserProfile, action: ActionType) => void;
  /** Admin correction of fields that researchers cannot edit after approval. */
  onCorrectAcademic?: (user: UserProfile, fields: AcademicCorrection) => Promise<void>;
}

const EMPTY_FORM: AcademicCorrection = { department: '', designation: '', program: null, batch: null, studentId: null };

const LINKS: { key: string; label: string; icon: LucideIcon }[] = [
  { key: 'website', label: 'Website', icon: Globe },
  { key: 'googleScholar', label: 'Google Scholar', icon: GraduationCap },
  { key: 'researchGate', label: 'ResearchGate', icon: FlaskConical },
  { key: 'github', label: 'GitHub', icon: Github },
  { key: 'linkedin', label: 'LinkedIn', icon: Linkedin }
];

let adminCache: Promise<Map<string, string>> | null = null;

export const ApplicantDetailModal: React.FC<ApplicantDetailModalProps> = ({ isOpen, onClose, user, onActionClick, onCorrectAcademic }) => {
  const { user: me } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<AcademicCorrection>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [admins, setAdmins] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (!isOpen) return;
    adminCache ??= getAdminDirectory();
    adminCache.then(setAdmins);
  }, [isOpen]);

  // Reset the correction form whenever a different applicant is opened
  useEffect(() => {
    setEditing(false);
    setSaveError(null);
    setCopied(false);
    if (user) {
      setForm({
        department: user.department || '',
        designation: user.designation || '',
        program: user.program ?? null,
        batch: user.batch ?? null,
        studentId: user.studentId ?? null
      });
    }
  }, [user]);

  if (!user) return null;

  const adminName = (uid?: string | null) => (!uid ? 'an admin' : uid === me?.uid ? 'you' : admins.get(uid) || 'another admin');

  const handleSaveCorrection = async () => {
    if (!onCorrectAcademic) return;
    if (!form.department.trim() || !form.designation.trim()) {
      setSaveError('Department and designation are required.');
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      await onCorrectAcademic(user, form);
      setEditing(false);
    } catch (err: any) {
      console.error('[ApplicantDetailModal] Correction failed:', err);
      setSaveError(err?.code === 'permission-denied' ? 'Permission denied by security rules.' : err?.message || 'Could not save the correction.');
    } finally {
      setSaving(false);
    }
  };

  const copyUid = async () => {
    try {
      await navigator.clipboard.writeText(user.uid);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  const fields: { key: keyof AcademicCorrection; label: string; required?: boolean }[] = [
    { key: 'designation', label: 'Role', required: true },
    { key: 'department', label: 'Department', required: true },
    { key: 'program', label: 'Program' },
    { key: 'batch', label: 'Batch' },
    { key: 'studentId', label: 'Student / faculty ID' }
  ];

  const links = LINKS.filter((l) => user.socialLinks?.[l.key]);

  // History timeline from stored fields
  const timeline: { title: string; meta: string; color: string; icon: LucideIcon; note?: string | null }[] = [
    {
      title: 'Applied',
      meta: `${relativeTime(user.requestedAt || user.createdAt)} · ${exactTime(user.requestedAt || user.createdAt)}`,
      color: 'var(--color-brand)',
      icon: Send
    }
  ];
  if (user.approvalStatus === 'approved' || (user.approvalStatus === 'suspended' && user.approvedAt)) {
    timeline.push({
      title: `Approved by ${adminName(user.approvedBy)}`,
      meta: `${relativeTime(user.approvedAt)} · ${exactTime(user.approvedAt)}`,
      color: 'var(--status-approved)',
      icon: CheckCircle
    });
  }
  if (user.approvalStatus === 'rejected') {
    timeline.push({
      title: `Rejected by ${adminName(user.approvedBy)}`,
      meta: `${relativeTime(user.updatedAt)} · ${exactTime(user.updatedAt)}`,
      color: 'var(--status-rejected)',
      icon: XCircle,
      note: user.rejectionReason
    });
  }
  if (user.approvalStatus === 'suspended') {
    timeline.push({
      title: 'Suspended',
      meta: `${relativeTime(user.updatedAt)} · ${exactTime(user.updatedAt)}`,
      color: 'var(--status-suspended)',
      icon: ShieldAlert
    });
  }

  const footer = (
    <>
      {user.approvalStatus === 'pending' && (
        <>
          <Button variant="secondary" icon={<XCircle size={15} aria-hidden="true" />} onClick={() => onActionClick(user, 'reject')}>
            Reject
          </Button>
          <Button variant="success" icon={<CheckCircle size={15} aria-hidden="true" />} onClick={() => onActionClick(user, 'approve')}>
            Approve
          </Button>
        </>
      )}
      {user.approvalStatus === 'approved' && (
        <Button variant="danger" icon={<ShieldAlert size={15} aria-hidden="true" />} onClick={() => onActionClick(user, 'suspend')}>
          Suspend account
        </Button>
      )}
      {(user.approvalStatus === 'suspended' || user.approvalStatus === 'rejected') && (
        <Button variant="primary" icon={<RotateCcw size={15} aria-hidden="true" />} onClick={() => onActionClick(user, 'reinstate')}>
          Reinstate
        </Button>
      )}
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Applicant details" maxWidth="680px" footer={footer}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        {/* Identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Avatar name={user.displayName} photoURL={user.photoURL} size={56} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: 18 }}>{user.displayName}</h3>
              <Badge status={user.approvalStatus} />
            </div>
            <div style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginTop: 2, wordBreak: 'break-all' }}>{user.email}</div>
            <div className="uid-row" style={{ marginTop: 4 }}>
              <span>UID</span>
              <code>{user.uid}</code>
              <button className="btn btn-ghost btn-sm" style={{ padding: 4 }} onClick={copyUid} aria-label="Copy UID" title="Copy UID">
                {copied ? <Check size={13} color="var(--status-approved)" /> : <Copy size={13} />}
              </button>
            </div>
          </div>
        </div>

        {/* Academic details (view / edit) */}
        <section aria-labelledby="acad-title">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div id="acad-title" className="section-label" style={{ marginBottom: 0 }}>Academic details</div>
            {onCorrectAcademic && !editing ? (
              <Button variant="secondary" size="sm" icon={<Pencil size={13} aria-hidden="true" />} onClick={() => setEditing(true)}>
                Edit details
              </Button>
            ) : null}
          </div>

          {!editing ? (
            <dl className="dl">
              {fields.map((f) => {
                const val = user[f.key as keyof UserProfile] as string | null | undefined;
                return (
                  <div key={f.key}>
                    <dt>{f.label}</dt>
                    <dd className={val ? '' : 'is-empty'}>{val || 'Not given'}</dd>
                  </div>
                );
              })}
            </dl>
          ) : (
            <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="dl">
                {fields.map((f) => (
                  <label key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {f.label}
                    {f.required ? ' *' : ''}
                    <input
                      className="input"
                      value={form[f.key] ?? ''}
                      maxLength={f.key === 'batch' || f.key === 'studentId' ? 50 : 100}
                      required={f.required}
                      onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                    />
                  </label>
                ))}
              </div>
              {saveError ? <div role="alert" style={{ fontSize: 12.5, color: 'var(--status-rejected-text)' }}>{saveError}</div> : null}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <Button variant="secondary" size="sm" onClick={() => setEditing(false)} disabled={saving}>Cancel</Button>
                <Button variant="primary" size="sm" onClick={handleSaveCorrection} loading={saving}>Save changes</Button>
              </div>
            </div>
          )}
        </section>

        {/* Bio */}
        {user.bio ? (
          <section>
            <div className="section-label">Bio</div>
            <p style={{ fontSize: 14, lineHeight: 1.55, margin: 0 }}>{user.bio}</p>
          </section>
        ) : null}

        {/* Interests */}
        <section>
          <div className="section-label">Research interests</div>
          {user.researchInterests?.length ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {user.researchInterests.map((interest) => (
                <span key={interest} className="tag">{interest}</span>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>None listed.</div>
          )}
        </section>

        {/* Links */}
        <section>
          <div className="section-label">Links</div>
          {links.length ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {links.map((l) => {
                const Icon = l.icon;
                return (
                  <a key={l.key} href={user.socialLinks?.[l.key]} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
                    <Icon size={14} aria-hidden="true" /> {l.label}
                  </a>
                );
              })}
            </div>
          ) : (
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>No links provided.</div>
          )}
        </section>

        {/* History */}
        <section>
          <div className="section-label">History</div>
          <ol className="timeline">
            {timeline.map((t) => {
              const Icon = t.icon;
              return (
                <li key={t.title}>
                  <span className="timeline-dot" style={{ background: 'var(--bg-surface-subtle)', color: t.color }}>
                    <Icon size={13} aria-hidden="true" />
                  </span>
                  <div>
                    <div className="timeline-title">{t.title}</div>
                    <div className="timeline-meta">{t.meta}</div>
                    {t.note ? <div className="timeline-note">{t.note}</div> : null}
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      </div>
    </Modal>
  );
};
