import React, { useEffect, useState } from 'react';
import { Users, Clock, CheckCircle2, XCircle, AlertOctagon, RefreshCw, ArrowRight, Globe, Wrench } from 'lucide-react';
import { StatCard } from '../components/dashboard/StatCard';
import { RecentActivity } from '../components/dashboard/RecentActivity';
import { Button } from '../components/common/Button';
import { PageHeader } from '../components/common/PageHeader';
import { getDashboardCounts, getRecentRegistrations, syncPublicDirectory } from '../services/admin.service';
import type { DashboardStats } from '../types/stats.types';
import type { UserProfile } from '../types/user.types';
import type { UsersFilter } from '../hooks/useHashRoute';

interface OverviewPageProps {
  onNavigateToPending: () => void;
  onNavigateToUsers: (filter?: UsersFilter) => void;
  onInspectUser: (uid: string) => void;
  reloadKey?: number;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({ onNavigateToPending, onNavigateToUsers, onInspectUser, reloadKey = 0 }) => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0, pendingUsers: 0, approvedUsers: 0, rejectedUsers: 0, suspendedUsers: 0, loading: true
  });
  const [recentUsers, setRecentUsers] = useState<UserProfile[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const loadData = async () => {
    setRefreshing(true);
    setError(null);
    try {
      const [counts, recent] = await Promise.all([getDashboardCounts(), getRecentRegistrations(8)]);
      setStats(counts);
      setRecentUsers(recent);
    } catch (err) {
      console.error('[OverviewPage] Error loading data:', err);
      setError('Could not load the latest numbers. Try Refresh.');
      setStats((s) => ({ ...s, loading: false }));
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey]);

  // Publishes public_profiles mirrors for approved researchers and removes stale ones. Safe to re-run.
  const handleSyncDirectory = async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const { published, removed } = await syncPublicDirectory();
      setSyncMessage({ ok: true, text: `Done: ${published} profile(s) published, ${removed} outdated profile(s) removed.` });
    } catch (err: any) {
      console.error('[OverviewPage] Directory sync failed:', err);
      setSyncMessage({ ok: false, text: `Sync failed: ${err?.code || err?.message || 'unknown error'}` });
    } finally {
      setSyncing(false);
    }
  };

  const v = (n: number) => (stats.loading ? '—' : n);

  return (
    <div className="stack">
      <PageHeader
        title="Overview"
        subtitle="Accounts and applications at a glance"
        actions={
          <Button variant="secondary" size="sm" icon={<RefreshCw size={14} aria-hidden="true" />} onClick={loadData} loading={refreshing}>
            Refresh
          </Button>
        }
      />

      {error ? <div role="alert" style={{ fontSize: 13, color: 'var(--status-rejected-text)' }}>{error}</div> : null}

      {stats.pendingUsers > 0 && (
        <div className="callout callout-warning" role="status">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Clock size={22} color="#D97706" aria-hidden="true" />
            <div>
              <div className="callout-title" style={{ color: 'var(--status-pending-text)' }}>
                {stats.pendingUsers} application{stats.pendingUsers > 1 ? 's' : ''} waiting for review
              </div>
              <div className="callout-text">Applicants can't use the app until they're approved.</div>
            </div>
          </div>
          <Button variant="warning" size="sm" onClick={onNavigateToPending}>
            Review now <ArrowRight size={14} aria-hidden="true" />
          </Button>
        </div>
      )}

      <div className="stat-grid">
        <StatCard title="All users" value={v(stats.totalUsers)} icon={Users} accentColor="#2563EB" onClick={() => onNavigateToUsers('all')} />
        <StatCard
          title="Pending"
          value={v(stats.pendingUsers)}
          icon={Clock}
          accentColor="#D97706"
          hint={stats.pendingUsers > 0 ? 'needs review' : undefined}
          onClick={onNavigateToPending}
        />
        <StatCard title="Approved" value={v(stats.approvedUsers)} icon={CheckCircle2} accentColor="#16A34A" onClick={() => onNavigateToUsers('approved')} />
        <StatCard title="Rejected" value={v(stats.rejectedUsers)} icon={XCircle} accentColor="#DC2626" onClick={() => onNavigateToUsers('rejected')} />
        <StatCard title="Suspended" value={v(stats.suspendedUsers)} icon={AlertOctagon} accentColor="#64748B" onClick={() => onNavigateToUsers('suspended')} />
      </div>

      <RecentActivity
        users={recentUsers}
        loading={stats.loading}
        onViewApplicant={onInspectUser}
        onViewAll={() => onNavigateToUsers('all')}
      />

      {/* Maintenance: kept away from everyday actions */}
      <section className="card" aria-labelledby="maint-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', maxWidth: 620 }}>
          <div className="stat-icon" style={{ background: 'var(--bg-surface-subtle)', color: 'var(--text-secondary)' }}>
            <Wrench size={17} aria-hidden="true" />
          </div>
          <div>
            <h2 id="maint-title" style={{ fontSize: 14.5 }}>Maintenance</h2>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
              Rebuild the public researcher directory from approved accounts. Only needed if the directory looks out of date; safe to run again.
            </div>
            {syncMessage ? (
              <div role="status" style={{ fontSize: 12.5, marginTop: 6, color: syncMessage.ok ? 'var(--status-approved-text)' : 'var(--status-rejected-text)' }}>
                {syncMessage.text}
              </div>
            ) : null}
          </div>
        </div>
        <Button variant="secondary" size="sm" icon={<Globe size={14} aria-hidden="true" />} onClick={handleSyncDirectory} loading={syncing}>
          Rebuild directory
        </Button>
      </section>
    </div>
  );
};
