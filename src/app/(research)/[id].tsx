import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, BookOpen, Layers, Calendar, ExternalLink, Trash2, Bookmark } from 'lucide-react-native';
import { spacing, radius, typography, fontFamilies } from '../../constants';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { Avatar } from '../../components/common/Avatar';
import { Button } from '../../components/common/Button';
import {
  getResearchWork,
  deleteResearchWork,
  formatWorkDate,
} from '@/services/research.service';
import type { ResearchWork } from '@/types/research.types';
import { useSavedItems } from '@/hooks/useSavedItems';

type LoadState = 'loading' | 'ready' | 'not-found' | 'error';

export default function ResearchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { firebaseUser } = useAuth();

  const [work, setWork] = useState<ResearchWork | null>(null);
  const [state, setState] = useState<LoadState>('loading');
  const [isDeleting, setIsDeleting] = useState(false);
  const { isSaved, toggleSave } = useSavedItems();

  const load = useCallback(async () => {
    if (!id) {
      setState('not-found');
      return;
    }
    setState('loading');
    try {
      const result = await getResearchWork(id);
      setWork(result);
      setState(result ? 'ready' : 'not-found');
    } catch (err: any) {
      // Unknown / legacy IDs and inaccessible drafts are denied by the rules.
      setState(err?.code === 'permission-denied' ? 'not-found' : 'error');
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const isOwner = Boolean(work && firebaseUser && work.authorUid === firebaseUser.uid);

  const handleOpenLink = (url: string) => {
    Linking.openURL(url).catch(() => Alert.alert('Link Error', `Unable to open: ${url}`));
  };

  const handleAuthorPress = () => {
    if (!work) return;
    router.push((isOwner ? '/(tabs)/profile' : `/(profile)/${work.authorUid}`) as any);
  };

  const handleDelete = () => {
    if (!work) return;
    Alert.alert('Delete research update?', 'This permanently removes it from the feed.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setIsDeleting(true);
          try {
            await deleteResearchWork(work.id);
            router.back();
          } catch {
            setIsDeleting(false);
            Alert.alert('Delete failed', 'Could not delete this update. Please try again.');
          }
        },
      },
    ]);
  };

  const renderStatus = () => {
    if (state === 'loading') {
      return (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
          <Text style={[styles.subtitle, { color: colors.textSecondary, marginTop: spacing.sm }]}>
            Loading research details...
          </Text>
        </View>
      );
    }
    return (
      <View style={styles.centered}>
        <View style={[styles.iconContainer, { backgroundColor: colors.primaryMuted }]}>
          <BookOpen size={36} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.textPrimary, textAlign: 'center' }]}>
          {state === 'not-found' ? 'Research not available' : 'Something went wrong'}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {state === 'not-found'
            ? 'This update may have been removed, or it is not shared with you.'
            : 'We could not load this research update. Check your connection and try again.'}
        </Text>
        {state === 'error' ? (
          <Button label="Retry" onPress={load} variant="outline" size="md" />
        ) : null}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <View
        style={[
          styles.header,
          { backgroundColor: colors.surface, borderBottomColor: colors.border },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Research Details</Text>
        {state === 'ready' && work && work.status === 'published' ? (
          <TouchableOpacity
            onPress={() => toggleSave(work)}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel={isSaved(work.id) ? 'Remove from saved items' : 'Save research'}
          >
            <Bookmark
              size={20}
              color={isSaved(work.id) ? colors.primary : colors.textPrimary}
              fill={isSaved(work.id) ? colors.primary : 'transparent'}
            />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {state !== 'ready' || !work ? (
        renderStatus()
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Author */}
          <TouchableOpacity activeOpacity={0.8} onPress={handleAuthorPress} style={styles.authorRow}>
            <Avatar name={work.authorName} uri={work.authorPhotoURL} size="md" />
            <View style={styles.authorInfo}>
              <Text style={[styles.authorName, { color: colors.textPrimary }]} numberOfLines={1}>
                {work.authorName}
              </Text>
              <Text style={[styles.authorMeta, { color: colors.textSecondary }]} numberOfLines={1}>
                {[work.authorDesignation, work.authorDepartment].filter(Boolean).join(' • ')}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Title & meta */}
          <Text style={[styles.title, { color: colors.textPrimary }]}>{work.title}</Text>

          <View style={styles.metaRow}>
            <View style={[styles.metaPill, { backgroundColor: colors.primaryMuted }]}>
              <Layers size={13} color={colors.primary} />
              <Text style={[styles.metaPillText, { color: colors.primary }]}>{work.stage}</Text>
            </View>
            <View style={styles.metaItem}>
              <Calendar size={13} color={colors.textSecondary} />
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                {formatWorkDate(work.createdAt)}
              </Text>
            </View>
            {work.status === 'draft' ? (
              <View style={[styles.metaPill, { backgroundColor: colors.surfaceSubtle }]}>
                <Text style={[styles.metaPillText, { color: colors.textMuted }]}>Draft</Text>
              </View>
            ) : null}
          </View>

          {/* Description */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
            <Text style={[styles.description, { color: colors.textPrimary }]}>{work.description}</Text>
          </View>

          {/* Tags */}
          {work.tags.length > 0 ? (
            <View style={styles.tagsRow}>
              {work.tags.map((tag) => (
                <View
                  key={tag}
                  style={[styles.tag, { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderSubtle }]}
                >
                  <Text style={[styles.tagText, { color: colors.textSecondary }]} numberOfLines={1}>
                    {tag}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          {/* External link */}
          {work.externalUrl ? (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleOpenLink(work.externalUrl!)}
              style={[styles.linkRow, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}
              accessibilityRole="link"
            >
              <ExternalLink size={16} color={colors.primary} />
              <Text style={[styles.linkText, { color: colors.primary }]} numberOfLines={1}>
                {work.externalUrl}
              </Text>
            </TouchableOpacity>
          ) : null}

          {/* Owner actions */}
          {isOwner ? (
            <View style={styles.ownerActions}>
              <Button
                label="Delete Update"
                onPress={handleDelete}
                variant="destructive"
                size="md"
                fullWidth
                loading={isDeleting}
                disabled={isDeleting}
                icon={<Trash2 size={16} color="#FFFFFF" />}
              />
            </View>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.titleSmall,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  authorInfo: {
    flex: 1,
    minWidth: 0,
    marginLeft: spacing.sm,
  },
  authorName: {
    ...typography.titleSmall,
  },
  authorMeta: {
    ...typography.bodySmall,
  },
  title: {
    ...typography.headlineSmall,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  metaPillText: {
    ...typography.caption,
    fontFamily: fontFamilies.sansSemiBold,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    ...typography.caption,
  },
  card: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  description: {
    ...typography.body,
    lineHeight: 22,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: spacing.md,
  },
  tag: {
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    maxWidth: '100%',
    flexShrink: 1,
  },
  tagText: {
    ...typography.caption,
    flexShrink: 1,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  linkText: {
    ...typography.bodySmall,
    flex: 1,
    minWidth: 0,
  },
  ownerActions: {
    marginTop: spacing.sm,
  },
});
