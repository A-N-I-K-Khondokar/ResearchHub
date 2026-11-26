import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BookOpen, Layers, Calendar, ExternalLink, Bookmark, Pencil, Users, UserPlus, Check, Clock, User, MessageCircle, IdCard } from 'lucide-react-native';
import { spacing, radius, typography, fontFamilies } from '../../constants';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { Avatar } from '../../components/common/Avatar';
import { ScreenHeader } from '../../components/layout/ScreenHeader';
import { DetailSkeleton } from '../../components/feedback/Skeleton';
import { Button } from '../../components/common/Button';
import { SoftDangerButton } from '../../components/common/SoftDangerButton';
import { ContactSheet, type ContactPerson } from '../../components/common/ContactSheet';
import {
  getResearchWork,
  deleteResearchWork,
  formatWorkDate,
  getPublishedWorksByAuthor,
  updateResearchStage,
} from '@/services/research.service';
import { EditWorkSheet } from '@/components/research/EditWorkSheet';
import { getPublicProfile } from '@/services/user.service';
import { RESEARCH_STAGE_IDS, type ResearchWork } from '@/types/research.types';
import type { PublicProfile } from '@/types/user.types';
import { useConnections } from '@/hooks/useConnections';
import { useToast } from '@/context/ToastContext';
import { WorkList } from '@/components/profile';
import { useCollaborate } from '@/hooks/useCollaborate';
import { respondToApplication, setCollabStatus, subscribeReceivedApplications } from '@/services/collab.service';
import type { CollabRequest } from '@/types/collab.types';
import { Switch } from 'react-native';
import { useSavedItems } from '@/hooks/useSavedItems';
import { useContactCard } from '@/context/ContactCardContext';
import { confirmAction } from '@/utils/dialogs';

type LoadState = 'loading' | 'ready' | 'not-found' | 'error';

