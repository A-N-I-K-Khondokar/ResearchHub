import React from 'react';
import {
  LayoutDashboard,
  UserCheck,
  Users,
  Activity,
  LogOut,
  Sun,
  Moon,
  ShieldCheck,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export type NavTab = 'overview' | 'pending' | 'users' | 'activity';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  pendingCount?: number;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  pendingCount = 0,
  isOpenMobile = false,
  onCloseMobile
}) => {
  const { user, adminRecord, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    { id: 'overview' as NavTab, label: 'Overview', icon: LayoutDashboard },
    {
      id: 'pending' as NavTab,
      label: 'Pending Requests',
      icon: UserCheck,
      badge: pendingCount > 0 ? pendingCount : null
    },
    { id: 'users' as NavTab, label: 'All Users', icon: Users },
    { id: 'activity' as NavTab, label: 'Activity Log', icon: Activity }
  ];

  const handleNavClick = (tab: NavTab) => {
    onSelectTab(tab);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 40
          }}
        />
      )}

      <aside
        style={{
          width: '260px',
          backgroundColor: 'var(--bg-sidebar)',
          color: 'var(--text-sidebar)',
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid var(--border)',
          zIndex: 50,
          position: isOpenMobile ? 'fixed' : 'sticky',
          top: 0,
          bottom: 0,
          height: '100vh',
          left: isOpenMobile ? 0 : undefined,
          transition: 'transform var(--transition-normal)'
        }}
      >
        {/* Brand Header */}
        <div
          style={{
            padding: '24px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: '0 2px 4px rgba(37,99,235,0.3)'
            }}
          >
            <GraduationCap size={22} />
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.2px' }}>
              CSE Research Hub
            </div>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--text-sidebar-muted)',
                letterSpacing: '0.8px',
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <ShieldCheck size={12} color="#60A5FA" /> Admin Portal
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav style={{ flex: 1, padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '11px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  backgroundColor: isActive ? 'rgba(37, 99, 235, 0.18)' : 'transparent',
                  color: isActive ? '#93C5FD' : 'var(--text-sidebar-muted)',
                  fontSize: '13.5px',
                  fontWeight: isActive ? 600 : 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <Icon size={18} color={isActive ? '#60A5FA' : 'currentColor'} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge !== null && item.badge !== undefined && (
                  <span
                    style={{
                      background: '#D97706',
                      color: '#FFFFFF',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 7px',
                      borderRadius: 'var(--radius-full)'
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Administrator Profile & Actions */}
        <div
          style={{
            padding: '16px 14px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          {/* Admin User Card */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 10px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255, 255, 255, 0.04)'
            }}
          >
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt="Admin avatar"
                style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-full)', objectFit: 'cover' }}
              />
            ) : (
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-full)',
                  background: '#2563EB',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '13px',
                  fontWeight: 700
                }}
              >
                {(user?.displayName || user?.email || 'A')[0].toUpperCase()}
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: '12.5px',
                  fontWeight: 600,
                  color: '#FFFFFF',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {user?.displayName || 'Administrator'}
              </div>
              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--text-sidebar-muted)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {adminRecord?.email || user?.email}
              </div>
            </div>
          </div>

          {/* Quick Actions (Theme & Logout) */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={toggleTheme}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '8px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'transparent',
                color: 'var(--text-sidebar-muted)',
                fontSize: '12px',
                cursor: 'pointer'
              }}
              title="Toggle Light/Dark Theme"
            >
              {theme === 'dark' ? <Sun size={14} color="#FBBF24" /> : <Moon size={14} color="#94A3B8" />}
              <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
            </button>

            <button
              onClick={logout}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '8px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(220, 38, 38, 0.3)',
                background: 'rgba(220, 38, 38, 0.1)',
                color: '#F87171',
                fontSize: '12px',
                cursor: 'pointer'
              }}
              title="Sign Out"
            >
              <LogOut size={14} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

