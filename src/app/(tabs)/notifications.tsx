import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { Avatar } from '@/components/common/Avatar';
import { mockNotifications } from '@/data';
import { AppNotification } from '@/types';

type AlertFilter = 'all' | 'unread' | 'connections' | 'comments' | 'likes';

interface FilterOption {
  key: AlertFilter;
  label: string;
}

const FILTER_OPTIONS: FilterOption[] = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'connections', label: 'Connections' },
  { key: 'comments', label: 'Comments' },
  { key: 'likes', label: 'Likes' },
];

export default function NotificationsTab() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [alerts, setAlerts] = useState<AppNotification[]>(mockNotifications);
  const [activeFilter, setActiveFilter] = useState<AlertFilter>('all');
  const [refreshing, setRefreshing] = useState(false);

  // Unread count
  const unreadCount = useMemo(() => {
    return alerts.filter((a) => !a.read).length;
  }, [alerts]);

  // Pull-to-refresh
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 600);
  }, []);

  // Mark single alert as read
  const handleToggleRead = useCallback((id: string) => {
    setAlerts((prev) =>
      prev.map((item) => (item.id === id ? { ...item, read: true } : item))
    );
  }, []);

  // Mark all alerts as read
  const handleMarkAllAsRead = useCallback(() => {
    setAlerts((prev) => prev.map((item) => ({ ...item, read: true })));
  }, []);

  // Handle connection response
  const handleAcceptConnection = useCallback((id: string) => {
    setAlerts((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: 'accepted', read: true } : item
      )
    );
  }, []);

  const handleDeclineConnection = useCallback((id: string) => {
    setAlerts((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: 'declined', read: true } : item
      )
    );
  }, []);

  // Filter alerts by selected tab
  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      if (activeFilter === 'unread') return !alert.read;
      if (activeFilter === 'connections') {
        return (
          alert.type === 'connection_request' ||
          alert.type === 'connection_accepted'
        );
      }
      if (activeFilter === 'comments') return alert.type === 'comment';
      if (activeFilter === 'likes') return alert.type === 'like';
      return true;
    });
  }, [alerts, activeFilter]);

  // Group alerts into "New" (recent minutes/hours) vs "Earlier" (days)
  const sections = useMemo(() => {
    const isNew = (time: string) => time.includes('m') || time.includes('h');
    const newItems = filteredAlerts.filter((item) => isNew(item.createdAt));
    const earlierItems = filteredAlerts.filter((item) => !isNew(item.createdAt));

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
  const renderItem = ({ item }: { item: AppNotification }) => {
    const isUnread = !item.read;

    return (
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={() => handleToggleRead(item.id)}
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
        accessibilityLabel={`${item.title}: ${item.message}`}
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
            name={item.sender?.name || 'Researcher'}
            uri={item.sender?.photoURL || item.sender?.avatar}
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
                {item.sender?.name || 'Academic'}{' '}
              </Text>
              <Text
                style={[styles.actionText, { color: colors.textSecondary }]}
              >
                {item.actionText || item.message}
              </Text>
            </Text>
          </View>

          {/* Actionable Connection Request Buttons */}
          {item.type === 'connection_request' && (
            <View style={styles.actionContainer}>
              {item.status === 'accepted' ? (
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
              ) : item.status === 'declined' ? (
                <Text
                  style={[styles.statusDeclinedText, { color: colors.textMuted }]}
                >
                  Request dismissed
                </Text>
              ) : (
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => handleAcceptConnection(item.id)}
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
                    onPress={() => handleDeclineConnection(item.id)}
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
          {item.createdAt}
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
              Alerts
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
              No alerts found
            </Text>
            <Text
              style={[styles.emptySubtitle, { color: colors.textSecondary }]}
            >
              {activeFilter === 'unread'
                ? "You're all caught up! There are no unread notifications."
                : 'Activity and interactions on your research will appear here.'}
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
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    maxWidth: '100%',
    flexShrink: 1,
  },
  filterPillText: {
    ...typography.caption,
    fontFamily: fontFamilies.sansMedium,
    flexShrink: 1,
  },
  filterPillTextActive: {
    fontFamily: fontFamilies.sansSemiBold,
  },
  container: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 120, // CRITICAL: floating bottom tab bar clearance
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
    fontSize: 14.5,
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
    paddingVertical: 7,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButtonText: {
    fontSize: 12.5,
    fontFamily: fontFamilies.sansSemiBold,
    color: '#FFFFFF',
  },
  declineButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineButtonText: {
    fontSize: 12.5,
    fontFamily: fontFamilies.sansSemiBold,
    fontWeight: '600',
  },
  statusConfirmedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusConfirmedText: {
    fontSize: 12.5,
    fontFamily: fontFamilies.sansSemiBold,
  },
  statusDeclinedText: {
    fontSize: 12,
    fontFamily: fontFamilies.sansRegular,
    fontStyle: 'italic',
  },
  timestamp: {
    fontSize: 11.5,
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
    fontSize: 13.5,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  resetFilterButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  resetFilterText: {
    fontSize: 13,
    fontFamily: fontFamilies.sansSemiBold,
  },
});
