/**
 * Notifications
 *
 *  - filters with counts: All · Unread · Connections · Collaborations
 *  - grouped by Today / This week / Earlier
 *  - applications: inline Accept / Decline with role + message and live status;
 *    several applicants for one post collapse into one "Review N applicants" row
 *  - accepted: Open project + Contact lead · declined: Browse open collaborations
 *  - connection requests: inline Accept / Decline
 *  - long-press: Mark as read / Remove · "Clear read" · "Show older"
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { BadgeCheck, BellOff, Check, CheckCheck, UserPlus, Users, XCircle } from 'lucide-react-native';
import { ICON_STROKE } from '@/constants/icons';
import { spacing, radius, typography, fontFamilies } from '@/constants';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { TabHeader, HeaderBadge } from '@/components/layout/TabHeader';
import { Avatar } from '@/components/common/Avatar';
import { ContactSheet, type ContactPerson } from '@/components/common/ContactSheet';
import { SkeletonList } from '@/components/feedback/Skeleton';
import { useConnections } from '@/hooks/useConnections';
import {
  subscribeNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  deleteNotifications,
  NOTIFICATIONS_LIMIT,
} from '@/services/network.service';
import { respondToApplication, subscribeReceivedApplications } from '@/services/collab.service';
import { formatWorkDate } from '@/services/research.service';
import { chooseAction, confirmAction } from '@/utils/dialogs';
import type { InAppNotification } from '@/types/network.types';
import type { CollabRequest } from '@/types/collab.types';

type AlertFilter = 'all' | 'unread' | 'connections' | 'collaborations';
const FILTERS: { key: AlertFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'connections', label: 'Connections' },
  { key: 'collaborations', label: 'Collaborations' },
];

type Row =
  | { kind: 'single'; key: string; item: InAppNotification }
  | { kind: 'group'; key: string; workId: string; workTitle: string; items: InAppNotification[] };

const DAY_MS = 24 * 60 * 60 * 1000;

/** Collaboration request ids are `${workId}_${applicantUid}`. */
function workIdOf(item: InAppNotification): string {
  const applicantUid = item.type === 'collab_request' ? item.actorUid : item.recipientUid;
  return item.connectionId.endsWith(`_${applicantUid}`) ? item.connectionId.slice(0, -(applicantUid.length + 1)) : '';
}

