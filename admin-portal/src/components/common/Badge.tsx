import React from 'react';
import { CheckCircle2, Clock, XCircle, AlertOctagon } from 'lucide-react';
import type { ApprovalStatus } from '../../types/user.types';

interface BadgeProps {
  status: ApprovalStatus;
  showIcon?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({ status, showIcon = true }) => {
  const getIcon = () => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 size={13} />;
      case 'pending':
        return <Clock size={13} />;
      case 'rejected':
        return <XCircle size={13} />;
      case 'suspended':
        return <AlertOctagon size={13} />;
    }
  };

  return (
    <span className={`badge badge-${status}`}>
      {showIcon && getIcon()}
      <span>{status}</span>
    </span>
  );
};

