import React, { useEffect, useState } from 'react';
import { Sidebar, NAV_LABELS, NAV_ORDER, type NavTab } from './Sidebar';
import { TopNav } from './TopNav';
import { ToastContainer } from '../common/ToastContainer';

interface AdminLayoutProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  pendingCount?: number;
  onSelectApplicant?: (uid: string) => void;
  children: React.ReactNode;
}

const COLLAPSE_KEY = 'cse_admin_sidebar_collapsed';

export const AdminLayout: React.FC<AdminLayoutProps> = ({ currentTab, onSelectTab, pendingCount = 0, onSelectApplicant, children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSE_KEY) === '1');

  useEffect(() => {
    localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0');
  }, [collapsed]);

  // Browser tab title: page name, with the pending count up front when there is one.
  useEffect(() => {
    document.title = `${pendingCount > 0 ? `(${pendingCount}) ` : ''}${NAV_LABELS[currentTab]} · Admin`;
  }, [currentTab, pendingCount]);

  // Keyboard shortcuts: Alt/Option + 1…4 switch pages (ignored while typing).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!e.altKey || e.ctrlKey || e.metaKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName))) return;
      const n = /^Digit([1-4])$/.exec(e.code)?.[1];
      if (!n) return;
      e.preventDefault();
      onSelectTab(NAV_ORDER[Number(n) - 1]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onSelectTab]);

  return (
    <div className="app-container">
      {/* Not an href: "#main" would be read as a route by the hash router */}
      <button
        type="button"
        className="sr-only btn btn-primary btn-sm"
        style={{ position: 'absolute', top: 8, left: 8, zIndex: 100 }}
        onFocus={(e) => e.currentTarget.classList.remove('sr-only')}
        onBlur={(e) => e.currentTarget.classList.add('sr-only')}
        onClick={() => document.getElementById('main')?.focus()}
      >
        Skip to content
      </button>
      <Sidebar
        currentTab={currentTab}
        onSelectTab={onSelectTab}
        pendingCount={pendingCount}
        isOpenMobile={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((v) => !v)}
      />

      <div className="main-content">
        <TopNav
          currentTab={currentTab}
          pendingCount={pendingCount}
          onGoPending={() => onSelectTab('pending')}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onSelectApplicant={onSelectApplicant}
        />
        <main id="main" className="page-body" tabIndex={-1}>
          {children}
        </main>
      </div>

      <ToastContainer onSelectApplicant={onSelectApplicant} />
    </div>
  );
};
