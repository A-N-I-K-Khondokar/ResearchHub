import React, { useEffect, useRef, useState } from 'react';
import { Bell, Menu, CheckCheck, Trash2, ChevronRight, ChevronDown, Clock, LogOut, Moon, Sun } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Avatar } from '../common/Avatar';
import { useNotifications } from '../../context/NotificationContext';
import { NAV_LABELS, type NavTab } from './Sidebar';
import { RelativeTime } from '../common/RelativeTime';

interface TopNavProps {
  currentTab: NavTab;
  pendingCount?: number;
  onGoPending?: () => void;
  onOpenMobileMenu?: () => void;
  onSelectApplicant?: (uid: string) => void;
}

/**
 * Slim top bar: menu button (small screens), breadcrumb, live alerts.
 * The page title itself lives in each page's PageHeader (no duplicate titles).
 */
export const TopNav: React.FC<TopNavProps> = ({ currentTab, pendingCount = 0, onGoPending, onOpenMobileMenu, onSelectApplicant }) => {
  const { user, adminRecord, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!accountOpen) return;
    const onDown = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) setAccountOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setAccountOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    accountRef.current?.querySelector<HTMLButtonElement>('.menu-item')?.focus();
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [accountOpen]);

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

      <div className="top-actions">
      {pendingCount > 0 && currentTab !== 'pending' && onGoPending ? (
        <button className="pending-pill" onClick={onGoPending} aria-label={`${pendingCount} applications waiting. Open Pending review`}>
          <Clock size={14} aria-hidden="true" />
          {pendingCount}
          <span className="pill-text">pending</span>
        </button>
      ) : null}
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
                  <button onClick={markAllAsRead} className="btn btn-ghost btn-sm btn-icon" aria-label="Mark all as read" title="Mark all as read">
                    <CheckCheck size={15} />
                  </button>
                )}
                {notifications.length > 0 && (
                  <button onClick={clearNotifications} className="btn btn-ghost btn-sm btn-icon" aria-label="Clear alerts" title="Clear alerts">
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

      {/* Account menu: who is signed in, theme, sign out */}
      <div style={{ position: 'relative' }} ref={accountRef}>
        <button
          className="account-btn"
          onClick={() => setAccountOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={accountOpen}
          aria-label="Account menu"
        >
          <Avatar name={user?.displayName || user?.email} photoURL={user?.photoURL} size={30} />
          <span className="account-name">{(user?.displayName || 'Admin').split(' ')[0]}</span>
          <ChevronDown size={14} aria-hidden="true" color="var(--text-secondary)" />
        </button>
        {accountOpen ? (
          <div className="menu" role="menu" style={{ minWidth: 240 }}>
            <div className="menu-head">
              <div style={{ fontSize: 13.5, fontWeight: 700 }}>{user?.displayName || 'Administrator'}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', wordBreak: 'break-all' }}>{adminRecord?.email || user?.email}</div>
            </div>
            <button
              type="button"
              role="menuitem"
              className="menu-item"
              onClick={() => {
                toggleTheme();
                setAccountOpen(false);
              }}
            >
              {theme === 'dark' ? <Sun size={14} aria-hidden="true" /> : <Moon size={14} aria-hidden="true" />}
              {theme === 'dark' ? 'Light mode' : 'Dark mode'}
            </button>
            <div className="menu-sep" />
            <button
              type="button"
              role="menuitem"
              className="menu-item is-danger"
              onClick={() => {
                setAccountOpen(false);
                logout();
              }}
            >
              <LogOut size={14} aria-hidden="true" />
              Sign out
            </button>
          </div>
        ) : null}
      </div>
      </div>
    </header>
  );
};