export default function ResearchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { firebaseUser, userProfile } = useAuth();

  const [work, setWork] = useState<ResearchWork | null>(null);
  const [state, setState] = useState<LoadState>('loading');
  const [isDeleting, setIsDeleting] = useState(false);
  const { isSaved, toggleSave } = useSavedItems();
  const { relationship, handleConnectPress, busyUid } = useConnections();
  const toast = useToast();
  const collaborate = useCollaborate();
  const [author, setAuthor] = useState<PublicProfile | null>(null);
  const [moreWorks, setMoreWorks] = useState<ResearchWork[]>([]);
  const [applicants, setApplicants] = useState<CollabRequest[]>([]);
  const [busyRequest, setBusyRequest] = useState<string | null>(null);
  const [statusBusy, setStatusBusy] = useState(false);
  const [contactPerson, setContactPerson] = useState<ContactPerson | null>(null);
  const [editing, setEditing] = useState(false);
  const [stageBusy, setStageBusy] = useState(false);
  const { hasMyCard, openContactEditor } = useContactCard();

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
      if (result) {
        // Secondary data (non-blocking): author card + "More from this researcher"
        Promise.all([
          getPublicProfile(result.authorUid).catch(() => null),
          getPublishedWorksByAuthor(result.authorUid).catch(() => [] as ResearchWork[]),
        ]).then(([profile, works]) => {
          setAuthor(profile);
          setMoreWorks(works.filter((w) => w.id !== result.id).slice(0, 3));
        });
      }
    } catch (err: any) {
      // Unknown / legacy IDs and inaccessible drafts are denied by the rules.
      setState(err?.code === 'permission-denied' ? 'not-found' : 'error');
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const isOwner = Boolean(work && firebaseUser && work.authorUid === firebaseUser.uid);
  const isCollabPost = work?.postType === 'collaboration';
  const myUid = firebaseUser?.uid ?? '';
  const onTeam = Boolean(work && !isOwner && work.team.some((m) => m.uid === myUid));
  // Team members and an author with a team need a contact card to be reachable.
  const needsMyCard = Boolean(isCollabPost && (onTeam || (isOwner && (work?.team.length ?? 0) > 0)));

  // Live applicants for the author of a collaboration post
  useEffect(() => {
    if (!isOwner || !isCollabPost || !firebaseUser || !work) return;
    return subscribeReceivedApplications(firebaseUser.uid, setApplicants, work.id);
  }, [isOwner, isCollabPost, firebaseUser, work?.id]);

  const refreshWork = async () => {
    if (!id) return;
    try {
      const fresh = await getResearchWork(id);
      if (fresh) setWork(fresh);
    } catch {
      // keep the current copy
    }
  };

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
        await refreshWork();
        if (hasMyCard === false) {
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

  const handleOpenLink = (url: string) => {
    Linking.openURL(url).catch(() => toast.show('Unable to open this link', 'error'));
  };

  const handleAuthorPress = () => {
    if (!work) return;
    router.push((isOwner ? '/(tabs)/profile' : `/(profile)/${work.authorUid}`) as any);
  };

  const handleDelete = async () => {
    if (!work) return;
    const ok = await confirmAction({
      title: isCollabPost ? 'Delete collaboration post?' : 'Delete research work?',
      message: `"${work.title}" will be permanently removed${isCollabPost ? ', including its team list and applications' : ''}. This cannot be undone.`,
      confirmLabel: 'Delete permanently',
      destructive: true,
    });
    if (!ok) return;
    setIsDeleting(true);
    try {
      await deleteResearchWork(work.id);
      toast.show(isCollabPost ? 'Collaboration post deleted' : 'Research work deleted', 'info');
      router.back();
    } catch {
      setIsDeleting(false);
      toast.show('Could not delete this post. Please try again.', 'error');
    }
  };

  const renderStatus = () => {
    if (state === 'loading') {
      return <DetailSkeleton />;
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
      <ScreenHeader
        title="Research Details"
        right={
          state === 'ready' && work && work.status === 'published' ? (
            <View style={styles.headerActions}>
            {isOwner ? (
              <TouchableOpacity
                onPress={() => setEditing(true)}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel="Edit post"
              >
                <Pencil size={19} color={colors.textPrimary} />
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              onPress={() => toggleSave(work)}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel={isSaved(work.id) ? 'Remove from saved items' : 'Save research'}
            >
              <Bookmark
                size={20}
                color={isSaved(work.id) ? colors.primary : colors.textPrimary}
                fill={isSaved(work.id) ? colors.primary : 'transparent'}
              />
            </TouchableOpacity>
            </View>
          ) : null
        }
      />

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

          {/* Title */}
          <View style={styles.titleBlock}>
            <View style={[styles.typeBadge, { backgroundColor: isCollabPost ? colors.primaryMuted : colors.surfaceSubtle }]}>
              {isCollabPost ? <Users size={13} color={colors.primary} /> : <BookOpen size={13} color={colors.textSecondary} />}
              <Text style={[styles.typeBadgeText, { color: isCollabPost ? colors.primary : colors.textSecondary }]}>
                {isCollabPost ? 'Collaboration post' : 'Research work'}
              </Text>
            </View>
            {work.status === 'draft' ? (
              <View style={[styles.typeBadge, { backgroundColor: colors.surfaceSubtle }]}>
                <Text style={[styles.typeBadgeText, { color: colors.textMuted }]}>Draft</Text>
              </View>
            ) : null}
          </View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{work.title}</Text>

          {/* ===== Section 1: Research ===== */}
          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
            <View style={styles.sectionHeader}>
              <BookOpen size={16} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Research</Text>
              <View style={styles.metaItem}>
                <Calendar size={13} color={colors.textSecondary} />
                <Text style={[styles.metaText, { color: colors.textSecondary }]}>{formatWorkDate(work.createdAt)}</Text>
              </View>
            </View>

            <Text style={[styles.subLabel, { color: colors.textSecondary }]}>STAGE</Text>
            {/* Stage stepper */}
            <View style={styles.stepper} accessibilityLabel={`Research stage: ${work.stage}`}>
              {RESEARCH_STAGE_IDS.map((stageId, index) => {
                const current = RESEARCH_STAGE_IDS.indexOf(work.stage);
                const reached = index <= current;
                return (
                  <React.Fragment key={stageId}>
                    {index > 0 ? (
                      <View style={[styles.stepLine, { backgroundColor: index <= current ? colors.primary : colors.borderSubtle }]} />
                    ) : null}
                    <TouchableOpacity
                      style={styles.step}
                      disabled={!isOwner || stageBusy || stageId === work.stage}
                      onPress={() => handleStageChange(stageId)}
                      accessibilityRole={isOwner ? 'button' : undefined}
                      accessibilityLabel={isOwner ? `Set stage to ${stageId}` : undefined}
                    >
                      <View
                        style={[
                          styles.stepDot,
                          reached
                            ? { backgroundColor: colors.primary, borderColor: colors.primary }
                            : { backgroundColor: colors.surface, borderColor: colors.border },
                        ]}
                      >
                        {index < current ? <Check size={11} color="#FFFFFF" strokeWidth={3} /> : null}
                      </View>
                      <Text
                        style={[
                          styles.stepLabel,
                          { color: index === current ? colors.primary : colors.textSecondary },
                          index === current && { fontFamily: fontFamilies.sansSemiBold },
                        ]}
                        numberOfLines={2}
                      >
                        {stageId}
                      </Text>
                    </TouchableOpacity>
                  </React.Fragment>
                );
              })}
            </View>
            {isOwner ? (
              <Text style={[styles.stageHint, { color: colors.textMuted }]}>Tap a stage to update your progress</Text>
            ) : null}

            <Text style={[styles.subLabel, { color: colors.textSecondary }]}>DESCRIPTION</Text>
            <Text style={[styles.description, { color: colors.textPrimary }]}>{work.description}</Text>

            {work.tags.length > 0 ? (
              <>
                <Text style={[styles.subLabel, { color: colors.textSecondary }]}>TOPICS</Text>
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
              </>
            ) : null}

            {work.externalUrl ? (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => handleOpenLink(work.externalUrl!)}
                style={[styles.linkRow, { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderSubtle }]}
                accessibilityRole="link"
              >
                <ExternalLink size={16} color={colors.primary} />
                <Text style={[styles.linkText, { color: colors.primary }]} numberOfLines={1}>
                  {work.externalUrl}
                </Text>
              </TouchableOpacity>
            ) : null}

            {/* Delete — bottom of the post details (work posts) */}
            {isOwner && !isCollabPost ? (
              <View style={[styles.deleteRow, { borderTopColor: colors.borderSubtle }]}>
                <Button
                  label="Edit research work"
                  onPress={() => setEditing(true)}
                  variant="outline"
                  size="md"
                  fullWidth
                  icon={<Pencil size={16} color={colors.primary} />}
                />
                <SoftDangerButton
                  label="Delete research work"
                  onPress={handleDelete}
                  loading={isDeleting}
                />
              </View>
            ) : null}
          </View>

          {/* ===== Section 2: Collaboration (collaboration posts only) ===== */}
          {isCollabPost ? (
            <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.primaryLight }]}>
              <View style={styles.sectionHeader}>
                <Users size={16} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Collaboration</Text>
                <View
                  style={[
                    styles.statusPill,
                    { backgroundColor: work.collabStatus === 'closed' ? colors.successLight : colors.primaryMuted },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      { color: work.collabStatus === 'closed' ? colors.success : colors.primary },
                    ]}
                  >
                    {work.collabStatus === 'closed' ? 'Team formed' : 'Open'}
                  </Text>
                </View>
              </View>

              {work.lookingFor.length > 0 ? (
                <>
                  <Text style={[styles.subLabel, { color: colors.textSecondary }]}>LOOKING FOR</Text>
                  <View style={styles.tagsRow}>
                    {work.lookingFor.map((role) => (
                      <View key={role} style={[styles.tag, { backgroundColor: colors.primaryMuted, borderColor: colors.primaryLight }]}>
                        <Text style={[styles.tagText, { color: colors.primary, fontFamily: fontFamilies.sansSemiBold }]} numberOfLines={1}>
                          {role}
                        </Text>
                      </View>
                    ))}
                  </View>
                </>
              ) : null}

              {(() => {
                const action = collaborate(work);
                if (isOwner) return null;
                if (!action.onCollaboratePress) return null;
                return (
                  <TouchableOpacity
                    onPress={action.onCollaboratePress}
                    disabled={action.collaborateDisabled}
                    style={[
                      styles.authorButton,
                      { marginTop: spacing.md },
                      action.collaborateDisabled
                        ? { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderSubtle }
                        : { backgroundColor: colors.primary, borderColor: colors.primary },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={action.collaborateLabel}
                  >
                    <UserPlus size={15} color={action.collaborateDisabled ? colors.textMuted : '#FFFFFF'} />
                    <Text style={[styles.authorButtonText, { color: action.collaborateDisabled ? colors.textMuted : '#FFFFFF' }]}>
                      {action.collaborateLabel}
                    </Text>
                  </TouchableOpacity>
                );
              })()}

              {onTeam ? (
                <TouchableOpacity
                  onPress={() =>
                    setContactPerson({
                      uid: work.authorUid,
                      displayName: work.authorName,
                      photoURL: work.authorPhotoURL,
                      subtitle: 'Project lead',
                    })
                  }
                  style={[styles.authorButton, styles.contactButton, { backgroundColor: colors.primaryMuted, borderColor: colors.primaryLight }]}
                  accessibilityRole="button"
                  accessibilityLabel={`Contact ${work.authorName}`}
                >
                  <MessageCircle size={15} color={colors.primary} />
                  <Text style={[styles.authorButtonText, { color: colors.primary, fontFamily: fontFamilies.sansSemiBold }]}>
                    Contact {work.authorName.split(' ')[0]}
                  </Text>
                </TouchableOpacity>
              ) : null}

              {needsMyCard && hasMyCard === false ? (
                <View style={[styles.nudge, { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderSubtle }]}>
                  <IdCard size={18} color={colors.primary} />
                  <Text style={[styles.nudgeText, { color: colors.textSecondary }]}>
                    {isOwner
                      ? 'Add your contact card so your team can reach you.'
                      : 'Add your contact card so the team can reach you.'}
                  </Text>
                  <TouchableOpacity onPress={openContactEditor} hitSlop={8} accessibilityRole="button">
                    <Text style={[styles.nudgeLink, { color: colors.primary }]}>Add</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              {work.team.length > 0 ? (
                <View style={styles.subsection}>
                  <Text style={[styles.subLabel, { color: colors.textSecondary }]}>TEAM ({work.team.length})</Text>
                  {work.team.map((m) => (
                    <TouchableOpacity
                      key={m.uid}
                      onPress={() => router.push(`/(profile)/${m.uid}` as any)}
                      style={styles.personRow}
                      accessibilityRole="button"
                      accessibilityLabel={`${m.displayName}, ${m.role}`}
                    >
                      <Avatar name={m.displayName} uri={m.photoURL} size="sm" />
                      <Text style={[styles.personName, { color: colors.textPrimary, flex: 1 }]} numberOfLines={1}>{m.displayName}</Text>
                      <View style={[styles.rolePill, { backgroundColor: colors.primaryMuted }]}>
                        <Text style={[styles.rolePillText, { color: colors.primary }]} numberOfLines={1}>{m.role}</Text>
                      </View>
                      {isOwner ? (
                        <TouchableOpacity
                          onPress={() => setContactPerson({ uid: m.uid, displayName: m.displayName, photoURL: m.photoURL, subtitle: m.role })}
                          hitSlop={8}
                          style={[styles.contactIcon, { borderColor: colors.primaryLight, backgroundColor: colors.surface }]}
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

              {isOwner ? (
                <>
                  <View style={[styles.toggleRow, styles.subsection]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.personName, { color: colors.textPrimary }]}>Accepting applications</Text>
                      <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                        {work.collabStatus === 'closed' ? 'Shown as "Team formed" — no new applications.' : 'Researchers can apply for the roles above.'}
                      </Text>
                    </View>
                    <Switch
                      value={work.collabStatus !== 'closed'}
                      onValueChange={handleToggleOpen}
                      disabled={statusBusy}
                      accessibilityLabel="Accepting applications"
                    />
                  </View>

                  <View style={styles.subsection}>
                  <Text style={[styles.subLabel, { color: colors.textSecondary }]}>
                    APPLICANTS ({applicants.length})
                  </Text>
                  {applicants.length === 0 ? (
                    <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                      No applications yet. They will appear here (and in Notifications) as researchers apply.
                    </Text>
                  ) : (
                    [...applicants]
                      .sort((a, b) => (a.status === 'pending' ? -1 : 0) - (b.status === 'pending' ? -1 : 0))
                      .map((r) => (
                        <View key={r.id} style={[styles.applicant, { borderColor: colors.borderSubtle }]}>
                          <TouchableOpacity
                            onPress={() => router.push(`/(profile)/${r.applicantUid}` as any)}
                            style={styles.personRow}
                            accessibilityRole="button"
                          >
                            <Avatar name={r.applicant.displayName} uri={r.applicant.photoURL} size="sm" />
                            <View style={{ flex: 1, minWidth: 0 }}>
                              <Text style={[styles.personName, { color: colors.textPrimary }]} numberOfLines={1}>
                                {r.applicant.displayName}
                              </Text>
                              <Text style={[styles.metaText, { color: colors.textSecondary }]} numberOfLines={1}>
                                {r.applicant.designation} · {formatWorkDate(r.createdAt)}
                              </Text>
                            </View>
                            <View style={[styles.rolePill, { backgroundColor: colors.primaryMuted }]}>
                              <Text style={[styles.rolePillText, { color: colors.primary }]} numberOfLines={1}>{r.role}</Text>
                            </View>
                          </TouchableOpacity>
                          {r.message ? (
                            <Text style={[styles.applicantMessage, { color: colors.textPrimary, backgroundColor: colors.surfaceSubtle }]}>
                              "{r.message}"
                            </Text>
                          ) : null}
                          {r.status === 'pending' ? (
                            <View style={styles.authorActions}>
                              <TouchableOpacity
                                onPress={() => handleRespond(r, false)}
                                disabled={busyRequest === r.id}
                                style={[styles.authorButton, { borderColor: colors.border, backgroundColor: colors.surface }]}
                                accessibilityRole="button"
                              >
                                <Text style={[styles.authorButtonText, { color: colors.textPrimary }]}>Decline</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                onPress={() => handleRespond(r, true)}
                                disabled={busyRequest === r.id}
                                style={[styles.authorButton, { backgroundColor: colors.primary, borderColor: colors.primary }]}
                                accessibilityRole="button"
                              >
                                <Check size={15} color="#FFFFFF" />
                                <Text style={[styles.authorButtonText, { color: '#FFFFFF' }]}>
                                  {busyRequest === r.id ? 'Saving…' : 'Accept'}
                                </Text>
                              </TouchableOpacity>
                            </View>
                          ) : (
                            <Text
                              style={[
                                styles.metaText,
                                { color: r.status === 'accepted' ? colors.success : colors.textMuted, marginTop: spacing.xs },
                              ]}
                            >
                              {r.status === 'accepted' ? '✓ Accepted — on your team' : 'Declined'}
                            </Text>
                          )}
                        </View>
                      ))
                  )}
                  </View>
                </>
              ) : null}

              {/* Delete — bottom of the post details (collaboration posts) */}
              {isOwner ? (
                <View style={[styles.deleteRow, { borderTopColor: colors.borderSubtle }]}>
                  <Button
                    label="Edit collaboration post"
                    onPress={() => setEditing(true)}
                    variant="outline"
                    size="md"
                    fullWidth
                    icon={<Pencil size={16} color={colors.primary} />}
                  />
                  <SoftDangerButton
                    label="Delete collaboration post"
                    onPress={handleDelete}
                    loading={isDeleting}
                  />
                </View>
              ) : null}
            </View>
          ) : null}

          {/* About the researcher */}
          {!isOwner && author ? (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
              <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>About the researcher</Text>
              <View style={styles.authorRow}>
                <Avatar name={author.displayName} uri={author.photoURL} size="md" />
                <View style={styles.authorInfo}>
                  <Text style={[styles.authorName, { color: colors.textPrimary }]} numberOfLines={1}>
                    {author.displayName}
                  </Text>
                  <Text style={[styles.authorMeta, { color: colors.textSecondary }]} numberOfLines={1}>
                    {[author.designation, author.department].filter(Boolean).join(' • ')}
                  </Text>
                </View>
              </View>
              {author.bio ? (
                <Text style={[styles.metaText, { color: colors.textSecondary, marginBottom: spacing.sm }]} numberOfLines={3}>
                  {author.bio}
                </Text>
              ) : null}
              <View style={styles.authorActions}>
                <TouchableOpacity
                  onPress={handleAuthorPress}
                  style={[styles.authorButton, { borderColor: colors.border, backgroundColor: colors.surface }]}
                  accessibilityRole="button"
                >
                  <User size={15} color={colors.textPrimary} />
                  <Text style={[styles.authorButtonText, { color: colors.textPrimary }]}>View profile</Text>
                </TouchableOpacity>
                {(() => {
                  const rel = relationship(author.uid).state;
                  const busy = busyUid === author.uid;
                  const filled = rel === 'none' || rel === 'incoming';
                  const label =
                    rel === 'connected' ? 'Connected'
                    : rel === 'outgoing' ? 'Request sent'
                    : rel === 'incoming' ? 'Respond'
                    : rel === 'rejected' ? 'Declined'
                    : 'Connect';
                  const Icon = rel === 'connected' ? Check : rel === 'outgoing' || rel === 'rejected' ? Clock : UserPlus;
                  return (
                    <TouchableOpacity
                      onPress={() => handleConnectPress(author)}
                      disabled={busy}
                      style={[
                        styles.authorButton,
                        filled
                          ? { backgroundColor: colors.primary, borderColor: colors.primary }
                          : { backgroundColor: colors.primaryMuted, borderColor: colors.primaryLight },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={label}
                    >
                      <Icon size={15} color={filled ? '#FFFFFF' : colors.primary} />
                      <Text style={[styles.authorButtonText, { color: filled ? '#FFFFFF' : colors.primary }]}>{label}</Text>
                    </TouchableOpacity>
                  );
                })()}
              </View>
            </View>
          ) : null}

          {/* More from this researcher */}
          {moreWorks.length > 0 ? (
            <View style={styles.moreSection}>
              <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>
                More from {isOwner ? 'you' : work.authorName.split(' ')[0]}
              </Text>
              <WorkList works={moreWorks} onOpen={(w) => router.push(`/(research)/${w.id}` as any)} />
            </View>
          ) : null}

        </ScrollView>
      )}

      <EditWorkSheet
        work={work}
        visible={editing}
        onClose={() => setEditing(false)}
        onSaved={(updated) => setWork(updated)}
      />

      <ContactSheet
        person={contactPerson}
        onClose={() => setContactPerson(null)}
        onViewProfile={(uid) => router.push(`/(profile)/${uid}` as any)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  titleBlock: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.sm },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  typeBadgeText: { ...typography.caption, fontFamily: fontFamilies.sansSemiBold },
  section: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.xs },
  sectionTitle: { ...typography.title, fontSize: 17, flex: 1 },
  subLabel: { ...typography.micro, fontFamily: fontFamilies.sansSemiBold, letterSpacing: 0.6, marginTop: spacing.md, marginBottom: spacing.xs },
  subsection: { marginTop: spacing.sm },
  statusPill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.full },
  statusPillText: { ...typography.micro, fontFamily: fontFamilies.sansSemiBold },
  stepper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  step: {
    alignItems: 'center',
    width: 64,
  },
  stepDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLine: {
    flex: 1,
    height: 2,
    marginTop: 9,
    marginHorizontal: -18,
  },
  stepLabel: {
    ...typography.micro,
    textAlign: 'center',
    marginTop: 4,
  },
  sectionLabel: {
    ...typography.sectionHeader,
    marginBottom: spacing.sm,
  },
  authorActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  authorButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: spacing.secondaryButtonHeight,
    borderRadius: radius.button,
    borderWidth: 1,
  },
  authorButtonText: {
    ...typography.label,
  },
  contactButton: { flex: 0, marginTop: spacing.md },
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
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 6,
  },
  personName: {
    ...typography.label,
    flexShrink: 1,
  },
  rolePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    maxWidth: 150,
  },
  rolePillText: {
    ...typography.caption,
    fontFamily: fontFamilies.sansSemiBold,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  applicant: {
    borderTopWidth: 1,
    paddingTop: spacing.sm,
    marginTop: spacing.sm,
  },
  applicantMessage: {
    ...typography.bodySmall,
    fontStyle: 'italic',
    padding: spacing.sm,
    borderRadius: radius.sm,
    marginVertical: spacing.xs,
  },
  moreSection: {
    marginBottom: spacing.md,
  },
  safeArea: {
    flex: 1,
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
    paddingHorizontal: 10,
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
    paddingHorizontal: 10,
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
    marginTop: spacing.md,
  },
  linkText: {
    ...typography.bodySmall,
    flex: 1,
    minWidth: 0,
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  stageHint: { ...typography.micro, textAlign: 'center', marginTop: spacing.xs },
  deleteRow: {
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
});