export default function NotificationsTab() {
  const { colors } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const { userProfile } = useAuth();
  const { relationship, accept, decline, busyUid } = useConnections();
  const uid = userProfile?.approvalStatus === 'approved' ? userProfile.uid : '';

  const [alerts, setAlerts] = useState<InAppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [filter, setFilter] = useState<AlertFilter>('all');
  const [max, setMax] = useState(NOTIFICATIONS_LIMIT);
  const [refreshing, setRefreshing] = useState(false);
  const [listenerKey, setListenerKey] = useState(0);
  const [received, setReceived] = useState<CollabRequest[]>([]);
  const [receivedLoaded, setReceivedLoaded] = useState(false);
  const [busyRequest, setBusyRequest] = useState<string | null>(null);
  const [contactPerson, setContactPerson] = useState<ContactPerson | null>(null);

  // Real-time notifications (recipient only)
  useEffect(() => {
    if (!uid) return;
    setLoading(true);
    return subscribeNotifications(
      uid,
      (list) => {
        setAlerts(list);
        setLoading(false);
        setRefreshing(false);
        setLoadError(false);
      },
      () => {
        setLoading(false);
        setRefreshing(false);
        setLoadError(true);
      },
      max,
    );
  }, [uid, listenerKey, max]);

  // Live status of applications to my posts (for inline Accept / Decline)
  useEffect(() => {
    if (!uid) return;
    return subscribeReceivedApplications(uid, (list) => {
      setReceived(list);
      setReceivedLoaded(true);
    });
  }, [uid]);
  const requestById = useMemo(() => new Map(received.map((r) => [r.id, r] as const)), [received]);

  const unreadCount = useMemo(() => alerts.filter((a) => !a.read).length, [alerts]);
  const counts = useMemo(
    () => ({
      all: alerts.length,
      unread: unreadCount,
      connections: alerts.filter((a) => a.type.startsWith('connection_')).length,
      collaborations: alerts.filter((a) => a.type.startsWith('collab_')).length,
    }),
    [alerts, unreadCount],
  );

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------
  const markRead = (item: InAppNotification) => {
    if (!item.read) markNotificationRead(item.id).catch(() => {});
  };

  const openAlert = useCallback(
    (item: InAppNotification) => {
      markRead(item);
      const workId = item.type.startsWith('collab_') ? workIdOf(item) : '';
      if (item.type === 'collab_request' && workId) {
        router.push({ pathname: `/(research)/${workId}` as any, params: { manage: '1' } });
      } else {
        router.push((workId ? `/(research)/${workId}` : `/(profile)/${item.actorUid}`) as any);
      }
    },
    [router],
  );

  const handleMarkAll = () => {
    markAllNotificationsRead(alerts.filter((a) => !a.read).map((a) => a.id))
      .then(() => toast.show('All caught up', 'info'))
      .catch(() => toast.show('Could not mark all as read', 'error'));
  };

  const handleClearRead = async () => {
    const readIds = alerts.filter((a) => a.read).map((a) => a.id);
    if (readIds.length === 0) return;
    const ok = await confirmAction({
      title: 'Clear read notifications?',
      message: `${readIds.length} read notification${readIds.length === 1 ? '' : 's'} will be removed. Unread ones stay.`,
      confirmLabel: 'Clear',
      destructive: true,
      icon: 'delete',
    });
    if (!ok) return;
    deleteNotifications(readIds)
      .then(() => toast.show('Read notifications cleared', 'info'))
      .catch(() => toast.show('Could not clear notifications', 'error'));
  };

  const openMenu = (item: InAppNotification) => {
    chooseAction(item.actorName || 'Notification', [
      ...(!item.read ? [{ label: 'Mark as read', onPress: () => markRead(item) }] : []),
      {
        label: 'Remove',
        destructive: true,
        onPress: () => {
          deleteNotification(item.id)
            .then(() => toast.show('Notification removed', 'info'))
            .catch(() => toast.show('Could not remove it', 'error'));
        },
      },
    ]);
  };

  const respondConnection = (item: InAppNotification, doAccept: boolean) => {
    const { connection } = relationship(item.actorUid);
    if (!connection) return;
    markRead(item);
    if (doAccept) accept(connection);
    else decline(connection);
  };

  const respondApplication = async (item: InAppNotification, request: CollabRequest, doAccept: boolean) => {
    if (!userProfile) return;
    if (!doAccept) {
      const ok = await confirmAction({
        title: 'Decline application?',
        message: `${request.applicant.displayName} will be told the position is not available.`,
        confirmLabel: 'Decline',
        destructive: true,
      });
      if (!ok) return;
    }
    markRead(item);
    setBusyRequest(request.id);
    try {
      await respondToApplication(userProfile, request, doAccept, relationship(request.applicantUid).connection);
      toast.show(
        doAccept
          ? `${request.applicant.displayName.split(' ')[0]} joined your team as ${request.role}`
          : 'Application declined',
        doAccept ? 'success' : 'info',
      );
    } catch (err) {
      console.error('[Notifications] respond failed:', err);
      toast.show('Could not update the application. Please try again.', 'error');
    } finally {
      setBusyRequest(null);
    }
  };

  // ---------------------------------------------------------------------------
  // Sections: Today / This week / Earlier, with applications grouped per post
  // ---------------------------------------------------------------------------
  const sections = useMemo(() => {
    const filtered = alerts.filter((a) =>
      filter === 'unread'
        ? !a.read
        : filter === 'connections'
          ? a.type.startsWith('connection_')
          : filter === 'collaborations'
            ? a.type.startsWith('collab_')
            : true,
    );
    const now = Date.now();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const bucket = (a: InAppNotification) => {
      const t = a.createdAt?.toMillis?.() ?? now;
      return t >= startOfToday.getTime() ? 'Today' : now - t < 7 * DAY_MS ? 'This week' : 'Earlier';
    };

    const out: { title: string; data: Row[] }[] = [];
    for (const title of ['Today', 'This week', 'Earlier']) {
      const items = filtered.filter((a) => bucket(a) === title);
      if (!items.length) continue;
      // Group 2+ applications for the same post (still pending) into one row
      const byWork = new Map<string, InAppNotification[]>();
      items.forEach((a) => {
        if (a.type !== 'collab_request') return;
        const req = requestById.get(a.connectionId);
        if (req && req.status !== 'pending') return;
        const w = workIdOf(a);
        if (w) byWork.set(w, [...(byWork.get(w) ?? []), a]);
      });
      const grouped = new Set<string>();
      const rows: Row[] = [];
      items.forEach((a) => {
        const w = a.type === 'collab_request' ? workIdOf(a) : '';
        const group = w ? byWork.get(w) : undefined;
        if (group && group.length > 1) {
          if (!grouped.has(w)) {
            grouped.add(w);
            rows.push({ kind: 'group', key: `group-${title}-${w}`, workId: w, workTitle: a.workTitle ?? 'your post', items: group });
          }
          return;
        }
        rows.push({ kind: 'single', key: a.id, item: a });
      });
      out.push({ title, data: rows });
    }
    return out;
  }, [alerts, filter, requestById]);

  // ---------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------
  const typeBadge = (type: InAppNotification['type']) => {
    const map: Record<string, { bg: string; Icon: typeof Users }> = {
      collab_request: { bg: colors.primary, Icon: Users },
      collab_accepted: { bg: colors.success, Icon: BadgeCheck },
      collab_declined: { bg: colors.textMuted, Icon: XCircle },
      connection_request: { bg: colors.primary, Icon: UserPlus },
      connection_accepted: { bg: colors.success, Icon: Check },
    };
    const { bg, Icon } = map[type] ?? map.connection_request;
    return (
      <View style={[styles.typeBadge, { backgroundColor: bg, borderColor: colors.surface }]}>
        <Icon size={10} color="#FFFFFF" strokeWidth={ICON_STROKE.emphasis} />
      </View>
    );
  };

  const messageFor = (item: InAppNotification) =>
    item.type === 'connection_request'
      ? 'sent you a connection request.'
      : item.type === 'connection_accepted'
        ? 'accepted your connection request.'
        : item.type === 'collab_request'
          ? `applied to join "${item.workTitle}" as ${item.role}.`
          : item.type === 'collab_accepted'
            ? `accepted you to "${item.workTitle}" as ${item.role}.`
            : `declined your application to "${item.workTitle}".`;

  const smallBtn = (label: string, onPress: () => void, primary = false, icon?: React.ReactNode, disabled = false) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      style={[
        styles.btn,
        primary
          ? { backgroundColor: colors.primary, borderColor: colors.primary }
          : { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
      accessibilityRole="button"
    >
      {icon}
      <Text style={[styles.btnText, { color: primary ? '#FFFFFF' : colors.textPrimary }]}>{label}</Text>
    </TouchableOpacity>
  );

  const statusText = (text: string, ok: boolean) => (
    <View style={styles.statusRow}>
      {ok ? <Check size={14} color={colors.success} /> : null}
      <Text style={[styles.statusText, { color: ok ? colors.success : colors.textMuted }]}>{text}</Text>
    </View>
  );

  const renderActions = (item: InAppNotification) => {
    if (item.type === 'connection_request') {
      const rel = relationship(item.actorUid).state;
      if (rel === 'connected') return statusText('Connected', true);
      if (rel !== 'incoming') return statusText(rel === 'rejected' ? 'Request declined' : 'Request no longer active', false);
      if (busyUid === item.actorUid) return <ActivityIndicator size="small" color={colors.primary} />;
      return (
        <View style={styles.btnRow}>
          {smallBtn('Decline', () => respondConnection(item, false))}
          {smallBtn('Accept', () => respondConnection(item, true), true)}
        </View>
      );
    }
    if (item.type === 'collab_request') {
      const req = requestById.get(item.connectionId);
      if (!req) return receivedLoaded ? statusText('Application withdrawn', false) : null;
      if (req.status === 'accepted') return statusText('Accepted — on your team', true);
      if (req.status === 'declined') return statusText('Declined', false);
      const busy = busyRequest === req.id;
      return (
        <>
          {req.message ? (
            <Text style={[styles.quote, { color: colors.textPrimary, backgroundColor: colors.surfaceSubtle }]} numberOfLines={3}>
              “{req.message}”
            </Text>
          ) : null}
          <View style={styles.btnRow}>
            {busy ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                {smallBtn('Decline', () => respondApplication(item, req, false))}
                {smallBtn('Accept', () => respondApplication(item, req, true), true)}
              </>
            )}
          </View>
        </>
      );
    }
    if (item.type === 'collab_accepted') {
      const workId = workIdOf(item);
      return (
        <View style={styles.btnRow}>
          {workId ? smallBtn('Open project', () => { markRead(item); router.push(`/(research)/${workId}` as any); }) : null}
          {smallBtn(
            `Contact ${item.actorName.split(' ')[0]}`,
            () => {
              markRead(item);
              setContactPerson({ uid: item.actorUid, displayName: item.actorName, photoURL: item.actorPhotoURL, subtitle: 'Project lead' });
            },
            true,
          )}
        </View>
      );
    }
    if (item.type === 'collab_declined') {
      return (
        <View style={styles.btnRow}>
          {smallBtn('Browse open collaborations', () => {
            markRead(item);
            router.push({ pathname: '/(explore)/search' as any, params: { category: 'collaborations' } });
          })}
        </View>
      );
    }
    return null;
  };

  const rowShell = (key: string, unread: boolean, onPress: () => void, onLongPress: (() => void) | undefined, children: React.ReactNode, label: string) => (
    <TouchableOpacity
      key={key}
      activeOpacity={0.75}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={350}
      style={[
        styles.row,
        { backgroundColor: unread ? colors.primaryMuted : colors.surface, borderBottomColor: colors.borderSubtle },
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint="Long press for more options"
    >
      <View style={styles.dotSlot}>{unread ? <View style={[styles.dot, { backgroundColor: colors.primary }]} /> : null}</View>
      {children}
    </TouchableOpacity>
  );

  const renderRow = ({ item: row }: { item: Row }) => {
    if (row.kind === 'group') {
      const first = row.items[0];
      const unread = row.items.some((a) => !a.read);
      const others = row.items.length - 1;
      return rowShell(
        row.key,
        unread,
        () => {
          row.items.forEach(markRead);
          router.push({ pathname: `/(research)/${row.workId}` as any, params: { manage: '1' } });
        },
        undefined,
        <>
          <View style={styles.avatarWrap}>
            <Avatar name={first.actorName} uri={first.actorPhotoURL} size="md" />
            {typeBadge('collab_request')}
          </View>
          <View style={styles.body}>
            <Text style={[styles.message, { color: colors.textSecondary }]}>
              <Text style={[styles.actor, { color: colors.textPrimary }]}>{first.actorName}</Text>
              {` and ${others} other${others === 1 ? '' : 's'} applied to "${row.workTitle}".`}
            </Text>
            <View style={styles.btnRow}>
              {smallBtn(`Review ${row.items.length} applicants`, () => {
                row.items.forEach(markRead);
                router.push({ pathname: `/(research)/${row.workId}` as any, params: { manage: '1' } });
              }, true)}
            </View>
          </View>
          <Text style={[styles.time, { color: colors.textMuted }]}>{formatWorkDate(first.createdAt)}</Text>
        </>,
        `${first.actorName} and ${others} others applied to ${row.workTitle}`,
      );
    }

    const item = row.item;
    const message = messageFor(item);
    return rowShell(
      row.key,
      !item.read,
      () => openAlert(item),
      () => openMenu(item),
      <>
        <View style={styles.avatarWrap}>
          <Avatar name={item.actorName || 'Researcher'} uri={item.actorPhotoURL} size="md" />
          {typeBadge(item.type)}
        </View>
        <View style={styles.body}>
          <Text style={[styles.message, { color: colors.textSecondary }]}>
            <Text style={[styles.actor, { color: colors.textPrimary }]}>{item.actorName || 'Researcher'} </Text>
            {message}
          </Text>
          {renderActions(item)}
        </View>
        <Text style={[styles.time, { color: colors.textMuted }]}>{formatWorkDate(item.createdAt)}</Text>
      </>,
      `${item.actorName} ${message}`,
    );
  };

  const emptyText =
    loadError
      ? 'Pull down to try again.'
      : filter === 'unread'
        ? "You're all caught up — no unread notifications."
        : filter === 'connections'
          ? 'Connection requests and acceptances will appear here.'
          : filter === 'collaborations'
            ? 'Applications to your posts and replies to yours will appear here.'
            : 'Connection requests, applications and team updates will appear here.';

  const readCount = alerts.length - unreadCount;

  return (
    <View style={[styles.safeArea, { backgroundColor: colors.surface }]}>
      <TabHeader
        title="Notifications"
        accessory={unreadCount > 0 ? <HeaderBadge label={`${unreadCount} new`} /> : null}
        right={
          unreadCount > 0 ? (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleMarkAll}
              style={[styles.headerBtn, { backgroundColor: colors.surfaceSubtle }]}
              accessibilityRole="button"
              accessibilityLabel="Mark all as read"
            >
              <CheckCheck size={14} color={colors.primary} />
              <Text style={[styles.headerBtnText, { color: colors.primary }]}>Mark all read</Text>
            </TouchableOpacity>
          ) : null
        }
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
          {FILTERS.map((f) => {
            const selected = filter === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                activeOpacity={0.8}
                onPress={() => setFilter(f.key)}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: selected ? colors.primary : colors.surfaceSubtle,
                    borderColor: selected ? colors.primary : colors.borderSubtle,
                  },
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={`${f.label}, ${counts[f.key]}`}
              >
                <Text
                  style={[
                    styles.filterText,
                    { color: selected ? '#FFFFFF' : colors.textSecondary },
                    selected && { fontFamily: fontFamilies.sansSemiBold },
                  ]}
                >
                  {f.label} {counts[f.key]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </TabHeader>

      <SectionList
        sections={sections}
        keyExtractor={(row) => row.key}
        renderItem={renderRow}
        renderSectionHeader={({ section }) => (
          <View style={[styles.sectionHead, { backgroundColor: colors.background }]}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{section.title.toUpperCase()}</Text>
          </View>
        )}
        stickySectionHeadersEnabled={false}
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              setListenerKey((k) => k + 1);
            }}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListFooterComponent={
          alerts.length > 0 ? (
            <View style={styles.footer}>
              {alerts.length >= max ? (
                <TouchableOpacity
                  onPress={() => setMax((m) => m + NOTIFICATIONS_LIMIT)}
                  style={[styles.footerBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
                  accessibilityRole="button"
                >
                  <Text style={[styles.footerBtnText, { color: colors.primary }]}>Show older</Text>
                </TouchableOpacity>
              ) : null}
              {readCount > 0 ? (
                <TouchableOpacity onPress={handleClearRead} hitSlop={8} accessibilityRole="button">
                  <Text style={[styles.clearText, { color: colors.textSecondary }]}>Clear {readCount} read</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null
        }
        ListEmptyComponent={
          loading ? (
            <View style={{ padding: spacing.md }}>
              <SkeletonList count={5} variant="row" />
            </View>
          ) : (
            <View style={styles.empty}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderSubtle }]}>
                <BellOff size={30} color={colors.textSecondary} strokeWidth={ICON_STROKE.light} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                {loadError ? 'Could not load notifications' : 'Nothing here'}
              </Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{emptyText}</Text>
              {filter !== 'all' && !loadError ? (
                <TouchableOpacity
                  onPress={() => setFilter('all')}
                  style={[styles.footerBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
                >
                  <Text style={[styles.footerBtnText, { color: colors.primary }]}>View all notifications</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          )
        }
      />

      <ContactSheet
        person={contactPerson}
        onClose={() => setContactPerson(null)}
        onViewProfile={(id) => router.push(`/(profile)/${id}` as any)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  listContent: { paddingBottom: spacing.xxl, flexGrow: 1 },

  headerBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, height: spacing.compactButtonHeight, borderRadius: radius.button },
  headerBtnText: { ...typography.buttonSmall },
  filterScroll: { marginHorizontal: -spacing.md },
  filterContent: { paddingHorizontal: spacing.md, gap: spacing.xs },
  filterPill: { paddingHorizontal: 14, height: 34, borderRadius: radius.full, borderWidth: 1, justifyContent: 'center' },
  filterText: { ...typography.caption, fontSize: 13 },

  sectionHead: { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.xs },
  sectionTitle: { ...typography.micro, fontFamily: fontFamilies.sansSemiBold, letterSpacing: 0.6 },

  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.md,
    paddingRight: spacing.md,
    borderBottomWidth: 1,
    gap: spacing.sm,
  },
  dotSlot: { width: 14, alignItems: 'center', paddingTop: 18 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  avatarWrap: { position: 'relative' },
  typeBadge: {
    position: 'absolute',
    right: -3,
    bottom: -3,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, minWidth: 0, gap: spacing.xs },
  message: { ...typography.bodySmall, lineHeight: 20 },
  actor: { fontFamily: fontFamilies.sansSemiBold },
  time: { ...typography.micro, paddingTop: 2 },
  quote: { ...typography.caption, padding: spacing.sm, borderRadius: radius.sm, fontStyle: 'italic' },
  btnRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: 2 },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    height: spacing.compactButtonHeight,
    borderRadius: radius.button,
    borderWidth: 1,
  },
  btnText: { ...typography.buttonSmall },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statusText: { ...typography.caption, fontFamily: fontFamilies.sansSemiBold },

  footer: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.lg },
  footerBtn: { paddingHorizontal: spacing.lg, height: spacing.secondaryButtonHeight, borderRadius: radius.button, borderWidth: 1, justifyContent: 'center' },
  footerBtnText: { ...typography.button },
  clearText: { ...typography.caption, fontFamily: fontFamilies.sansSemiBold, textDecorationLine: 'underline' },

  empty: { alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: spacing.xxl, gap: spacing.sm },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { ...typography.title },
  emptyText: { ...typography.bodySmall, textAlign: 'center' },
});
