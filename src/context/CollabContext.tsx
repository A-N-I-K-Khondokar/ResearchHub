/**
 * src/context/CollabContext.tsx
 *
 * App-wide collaboration state:
 *  - live list of MY applications (so every card knows "Application sent", etc.)
 *  - the shared "Apply to collaborate" sheet (role + message), opened from any
 *    screen via `openApply(post)`.
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Users, X } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import { useContactCard } from '@/context/ContactCardContext';
import { applyToCollaboration, subscribeMyApplications, withdrawApplication } from '@/services/collab.service';
import { Button } from '@/components/common/Button';
import { radius, spacing, typography, fontFamilies } from '@/constants';
import { COLLAB_LIMITS, type CollabRequest } from '@/types/collab.types';

export interface ApplyTarget {
  id: string;
  authorUid: string;
  authorName: string;
  title: string;
  lookingFor: string[];
  /** Accepted members (uids) — used to block re-applying once on the team. */
  teamUids?: string[];
}

interface CollabContextType {
  myApplications: CollabRequest[];
  applicationFor: (workId: string) => CollabRequest | undefined;
  openApply: (post: ApplyTarget) => void;
  withdraw: (request: CollabRequest) => Promise<void>;
}

const CollabContext = createContext<CollabContextType>({
  myApplications: [],
  applicationFor: () => undefined,
  openApply: () => {},
  withdraw: async () => {},
});

