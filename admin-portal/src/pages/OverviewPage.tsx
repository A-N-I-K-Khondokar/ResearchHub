import React, { useEffect, useState } from 'react';
import {
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  AlertOctagon,
  RefreshCw,
  ArrowRight
} from 'lucide-react';
import { StatCard } from '../components/dashboard/StatCard';
import { RecentActivity } from '../components/dashboard/RecentActivity';
import { Button } from '../components/common/Button';
import { getDashboardCounts, getRecentRegistrations } from '../services/admin.service';
import type { DashboardStats } from '../types/stats.types';
import type { UserProfile } from '../types/user.types';

interface OverviewPageProps {
  onNavigateToPending: () => void;
  onNavigateToUsers: () => void;
  onInspectUser: (uid: string) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  onNavigateToPending,
  onNavigateToUsers,
  onInspectUser
}) => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    pendingUsers: 0,
    approvedUsers: 0,
    rejectedUsers: 0,
    suspendedUsers: 0,
    loading: true
  });
  const [recentUsers, setRecentUsers] = useState<UserProfile[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    setRefreshing(true);
    try {
      const [counts, recent] = await Promise.all([
        getDashboardCounts(),
        getRecentRegistrations(8)
      ]);
      setStats(counts);
      setRecentUsers(recent);
    } catch (err) {
      console.error('[OverviewPage] Error loading data:', err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner & Refresh */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
            System Status & Analytics
          </h2>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Live platform metrics sourced from Cloud Firestore
          </div>
        </div>

        <Button
          variant="secondary"
          size="sm"
          icon={<RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />}
          onClick={loadData}
          loading={refreshing}
        >
          Refresh Metrics
        </Button>
      </div>

      {/* Pending Review Callout Banner (if items waiting) */}
      {stats.pendingUsers > 0 && (
        <div
          style={{
            backgroundColor: 'var(--status-pending-bg)',
            border: '1px solid rgba(217, 119, 6, 0.3)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ color: '#D97706' }}>
              <Clock size={24} />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--status-pending-text)' }}>
                {stats.pendingUsers} Account Application{stats.pendingUsers > 1 ? 's' : ''} Awaiting Review
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Newly registered scholars cannot access research discovery until approved.
              </div>
            </div>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={onNavigateToPending}
            style={{ backgroundColor: '#D97706', borderColor: '#B45309' }}
          >
            Review Pending <ArrowRight size={14} />
          </Button>
        </div>
      )}

      {/* Summary Metrics Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '16px'
        }}
      >
        <StatCard
          title="Total Registered"
          value={stats.loading ? '—' : stats.totalUsers}
          icon={Users}
          accentColor="#2563EB"
          onClick={onNavigateToUsers}
        />
        <StatCard
          title="Pending Review"
          value={stats.loading ? '—' : stats.pendingUsers}
          icon={Clock}
          accentColor="#D97706"
          badge={stats.pendingUsers > 0 ? 'Action required' : undefined}
          onClick={onNavigateToPending}
        />
        <StatCard
          title="Approved Scholars"
          value={stats.loading ? '—' : stats.approvedUsers}
          icon={CheckCircle2}
          accentColor="#16A34A"
          onClick={onNavigateToUsers}
        />
        <StatCard
          title="Rejected Profiles"
          value={stats.loading ? '—' : stats.rejectedUsers}
          icon={XCircle}
          accentColor="#DC2626"
          onClick={onNavigateToUsers}
        />
        <StatCard
          title="Suspended Accounts"
          value={stats.loading ? '—' : stats.suspendedUsers}
          icon={AlertOctagon}
          accentColor="#64748B"
          onClick={onNavigateToUsers}
        />
      </div>

      {/* Recent Activity Table */}
      <RecentActivity
        users={recentUsers}
        onViewApplicant={onInspectUser}
        onViewAll={onNavigateToUsers}
      />
    </div>
  );
};
