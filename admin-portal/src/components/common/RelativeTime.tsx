import React from 'react';
import { exactTime, relativeTime, toDate } from '../../utils/time';

/** "2 days ago", exact date on hover / for screen readers. */
export const RelativeTime: React.FC<{ value: any; style?: React.CSSProperties }> = ({ value, style }) => {
  const d = toDate(value);
  if (!d) return <span style={style}>—</span>;
  return (
    <time dateTime={d.toISOString()} title={exactTime(d)} style={style}>
      {relativeTime(d)}
    </time>
  );
};
