/**
 * src/components/research/ManagePostSheet.tsx
 *
 * Author-only "Manage post" sheet: edit, accepting applications (open /
 * team formed), applicants with Accept / Decline, and delete. Keeps every
 * owner control out of the public reading layout.
 */

import React from 'react';
import { Modal, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Check, CheckCircle2, ChevronRight, Pencil, Send, Settings2, X, XCircle } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { Avatar } from '@/components/common/Avatar';
import { SoftDangerButton } from '@/components/common/SoftDangerButton';
import { formatWorkDate } from '@/services/research.service';
import type { ResearchWork } from '@/types/research.types';
import type { CollabRequest } from '@/types/collab.types';
import { fontFamilies, radius, spacing, typography } from '@/constants';

interface ManagePostSheetProps {
  visible: boolean;
  onClose: () => void;
  work: ResearchWork;
  applicants: CollabRequest[];
  busyRequest: string | null;
  statusBusy: boolean;
  isDeleting: boolean;
  onEdit: () => void;
  /** Drafts only: publish to the feed. */
  onPublish?: () => void;
  onToggleOpen: (open: boolean) => void;
  onRespond: (request: CollabRequest, accept: boolean) => void;
  onDelete: () => void;
}

export const ManagePostSheet: React.FC<ManagePostSheetProps> = ({
  visible,
  onClose,
  work,
  applicants,
  busyRequest,
  statusBusy,
  isDeleting,
  onEdit,
  onPublish,
  onToggleOpen,
  onRespond,
  onDelete,
}) => {
  const { colors } = useTheme();
  const router = useRouter();
  const isCollab = work.postType === 'collaboration';
  const sorted = [...applicants].sort(
    (a, b) => (a.status === 'pending' ? 0 : 1) - (b.status === 'pending' ? 0 : 1),
  );
  const pending = applicants.filter((a) => a.status === 'pending').length;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
        <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
          <View style={[styles.grabber, { backgroundColor: colors.border }]} />
          <View style={styles.header}>
            <View style={[styles.iconBadge, { backgroundColor: colors.primaryMuted }]}>
              <Settings2 size={17} color={colors.primary} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[styles.title, { color: colors.textPrimary }]}>Manage post</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                {work.title}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={10}
              style={[styles.close, { backgroundColor: colors.surfaceSubtle }]}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <X size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.body}>
            {/* Publish (drafts) */}
            {work.status === 'draft' && onPublish ? (
              <TouchableOpacity
        activeOpacity={0.9}
                onPress={() => {
                  onClose();
                  setTimeout(onPublish, 250);
                }}
                style={[styles.row, { backgroundColor: colors.primary, borderColor: colors.primary }]}
                accessibilityRole="button"
              >
                <Send size={18} color="#FFFFFF" />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowTitle, { color: '#FFFFFF' }]}>Publish now</Text>
                  <Text style={[styles.rowSub, { color: 'rgba(255,255,255,0.85)' }]}>
                    This is a draft — only you can see it.
                  </Text>
                </View>
                <ChevronRight size={18} color="#FFFFFF" />
              </TouchableOpacity>
            ) : null}

            {/* Edit */}
            <TouchableOpacity
        activeOpacity={0.9}
              onPress={() => {
                onClose();
                onEdit();
              }}
              style={[styles.row, { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderSubtle }]}
              accessibilityRole="button"
            >
              <Pencil size={18} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>
                  {isCollab ? 'Edit collaboration post' : 'Edit research work'}
                </Text>
                <Text style={[styles.rowSub, { color: colors.textSecondary }]}>
                  Title, description, stage, topics{isCollab ? ', roles' : ''} and link
                </Text>
              </View>
              <ChevronRight size={18} color={colors.textMuted} />
            </TouchableOpacity>

            {isCollab ? (
              <>
                {/* Open / Team formed */}
                <View style={[styles.row, { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderSubtle }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>Accepting applications</Text>
                    <Text style={[styles.rowSub, { color: colors.textSecondary }]}>
                      {work.collabStatus === 'closed'
                        ? 'Shown as "Team formed" — no new applications.'
                        : 'Researchers can apply for your roles.'}
                    </Text>
                  </View>
                  <Switch
                    value={work.collabStatus !== 'closed'}
                    onValueChange={onToggleOpen}
                    disabled={statusBusy}
                    accessibilityLabel="Accepting applications"
                  />
                </View>

                {/* Applicants */}
                <Text style={[styles.section, { color: colors.textSecondary }]}>
                  APPLICANTS ({applicants.length}){pending ? ` · ${pending} WAITING` : ''}
                </Text>
                {sorted.length === 0 ? (
                  <Text style={[styles.empty, { color: colors.textSecondary }]}>
                    No applications yet. They appear here and in Notifications.
                  </Text>
                ) : (
                  sorted.map((r) => (
                    <View key={r.id} style={[styles.applicant, { borderColor: colors.borderSubtle }]}>
                      <TouchableOpacity
                        style={styles.person}
                        onPress={() => {
                          onClose();
                          router.push(`/(profile)/${r.applicantUid}` as any);
                        }}
                        accessibilityRole="button"
                      >
                        <Avatar name={r.applicant.displayName} uri={r.applicant.photoURL} size="sm" />
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={[styles.rowTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                            {r.applicant.displayName}
                          </Text>
                          <Text style={[styles.rowSub, { color: colors.textSecondary }]} numberOfLines={1}>
                            {r.applicant.designation} · {formatWorkDate(r.createdAt)}
                          </Text>
                        </View>
                        <View style={[styles.rolePill, { backgroundColor: colors.primaryMuted }]}>
                          <Text style={[styles.roleText, { color: colors.primary }]} numberOfLines={1}>
                            {r.role}
                          </Text>
                        </View>
                      </TouchableOpacity>
                      {r.message ? (
                        <Text style={[styles.message, { color: colors.textPrimary, backgroundColor: colors.surfaceSubtle }]}>
                          “{r.message}”
                        </Text>
                      ) : null}
                      {r.status === 'pending' ? (
                        <View style={styles.actions}>
                          <TouchableOpacity
                            onPress={() => onRespond(r, false)}
                            disabled={busyRequest === r.id}
                            style={[styles.actionBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
                            accessibilityRole="button"
                          >
                            <Text style={[styles.actionText, { color: colors.textPrimary }]}>Decline</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => onRespond(r, true)}
                            disabled={busyRequest === r.id}
                            style={[styles.actionBtn, { backgroundColor: colors.primary, borderColor: colors.primary }]}
                            accessibilityRole="button"
                          >
                            <Check size={15} color="#FFFFFF" />
                            <Text style={[styles.actionText, { color: '#FFFFFF' }]}>
                              {busyRequest === r.id ? 'Saving…' : 'Accept'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <View style={styles.statusRow}>
                          {r.status === 'accepted' ? (
                            <CheckCircle2 size={14} color={colors.success} />
                          ) : (
                            <XCircle size={14} color={colors.textMuted} />
                          )}
                          <Text style={[styles.rowSub, { color: r.status === 'accepted' ? colors.success : colors.textMuted }]}>
                            {r.status === 'accepted' ? 'Accepted — on your team' : 'Declined'}
                          </Text>
                        </View>
                      )}
                    </View>
                  ))
                )}
              </>
            ) : null}

            {/* Delete */}
            <View style={[styles.danger, { borderTopColor: colors.borderSubtle }]}>
              <SoftDangerButton
                label={isCollab ? 'Delete collaboration post' : 'Delete research work'}
                onPress={onDelete}
                loading={isDeleting}
              />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderWidth: 1,
    paddingTop: spacing.xs,
    maxHeight: '88%',
  },
  grabber: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md },
  iconBadge: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  title: { ...typography.title },
  subtitle: { ...typography.bodySmall },
  close: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  body: { padding: spacing.md, paddingBottom: spacing.xl, gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  rowTitle: { ...typography.label, fontFamily: fontFamilies.sansSemiBold },
  rowSub: { ...typography.caption },
  section: { ...typography.micro, fontFamily: fontFamilies.sansSemiBold, letterSpacing: 0.6, marginTop: spacing.sm },
  empty: { ...typography.bodySmall },
  applicant: { borderWidth: 1, borderRadius: radius.md, padding: spacing.sm },
  person: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rolePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full, maxWidth: 140 },
  roleText: { ...typography.caption, fontFamily: fontFamilies.sansSemiBold },
  message: { ...typography.bodySmall, padding: spacing.sm, borderRadius: radius.sm, marginTop: spacing.sm },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: spacing.compactButtonHeight,
    borderRadius: radius.button,
    borderWidth: 1,
  },
  actionText: { ...typography.buttonSmall },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: spacing.xs },
  danger: { borderTopWidth: 1, paddingTop: spacing.md, marginTop: spacing.sm },
});
