/**
 * Saved Items — the signed-in researcher's private bookmarks.
 *
 *  - shows each saved post as it is NOW (live), falling back to the saved copy
 *  - deleted / hidden posts are marked "No longer available" (+ bulk remove)
 *  - search · filters with counts (All / Collaborations / Research / Unavailable)
 *  - sort: recently saved / recently updated
 *  - filled bookmark unsaves, with a 5-second Undo bar
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, RefreshControl, Animated } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AlertTriangle, Bookmark, BookOpen, ChevronDown, Layers, Search, Users, X } from 'lucide-react-native';
import { FieldFrame } from '@/components/common/TextField';
import { ICON_STROKE } from '@/constants/icons';
import { ScreenHeader } from '../../components/layout/ScreenHeader';
import { SkeletonList } from '../../components/feedback/Skeleton';
import { HighlightText } from '@/components/search/SearchRows';
import { spacing, radius, typography, fontFamilies, shadows } from '../../constants';
import { cardShadow } from '@/constants/cards';
import { useTheme } from '@/hooks/useTheme';
import { useSavedItems } from '@/hooks/useSavedItems';
import { useCollaborate } from '@/hooks/useCollaborate';
import { subscribeWorksStatus, toCurrentWork } from '@/services/research.service';
import { formatRelativeDate } from '@/utils/date';
import { confirmAction } from '@/utils/dialogs';
import { tokenize } from '@/utils/searchRank';
import type { ResearchWork } from '@/types/research.types';
import type { SavedItem } from '@/types/network.types';

type Filter = 'all' | 'collaborations' | 'research' | 'unavailable';
type Sort = 'saved' | 'updated';
const UNDO_MS = 5000;

const millis = (t: any) => (t?.toMillis ? t.toMillis() : 0);

interface Entry {
  saved: SavedItem;
  /** undefined = still loading, null = deleted / not visible */
  live: ResearchWork | null | undefined;
}

