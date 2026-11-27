/**
 * Tiny hash router (no library): keeps the current page in the URL so refresh
 * and browser Back/Forward work.  #/overview, #/pending, #/users, #/users/rejected, #/activity
 */
import { useCallback, useEffect, useState } from 'react';
import type { NavTab } from '../components/layout/Sidebar';
import type { ApprovalStatus } from '../types/user.types';

export type UsersFilter = ApprovalStatus | 'all';
export interface Route {
  tab: NavTab;
  usersFilter: UsersFilter;
}

const TABS: NavTab[] = ['overview', 'pending', 'users', 'activity'];
const FILTERS: UsersFilter[] = ['all', 'pending', 'approved', 'rejected', 'suspended'];

function parse(hash: string): Route {
  const [tabPart, filterPart] = hash.replace(/^#\/?/, '').split('/');
  const tab = (TABS as string[]).includes(tabPart) ? (tabPart as NavTab) : 'overview';
  const usersFilter = (FILTERS as string[]).includes(filterPart) ? (filterPart as UsersFilter) : 'all';
  return { tab, usersFilter };
}

export function useHashRoute() {
  const [route, setRoute] = useState<Route>(() => parse(window.location.hash));

  useEffect(() => {
    const onChange = () => setRoute(parse(window.location.hash));
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  const navigate = useCallback((tab: NavTab, usersFilter: UsersFilter = 'all') => {
    const next = tab === 'users' && usersFilter !== 'all' ? `#/users/${usersFilter}` : `#/${tab}`;
    if (window.location.hash !== next) window.location.hash = next;
    else setRoute(parse(next));
    window.scrollTo({ top: 0 });
  }, []);

  return { route, navigate };
}