export const CollabProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userProfile } = useAuth();
  const { colors, isDark } = useTheme();
  const toast = useToast();
  const uid = userProfile?.approvalStatus === 'approved' ? userProfile.uid : '';

  const [myApplications, setMyApplications] = useState<CollabRequest[]>([]);
  const [target, setTarget] = useState<ApplyTarget | null>(null);
  const [role, setRole] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  // Synchronous guard: blocks a fast double-tap before `sending` re-renders.
  const sendingRef = useRef(false);

  const { hasMyCard, openContactEditor } = useContactCard();
  const hasMyCardRef = useRef(hasMyCard);
  const openEditorRef = useRef(openContactEditor);
  hasMyCardRef.current = hasMyCard;
  openEditorRef.current = openContactEditor;

  // Statuses from the previous snapshot, to spot "pending → accepted" live.
  const prevStatus = useRef<Map<string, string> | null>(null);

  useEffect(() => {
    prevStatus.current = null;
    if (!uid) {
      setMyApplications([]);
      return;
    }
    return subscribeMyApplications(uid, (requests) => {
      const before = prevStatus.current;
      prevStatus.current = new Map(requests.map((r) => [r.id, r.status] as const));
      setMyApplications(requests);
      if (!before) return; // first snapshot: nothing "just" happened
      const joined = requests.find((r) => r.status === 'accepted' && before.get(r.id) === 'pending');
      if (!joined) return;
      const hasCard = hasMyCardRef.current !== false;
      toast.show(
        hasCard
          ? `You joined "${joined.workTitle}"! Open the post to contact the team.`
          : `You joined "${joined.workTitle}"! Add your contact so the team can reach you.`,
        'success',
      );
      if (!hasCard) setTimeout(() => openEditorRef.current(), 1200);
    });
  }, [uid, toast]);

  const byWork = useMemo(() => new Map(myApplications.map((r) => [r.workId, r] as const)), [myApplications]);
  const applicationFor = useCallback((workId: string) => byWork.get(workId), [byWork]);

  const openApply = useCallback((post: ApplyTarget) => {
    // One application per person per post: never open the sheet twice.
    const existing = byWork.get(post.id);
    if (existing || (uid && post.teamUids?.includes(uid))) {
      toast.show(
        existing?.status === 'pending'
          ? 'You have already applied — your application is pending.'
          : existing?.status === 'declined'
            ? 'Your application to this post was declined.'
            : "You're already on this team.",
        'info',
      );
      return;
    }
    setTarget(post);
    setRole(post.lookingFor[0] ?? '');
    setMessage('');
  }, [byWork, uid, toast]);

  const withdraw = useCallback(
    async (request: CollabRequest) => {
      try {
        await withdrawApplication(request.id);
        toast.show('Application withdrawn', 'info');
      } catch {
        toast.show('Could not withdraw the application', 'error');
      }
    },
    [toast],
  );

  const send = async () => {
    if (!target || !userProfile || !role || sendingRef.current) return;
    if (byWork.has(target.id)) {
      // Already applied (e.g. from another screen while the sheet was open).
      toast.show('You have already applied to this post.', 'info');
      setTarget(null);
      return;
    }
    sendingRef.current = true;
    setSending(true);
    try {
      await applyToCollaboration(
        userProfile,
        { id: target.id, authorUid: target.authorUid, title: target.title },
        role,
        message.trim() || null,
      );
      toast.show(`Application sent to ${target.authorName.split(' ')[0]}`);
      setTarget(null);
    } catch (err: any) {
      console.error('[CollabContext] Apply failed:', err);
      toast.show(
        err?.code === 'permission-denied'
          ? "You can't apply to this post — you may have already applied, or it is no longer accepting applications."
          : 'Could not send your application. Please try again.',
        'error',
      );
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  };

  const value = useMemo(
    () => ({ myApplications, applicationFor, openApply, withdraw }),
    [myApplications, applicationFor, openApply, withdraw],
  );

  return (
    <CollabContext.Provider value={value}>
      {children}

      <Modal visible={Boolean(target)} animationType="slide" transparent onRequestClose={() => setTarget(null)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
          <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
            <View style={styles.headerRow}>
              <View style={[styles.iconBadge, { backgroundColor: colors.primaryMuted }]}>
                <Users size={18} color={colors.primary} />
              </View>
              <View style={styles.headerText}>
                <Text style={[styles.title, { color: colors.textPrimary }]}>Apply to collaborate</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={2}>
                  {target?.title} · by {target?.authorName}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setTarget(null)}
                hitSlop={10}
                style={[styles.close, { backgroundColor: colors.surfaceSubtle }]}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <X size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.body}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>I can help as</Text>
              <View style={styles.rolesRow}>
                {(target?.lookingFor ?? []).map((r) => {
                  const active = r === role;
                  return (
                    <TouchableOpacity
                      key={r}
                      onPress={() => setRole(r)}
                      style={[
                        styles.rolePill,
                        active
                          ? { backgroundColor: colors.primary, borderColor: colors.primary }
                          : { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderSubtle },
                      ]}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: active }}
                    >
                      <Text style={[styles.roleText, { color: active ? '#FFFFFF' : colors.textPrimary }]}>{r}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.label, { color: colors.textPrimary }]}>
                Message <Text style={{ color: colors.textMuted }}>(optional)</Text>
              </Text>
              <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder="Briefly say what you can contribute or relevant experience…"
                placeholderTextColor={colors.textMuted}
                multiline
                maxLength={COLLAB_LIMITS.messageMax}
                textAlignVertical="top"
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? colors.surfaceSubtle : colors.background,
                    borderColor: colors.borderSubtle,
                    color: colors.textPrimary,
                  },
                ]}
              />
              <Text style={[styles.counter, { color: colors.textMuted }]}>
                {message.length}/{COLLAB_LIMITS.messageMax}
              </Text>

              <Button
                label={sending ? 'Sending…' : 'Send application'}
                onPress={send}
                variant="primary"
                fullWidth
                loading={sending}
                disabled={sending || !role}
              />
              <Text style={[styles.note, { color: colors.textSecondary }]}>
                If accepted, you join the team and can see each other's contact card.
              </Text>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </CollabContext.Provider>
  );
};

export const useCollab = (): CollabContextType => useContext(CollabContext);

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderWidth: 1,
    paddingTop: spacing.md,
    maxHeight: '90%',
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md },
  iconBadge: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1, minWidth: 0 },
  title: { ...typography.title },
  subtitle: { ...typography.bodySmall },
  close: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  body: { padding: spacing.md, paddingBottom: spacing.xl, gap: spacing.sm },
  label: { ...typography.label, marginTop: spacing.sm },
  rolesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  rolePill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.full, borderWidth: 1 },
  roleText: { ...typography.caption, fontSize: 13, fontFamily: fontFamilies.sansSemiBold },
  input: {
    ...typography.bodyCompact,
    borderWidth: 1,
    borderRadius: radius.sm,
    padding: 12,
    minHeight: 110,
  },
  counter: { ...typography.micro, alignSelf: 'flex-end' },
  note: { ...typography.caption, textAlign: 'center', marginTop: spacing.xs },
});
