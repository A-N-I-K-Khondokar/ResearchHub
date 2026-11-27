import React from 'react';
import { LayoutDashboard, UserCheck, Users, Activity, LogOut, Sun, Moon, ShieldCheck, GraduationCap, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Avatar } from '../common/Avatar';

export type NavTab = 'overview' | 'pending' | 'users' | 'activity';

export const NAV_LABELS: Record<NavTab, string> = {
  overview: 'Overview',
  pending: 'Pending review',
  users: 'Users',
  activity: 'Activity'
};

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  pendingCount?: number;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

/** Collapses into an off-canvas drawer under 960px (see .sidebar in index.css). */
export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  pendingCount = 0,
  isOpenMobile = false,
  onCloseMobile
}) => {
  const { user, adminRecord, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const navItems: { id: NavTab; icon: typeof Users; badge?: number }[] = [
    { id: 'overview', icon: LayoutDashboard },
    { id: 'pending', icon: UserCheck, badge: pendingCount },
    { id: 'users', icon: Users },
    { id: 'activity', icon: Activity }
  ];

  return (
    <>
      {isOpenMobile && <div className="sidebar-backdrop" onClick={onCloseMobile} aria-hidden="true" />}

      <aside className={`sidebar ${isOpenMobile ? 'is-open' : ''}`} aria-label="Main navigation">
        {/* Brand */}
        <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 38, height: 38, borderRadius: 'var(--radius-md)', background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0
            }}
          >
            <GraduationCap size={21} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>CSE Research Hub</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-sidebar-muted)', letterSpacing: '0.6px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4 }}>
              <ShieldCheck size={12} color="#60A5FA" /> Admin
            </div>
          </div>
          {isOpenMobile ? (
            <button onClick={onCloseMobile} className="nav-item" style={{ width: 'auto', padding: 6 }} aria-label="Close menu">
              <X size={18} />
            </button>
          ) : null}
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                className={`nav-item ${active ? 'is-active' : ''}`}
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile?.();
                }}
                aria-current={active ? 'page' : undefined}
              >
                <Icon size={18} aria-hidden="true" />
                <span style={{ flex: 1 }}>{NAV_LABELS[item.id]}</span>
                {item.badge ? (
                  <span className="nav-badge" aria-label={`${item.badge} waiting`}>
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

        {/* Signed-in admin + theme / sign out */}
        <div style={{ padding: '14px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px' }}>
            <Avatar name={user?.displayName || user?.email} photoURL={user?.photoURL} size={32} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.displayName || 'Administrator'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-sidebar-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {adminRecord?.email || user?.email}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={toggleTheme} className="nav-item" style={{ justifyContent: 'center', border: '1px solid rgba(255,255,255,0.1)', padding: 8, fontSize: 12.5 }}>
              {theme === 'dark' ? <Sun size={14} aria-hidden="true" /> : <Moon size={14} aria-hidden="true" />}
              {theme === 'dark' ? 'Light' : 'Dark'}
            </button>
            <button
              onClick={logout}
              className="nav-item"
              style={{ justifyContent: 'center', border: '1px solid rgba(220,38,38,0.3)', color: '#F87171', padding: 8, fontSize: 12.5 }}
            >
              <LogOut size={14} aria-hidden="true" />
              Sign out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