export default function SavedItemsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { items, loading, error, retry, remove, restore } = useSavedItems();
  const collaborate = useCollaborate();

  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState<Sort>('saved');
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Live copies of the saved posts
  const [liveById, setLiveById] = useState<Map<string, ResearchWork | null> | null>(null);
  const idsKey = items.map((i) => i.workId).sort().join(',');
  // Keep the previous map while the id list changes (e.g. after unsaving), so
  // rows don't flash back to skeletons; new ids show their saved copy meanwhile.
  useEffect(() => subscribeWorksStatus(idsKey ? idsKey.split(',') : [], setLiveById), [idsKey]);

  const entries: Entry[] = useMemo(
    () => items.map((saved) => ({ saved, live: liveById ? liveById.get(saved.workId) : undefined })),
    [items, liveById],
  );

  const kindOf = (e: Entry): Filter =>
    e.live === null ? 'unavailable' : e.live?.postType === 'collaboration' ? 'collaborations' : 'research';

  const counts = useMemo(() => {
    const c = { all: entries.length, collaborations: 0, research: 0, unavailable: 0 };
    entries.forEach((e) => {
      if (e.live === undefined) return;
      c[kindOf(e) as Exclude<Filter, 'all'>] += 1;
    });
    return c;
  }, [entries]);

  const terms = useMemo(() => tokenize(query), [query]);
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries
      .filter((e) => filter === 'all' || kindOf(e) === filter)
      .filter((e) => {
        if (!q) return true;
        const title = e.live?.title ?? e.saved.workTitle;
        const author = e.live?.authorName ?? e.saved.workAuthorName;
        return `${title} ${author}`.toLowerCase().includes(q);
      })
      .sort((a, b) =>
        sort === 'saved'
          ? millis(b.saved.savedAt) - millis(a.saved.savedAt)
          : millis(b.live?.updatedAt ?? b.saved.savedAt) - millis(a.live?.updatedAt ?? a.saved.savedAt),
      );
  }, [entries, filter, query, sort]);

  // ---------------------------------------------------------------------------
  // Unsave with Undo
  // ---------------------------------------------------------------------------
  const [undo, setUndo] = useState<{ work: ResearchWork; title: string } | null>(null);
  const undoAnim = useRef(new Animated.Value(0)).current;
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hideUndo = () => {
    Animated.timing(undoAnim, { toValue: 0, duration: 160, useNativeDriver: true }).start(() => setUndo(null));
  };
  useEffect(() => () => {
    if (undoTimer.current) clearTimeout(undoTimer.current);
  }, []);

  const unsave = async (e: Entry) => {
    const ok = await remove(e.saved.workId, { silent: Boolean(e.live) });
    if (!ok || !e.live) return; // unavailable posts can't be re-saved, so no Undo
    setUndo({ work: e.live, title: e.live.title });
    undoAnim.setValue(0);
    Animated.timing(undoAnim, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(hideUndo, UNDO_MS);
  };

  const doUndo = async () => {
    if (!undo) return;
    if (undoTimer.current) clearTimeout(undoTimer.current);
    const work = undo.work;
    hideUndo();
    await restore(work);
  };

  const removeUnavailable = async () => {
    const gone = entries.filter((e) => e.live === null);
    if (!gone.length) return;
    const ok = await confirmAction({
      title: `Remove ${gone.length} unavailable item${gone.length === 1 ? '' : 's'}?`,
      message: 'These posts were deleted or are no longer shared.',
      confirmLabel: 'Remove',
      destructive: true,
      icon: 'delete',
    });
    if (!ok) return;
    await Promise.all(gone.map((e) => remove(e.saved.workId, { silent: true })));
  };

  const onRefresh = () => {
    setRefreshing(true);
    retry();
    setTimeout(() => setRefreshing(false), 800);
  };

  // ---------------------------------------------------------------------------
  // Rows
  // ---------------------------------------------------------------------------
  const renderRow = (e: Entry) => {
    const { saved, live } = e;
    if (live === null) {
      return (
        <View key={saved.workId} style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.borderSubtle, opacity: 0.85 }]}>
          <View style={[styles.icon, { backgroundColor: colors.surfaceSubtle }]}>
            <AlertTriangle size={18} color={colors.textMuted} />
          </View>
          <View style={styles.body}>
            <Text style={[styles.title, { color: colors.textSecondary }]} numberOfLines={2}>{saved.workTitle}</Text>
            <Text style={[styles.meta, { color: colors.textMuted }]}>No longer available · by {saved.workAuthorName}</Text>
          </View>
          <TouchableOpacity
            onPress={() => unsave(e)}
            style={[styles.smallBtn, { borderColor: colors.border }]}
            accessibilityRole="button"
            accessibilityLabel={`Remove ${saved.workTitle}`}
          >
            <Text style={[styles.smallBtnText, { color: colors.textPrimary }]}>Remove</Text>
          </TouchableOpacity>
        </View>
      );
    }

    const title = live?.title ?? saved.workTitle;
    const author = live?.authorName ?? saved.workAuthorName;
    const stage = live?.stage ?? saved.workStage;
    const isCollab = live?.postType === 'collaboration';
    const closed = isCollab && live?.collabStatus === 'closed';
    const updatedAfterSave = live && millis(live.updatedAt) > millis(saved.savedAt) + 60_000;
    const action = live && isCollab ? collaborate(toCurrentWork(live)) : null;
    const canApply = Boolean(action?.onCollaboratePress && !action.collaborateDisabled);
    const Icon = isCollab ? Users : BookOpen;

    return (
      <TouchableOpacity
        key={saved.workId}
        activeOpacity={0.9}
        onPress={() => router.push(`/(research)/${saved.workId}` as any)}
        style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}
        accessibilityRole="button"
        accessibilityLabel={`${isCollab ? `Collaboration, ${closed ? 'team formed' : 'open'}` : 'Research work'}${stage ? `, ${stage}` : ''}: ${title}`}
      >
        <View style={[styles.icon, { backgroundColor: isCollab ? colors.primaryMuted : colors.surfaceSubtle }]}>
          <Icon size={18} color={isCollab ? colors.primary : colors.textSecondary} />
        </View>
        <View style={styles.body}>
          <HighlightText text={title} terms={terms} style={[styles.title, { color: colors.textPrimary }]} numberOfLines={2} />
          <View style={styles.metaLine}>
            <Text style={[styles.meta, { color: colors.textSecondary, flexShrink: 1 }]} numberOfLines={1}>{author}</Text>
            <Layers size={11} color={colors.textMuted} />
            <Text style={[styles.meta, { color: colors.textMuted }]} numberOfLines={1}>{stage}</Text>
          </View>
          <Text style={[styles.meta, { color: updatedAfterSave ? colors.primary : colors.textMuted }]} numberOfLines={1}>
            {updatedAfterSave ? `Updated ${formatRelativeDate(live!.updatedAt)}` : `Saved ${formatRelativeDate(saved.savedAt)}`}
          </Text>
          {isCollab ? (
            <View style={styles.collabLine}>
              <View style={[styles.status, { backgroundColor: closed ? colors.successLight : colors.primaryMuted }]}>
                <Text style={[styles.statusText, { color: closed ? colors.success : colors.primary }]}>{closed ? 'Team formed' : 'Open'}</Text>
              </View>
              {action?.collaborateLabel ? (
                <TouchableOpacity
                  onPress={action.onCollaboratePress}
                  disabled={!canApply}
                  hitSlop={6}
                  style={[
                    styles.applyBtn,
                    canApply
                      ? { backgroundColor: colors.primary, borderColor: colors.primary }
                      : { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderSubtle },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={action.collaborateLabel}
                >
                  <Text style={[styles.smallBtnText, { color: canApply ? '#FFFFFF' : colors.textMuted }]} numberOfLines={1}>
                    {canApply ? 'Apply' : action.collaborateLabel.replace(' · Tap to withdraw', '')}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}
        </View>
        <TouchableOpacity
          onPress={() => unsave(e)}
          hitSlop={10}
          style={styles.bookmark}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${title} from saved items`}
        >
          <Bookmark size={20} color={colors.primary} fill={colors.primary} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'collaborations', label: 'Collaborations' },
    { key: 'research', label: 'Research' },
    ...(counts.unavailable ? [{ key: 'unavailable' as const, label: 'Unavailable' }] : []),
  ];

  // ---------------------------------------------------------------------------
  // Screen
  // ---------------------------------------------------------------------------
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <ScreenHeader title="Saved Items" subtitle={items.length ? `${items.length} saved` : undefined} />

      {loading ? (
        <View style={styles.content}>
          <SkeletonList count={4} variant="row" />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Could not load saved items</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Check your connection and try again.</Text>
          <TouchableOpacity onPress={retry} style={[styles.cta, { backgroundColor: colors.primaryMuted }]} accessibilityRole="button">
            <Text style={[styles.ctaText, { color: colors.primary }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.centered}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.primaryMuted }]}>
            <Bookmark size={32} color={colors.primary} strokeWidth={ICON_STROKE.light} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No saved research yet</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Tap the bookmark on any post to keep it here for later.
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/explore' as any)}
            style={[styles.cta, { backgroundColor: colors.primaryMuted }]}
            accessibilityRole="button"
          >
            <Text style={[styles.ctaText, { color: colors.primary }]}>Explore research</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: spacing.xxl + (undo ? 64 : 0) }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
        >
          {/* Search + sort */}
          <View style={styles.toolbar}>
            <FieldFrame style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
              <Search size={16} color={colors.textMuted} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search saved"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                style={[styles.searchInput, { color: colors.textPrimary }]}
                accessibilityLabel="Search saved items"
              />
              {query ? (
                <TouchableOpacity onPress={() => setQuery('')} hitSlop={8} accessibilityLabel="Clear search">
                  <X size={15} color={colors.textMuted} />
                </TouchableOpacity>
              ) : null}
            </FieldFrame>
            <TouchableOpacity
              onPress={() => setSort((s) => (s === 'saved' ? 'updated' : 'saved'))}
              style={[styles.sortBtn, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}
              accessibilityRole="button"
              accessibilityLabel={`Sorted by recently ${sort}. Tap to change`}
            >
              <Text style={[styles.sortText, { color: colors.textSecondary }]}>{sort === 'saved' ? 'Saved' : 'Updated'}</Text>
              <ChevronDown size={14} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Filters with counts */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
            {FILTERS.map((f) => {
              const active = filter === f.key;
              const warn = f.key === 'unavailable';
              return (
                <TouchableOpacity
                  key={f.key}
                  onPress={() => setFilter(f.key)}
                  style={[
                    styles.filterChip,
                    active
                      ? { backgroundColor: colors.primary, borderColor: colors.primary }
                      : { backgroundColor: colors.surface, borderColor: warn ? colors.warning : colors.borderSubtle },
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <Text
                    style={[
                      styles.filterText,
                      { color: active ? '#FFFFFF' : warn ? colors.warning : colors.textSecondary },
                      active && { fontFamily: fontFamilies.sansSemiBold },
                    ]}
                  >
                    {f.label} {counts[f.key]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {liveById === null ? (
            <SkeletonList count={Math.min(items.length, 4)} variant="row" />
          ) : visible.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textSecondary, marginTop: spacing.lg }]}>
              {query ? `Nothing saved matches "${query}".` : 'Nothing in this filter.'}
            </Text>
          ) : (
            visible.map(renderRow)
          )}

          {counts.unavailable > 0 && liveById ? (
            <TouchableOpacity onPress={removeUnavailable} style={styles.cleanBtn} accessibilityRole="button">
              <Text style={[styles.cleanText, { color: colors.textSecondary }]}>
                Remove {counts.unavailable} unavailable
              </Text>
            </TouchableOpacity>
          ) : null}
        </ScrollView>
      )}

      {/* Undo bar */}
      {undo ? (
        <Animated.View
          style={[
            styles.undoBar,
            shadows.elevated,
            {
              backgroundColor: colors.textPrimary,
              bottom: Math.max(insets.bottom, spacing.md),
              opacity: undoAnim,
              transform: [{ translateY: undoAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
            },
          ]}
          accessibilityLiveRegion="polite"
        >
          <Text style={[styles.undoText, { color: colors.background }]} numberOfLines={1}>
            Removed "{undo.title}"
          </Text>
          <TouchableOpacity onPress={doUndo} hitSlop={10} accessibilityRole="button" accessibilityLabel="Undo remove">
            <Text style={[styles.undoAction, { color: colors.primaryLight }]}>Undo</Text>
          </TouchableOpacity>
        </Animated.View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  emptyIcon: { width: 64, height: 64, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  emptyTitle: { ...typography.titleSmall, textAlign: 'center', marginBottom: 4 },
  emptyText: { ...typography.bodySmall, textAlign: 'center' },
  cta: { marginTop: spacing.md, paddingHorizontal: spacing.lg, minHeight: spacing.secondaryButtonHeight, justifyContent: 'center', borderRadius: radius.button },
  ctaText: { ...typography.button },
  content: { padding: spacing.md, gap: spacing.sm },

  toolbar: { flexDirection: 'row', gap: spacing.xs },
  search: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: radius.button, paddingHorizontal: 12, height: spacing.secondaryButtonHeight },
  searchInput: { flex: 1, ...typography.bodyCompact, paddingVertical: 0 },
  sortBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, borderWidth: 1, borderRadius: radius.button, paddingHorizontal: 12, height: spacing.secondaryButtonHeight },
  sortText: { ...typography.caption, fontFamily: fontFamilies.sansSemiBold },
  filters: { gap: spacing.xs, paddingVertical: 2 },
  filterChip: { paddingHorizontal: 14, height: 34, borderRadius: radius.full, borderWidth: 1, justifyContent: 'center' },
  filterText: { ...typography.caption, fontSize: 13 },

  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 12,
    ...cardShadow(false),
  },
  icon: { width: 40, height: 40, borderRadius: radius.button, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, minWidth: 0, gap: 2 },
  title: { ...typography.label, fontFamily: fontFamilies.sansSemiBold },
  meta: { ...typography.caption },
  metaLine: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  collabLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: 6 },
  status: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full },
  statusText: { ...typography.micro, fontFamily: fontFamilies.sansSemiBold },
  applyBtn: { paddingHorizontal: 12, height: spacing.compactButtonHeight, borderRadius: radius.button, borderWidth: 1, justifyContent: 'center', maxWidth: 170 },
  smallBtn: { paddingHorizontal: 12, height: spacing.compactButtonHeight, borderRadius: radius.button, borderWidth: 1, justifyContent: 'center', alignSelf: 'center' },
  smallBtnText: { ...typography.buttonSmall },
  bookmark: { padding: 4 },
  cleanBtn: { alignSelf: 'center', paddingVertical: spacing.md },
  cleanText: { ...typography.caption, fontFamily: fontFamilies.sansSemiBold, textDecorationLine: 'underline' },

  undoBar: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    height: 48,
    borderRadius: radius.button,
  },
  undoText: { ...typography.bodySmall, flex: 1 },
  undoAction: { ...typography.label, fontFamily: fontFamilies.sansBold },
});
