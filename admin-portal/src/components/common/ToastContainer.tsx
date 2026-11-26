import React from 'react';
import { Bell, X, ArrowRight } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';

interface ToastContainerProps {
  /** Opens the applicant detail modal (wired from App via AdminLayout). */
  onSelectApplicant?: (uid: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ onSelectApplicant }) => {
  const { toasts, dismissToast } = useNotifications();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className="toast">
          <div style={{ marginTop: '2px', color: '#60A5FA' }}>
            <Bell size={18} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '13.5px', marginBottom: '2px' }}>
              {toast.title}
            </div>
            <div style={{ fontSize: '12.5px', color: '#CBD5E1', lineHeight: '1.4' }}>
              {toast.message}
            </div>
            {toast.applicantUid && (
              <button
                onClick={() => {
                  onSelectApplicant?.(toast.applicantUid);
                  dismissToast(toast.id);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#93C5FD',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 0 0 0',
                  marginTop: '4px'
                }}
              >
                Review Applicant <ArrowRight size={12} />
              </button>
            )}
          </div>
          <button
            onClick={() => dismissToast(toast.id)}
            style={{
              background: 'none',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              padding: '2px'
            }}
            aria-label="Dismiss notification"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};

