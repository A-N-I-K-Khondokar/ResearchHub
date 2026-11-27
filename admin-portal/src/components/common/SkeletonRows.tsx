import React from 'react';

/** Placeholder rows while lists load. */
export const SkeletonRows: React.FC<{ rows?: number }> = ({ rows = 4 }) => (
  <div aria-busy="true" aria-label="Loading" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
    {Array.from({ length: rows }, (_, i) => (
      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div className="skeleton" style={{ width: 36, height: 36, borderRadius: 999 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div className="skeleton" style={{ width: '40%', height: 12 }} />
          <div className="skeleton" style={{ width: '25%', height: 10 }} />
        </div>
        <div className="skeleton" style={{ width: 90, height: 28 }} />
      </div>
    ))}
  </div>
);
