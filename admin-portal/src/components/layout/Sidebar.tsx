import React from 'react';
import { LayoutDashboard, UserCheck, Users, Activity, ShieldCheck, X, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../common/Avatar';

export type NavTab = 'overview' | 'pending' | 'users' | 'activity';

export const NAV_LABELS: Record<NavTab, string> = {
  overview: 'Overview',
  pending: 'Pending review',
  users: 'Users',
  activity: 'Activity'
};

/** Keyboard shortcut per page: ⌥1 … ⌥4 (handled in AdminLayout). */
export const NAV_ORDER: NavTab[] = ['overview', 'pending', 'users', 'activity'];

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  pendingCount?: number;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}

const GROUPS: { label: string; items: { id: NavTab; icon: typeof Users }[] }[] = [
  { label: 'Review', items: [{ id: 'overview', icon: LayoutDashboard }, { id: 'pending', icon: UserCheck }] },
  { label: 'Directory', items: [{ id: 'users', icon: Users }, { id: 'activity', icon: Activity }] }
];

/** Off-canvas drawer under 960px; collapsible to icons on desktop. */
export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  pendingCount = 0,
  isOpenMobile = false,
  onCloseMobile,
  collapsed = false,
  onToggleCollapsed
}) => {
  const { user, adminRecord } = useAuth();

  return (
    <>
      {isOpenMobile && <div className="sidebar-backdrop" onClick={onCloseMobile} aria-hidden="true" />}

      <aside className={`sidebar ${isOpenMobile ? 'is-open' : ''} ${collapsed ? 'is-collapsed' : ''}`} aria-label="Main navigation">
        {/* Brand */}
        <div className="brand-row" style={{ padding: '18px 18px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="/favicon.svg" alt="" width={38} height={38} style={{ borderRadius: 10, flexShrink: 0 }} />
          <div className="brand-text" style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>CSE Research Hub</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-sidebar-muted)', letterSpacing: '0.6px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4 }}>
              <ShieldCheck size={12} color="#60A5FA" aria-hidden="true" /> Admin
            </div>
          </div>
          {isOpenMobile ? (
            <button onClick={onCloseMobile} className="nav-item" style={{ width: 'auto', minHeight: 32, padding: 6 }} aria-label="Close menu">
              <X size={18} />
            </button>
          ) : null}
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '4px 12px 12px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
          {GROUPS.map((g) => (
            <React.Fragment key={g.label}>
              <div className="nav-section">{g.label}</div>
              {g.items.map((item) => {
                const Icon = item.icon;
                const active = currentTab === item.id;
                const badge = item.id === 'pending' && pendingCount > 0 ? pendingCount : null;
                const key = NAV_ORDER.indexOf(item.id) + 1;
                return (
                  <button
                    key={item.id}
                    className={`nav-item ${active ? 'is-active' : ''}`}
                    onClick={() => {
                      onSelectTab(item.id);
                      onCloseMobile?.();
                    }}
                    aria-current={active ? 'page' : undefined}
                    aria-keyshortcuts={`Alt+${key}`}
                    title={collapsed ? `${NAV_LABELS[item.id]} (⌥${key})` : undefined}
                  >
                    <Icon size={18} aria-hidden="true" color={active ? '#60A5FA' : 'currentColor'} />
                    <span className="nav-label" style={{ flex: 1 }}>{NAV_LABELS[item.id]}</span>
                    {badge ? (
                      <span className="nav-badge" aria-label={`${badge} waiting`}>
                        {badge}
                      </span>
                    ) : (
                      <span className="nav-kbd" aria-hidden="true">⌥{key}</span>
                    )}
                  </button>
                );
              })}
            </React.Fragment>
          ))}
        </nav>

        {/* Signed-in admin + collapse */}
        <div style={{ padding: 12, borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="brand-row" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 6px' }} title={collapsed ? adminRecord?.email || user?.email || '' : undefined}>
            <Avatar name={user?.displayName || user?.email} photoURL={user?.photoURL} size={32} />
            <div className="brand-text" style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.displayName || 'Administrator'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-sidebar-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {adminRecord?.email || user?.email}
              </div>
            </div>
          </div>
          {onToggleCollapsed ? (
            <button className="collapse-btn" onClick={onToggleCollapsed} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} aria-pressed={collapsed}>
              {collapsed ? <PanelLeftOpen size={16} aria-hidden="true" /> : <PanelLeftClose size={16} aria-hidden="true" />}
              <span className="collapse-text">Collapse</span>
            </button>
          ) : null}
        </div>
      </aside>
    </>
  );
};
