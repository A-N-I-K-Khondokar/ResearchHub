import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Bookmark, Layers, Trash2 } from 'lucide-react-native';
import { ScreenHeader } from '../../components/layout/ScreenHeader';
import { SkeletonList } from '../../components/feedback/Skeleton';
import { spacing, radius, typography, fontFamilies } from '../../constants';
import { useTheme } from '@/hooks/useTheme';
import { useSavedItems } from '@/hooks/useSavedItems';
import { formatWorkDate } from '@/services/research.service';

/** Saved Items — the signed-in researcher's private bookmarks (users/{uid}/saved_items). */
export default function SavedItemsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { items, loading, error, remove } = useSavedItems();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <ScreenHeader title="Saved Items" />

      {loading ? (
        <View style={styles.list}>
          <SkeletonList count={4} variant="row" />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Could not load saved items</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Check your connection and try again.
          </Text>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.centered}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primaryMuted }]}>
            <Bookmark size={32} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No saved research yet</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Tap the bookmark on any research update to keep it here for later.
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/explore' as any)}
            style={[styles.cta, { backgroundColor: colors.primaryMuted }]}
          >
            <Text style={[styles.ctaText, { color: colors.primary }]}>Explore research</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.workId}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => router.push(`/(research)/${item.workId}` as any)}
              style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}
              accessibilityRole="button"
              accessibilityLabel={`Open ${item.workTitle}`}
            >
              <View style={styles.cardBody}>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                  {item.workTitle}
                </Text>
                <Text style={[styles.cardMeta, { color: colors.textSecondary }]} numberOfLines={1}>
                  {item.workAuthorName} • Saved {formatWorkDate(item.savedAt)}
                </Text>
                <View style={styles.stageRow}>
                  <Layers size={13} color={colors.textSecondary} />
                  <Text style={[styles.cardMeta, { color: colors.textSecondary }]}>{item.workStage}</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => remove(item.workId)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={styles.removeButton}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${item.workTitle} from saved items`}
              >
                <Trash2 size={18} color={colors.error} />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: { ...typography.titleSmall, textAlign: 'center', marginBottom: 4 },
  emptyText: { ...typography.bodySmall, textAlign: 'center' },
  cta: { marginTop: spacing.md, paddingHorizontal: spacing.lg, minHeight: spacing.secondaryButtonHeight, justifyContent: 'center', borderRadius: radius.button },
  ctaText: { ...typography.label },
  list: { padding: spacing.md, gap: spacing.sm },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  cardBody: { flex: 1, minWidth: 0 },
  cardTitle: { ...typography.titleSmall, marginBottom: 4 },
  cardMeta: { ...typography.caption },
  stageRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  removeButton: { paddingLeft: spacing.md },
});
