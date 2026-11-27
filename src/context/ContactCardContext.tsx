/**
 * src/context/ContactCardContext.tsx
 *
 * My contact card, app-wide:
 *  - `myCard` / `hasMyCard` — loaded once after approval, refreshed on save
 *  - `openContactEditor()` — a guided sheet any screen can open:
 *      1. "Share my email" toggle
 *      2. pick WhatsApp / Telegram / Phone / LinkedIn / Other
 *      3. type just the number or username (validated as you type)
 *      4. live preview of exactly what teammates will see
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Check, ExternalLink, IdCard, Link2, Mail, MessageCircle, Pencil, Phone, Send, X } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { FieldFrame } from '@/components/common/TextField';
import { useToast } from '@/context/ToastContext';
import { getContactCard, saveContactCard } from '@/services/collab.service';
import {
  CONTACT_METHODS,
  composeContact,
  contactActionFor,
  parseContact,
  validateContact,
  type ContactMethod,
} from '@/utils/contact';
import type { ContactCard } from '@/types/collab.types';
import { Button } from '@/components/common/Button';
import { confirmAction } from '@/utils/dialogs';
import { fontFamilies, radius, spacing, typography } from '@/constants';

interface ContactCardContextType {
  myCard: ContactCard | null;
  /** null while unknown (loading / not approved). */
  hasMyCard: boolean | null;
  openContactEditor: () => void;
}

const ContactCardContext = createContext<ContactCardContextType>({
  myCard: null,
  hasMyCard: null,
  openContactEditor: () => {},
});

const METHOD_ICON: Record<ContactMethod, typeof Mail> = {
  whatsapp: MessageCircle,
  telegram: Send,
  phone: Phone,
  linkedin: Link2,
  other: Pencil,
};

const METHOD_INPUT: Record<
  ContactMethod,
  { prefix?: string; placeholder: string; keyboard: 'default' | 'phone-pad' | 'url'; hint: string }
> = {
  whatsapp: { placeholder: '01712345678', keyboard: 'phone-pad', hint: 'Bangladesh numbers starting with 01 get +880 automatically.' },
  telegram: { prefix: '@', placeholder: 'username', keyboard: 'default', hint: 'Your Telegram username (Settings → Username).' },
  phone: { placeholder: '01712345678', keyboard: 'phone-pad', hint: 'Teammates can tap to call you.' },
  linkedin: { prefix: 'linkedin.com/in/', placeholder: 'your-name', keyboard: 'url', hint: 'Paste your profile link or just the username.' },
  other: { placeholder: 'e.g. Discord name, office room, Messenger link', keyboard: 'default', hint: 'Anything that helps the team reach you.' },
};

const hasContent = (card: ContactCard | null) => Boolean(card && (card.email || card.preferredContact));

