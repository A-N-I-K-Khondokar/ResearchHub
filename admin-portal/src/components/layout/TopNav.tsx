import React, { useEffect, useRef, useState } from 'react';
import { Bell, Menu, CheckCheck, Trash2, ChevronRight } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { NAV_LABELS, type NavTab } from './Sidebar';
import { RelativeTime } from '../common/RelativeTime';

interface TopNavProps {
  currentTab: NavTab;
  onOpenMobileMenu?: () => void;
  onSelectApplicant?: (uid: string) => void;
}

/**
 * Slim top bar: menu button (small screens), breadcrumb, live alerts.
 * The page title itself lives in each page's PageHeader (no duplicate titles).
 */
export const TopNav: React.FC<TopNavProps> = ({ currentTab, onOpenMobileMenu, onSelectApplicant }) => {
  const { notifications, unreadCount, markAllAsRead, clearNotifications, markAsRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <header className="topnav">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <button onClick={onOpenMobileMenu} className="icon-btn mobile-menu-btn" aria-label="Open menu">
          <Menu size={18} />
        </button>
        <nav className="crumbs" aria-label="Breadcrumb">
          <span>Admin</span>
          <ChevronRight size={14} aria-hidden="true" />
          <strong aria-current="page">{NAV_LABELS[currentTab]}</strong>
        </nav>
      </div>

      <div style={{ position: 'relative' }} ref={ref}>
        <button
          onClick={() => setOpen((v) => !v)}
          className="icon-btn"
          aria-label={unreadCount ? `Live alerts, ${unreadCount} unread` : 'Live alerts'}
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          <Bell size={17} />
          {unreadCount > 0 && <span className="count-dot">{unreadCount > 9 ? '9+' : unreadCount}</span>}
        </button>

        {open && (
          <div
            role="dialog"
            aria-label="Live alerts"
            style={{
              position: 'absolute', right: 0, top: 46, width: 360, maxWidth: 'calc(100vw - 32px)',
              background: 'var(--bg-surface-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-xl)', zIndex: 100, overflow: 'hidden'
            }}
          >
            <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 13.5, fontWeight: 700 }}>
                Live alerts{unreadCount > 0 ? ` · ${unreadCount} new` : ''}
              </div>
              <div style={{ display: 'flex', gap: 2 }}>
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} className="btn btn-ghost btn-sm" style={{ padding: 6 }} aria-label="Mark all as read" title="Mark all as read">
                    <CheckCheck size={15} />
                  </button>
                )}
                {notifications.length > 0 && (
                  <button onClick={clearNotifications} className="btn btn-ghost btn-sm" style={{ padding: 6 }} aria-label="Clear alerts" title="Clear alerts">
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            </div>

            <div style={{ maxHeight: 360, overflowY: 'auto' }}>
              {notifications.length === 0 ? (
                <div style={{ padding: '28px 16px', textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)' }}>
                  No new alerts.
                  <div style={{ fontSize: 12, marginTop: 4, color: 'var(--text-muted)' }}>
                    New applications appear here while this page is open.
                  </div>
                </div>
              ) : (
                notifications.map((item) => (
                  <button
                    key={item.id}
                    className="alert-item"
                    style={{ background: item.read ? 'transparent' : 'var(--color-brand-light)' }}
                    onClick={() => {
                      markAsRead(item.id);
                      if (item.applicantUid) {
                        onSelectApplicant?.(item.applicantUid);
                        setOpen(false);
                      }
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: item.read ? 600 : 700 }}>{item.title}</span>
                      <RelativeTime value={item.timestamp} style={{ fontSize: 11.5, color: 'var(--text-muted)', flexShrink: 0 }} />
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 2 }}>{item.message}</div>
                    {item.applicantUid ? (
                      <div style={{ marginTop: 6, fontSize: 12, color: 'var(--color-brand)', fontWeight: 600 }}>Review application →</div>
                    ) : null}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
