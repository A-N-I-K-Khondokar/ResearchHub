import React, { useState, useRef, useEffect } from 'react';
import { Bell, Menu, CheckCheck, Trash2, ExternalLink } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import type { NavTab } from './Sidebar';

interface TopNavProps {
  currentTab: NavTab;
  onOpenMobileMenu?: () => void;
  onSelectApplicant?: (uid: string) => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  currentTab,
  onOpenMobileMenu,
  onSelectApplicant
}) => {
  const { notifications, unreadCount, markAllAsRead, clearNotifications, markAsRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getPageTitle = () => {
    switch (currentTab) {
      case 'overview':
        return { title: 'Dashboard Overview', subtitle: 'Academic researcher registration & platform analytics' };
      case 'pending':
        return { title: 'Pending Applications', subtitle: 'Review and authorize pending departmental scholar accounts' };
      case 'users':
        return { title: 'All Registered Scholars', subtitle: 'Directory and account status management' };
      case 'activity':
        return { title: 'Activity & Audit Log', subtitle: 'Session registration notifications and operational history' };
    }
  };

  const { title, subtitle } = getPageTitle();

  return (
    <header
      style={{
        height: '70px',
        backgroundColor: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px',
        position: 'sticky',
        top: 0,
        zIndex: 30
      }}
    >
      {/* Title & Mobile Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          onClick={onOpenMobileMenu}
          className="btn btn-ghost btn-sm"
          style={{ display: 'none', padding: '8px' }}
          aria-label="Open sidebar menu"
          id="mobile-menu-btn"
        >
          <Menu size={20} />
        </button>

        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
            {title}
          </h1>
          <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
            {subtitle}
          </div>
        </div>
      </div>

      {/* Right Controls: Notifications */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', position: 'relative' }} ref={dropdownRef}>
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className="btn btn-secondary"
          style={{
            position: 'relative',
            padding: '8px 12px',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
          aria-label="View notifications"
        >
          <Bell size={17} />
          <span style={{ fontSize: '13px', fontWeight: 600 }}>Alerts</span>
          {unreadCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                backgroundColor: '#DC2626',
                color: '#FFFFFF',
                fontSize: '10.5px',
                fontWeight: 700,
                padding: '1px 6px',
                borderRadius: 'var(--radius-full)',
                boxShadow: '0 0 0 2px var(--bg-surface)'
              }}
            >
              {unreadCount}
            </span>
          )}
        </button>

        {/* Notifications Popover Dropdown */}
        {showNotifications && (
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: '48px',
              width: '360px',
              backgroundColor: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-xl)',
              zIndex: 100,
              overflow: 'hidden'
            }}
          >
            {/* Dropdown Header */}
            <div
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'var(--bg-surface-subtle)'
              }}
            >
              <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Session Alerts {unreadCount > 0 && `(${unreadCount} unread)`}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    title="Mark all as read"
                    style={{ background: 'none', border: 'none', color: 'var(--color-brand)', cursor: 'pointer', padding: '2px' }}
                  >
                    <CheckCheck size={16} />
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={clearNotifications}
                    title="Clear notification list"
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Notification Items List */}
            <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
              {notifications.length === 0 ? (
                <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                  No new account notifications during this session.
                  <div style={{ fontSize: '11.5px', marginTop: '4px', color: 'var(--text-secondary)' }}>
                    New registrations will trigger live alerts here.
                  </div>
                </div>
              ) : (
                notifications.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      markAsRead(item.id);
                      if (onSelectApplicant && item.applicantUid) {
                        onSelectApplicant(item.applicantUid);
                        setShowNotifications(false);
                      }
                    }}
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid var(--border-subtle)',
                      backgroundColor: item.read ? 'transparent' : 'var(--color-brand-light)',
                      cursor: 'pointer',
                      transition: 'background-color var(--transition-fast)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2px' }}>
                      <span style={{ fontSize: '13px', fontWeight: item.read ? 600 : 700, color: 'var(--text-primary)' }}>
                        {item.title}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                      {item.message}
                    </div>
                    <div style={{ marginTop: '6px', fontSize: '11.5px', color: 'var(--color-brand)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                      Review application <ExternalLink size={11} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

