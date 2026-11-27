import React from 'react';
import { ArrowRight, type LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  accentColor: string;
  /** Short hint under the number, e.g. "Needs review". */
  hint?: string;
  onClick?: () => void;
}

/** Metric tile; a real button, so it works with Tab / Enter. */
export const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, accentColor, hint, onClick }) => (
  <button type="button" className="stat-card" onClick={onClick} aria-label={`${title}: ${value}. View list`}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div className="stat-icon" style={{ background: `${accentColor}1A`, color: accentColor }}>
        <Icon size={18} aria-hidden="true" />
      </div>
      <span className="stat-link" aria-hidden="true">
        View <ArrowRight size={12} />
      </span>
    </div>
    <div className="stat-value">{value}</div>
    <div className="stat-label">
      {title}
      {hint ? <span style={{ color: accentColor, fontWeight: 600 }}> · {hint}</span> : null}
    </div>
  </button>
);
