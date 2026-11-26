import React, { useState, useMemo, useCallback, useEffect } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Bell,
  BellOff,
  UserPlus,
  MessageSquare,
  Heart,
  Sparkles,
  Check,
  CheckCheck,
} from 'lucide-react-native';
import { spacing, radius, typography, fontFamilies, floatingButtonTokens } from '@/constants';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { Avatar } from '@/components/common/Avatar';
import { SkeletonList } from '@/components/feedback/Skeleton';
import { useConnections } from '@/hooks/useConnections';
import {
  subscribeNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '@/services/network.service';
import { formatWorkDate } from '@/services/research.service';
import type { InAppNotification } from '@/types/network.types';

type AlertFilter = 'all' | 'unread' | 'connections';

interface FilterOption {
  key: AlertFilter;
  label: string;
}

const FILTER_OPTIONS: FilterOption[] = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'connections', label: 'Connections' },
];

const DAY_MS = 24 * 60 * 60 * 1000;

export default function NotificationsTab() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { userProfile } = useAuth();
  const { relationship, accept, decline, busyUid } = useConnections();

  const uid = userProfile?.approvalStatus === 'approved' ? userProfile.uid : '';
  const [alerts, setAlerts] = useState<InAppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [activeFilter, setActiveFilter] = useState<AlertFilter>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [listenerKey, setListenerKey] = useState(0);

  // Real-time in-app notifications (Firestore `notifications`, recipient only)
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
    );
  }, [uid, listenerKey]);

  // Unread count
  const unreadCount = useMemo(() => {
    return alerts.filter((a) => !a.read).length;
  }, [alerts]);

  // Pull-to-refresh re-opens the listener
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setListenerKey((k) => k + 1);
  }, []);

  // Mark single alert as read and open the actor's profile
  const handleOpenAlert = useCallback(
    (item: InAppNotification) => {
      if (!item.read) markNotificationRead(item.id).catch(() => {});
      router.push(`/(profile)/${item.actorUid}` as any);
    },
    [router],
  );

  // Mark all alerts as read
  const handleMarkAllAsRead = useCallback(() => {
    markAllNotificationsRead(alerts.filter((a) => !a.read).map((a) => a.id)).catch(() => {});
  }, [alerts]);

  // Respond to a connection request directly from the alert
  const handleRespond = useCallback(
    (item: InAppNotification, doAccept: boolean) => {
      const { connection } = relationship(item.actorUid);
      if (!connection) return;
      if (!item.read) markNotificationRead(item.id).catch(() => {});
      if (doAccept) accept(connection);
      else decline(connection);
    },
    [accept, decline, relationship],
  );

  // Filter alerts by selected tab
  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      if (activeFilter === 'unread') return !alert.read;
      return true; // every current notification type is connection-related
    });
  }, [alerts, activeFilter]);

  // Group alerts into "New" (last 24 hours) vs "Earlier"
  const sections = useMemo(() => {
    const now = Date.now();
    const isNew = (item: InAppNotification) =>
      now - (item.createdAt?.toMillis?.() ?? now) < DAY_MS;
    const newItems = filteredAlerts.filter(isNew);
    const earlierItems = filteredAlerts.filter((item) => !isNew(item));

    const result = [];
    if (newItems.length > 0) {
      result.push({ title: 'New', data: newItems });
    }
    if (earlierItems.length > 0) {
      result.push({ title: 'Earlier', data: earlierItems });
    }
    return result;
  }, [filteredAlerts]);

  // Render icon badge on avatar
  const renderBadgeIcon = (type: string) => {
    switch (type) {
      case 'connection_request':
      case 'connection_accepted':
        return (
          <View style={[styles.typeBadge, { backgroundColor: colors.primary }]}>
            <UserPlus size={10} color="#FFFFFF" strokeWidth={2.4} />
          </View>
        );
      case 'comment':
        return (
          <View style={[styles.typeBadge, { backgroundColor: colors.accent }]}>
            <MessageSquare size={10} color="#FFFFFF" strokeWidth={2.4} />
          </View>
        );
      case 'like':
        return (
          <View style={[styles.typeBadge, { backgroundColor: '#E5484D' }]}>
            <Heart size={10} color="#FFFFFF" strokeWidth={2.4} fill="#FFFFFF" />
          </View>
        );
      case 'topic_activity':
      default:
        return (
          <View style={[styles.typeBadge, { backgroundColor: colors.secondary }]}>
            <Sparkles size={10} color="#FFFFFF" strokeWidth={2.4} />
          </View>
        );
    }
  };

  // Render individual notification row
  const renderItem = ({ item }: { item: InAppNotification }) => {
    const isUnread = !item.read;
    const rel = item.type === 'connection_request' ? relationship(item.actorUid).state : null;
    const busy = busyUid === item.actorUid;
    const message =
      item.type === 'connection_request'
        ? 'sent you a connection request.'
        : 'accepted your connection request.';

    return (
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={() => handleOpenAlert(item)}
        style={[
          styles.itemRow,
          {
            backgroundColor: isUnread
              ? isDark
                ? 'rgba(36, 113, 231, 0.08)'
                : '#F2F6FE'
              : colors.surface,
            borderBottomColor: colors.borderSubtle,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`${item.actorName} ${message}`}
      >
        {/* Unread Indicator Dot */}
        <View style={styles.dotContainer}>
          {isUnread ? (
            <View
              style={[
                styles.unreadDot,
                { backgroundColor: colors.primary },
              ]}
            />
          ) : (
            <View style={styles.unreadDotPlaceholder} />
          )}
        </View>

        {/* User Avatar with Type Badge */}
        <View style={styles.avatarContainer}>
          <Avatar
            name={item.actorName || 'Researcher'}
            uri={item.actorPhotoURL}
            size="md"
          />
          {renderBadgeIcon(item.type)}
        </View>

        {/* Content Body */}
        <View style={styles.contentBody}>
          <View style={styles.messageRow}>
            <Text style={styles.messageText}>
              <Text
                style={[styles.senderName, { color: colors.textPrimary }]}
              >
                {item.actorName || 'Researcher'}{' '}
              </Text>
              <Text
                style={[styles.actionText, { color: colors.textSecondary }]}
              >
                {message}
              </Text>
            </Text>
          </View>

          {/* Actionable Connection Request Buttons */}
          {item.type === 'connection_request' && (
            <View style={styles.actionContainer}>
              {rel === 'connected' ? (
                <View style={styles.statusConfirmedRow}>
                  <Check size={14} color={colors.secondary} strokeWidth={2.4} />
                  <Text
                    style={[
                      styles.statusConfirmedText,
                      { color: colors.secondary },
                    ]}
                  >
                    Connected
                  </Text>
                </View>
              ) : rel !== 'incoming' ? (
                <Text
                  style={[styles.statusDeclinedText, { color: colors.textMuted }]}
                >
                  {rel === 'rejected' ? 'Request declined' : 'Request no longer active'}
                </Text>
              ) : busy ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => handleRespond(item, true)}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    style={[
                      styles.acceptButton,
                      floatingButtonTokens.primary,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Accept connection request"
                  >
                    <Text style={styles.acceptButtonText}>Accept</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => handleRespond(item, false)}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    style={[
                      styles.declineButton,
                      {
                        backgroundColor: isDark ? colors.surfaceContainer : colors.surface,
                        borderColor: isDark ? colors.borderSubtle : '#D4D8E2',
                      },
                      floatingButtonTokens.secondary,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Decline connection request"
                  >
                    <Text
                      style={[
                        styles.declineButtonText,
                        { color: colors.textPrimary },
                      ]}
                    >
                      Decline
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Timestamp on Far Right */}
        <Text style={[styles.timestamp, { color: colors.textMuted }]}>
          {formatWorkDate(item.createdAt)}
        </Text>
      </TouchableOpacity>
    );
  };

  // Render Section Header (New vs Earlier)
  const renderSectionHeader = ({
    section: { title },
  }: {
    section: { title: string };
  }) => (
    <View
      style={[
        styles.sectionHeaderContainer,
        {
          backgroundColor: colors.background,
          borderBottomColor: colors.borderSubtle,
        },
      ]}
    >
      <Text style={[styles.sectionHeaderText, { color: colors.textMuted }]}>
        {title.toUpperCase()}
      </Text>
    </View>
  );

  return (
    <View style={[styles.safeArea, { backgroundColor: colors.surface }]}>
      {/* Header Container */}
      <View
        style={[
          styles.headerContainer,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.borderSubtle,
            paddingTop: insets.top + 16,
          },
        ]}
      >
        <View style={styles.titleRow}>
          <View style={styles.titleWithBadge}>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
              Notifications
            </Text>
            {unreadCount > 0 && (
              <View
                style={[
                  styles.unreadBadge,
                  { backgroundColor: colors.primaryMuted },
                ]}
              >
                <Text
                  style={[styles.unreadBadgeText, { color: colors.primary }]}
                >
                  {unreadCount} new
                </Text>
              </View>
            )}
          </View>

          {unreadCount > 0 && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleMarkAllAsRead}
              style={[
                styles.markAllButton,
                { backgroundColor: colors.surfaceSubtle },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Mark all alerts as read"
            >
              <CheckCheck size={14} color={colors.primary} strokeWidth={2.2} />
              <Text style={[styles.markAllText, { color: colors.primary }]}>
                Mark all read
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Horizontally Scrollable Filter Tags */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScrollView}
          contentContainerStyle={styles.filterScrollContent}
        >
          {FILTER_OPTIONS.map((filter) => {
            const isSelected = activeFilter === filter.key;
            return (
              <TouchableOpacity
                key={filter.key}
                activeOpacity={0.8}
                onPress={() => setActiveFilter(filter.key)}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: isSelected
                      ? colors.primary
                      : colors.surfaceSubtle,
                    borderColor: isSelected
                      ? colors.primary
                      : colors.borderSubtle,
                  },
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    {
                      color: isSelected ? '#FFFFFF' : colors.textSecondary,
                    },
                    isSelected && styles.filterPillTextActive,
                  ]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {filter.label}
                  {filter.key === 'unread' && unreadCount > 0
                    ? ` (${unreadCount})`
                    : ''}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main SectionList Feed */}
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        stickySectionHeadersEnabled={false}
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          loading ? (
            <View style={{ padding: spacing.md }}>
              <SkeletonList count={5} variant="row" />
            </View>
          ) : (
          <View style={styles.emptyContainer}>
            <View
              style={[
                styles.emptyIconCircle,
                {
                  backgroundColor: colors.surfaceSubtle,
                  borderColor: colors.borderSubtle,
                },
              ]}
            >
              <BellOff
                size={32}
                color={colors.textSecondary}
                strokeWidth={1.8}
              />
            </View>
            <Text
              style={[styles.emptyTitle, { color: colors.textPrimary }]}
            >
              {loadError ? 'Could not load alerts' : 'No alerts found'}
            </Text>
            <Text
              style={[styles.emptySubtitle, { color: colors.textSecondary }]}
            >
              {loadError
                ? 'Pull down to try again.'
                : activeFilter === 'unread'
                ? "You're all caught up! There are no unread notifications."
                : 'Connection requests and responses will appear here.'}
            </Text>
            {activeFilter !== 'all' && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setActiveFilter('all')}
                style={[
                  styles.resetFilterButton,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.borderSubtle,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.resetFilterText,
                    { color: colors.primary },
                  ]}
                >
                  View all alerts
                </Text>
              </TouchableOpacity>
            )}
          </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTitle: {
    ...typography.display,
    fontSize: 28,
    lineHeight: 34,
  },
  unreadBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  unreadBadgeText: {
    fontSize: 11,
    fontFamily: fontFamilies.sansSemiBold,
    letterSpacing: 0.2,
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  markAllText: {
    ...typography.caption,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 12,
  },
  filterScrollView: {
    marginHorizontal: -spacing.md,
    marginTop: spacing.xs,
  },
  filterScrollContent: {
    paddingHorizontal: spacing.md,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    maxWidth: '100%',
    flexShrink: 1,
    minHeight: 32,
    justifyContent: 'center',
  },
  filterPillText: {
    ...typography.caption,
    fontFamily: fontFamilies.sansMedium,
    flexShrink: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  filterPillTextActive: {
    fontFamily: fontFamilies.sansSemiBold,
  },
  container: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 32,
  },
  sectionHeaderContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  sectionHeaderText: {
    fontSize: 11,
    fontFamily: fontFamilies.sansBold,
    letterSpacing: 0.8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  dotContainer: {
    width: 14,
    paddingTop: 14,
    alignItems: 'center',
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  unreadDotPlaceholder: {
    width: 7,
    height: 7,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: spacing.sm + 2,
  },
  typeBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  contentBody: {
    flex: 1,
    marginRight: spacing.xs,
  },
  messageRow: {
    marginBottom: 2,
  },
  messageText: {
    lineHeight: 20,
  },
  senderName: {
    fontSize: 15,
    fontFamily: fontFamilies.sansSemiBold,
  },
  actionText: {
    fontSize: 14,
    fontFamily: fontFamilies.sansRegular,
  },
  actionContainer: {
    marginTop: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  acceptButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
  },
  acceptButtonText: {
    fontSize: 13,
    fontFamily: fontFamilies.sansSemiBold,
    color: '#FFFFFF',
  },
  declineButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.button,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
  },
  declineButtonText: {
    fontSize: 13,
    fontFamily: fontFamilies.sansSemiBold,
    fontWeight: '600',
  },
  statusConfirmedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusConfirmedText: {
    fontSize: 13,
    fontFamily: fontFamilies.sansSemiBold,
  },
  statusDeclinedText: {
    fontSize: 12,
    fontFamily: fontFamilies.sansRegular,
    fontStyle: 'italic',
  },
  timestamp: {
    fontSize: 12,
    fontFamily: fontFamilies.sansMedium,
    marginLeft: spacing.xs,
    paddingTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: 64,
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    ...typography.title,
    fontSize: 17,
    marginBottom: 4,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...typography.caption,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  resetFilterButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
    minHeight: 36,
    justifyContent: 'center',
  },
  resetFilterText: {
    fontSize: 13,
    fontFamily: fontFamilies.sansSemiBold,
  },
});