export const ContactCardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userProfile } = useAuth();
  const { colors, isDark } = useTheme();
  const toast = useToast();
  const uid = userProfile?.approvalStatus === 'approved' ? userProfile.uid : '';

  const [myCard, setMyCard] = useState<ContactCard | null>(null);
  const [loaded, setLoaded] = useState(false);

  const [visible, setVisible] = useState(false);
  const [shareEmail, setShareEmail] = useState(false);
  const [method, setMethod] = useState<ContactMethod>('whatsapp');
  const [values, setValues] = useState<Partial<Record<ContactMethod, string>>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setMyCard(null);
    setLoaded(false);
    if (!uid) return;
    let active = true;
    getContactCard(uid)
      .then((card) => active && setMyCard(card))
      .catch(() => {})
      .finally(() => active && setLoaded(true));
    return () => {
      active = false;
    };
  }, [uid]);

  const openContactEditor = useCallback(() => {
    const parsed = parseContact(myCard?.preferredContact);
    setShareEmail(myCard ? Boolean(myCard.email) : true); // default ON for a first card
    setMethod(parsed.method);
    setValues({ [parsed.method]: parsed.value });
    setVisible(true);
  }, [myCard]);

  const value = values[method] ?? '';
  const error = validateContact(method, value);
  const preferred = error ? null : composeContact(method, value);
  const previewAction = contactActionFor(preferred);
  const nothingToShare = !shareEmail && !preferred;
  const input = METHOD_INPUT[method];

  const save = async () => {
    if (!userProfile || saving || error) return;
    if (nothingToShare) {
      toast.show('Share your email or add one way to reach you', 'info');
      return;
    }
    setSaving(true);
    try {
      await saveContactCard(userProfile, shareEmail, preferred);
      setMyCard({
        uid: userProfile.uid,
        email: shareEmail ? userProfile.email : null,
        preferredContact: preferred,
        updatedAt: myCard?.updatedAt as any,
      });
      setVisible(false);
      toast.show('Contact card saved — your team can reach you now');
    } catch (err) {
      console.error('[ContactCard] Save failed:', err);
      toast.show('Could not save your contact card. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!userProfile || saving) return;
    const ok = await confirmAction({
      title: 'Remove contact card?',
      message: 'Your connections and teammates will no longer see how to reach you.',
      confirmLabel: 'Remove',
      destructive: true,
    });
    if (!ok) return;
    setSaving(true);
    try {
      await saveContactCard(userProfile, false, null);
      setMyCard({ uid: userProfile.uid, email: null, preferredContact: null, updatedAt: myCard?.updatedAt as any });
      setVisible(false);
      toast.show('Contact card removed', 'info');
    } catch {
      toast.show('Could not remove your contact card', 'error');
    } finally {
      setSaving(false);
    }
  };

  const ctx = useMemo(
    () => ({ myCard, hasMyCard: loaded ? hasContent(myCard) : null, openContactEditor }),
    [myCard, loaded, openContactEditor],
  );

  const PreviewIcon = previewAction ? METHOD_ICON[method] : Pencil;

  return (
    <ContactCardContext.Provider value={ctx}>
      {children}

      <Modal visible={visible} animationType="slide" transparent onRequestClose={() => setVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
          <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
            <View style={styles.headerRow}>
              <View style={[styles.iconBadge, { backgroundColor: colors.primaryMuted }]}>
                <IdCard size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, { color: colors.textPrimary }]}>Your contact card</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  Only your connections and teammates can see this.
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setVisible(false)}
                hitSlop={10}
                style={[styles.close, { backgroundColor: colors.surfaceSubtle }]}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <X size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.body}>
              {/* 1. Email */}
              <Text style={[styles.step, { color: colors.textSecondary }]}>1 · EMAIL</Text>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setShareEmail((v) => !v)}
                style={[styles.emailRow, { backgroundColor: colors.surfaceSubtle, borderColor: shareEmail ? colors.primaryLight : colors.borderSubtle }]}
                accessibilityRole="switch"
                accessibilityState={{ checked: shareEmail }}
              >
                <Mail size={18} color={shareEmail ? colors.primary : colors.textMuted} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>Share my email</Text>
                  <Text style={[styles.rowSub, { color: colors.textSecondary }]} numberOfLines={1}>
                    {userProfile?.email}
                  </Text>
                </View>
                <Switch value={shareEmail} onValueChange={setShareEmail} accessibilityLabel="Share my email" />
              </TouchableOpacity>

              {/* 2. Method */}
              <Text style={[styles.step, { color: colors.textSecondary }]}>2 · BEST WAY TO REACH YOU</Text>
              <View style={styles.methods}>
                {CONTACT_METHODS.map((m) => {
                  const active = m.id === method;
                  const Icon = METHOD_ICON[m.id];
                  return (
                    <TouchableOpacity
                      key={m.id}
                      onPress={() => setMethod(m.id)}
                      style={[
                        styles.method,
                        active
                          ? { backgroundColor: colors.primary, borderColor: colors.primary }
                          : { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderSubtle },
                      ]}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: active }}
                    >
                      <Icon size={15} color={active ? '#FFFFFF' : colors.textSecondary} />
                      <Text style={[styles.methodText, { color: active ? '#FFFFFF' : colors.textPrimary }]}>{m.label}</Text>
                      {values[m.id]?.trim() && !active ? <View style={[styles.dot, { backgroundColor: colors.primary }]} /> : null}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* 3. Value */}
              <FieldFrame
                style={[
                  styles.inputWrap,
                  {
                    backgroundColor: isDark ? colors.surfaceSubtle : colors.background,
                    borderColor: error ? colors.error : value.trim() ? colors.primaryLight : colors.borderSubtle,
                  },
                ]}
              >
                {input.prefix ? <Text style={[styles.prefix, { color: colors.textMuted }]}>{input.prefix}</Text> : null}
                <TextInput
                  value={value}
                  onChangeText={(v) => setValues((prev) => ({ ...prev, [method]: v }))}
                  placeholder={input.placeholder}
                  placeholderTextColor={colors.textMuted}
                  keyboardType={input.keyboard}
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={180}
                  style={[styles.input, { color: colors.textPrimary }]}
                  accessibilityLabel={`${CONTACT_METHODS.find((m) => m.id === method)?.label} contact`}
                />
                {value.trim() && !error ? <Check size={16} color={colors.success} /> : null}
              </FieldFrame>
              <Text style={[styles.hint, { color: error ? colors.error : colors.textMuted }]}>{error ?? input.hint}</Text>

              {/* 4. Preview */}
              <Text style={[styles.step, { color: colors.textSecondary }]}>PREVIEW · WHAT YOUR TEAM SEES</Text>
              <View style={[styles.preview, { borderColor: colors.borderSubtle, backgroundColor: colors.surfaceSubtle }]}>
                {nothingToShare ? (
                  <Text style={[styles.rowSub, { color: colors.textMuted, textAlign: 'center' }]}>
                    Nothing shared yet — turn on email or add a contact above.
                  </Text>
                ) : (
                  <>
                    {shareEmail ? (
                      <View style={styles.previewRow}>
                        <Mail size={16} color={colors.primary} />
                        <Text style={[styles.previewText, { color: colors.textPrimary }]} numberOfLines={1}>{userProfile?.email}</Text>
                        <View style={[styles.previewBtn, { backgroundColor: colors.primary }]}>
                          <ExternalLink size={12} color="#FFFFFF" />
                          <Text style={styles.previewBtnText}>Email</Text>
                        </View>
                      </View>
                    ) : null}
                    {preferred ? (
                      <View style={styles.previewRow}>
                        <PreviewIcon size={16} color={colors.primary} />
                        <Text style={[styles.previewText, { color: colors.textPrimary }]} numberOfLines={1}>{preferred}</Text>
                        {previewAction ? (
                          <View style={[styles.previewBtn, { backgroundColor: colors.primary }]}>
                            <ExternalLink size={12} color="#FFFFFF" />
                            <Text style={styles.previewBtnText}>{previewAction.label}</Text>
                          </View>
                        ) : null}
                      </View>
                    ) : null}
                  </>
                )}
              </View>

              <Button
                label={saving ? 'Saving…' : 'Save contact card'}
                onPress={save}
                variant="primary"
                fullWidth
                loading={saving}
                disabled={saving || Boolean(error)}
              />
              {hasContent(myCard) ? (
                <TouchableOpacity onPress={remove} disabled={saving} style={styles.removeBtn} accessibilityRole="button">
                  <Text style={[styles.removeText, { color: colors.error }]}>Remove contact card</Text>
                </TouchableOpacity>
              ) : null}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ContactCardContext.Provider>
  );
};

