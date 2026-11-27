import React from 'react';

/** The single title of a page, with its actions on the right. */
export const PageHeader: React.FC<{ title: string; subtitle?: React.ReactNode; actions?: React.ReactNode }> = ({
  title,
  subtitle,
  actions
}) => (
  <div className="page-header">
    <div>
      <h1 className="page-title">{title}</h1>
      {subtitle ? <div className="page-subtitle">{subtitle}</div> : null}
    </div>
    {actions ? <div className="page-actions">{actions}</div> : null}
  </div>
);
