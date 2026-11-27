import React from 'react';
import type { LucideIcon } from 'lucide-react';

export const EmptyState: React.FC<{
  icon: LucideIcon;
  title: string;
  text?: React.ReactNode;
  tone?: 'neutral' | 'success';
  action?: React.ReactNode;
}> = ({ icon: Icon, title, text, tone = 'neutral', action }) => (
  <div className="empty" role="status">
    <div
      className="empty-icon"
      style={tone === 'success' ? { background: 'var(--status-approved-bg)', color: 'var(--status-approved-text)' } : undefined}
    >
      <Icon size={22} />
    </div>
    <div className="empty-title">{title}</div>
    {text ? <div className="empty-text">{text}</div> : null}
    {action ? <div style={{ marginTop: 10 }}>{action}</div> : null}
  </div>
);
