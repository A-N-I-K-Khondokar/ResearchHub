import React from 'react';
import { useNotifications } from '../context/NotificationContext';
import { Bell, ArrowRight, ShieldCheck, CheckCheck, Trash2 } from 'lucide-react';
import { Button } from '../components/common/Button';

interface ActivityPageProps {
  onInspectUser: (uid: string) => void;
}

export const ActivityPage: React.FC<ActivityPageProps> = ({ onInspectUser }) => {
  const { notifications, unreadCount, markAllAsRead, clearNotifications } = useNotifications();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Session Event & Notification Log
          </h2>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Real-time applicant arrivals detected while the administrative portal is active
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {unreadCount > 0 && (
            <Button variant="secondary" size="sm" icon={<CheckCheck size={14} />} onClick={markAllAsRead}>
              Mark All Read
            </Button>
          )}
          {notifications.length > 0 && (
            <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} onClick={clearNotifications}>
              Clear Session Log
            </Button>
          )}
        </div>
      </div>

      {/* Info Callout */}
      <div
        style={{
          padding: '16px 20px',
          backgroundColor: 'var(--bg-surface-subtle)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          fontSize: '13px',
          color: 'var(--text-secondary)'
        }}
      >
        <ShieldCheck size={18} color="var(--color-brand)" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong>Operational Model Note:</strong> In-app notifications are captured in real-time while this Admin Portal remains open and authenticated. For scheduled asynchronous email alerts when offline, the Google Apps Script outbox polling service handles email dispatches to <code>anik.khondokar09@gmail.com</code>.
        </div>
      </div>

      {/* Event Items */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {notifications.length === 0 ? (
          <div style={{ padding: '60px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Bell size={32} style={{ margin: '0 auto 12px auto', opacity: 0.4 }} />
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
              No Events Recorded in Current Session
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto' }}>
              As students and researchers submit profile registrations, live notifications will stream into this log.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {notifications.map((item) => (
              <div
                key={item.id}
                style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  backgroundColor: item.read ? 'transparent' : 'var(--color-brand-light)',
                  transition: 'background-color var(--transition-fast)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-surface-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--color-brand)'
                    }}
                  >
                    <Bell size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {item.title} — {item.applicantName}
                    </div>
                    <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                      {item.message}
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} &bull; {new Date(item.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {item.applicantUid && (
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<ArrowRight size={13} />}
                    onClick={() => onInspectUser(item.applicantUid)}
                  >
                    Inspect Profile
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
