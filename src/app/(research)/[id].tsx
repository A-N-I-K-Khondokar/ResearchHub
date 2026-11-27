/**
 * Research Details
 *
 * Layout (top → bottom):
 *   header (⋯ Manage for the author)
 *   hero: type/status line · title · author row (+ Connect) · stage progress
 *   About this research: collapsible description, topics, link
 *   Team & roles (collaboration posts): looking for, stacked team avatars
 *   More from <author>: horizontal cards
 *   sticky bottom action bar: the ONE main action for whoever is viewing
 * Author tools (edit, open/closed, applicants, delete) live in ManagePostSheet.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  RefreshControl,
} from 'react-native';
import { COMPACT_FONT_SCALE } from '@/constants/typography';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  BookOpen,
  Bookmark,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  ExternalLink,
  IdCard,
  Layers,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Send,
  Settings2,
  Share2,
  UserPlus,
  Users,
} from 'lucide-react-native';
import { ICON_STROKE } from '@/constants/icons';
import { spacing, radius, typography, fontFamilies, shadows } from '../../constants';
import { cardShadow } from '@/constants/cards';
import { collabStateIcon } from '@/components/common/collabStateIcon';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useContactCard } from '@/context/ContactCardContext';
import { Avatar } from '../../components/common/Avatar';
import { ScreenHeader, ScreenHeaderAction } from '../../components/layout/ScreenHeader';
import { Share as RNShare } from 'react-native';
import { DetailSkeleton } from '../../components/feedback/Skeleton';
import { Button } from '../../components/common/Button';
import { ContactSheet, type ContactPerson } from '../../components/common/ContactSheet';
import { EditWorkSheet } from '@/components/research/EditWorkSheet';
import { ManagePostSheet } from '@/components/research/ManagePostSheet';
import { StageProgress } from '@/components/research/StageProgress';
import {
  subscribeResearchWork,
  deleteResearchWork,
  formatWorkDate,
  getPublishedWorksByAuthor,
  updateResearchStage,
  publishDraft,
} from '@/services/research.service';
import { respondToApplication, setCollabStatus, subscribeReceivedApplications } from '@/services/collab.service';
import type { ResearchWork } from '@/types/research.types';
import type { CollabRequest } from '@/types/collab.types';
import { useConnections } from '@/hooks/useConnections';
import { useCollaborate } from '@/hooks/useCollaborate';
import { useCollab } from '@/context/CollabContext';
import { useResearchDirectory } from '@/hooks/useResearchDirectory';
import { formatRelativeDate } from '@/utils/date';
import { tagMatchKey } from '@/utils/researchWork';
import { TOPIC_TAXONOMY } from '@/utils/search';
import { useSavedItems } from '@/hooks/useSavedItems';
import { confirmAction } from '@/utils/dialogs';

type LoadState = 'loading' | 'ready' | 'not-found' | 'removed' | 'error';

/** Splits text into plain parts and tappable http(s) links. */
const URL_RE = /(https?:\/\/[^\s)]+)/g;
function linkParts(text: string): { text: string; url?: string }[] {
  const parts: { text: string; url?: string }[] = [];
  let last = 0;
  for (const m of text.matchAll(URL_RE)) {
    const start = m.index ?? 0;
    if (start > last) parts.push({ text: text.slice(last, start) });
    const url = m[0].replace(/[.,;:!?]+$/, '');
    parts.push({ text: url, url });
    last = start + url.length;
  }
  if (last < text.length) parts.push({ text: text.slice(last) });
  return parts;
}

const DESCRIPTION_PREVIEW_LINES = 5;
const DESCRIPTION_LONG = 280;
const BOTTOM_BAR_HEIGHT = 76;

