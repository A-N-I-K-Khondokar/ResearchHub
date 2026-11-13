import React, { useState } from 'react';
import { Sidebar, type NavTab } from './Sidebar';
import { TopNav } from './TopNav';
import { ToastContainer } from '../common/ToastContainer';

interface AdminLayoutProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  pendingCount?: number;
  onSelectApplicant?: (uid: string) => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentTab,
  onSelectTab,
  pendingCount = 0,
  onSelectApplicant,
  children
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="app-container">
      <Sidebar
        currentTab={currentTab}
        onSelectTab={onSelectTab}
        pendingCount={pendingCount}
        isOpenMobile={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="main-content">
        <TopNav
          currentTab={currentTab}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onSelectApplicant={onSelectApplicant}
        />
        <main className="page-body">{children}</main>
      </div>

      <ToastContainer />
    </div>
  );
};

