import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'soft-danger' | 'warning' | 'ghost';
  size?: 'sm' | 'md';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  disabled,
  className = '',
  ...props
}) => {
  const sizeClass = size === 'sm' ? 'btn-sm' : '';
  const variantClass = `btn-${variant}`;

  return (
    <button
      className={`btn ${variantClass} ${sizeClass} ${className}`.trim()}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin" aria-hidden="true" />
      ) : (
        icon
      )}
      {children}
    </button>
  );
};