export default function ResearchDetailScreen() {
  const { id, manage } = useLocalSearchParams<{ id: string; manage?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { firebaseUser, userProfile } = useAuth();
  const toast = useToast();
  const { isSaved, toggleSave } = useSavedItems();
  const { relationship, handleConnectPress, busyUid } = useConnections();
  const collaborate = useCollaborate();
  const { hasMyCard, openContactEditor } = useContactCard();

  const [work, setWork] = useState<ResearchWork | null>(null);
  const [state, setState] = useState<LoadState>('loading');
  const [refreshing, setRefreshing] = useState(false);
  const [moreWorks, setMoreWorks] = useState<ResearchWork[]>([]);
  const [applicants, setApplicants] = useState<CollabRequest[]>([]);
  const [busyRequest, setBusyRequest] = useState<string | null>(null);
  const [statusBusy, setStatusBusy] = useState(false);
  const [stageBusy, setStageBusy] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [teamOpen, setTeamOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [contactPerson, setContactPerson] = useState<ContactPerson | null>(null);

  // -------------------------------------------------------------------------
  // Data
  // -------------------------------------------------------------------------

  // Live post: edits, stage, team, Team formed and deletion appear immediately
  const [liveKey, setLiveKey] = useState(0);
  const wasReady = React.useRef(false);
  useEffect(() => {
    if (!id) {
      setState('not-found');
      return;
    }
    setState((s) => (s === 'ready' ? s : 'loading'));
    return subscribeResearchWork(
      id,
      (result) => {
        setRefreshing(false);
        if (result) {
          wasReady.current = true;
          setWork(result);
          setState('ready');
        } else {
          setState(wasReady.current ? 'removed' : 'not-found');
          setWork(null);
        }
      },
      (err) => {
        setRefreshing(false);
        // Unknown / legacy IDs and inaccessible drafts are denied by the rules.
        setState(err?.code === 'permission-denied' ? (wasReady.current ? 'removed' : 'not-found') : 'error');
      },
    );
  }, [id, liveKey]);
  const load = useCallback(() => setLiveKey((k) => k + 1), []);

  // "More from <author>" once per author
  const authorUid = work?.authorUid;
  useEffect(() => {
    if (!authorUid) return;
    getPublishedWorksByAuthor(authorUid)
      .then((works) => setMoreWorks(works.filter((w) => w.id !== id).slice(0, 6)))
      .catch(() => setMoreWorks([]));
  }, [authorUid, id]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
    setTimeout(() => setRefreshing(false), 1500);
  };

  // Related research: other authors, overlapping topics (from the shared directory)
  const directory = useResearchDirectory();
  const related = React.useMemo(() => {
    if (!work || work.tags.length === 0) return [];
    const keys = new Set(work.tags.map(tagMatchKey));
    return directory.works
      .filter((w) => w.id !== work.id && w.authorUid !== work.authorUid)
      .map((w) => ({ w, n: w.tags.filter((t) => keys.has(tagMatchKey(t))).length }))
      .filter((x) => x.n > 0)
      .sort((a, b) => b.n - a.n)
      .slice(0, 6)
      .map((x) => x.w);
  }, [work, directory.works]);

  // My own application to this post (applicants see its status here)
  const { applicationFor, withdraw } = useCollab();

  const myUid = firebaseUser?.uid ?? '';
  const isOwner = Boolean(work && myUid && work.authorUid === myUid);
  const isCollabPost = work?.postType === 'collaboration';
  const onTeam = Boolean(work && !isOwner && work.team.some((m) => m.uid === myUid));
  const needsMyCard = Boolean(isCollabPost && (onTeam || (isOwner && (work?.team.length ?? 0) > 0)));
  const pendingCount = applicants.filter((a) => a.status === 'pending').length;
  const authorFirst = work?.authorName.split(' ')[0] ?? '';

  // Deep link from Home's "applicants waiting": open the Manage sheet once
  const openedManage = React.useRef(false);
  useEffect(() => {
    if (manage === '1' && isOwner && !openedManage.current) {
      openedManage.current = true;
      setManageOpen(true);
    }
  }, [manage, isOwner]);

  // Live applicants for the author of a collaboration post
  useEffect(() => {
    if (!isOwner || !isCollabPost || !myUid || !work?.id) return;
    return subscribeReceivedApplications(myUid, setApplicants, work.id);
  }, [isOwner, isCollabPost, myUid, work?.id]);

  // -------------------------------------------------------------------------
  // Actions
  // -------------------------------------------------------------------------

  const handleRespond = async (request: CollabRequest, accept: boolean) => {
    if (!userProfile) return;
    if (!accept) {
      const ok = await confirmAction({
        title: 'Decline application?',
        message: `${request.applicant.displayName} will be notified that the position is not available.`,
        confirmLabel: 'Decline',
        destructive: true,
      });
      if (!ok) return;
    }
    setBusyRequest(request.id);
    try {
      await respondToApplication(userProfile, request, accept, relationship(request.applicantUid).connection);
      toast.show(
        accept ? `${request.applicant.displayName.split(' ')[0]} joined your team as ${request.role}` : 'Application declined',
        accept ? 'success' : 'info',
      );
      if (accept) {
        if (hasMyCard === false) {
          setManageOpen(false);
          setTimeout(() => openContactEditor(), 900);
        }
      }
    } catch (err) {
      console.error('[ResearchDetail] respond failed:', err);
      toast.show('Could not update the application. Please try again.', 'error');
    } finally {
      setBusyRequest(null);
    }
  };

  const handleToggleOpen = async (open: boolean) => {
    if (!work) return;
    setStatusBusy(true);
    try {
      await setCollabStatus(work.id, open ? 'open' : 'closed');
      setWork({ ...work, collabStatus: open ? 'open' : 'closed' });
      toast.show(open ? 'Accepting applications again' : 'Marked as Team formed', 'info');
    } catch {
      toast.show('Could not update the post status', 'error');
    } finally {
      setStatusBusy(false);
    }
  };

  const handleStageChange = async (stage: ResearchWork['stage']) => {
    if (!work || !isOwner || stageBusy || stage === work.stage) return;
    const previous = work.stage;
    setStageBusy(true);
    setWork({ ...work, stage }); // optimistic
    try {
      await updateResearchStage(work.id, stage);
      toast.show(`Stage updated to ${stage}`);
    } catch {
      setWork((w) => (w ? { ...w, stage: previous } : w));
      toast.show('Could not update the stage. Please try again.', 'error');
    } finally {
      setStageBusy(false);
    }
  };

  const handlePublish = async () => {
    if (!work || work.status !== 'draft') return;
    const ok = await confirmAction({
      title: isCollabPost ? 'Publish collaboration request?' : 'Publish this update?',
      message: `"${work.title}" will be visible to all approved CSE researchers.`,
      confirmLabel: 'Publish',
      cancelLabel: 'Not yet',
      icon: 'info',
    });
    if (!ok) return;
    try {
      await publishDraft(work.id);
      setWork({ ...work, status: 'published' });
      toast.show(isCollabPost ? 'Collaboration request published' : 'Update published');
    } catch {
      toast.show('Could not publish. Please try again.', 'error');
    }
  };

  const handleDelete = async () => {
    if (!work) return;
    const ok = await confirmAction({
      title: isCollabPost ? 'Delete collaboration post?' : 'Delete research work?',
      message: `"${work.title}" will be permanently removed${isCollabPost ? ', including its team list and applications' : ''}. This cannot be undone.`,
      confirmLabel: 'Delete permanently',
      icon: 'delete',
      destructive: true,
    });
    if (!ok) return;
    setIsDeleting(true);
    try {
      await deleteResearchWork(work.id);
      setManageOpen(false);
      toast.show(isCollabPost ? 'Collaboration post deleted' : 'Research work deleted', 'info');
      router.back();
    } catch {
      setIsDeleting(false);
      toast.show('Could not delete this post. Please try again.', 'error');
    }
  };

  const shareWork = async () => {
    if (!work) return;
    const summary = work.description.length > 160 ? `${work.description.slice(0, 157)}…` : work.description;
    const kind = isCollabPost ? `Collaboration — looking for ${work.lookingFor.join(', ')}` : `Research · ${work.stage}`;
    try {
      await RNShare.share({
        title: work.title,
        message: `${work.title}\nby ${work.authorName} · ${kind}\n\n${summary}\n\nOpen in CSE Research Hub: cseresearchhub://research/${work.id}`,
      });
    } catch {
      // user dismissed / share unavailable
    }
  };

  /** Tags open the matching topic page (or a search when it isn't a known topic). */
  const openTag = (tag: string) => {
    const key = tagMatchKey(tag);
    const topic = TOPIC_TAXONOMY.find((t) => tagMatchKey(t.name) === key);
    if (topic) router.push({ pathname: '/(explore)/topic-researchers' as any, params: { topic: topic.name } });
    else router.push({ pathname: '/(explore)/search' as any, params: { q: tag.replace(/^#/, '') } });
  };

  const withdrawMine = async () => {
    const mine = work ? applicationFor(work.id) : undefined;
    if (!mine) return;
    const ok = await confirmAction({
      title: 'Withdraw application?',
      message: `Withdraw your application to "${mine.workTitle}" as ${mine.role}?`,
      confirmLabel: 'Withdraw',
      destructive: true,
    });
    if (ok) await withdraw(mine);
  };

  const openLink = (url: string) => Linking.openURL(url).catch(() => toast.show('Unable to open this link', 'error'));
  const openProfile = (uid: string) =>
    router.push((uid === myUid ? '/(tabs)/profile' : `/(profile)/${uid}`) as any);

  const contactAuthor = () =>
    work &&
    setContactPerson({
      uid: work.authorUid,
      displayName: work.authorName,
      photoURL: work.authorPhotoURL,
      subtitle: isCollabPost ? 'Project lead' : work.authorDesignation,
    });

  const authorSource = useMemo(
    () =>
      work
        ? { uid: work.authorUid, displayName: work.authorName, photoURL: work.authorPhotoURL, designation: work.authorDesignation }
        : null,
    [work],
  );

  // -------------------------------------------------------------------------
  // Render helpers
  // -------------------------------------------------------------------------

  const renderStatus = () => {
    if (state === 'loading') return <DetailSkeleton />;
    return (
      <View style={styles.centered}>
        <View style={[styles.iconContainer, { backgroundColor: colors.primaryMuted }]}>
          <BookOpen size={36} color={colors.primary} strokeWidth={ICON_STROKE.light} />
        </View>
        <Text style={[styles.statusTitle, { color: colors.textPrimary }]}>
          {state === 'removed' ? 'This post was removed' : state === 'not-found' ? 'Research not available' : 'Something went wrong'}
        </Text>
        <Text style={[styles.statusText, { color: colors.textSecondary }]}>
          {state === 'removed'
            ? 'The author deleted it or it is no longer shared.'
            : state === 'not-found'
            ? 'This post may have been removed, or it is not shared with you.'
            : 'We could not load this post. Check your connection and try again.'}
        </Text>
        {state === 'error' ? <Button label="Retry" onPress={() => load()} variant="outline" size="md" /> : null}
      </View>
    );
  };

  /** Compact Connect pill beside the author (visitors only). */
  const renderConnectPill = () => {
    if (!authorSource || isOwner) return null;
    const rel = relationship(authorSource.uid).state;
    if (rel === 'rejected') return null;
    const busy = busyUid === authorSource.uid;
    const connected = rel === 'connected';
    const label = connected ? 'Connected' : rel === 'outgoing' ? 'Requested' : rel === 'incoming' ? 'Respond' : 'Connect';
    const Icon = connected ? Check : rel === 'outgoing' ? Clock : UserPlus;
    const filled = rel === 'none' || rel === 'incoming';
    return (
      <TouchableOpacity
        onPress={() => handleConnectPress(authorSource)}
        disabled={busy || connected}
        style={[
          styles.connectPill,
          filled
            ? { backgroundColor: colors.primary, borderColor: colors.primary }
            : { backgroundColor: colors.surface, borderColor: colors.borderSubtle },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`${label} ${work?.authorName}`}
      >
        <Icon size={13} color={filled ? '#FFFFFF' : connected ? colors.success : colors.textSecondary} />
        <Text style={[styles.connectText, { color: filled ? '#FFFFFF' : connected ? colors.success : colors.textSecondary }]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  /** The one main action for whoever is looking at the post. */
  const renderBottomBar = () => {
    if (!work) return null;
    const saved = isSaved(work.id);
    const canSave = work.status === 'published' && !isOwner;

    let primary: React.ReactNode;
    if (isOwner && work.status === 'draft') {
      primary = (
        <TouchableOpacity
          onPress={handlePublish}
          style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
          accessibilityRole="button"
        >
          <Send size={17} color="#FFFFFF" />
          <Text style={styles.primaryText}>Publish draft</Text>
        </TouchableOpacity>
      );
    } else if (isOwner) {
      primary = (
        <TouchableOpacity
          onPress={() => setManageOpen(true)}
          style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
          accessibilityRole="button"
          accessibilityLabel={pendingCount ? `Manage post, ${pendingCount} applicants waiting` : 'Manage post'}
        >
          <Settings2 size={17} color="#FFFFFF" />
          <Text style={styles.primaryText}>
            {isCollabPost ? (pendingCount ? `Manage applicants` : 'Manage post') : 'Manage post'}
          </Text>
          {pendingCount ? (
            <View style={styles.countBadge}>
              <Text maxFontSizeMultiplier={COMPACT_FONT_SCALE} style={[styles.countText, { color: colors.primary }]}>{pendingCount}</Text>
            </View>
          ) : null}
        </TouchableOpacity>
      );
    } else if (onTeam || (!isCollabPost && relationship(work.authorUid).state === 'connected')) {
      primary = (
        <TouchableOpacity
          onPress={contactAuthor}
          style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
          accessibilityRole="button"
        >
          <MessageCircle size={17} color="#FFFFFF" />
          <Text style={styles.primaryText}>Contact {authorFirst}</Text>
        </TouchableOpacity>
      );
    } else if (isCollabPost) {
      const action = collaborate(work);
      const disabled = Boolean(action.collaborateDisabled);
      const CollabIcon = collabStateIcon(action.collaborateState);
      primary = (
        <TouchableOpacity
          onPress={action.onCollaboratePress}
          disabled={disabled || !action.onCollaboratePress}
          style={[
            styles.primaryBtn,
            disabled
              ? { backgroundColor: colors.surfaceSubtle, borderWidth: 1, borderColor: colors.borderSubtle }
              : { backgroundColor: colors.primary },
          ]}
          accessibilityRole="button"
          accessibilityLabel={action.collaborateLabel}
        >
          <CollabIcon size={17} color={disabled ? colors.textMuted : '#FFFFFF'} />
          <Text style={[styles.primaryText, disabled && { color: colors.textMuted }]} numberOfLines={1}>
            {action.collaborateLabel}
          </Text>
        </TouchableOpacity>
      );
    } else if (authorSource) {
      const rel = relationship(work.authorUid).state;
      const disabled = rel === 'outgoing' || rel === 'rejected';
      const label =
        rel === 'outgoing' ? 'Request sent' : rel === 'incoming' ? 'Respond to request' : rel === 'rejected' ? 'Request declined' : `Connect with ${authorFirst}`;
      primary = (
        <TouchableOpacity
          onPress={() => handleConnectPress(authorSource)}
          disabled={disabled || busyUid === work.authorUid}
          style={[
            styles.primaryBtn,
            disabled
              ? { backgroundColor: colors.surfaceSubtle, borderWidth: 1, borderColor: colors.borderSubtle }
              : { backgroundColor: colors.primary },
          ]}
          accessibilityRole="button"
        >
          {disabled ? <Clock size={17} color={colors.textMuted} /> : <UserPlus size={17} color="#FFFFFF" />}
          <Text style={[styles.primaryText, disabled && { color: colors.textMuted }]}>{label}</Text>
        </TouchableOpacity>
      );
    }

    return (
      <View
        style={[
          styles.bottomBar,
          shadows.elevated,
          { backgroundColor: colors.surface, borderTopColor: colors.borderSubtle, paddingBottom: Math.max(insets.bottom, spacing.sm) },
        ]}
      >
        {primary}
        {isOwner ? (
          <TouchableOpacity
            onPress={() => setEditing(true)}
            style={[styles.squareBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
            accessibilityRole="button"
            accessibilityLabel="Edit post"
          >
            <Pencil size={18} color={colors.textPrimary} />
          </TouchableOpacity>
        ) : canSave ? (
          <TouchableOpacity
            onPress={() => toggleSave(work)}
            style={[
              styles.squareBtn,
              saved
                ? { borderColor: colors.primaryLight, backgroundColor: colors.primaryMuted }
                : { borderColor: colors.border, backgroundColor: colors.surface },
            ]}
            accessibilityRole="button"
            accessibilityLabel={saved ? 'Remove from saved items' : 'Save post'}
          >
            <Bookmark size={18} color={saved ? colors.primary : colors.textPrimary} fill={saved ? colors.primary : 'transparent'} />
          </TouchableOpacity>
        ) : null}
      </View>
    );
  };

  // -------------------------------------------------------------------------
  // Screen
  // -------------------------------------------------------------------------

  const accent = isCollabPost ? colors.primary : colors.textSecondary;
  const longDescription =
    (work?.description.length ?? 0) > DESCRIPTION_LONG || (work?.description.split('\n').length ?? 0) > DESCRIPTION_PREVIEW_LINES;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <ScreenHeader
        title="Research Details"
        right={
          state === 'ready' && work ? (
            <>
              {work.status === 'published' ? (
                <ScreenHeaderAction onPress={shareWork} label="Share this post" icon={<Share2 size={20} color={colors.textPrimary} />} />
              ) : null}
              {isOwner ? (
                <ScreenHeaderAction
                  onPress={() => setManageOpen(true)}
                  label={pendingCount ? `Manage post, ${pendingCount} applicants waiting` : 'Manage post'}
                  icon={
                    <View>
                      <MoreHorizontal size={22} color={colors.textPrimary} />
                      {pendingCount ? <View style={[styles.dot, { backgroundColor: colors.error, borderColor: colors.surface }]} /> : null}
                    </View>
                  }
                />
              ) : null}
            </>
          ) : null
        }
      />

      {state !== 'ready' || !work ? (
        renderStatus()
      ) : (
        <>
          <ScrollView
            contentContainerStyle={[styles.scroll, { paddingBottom: BOTTOM_BAR_HEIGHT + insets.bottom + spacing.lg }]}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          >
            {/* ===== Hero ===== */}
            <View style={styles.hero}>
              <View style={[styles.accentBar, { backgroundColor: accent }]} />
              <View style={styles.statusLine}>
                <View
                  style={[
                    styles.typeChip,
                    { backgroundColor: isCollabPost ? colors.primaryMuted : colors.surfaceSubtle },
                  ]}
                >
                  {isCollabPost ? <Users size={13} color={colors.primary} /> : <BookOpen size={13} color={colors.textSecondary} />}
                  <Text style={[styles.typeText, { color: isCollabPost ? colors.primary : colors.textSecondary }]}>
                    {isCollabPost ? 'Collaboration' : 'Research work'}
                  </Text>
                </View>
                {isCollabPost ? (
                  <View
                    style={[
                      styles.typeChip,
                      { backgroundColor: work.collabStatus === 'closed' ? colors.successLight : colors.surfaceSubtle },
                    ]}
                  >
                    <View
                      style={[styles.liveDot, { backgroundColor: work.collabStatus === 'closed' ? colors.success : colors.primary }]}
                    />
                    <Text
                      style={[styles.typeText, { color: work.collabStatus === 'closed' ? colors.success : colors.textPrimary }]}
                    >
                      {work.collabStatus === 'closed' ? 'Team formed' : 'Open'}
                    </Text>
                  </View>
                ) : null}
                {work.status === 'draft' ? (
                  <View style={[styles.typeChip, { backgroundColor: colors.warningLight }]}>
                    <Text style={[styles.typeText, { color: colors.warning }]}>Draft</Text>
                  </View>
                ) : null}
                <Text style={[styles.date, { color: colors.textMuted }]}>
                  {formatWorkDate(work.createdAt)}
                  {(work.updatedAt?.toMillis?.() ?? 0) - (work.createdAt?.toMillis?.() ?? 0) > 60_000
                    ? ` · Edited ${formatRelativeDate(work.updatedAt)}`
                    : ''}
                </Text>
              </View>

              <Text style={[styles.title, { color: colors.textPrimary }]}>{work.title}</Text>

              <View style={styles.authorRow}>
                <TouchableOpacity
                  style={styles.authorTap}
                  onPress={() => openProfile(work.authorUid)}
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${work.authorName}'s profile`}
                >
                  <Avatar name={work.authorName} uri={work.authorPhotoURL} size="sm" />
                  <View style={styles.authorInfo}>
                    <Text style={[styles.authorName, { color: colors.textPrimary }]} numberOfLines={1}>
                      {isOwner ? `${work.authorName} (you)` : work.authorName}
                    </Text>
                    <Text style={[styles.authorMeta, { color: colors.textSecondary }]} numberOfLines={1}>
                      {[work.authorDesignation, work.authorDepartment].filter(Boolean).join(' · ')}
                    </Text>
                  </View>
                  <ChevronRight size={16} color={colors.textMuted} />
                </TouchableOpacity>
                {renderConnectPill()}
              </View>

              <View style={[styles.progressCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
                <StageProgress stage={work.stage} editable={isOwner} busy={stageBusy} onChange={handleStageChange} />
              </View>
            </View>

            {/* ===== About this research ===== */}
            <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>About this research</Text>
              <Text
                style={[styles.description, { color: colors.textPrimary }]}
                numberOfLines={expanded || !longDescription ? undefined : DESCRIPTION_PREVIEW_LINES}
              >
                {linkParts(work.description).map((p, i) =>
                  p.url ? (
                    <Text
                      key={i}
                      onPress={() => openLink(p.url!)}
                      style={{ color: colors.primary, textDecorationLine: 'underline' }}
                      accessibilityRole="link"
                    >
                      {p.text}
                    </Text>
                  ) : (
                    <Text key={i}>{p.text}</Text>
                  ),
                )}
              </Text>
              {longDescription ? (
                <TouchableOpacity onPress={() => setExpanded((v) => !v)} style={styles.readMore} accessibilityRole="button">
                  <Text style={[styles.readMoreText, { color: colors.primary }]}>{expanded ? 'Show less' : 'Read more'}</Text>
                  {expanded ? <ChevronUp size={15} color={colors.primary} /> : <ChevronDown size={15} color={colors.primary} />}
                </TouchableOpacity>
              ) : null}

              {work.tags.length > 0 || work.externalUrl ? (
                <View style={styles.tagsRow}>
                  {work.tags.map((tag) => (
                    <TouchableOpacity
                      key={tag}
                      onPress={() => openTag(tag)}
                      style={[styles.tag, { backgroundColor: colors.surfaceSubtle }]}
                      accessibilityRole="button"
                      accessibilityLabel={`Topic ${tag}`}
                    >
                      <Text style={[styles.tagText, { color: colors.textSecondary }]} numberOfLines={1}>
                        {tag}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  {work.externalUrl ? (
                    <TouchableOpacity
                      onPress={() => openLink(work.externalUrl!)}
                      style={[styles.tag, styles.linkTag, { borderColor: colors.primaryLight, backgroundColor: colors.primaryMuted }]}
                      accessibilityRole="link"
                      accessibilityLabel={`Open project link ${work.externalUrl}`}
                    >
                      <ExternalLink size={12} color={colors.primary} />
                      <Text style={[styles.tagText, { color: colors.primary, fontFamily: fontFamilies.sansSemiBold }]}>
                        Project link
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              ) : null}
            </View>

            {/* ===== Team & roles (collaboration posts) ===== */}
            {isCollabPost ? (
              <>
                <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Team & roles</Text>

                  {work.lookingFor.length > 0 ? (
                    <>
                      <Text style={[styles.subLabel, { color: colors.textSecondary }]}>
                        {work.collabStatus === 'closed' ? 'Was looking for' : 'Looking for'}
                      </Text>
                      <View style={styles.tagsRow}>
                        {work.lookingFor.map((role) => (
                          <View key={role} style={[styles.tag, { backgroundColor: colors.primaryMuted }]}>
                            <Text style={[styles.tagText, { color: colors.primary, fontFamily: fontFamilies.sansSemiBold }]} numberOfLines={1}>
                              {role}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </>
                  ) : null}

                  {/* Your application (applicants only) */}
                  {(() => {
                    const mine = !isOwner ? applicationFor(work.id) : undefined;
                    if (!mine) return null;
                    const tone =
                      mine.status === 'accepted'
                        ? { fg: colors.success, bg: colors.successLight, text: 'Accepted — you are on the team' }
                        : mine.status === 'declined'
                          ? { fg: colors.textMuted, bg: colors.surfaceSubtle, text: 'Declined' }
                          : { fg: colors.primary, bg: colors.primaryMuted, text: 'Pending review' };
                    return (
                      <View style={[styles.myApp, { backgroundColor: colors.surface, borderColor: colors.primaryLight }]}>
                        <View style={styles.myAppHead}>
                          <Text style={[styles.myAppTitle, { color: colors.textPrimary }]}>Your application</Text>
                          <View style={[styles.myAppChip, { backgroundColor: tone.bg }]}>
                            <Text maxFontSizeMultiplier={COMPACT_FONT_SCALE} style={[styles.myAppChipText, { color: tone.fg }]}>{tone.text}</Text>
                          </View>
                        </View>
                        <Text style={[styles.muted, { color: colors.textSecondary }]}>
                          As {mine.role} · sent {formatRelativeDate(mine.createdAt)}
                        </Text>
                        {mine.message ? (
                          <Text style={[styles.myAppMsg, { color: colors.textPrimary, backgroundColor: colors.surfaceSubtle, borderLeftColor: colors.primaryLight }]} numberOfLines={4}>
                            “{mine.message}”
                          </Text>
                        ) : null}
                        {mine.status === 'pending' ? (
                          <TouchableOpacity
                            onPress={withdrawMine}
                            style={[styles.myAppBtn, { borderColor: colors.border }]}
                            accessibilityRole="button"
                          >
                            <Text maxFontSizeMultiplier={COMPACT_FONT_SCALE} style={[styles.myAppBtnText, { color: colors.textPrimary }]}>Withdraw application</Text>
                          </TouchableOpacity>
                        ) : null}
                      </View>
                    );
                  })()}

                  <Text style={[styles.subLabel, { color: colors.textSecondary }]}>Team</Text>
                  {work.team.length === 0 ? (
                    <Text style={[styles.muted, { color: colors.textSecondary }]}>
                      {isOwner ? 'No one on the team yet. Accepted applicants appear here.' : 'No members yet — be the first to join.'}
                    </Text>
                  ) : (
                    <>
                      <TouchableOpacity
                        onPress={() => setTeamOpen((v) => !v)}
                        style={[styles.teamSummary, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}
                        accessibilityRole="button"
                        accessibilityLabel={`${teamOpen ? 'Hide' : 'Show'} team of ${work.team.length}`}
                      >
                        <View style={styles.stack}>
                          <View style={[styles.stackItem, { borderColor: colors.surface }]}>
                            <Avatar name={work.authorName} uri={work.authorPhotoURL} size="sm" />
                          </View>
                          {work.team.slice(0, 4).map((m) => (
                            <View key={m.uid} style={[styles.stackItem, styles.stackOverlap, { borderColor: colors.surface }]}>
                              <Avatar name={m.displayName} uri={m.photoURL} size="sm" />
                            </View>
                          ))}
                          {work.team.length > 4 ? (
                            <View style={[styles.stackMore, styles.stackOverlap, { backgroundColor: colors.surfaceSubtle, borderColor: colors.surface }]}>
                              <Text style={[styles.stackMoreText, { color: colors.textSecondary }]}>+{work.team.length - 4}</Text>
                            </View>
                          ) : null}
                        </View>
                        <Text style={[styles.teamCount, { color: colors.textPrimary }]}>
                          {work.team.length + 1} people
                        </Text>
                        {teamOpen ? <ChevronUp size={18} color={colors.textMuted} /> : <ChevronDown size={18} color={colors.textMuted} />}
                      </TouchableOpacity>

                      {teamOpen ? (
                        <View style={styles.teamList}>
                          <View style={styles.memberRow}>
                            <Avatar name={work.authorName} uri={work.authorPhotoURL} size="sm" />
                            <Text style={[styles.memberName, { color: colors.textPrimary }]} numberOfLines={1}>{work.authorName}</Text>
                            <View style={[styles.rolePill, { backgroundColor: colors.surfaceSubtle }]}>
                              <Text maxFontSizeMultiplier={COMPACT_FONT_SCALE} style={[styles.roleText, { color: colors.textSecondary }]}>Lead</Text>
                            </View>
                            {onTeam ? (
                              <TouchableOpacity
                                onPress={contactAuthor}
                                hitSlop={8}
                                style={[styles.contactIcon, { borderColor: colors.primaryLight }]}
                                accessibilityRole="button"
                                accessibilityLabel={`Contact ${work.authorName}`}
                              >
                                <MessageCircle size={15} color={colors.primary} />
                              </TouchableOpacity>
                            ) : null}
                          </View>
                          {work.team.map((m) => (
                            <TouchableOpacity
                              key={m.uid}
                              onPress={() => openProfile(m.uid)}
                              style={styles.memberRow}
                              accessibilityRole="button"
                              accessibilityLabel={`${m.displayName}, ${m.role}`}
                            >
                              <Avatar name={m.displayName} uri={m.photoURL} size="sm" />
                              <Text style={[styles.memberName, { color: colors.textPrimary }]} numberOfLines={1}>
                                {m.uid === myUid ? `${m.displayName} (you)` : m.displayName}
                              </Text>
                              <View style={[styles.rolePill, { backgroundColor: colors.primaryMuted }]}>
                                <Text maxFontSizeMultiplier={COMPACT_FONT_SCALE} style={[styles.roleText, { color: colors.primary }]} numberOfLines={1}>{m.role}</Text>
                              </View>
                              {isOwner ? (
                                <TouchableOpacity
                                  onPress={() =>
                                    setContactPerson({ uid: m.uid, displayName: m.displayName, photoURL: m.photoURL, subtitle: m.role })
                                  }
                                  hitSlop={8}
                                  style={[styles.contactIcon, { borderColor: colors.primaryLight }]}
                                  accessibilityRole="button"
                                  accessibilityLabel={`Contact ${m.displayName}`}
                                >
                                  <MessageCircle size={15} color={colors.primary} />
                                </TouchableOpacity>
                              ) : null}
                            </TouchableOpacity>
                          ))}
                        </View>
                      ) : null}
                    </>
                  )}

                  {needsMyCard && hasMyCard === false ? (
                    <TouchableOpacity
                      onPress={openContactEditor}
                      style={[styles.nudge, { backgroundColor: colors.primaryMuted, borderColor: colors.primaryLight }]}
                      accessibilityRole="button"
                    >
                      <IdCard size={18} color={colors.primary} />
                      <Text style={[styles.nudgeText, { color: colors.textPrimary }]}>
                        Add your contact card so the team can reach you.
                      </Text>
                      <Text style={[styles.nudgeLink, { color: colors.primary }]}>Add</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </>
            ) : null}

            {/* ===== More from the author ===== */}
            {moreWorks.length > 0 ? (
              <>
                <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />
                <View style={styles.sectionHeaderRow}>
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 0 }]}>
                    More from {isOwner ? 'you' : authorFirst}
                  </Text>
                  <TouchableOpacity onPress={() => openProfile(work.authorUid)} hitSlop={8} accessibilityRole="button">
                    <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.moreRow}
                >
                  {moreWorks.map((w) => (
                    <TouchableOpacity
                      key={w.id}
                      activeOpacity={0.9}
                      onPress={() => router.push(`/(research)/${w.id}` as any)}
                      style={[styles.moreCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}
                      accessibilityRole="button"
                      accessibilityLabel={`Open ${w.title}`}
                    >
                      <View style={[styles.moreAccent, { backgroundColor: w.postType === 'collaboration' ? colors.primary : colors.border }]} />
                      <Text style={[styles.moreType, { color: w.postType === 'collaboration' ? colors.primary : colors.textMuted }]}>
                        {w.postType === 'collaboration' ? 'Collaboration' : 'Research work'}
                      </Text>
                      <Text style={[styles.moreTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                        {w.title}
                      </Text>
                      <View style={styles.moreMeta}>
                        <Layers size={12} color={colors.textMuted} />
                        <Text maxFontSizeMultiplier={COMPACT_FONT_SCALE} style={[styles.moreMetaText, { color: colors.textMuted }]} numberOfLines={1}>
                          {w.stage} · {formatWorkDate(w.createdAt)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            ) : null}
            {/* ===== Related research (other authors, same topics) ===== */}
            {related.length > 0 ? (
              <>
                <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />
                <View style={styles.sectionHeaderRow}>
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 0 }]}>Related research</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.moreRow}>
                  {related.map((w) => (
                    <TouchableOpacity
                      key={w.id}
                      activeOpacity={0.9}
                      onPress={() => router.push(`/(research)/${w.id}` as any)}
                      style={[styles.moreCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}
                      accessibilityRole="button"
                      accessibilityLabel={`Open ${w.title} by ${w.authorName}`}
                    >
                      <View style={[styles.moreAccent, { backgroundColor: w.postType === 'collaboration' ? colors.primary : colors.border }]} />
                      <Text style={[styles.moreType, { color: w.postType === 'collaboration' ? colors.primary : colors.textMuted }]}>
                        {w.postType === 'collaboration' ? 'Collaboration' : 'Research work'}
                      </Text>
                      <Text style={[styles.moreTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                        {w.title}
                      </Text>
                      <View style={styles.moreMeta}>
                        <Avatar name={w.authorName} uri={w.authorPhotoURL} size="xs" />
                        <Text maxFontSizeMultiplier={COMPACT_FONT_SCALE} style={[styles.moreMetaText, { color: colors.textMuted }]} numberOfLines={1}>
                          {w.authorName} · {w.stage}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            ) : null}
          </ScrollView>

          {renderBottomBar()}

          <ManagePostSheet
            visible={manageOpen}
            onClose={() => setManageOpen(false)}
            work={work}
            applicants={applicants}
            busyRequest={busyRequest}
            statusBusy={statusBusy}
            isDeleting={isDeleting}
            onEdit={() => setEditing(true)}
            onPublish={handlePublish}
            onToggleOpen={handleToggleOpen}
            onRespond={handleRespond}
            onDelete={handleDelete}
          />
        </>
      )}

      <EditWorkSheet work={work} visible={editing} onClose={() => setEditing(false)} onSaved={(updated) => setWork(updated)} />

      <ContactSheet
        person={contactPerson}
        onClose={() => setContactPerson(null)}
        onViewProfile={(uid) => openProfile(uid)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scroll: { paddingTop: spacing.md },

  // status / empty
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md },
  iconContainer: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  statusTitle: { ...typography.headline, textAlign: 'center' },
  statusText: { ...typography.bodySmall, textAlign: 'center' },

  // hero
  hero: { paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  accentBar: { width: 36, height: 4, borderRadius: 2, marginBottom: spacing.sm },
  statusLine: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.xs },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    height: 26,
    borderRadius: radius.full,
  },
  typeText: { ...typography.caption, fontFamily: fontFamilies.sansSemiBold },
  liveDot: { width: 7, height: 7, borderRadius: 4 },
  date: { ...typography.caption, marginLeft: 2 },
  title: {
    ...typography.display,
    fontSize: 26,
    lineHeight: 33,
    marginTop: spacing.sm,
  },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md },
  authorTap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minWidth: 0 },
  authorInfo: { flex: 1, minWidth: 0 },
  authorName: { ...typography.label, fontFamily: fontFamilies.sansSemiBold },
  authorMeta: { ...typography.caption },
  connectPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    height: 32,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  connectText: { ...typography.caption, fontFamily: fontFamilies.sansSemiBold },
  progressCard: { borderWidth: 1, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.md, ...cardShadow(false) },

  // sections
  divider: { height: 1, marginHorizontal: spacing.md },
  section: { paddingHorizontal: spacing.md, paddingVertical: spacing.lg },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  sectionTitle: { ...typography.sectionTitle, marginBottom: spacing.sm },
  subLabel: { ...typography.caption, fontFamily: fontFamilies.sansSemiBold, marginTop: spacing.md, marginBottom: spacing.xs },
  description: { ...typography.body},
  readMore: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: spacing.xs, alignSelf: 'flex-start' },
  readMoreText: { ...typography.label, fontFamily: fontFamilies.sansSemiBold },
  muted: { ...typography.bodySmall },
  seeAll: { ...typography.label, fontFamily: fontFamilies.sansSemiBold },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.md },
  tag: { paddingHorizontal: 10, height: 28, justifyContent: 'center', borderRadius: radius.full, maxWidth: '100%' },
  linkTag: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1 },
  tagText: { ...typography.caption },

  // team
  teamSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  stack: { flexDirection: 'row', alignItems: 'center' },
  stackItem: { borderWidth: 2, borderRadius: radius.full},
  stackOverlap: { marginLeft: -10 },
  stackMore: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  stackMoreText: { ...typography.micro, fontFamily: fontFamilies.sansSemiBold },
  teamCount: { ...typography.label, fontFamily: fontFamilies.sansSemiBold, flex: 1, fontVariant: ['tabular-nums'] },
  teamList: { marginTop: spacing.sm, gap: 2 },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 6 },
  memberName: { ...typography.label, flex: 1, minWidth: 0 },
  rolePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full, maxWidth: 140 },
  roleText: { ...typography.caption, fontFamily: fontFamilies.sansSemiBold },
  contactIcon: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  nudge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginTop: spacing.md,
  },
  nudgeText: { ...typography.bodySmall, flex: 1 },
  nudgeLink: { ...typography.label, fontFamily: fontFamilies.sansSemiBold },

  // more from
  moreRow: { paddingHorizontal: spacing.md, gap: spacing.sm, paddingBottom: spacing.sm },
  moreCard: { width: 220, borderWidth: 1, borderRadius: radius.md, padding: spacing.md, overflow: 'hidden', ...cardShadow(false) },
  moreAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3 },
  moreType: { ...typography.micro, fontFamily: fontFamilies.sansSemiBold, marginBottom: 4 },
  moreTitle: { ...typography.body, minHeight: 40 },
  moreMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.sm },
  moreMetaText: { ...typography.micro, flex: 1 },

  // your application
  myApp: { borderWidth: 1, borderRadius: radius.md, padding: spacing.md, gap: 6, marginTop: spacing.md },
  myAppHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  myAppTitle: { ...typography.label, fontFamily: fontFamilies.sansSemiBold },
  myAppChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full },
  myAppChipText: { ...typography.micro, fontFamily: fontFamilies.sansSemiBold },
  myAppMsg: { ...typography.bodySmall, paddingVertical: 6, paddingHorizontal: spacing.sm, borderLeftWidth: 3, borderTopRightRadius: radius.sm, borderBottomRightRadius: radius.sm },
  myAppBtn: { alignSelf: 'flex-start', paddingHorizontal: 12, height: spacing.compactButtonHeight, borderRadius: radius.button, borderWidth: 1, justifyContent: 'center', marginTop: 2 },
  myAppBtnText: { ...typography.buttonSmall },

  // header dot
  dot: { position: 'absolute', top: -2, right: -4, width: 10, height: 10, borderRadius: 5, borderWidth: 2 },

  // bottom bar
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
  },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    height: spacing.buttonHeight,
    borderRadius: radius.button,
    paddingHorizontal: spacing.md,
  },
  primaryText: { ...typography.button, color: '#FFFFFF', flexShrink: 1 },
  countBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: { ...typography.micro, fontFamily: fontFamilies.sansSemiBold, fontVariant: ['tabular-nums'] },
  squareBtn: {
    width: spacing.buttonHeight,
    height: spacing.buttonHeight,
    borderRadius: radius.button,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