export const useContactCard = (): ContactCardContextType => useContext(ContactCardContext);

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderWidth: 1,
    paddingTop: spacing.md,
    maxHeight: '92%',
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md },
  iconBadge: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  title: { ...typography.title },
  subtitle: { ...typography.bodySmall },
  close: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  body: { padding: spacing.md, paddingBottom: spacing.xl, gap: spacing.sm },
  step: { ...typography.micro, fontFamily: fontFamilies.sansSemiBold, letterSpacing: 0.6, marginTop: spacing.sm },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 12,
  },
  rowTitle: { ...typography.label, fontFamily: fontFamilies.sansSemiBold },
  rowSub: { ...typography.bodySmall },
  methods: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  method: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    height: 36,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  methodText: { ...typography.caption, fontSize: 13, fontFamily: fontFamilies.sansSemiBold },
  dot: { width: 6, height: 6, borderRadius: 3 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.xs },
  prefix: { ...typography.bodyCompact },
  input: { flex: 1, paddingVertical: 10, ...typography.body },
  hint: { ...typography.micro },
  preview: { borderWidth: 1, borderRadius: radius.md, padding: spacing.sm, gap: spacing.sm, marginBottom: spacing.sm },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  previewText: { ...typography.bodySmall, flex: 1, minWidth: 0 },
  previewBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, height: 28, borderRadius: radius.button },
  previewBtnText: { ...typography.micro, color: '#FFFFFF', fontFamily: fontFamilies.sansSemiBold },
  removeBtn: { alignItems: 'center', paddingVertical: spacing.sm },
  removeText: { ...typography.label, fontFamily: fontFamilies.sansSemiBold },
});
