import React from 'react';

/** Photo or initial, one consistent style everywhere. */
export const Avatar: React.FC<{ name?: string | null; photoURL?: string | null; size?: number }> = ({
  name,
  photoURL,
  size = 36
}) =>
  photoURL ? (
    <img src={photoURL} alt="" className="avatar" style={{ width: size, height: size }} />
  ) : (
    <span className="avatar" aria-hidden="true" style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}>
      {(name || '?').trim()[0]?.toUpperCase() || '?'}
    </span>
  );
