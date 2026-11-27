/**
 * src/components/common/ContactSheet.tsx
 *
 * Bottom sheet with a researcher's contact card:
 *   - a primary one-tap button for their preferred method
 *   - labelled two-line rows (tap to open, copy icon), email marked Verified
 *   - clear states: loading, not connected (Connect), connected without a card
 *   - "Also on" links from their public profile as fallbacks
 * The card is only readable by accepted connections (Firestore rules).
 */

import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Linking, Modal, Platform, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import {
  BadgeCheck,
  Check,
  CheckCircle2,
  Copy,
  IdCard,
  Link2,
  Lock,
  Mail,
  MessageCircle,
  Phone,
  Send,
  User,
  UserPlus,
  X,
  type LucideIcon,
} from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import { getContactCard } from '@/services/collab.service';
import { getPublicProfile } from '@/services/user.service';
import { useConnections } from '@/hooks/useConnections';
import { contactActionFor, contactValueFor, type ContactActionKind } from '@/utils/contact';
import type { ContactCard } from '@/types/collab.types';
import type { PublicProfile } from '@/types/user.types';
import { Avatar } from './Avatar';
import { Button } from './Button';
import { StatusChip } from './StatusChip';
import { linkIconFor } from './linkIcon';
import { Skeleton } from '@/components/feedback/Skeleton';
import { COMPACT_FONT_SCALE } from '@/constants/typography';
import { fontFamilies, radius, spacing, typography } from '@/constants';

export interface ContactPerson {
  uid: string;
  displayName: string;
  photoURL: string | null;
  /** e.g. the person's team role. */
  subtitle?: string;
}

interface ContactSheetProps {
  person: ContactPerson | null;
  onClose: () => void;
  onViewProfile?: (uid: string) => void;
}

const ICONS: Record<ContactActionKind, LucideIcon> = {
  email: Mail,
  whatsapp: MessageCircle,
  telegram: Send,
  phone: Phone,
  link: Link2,
};

const LABELS: Record<ContactActionKind, string> = {
  email: 'Email',
  whatsapp: 'WhatsApp',
  telegram: 'Telegram',
  phone: 'Phone',
  link: 'Link',
};

const primaryLabel = (kind: ContactActionKind, firstName: string) =>
  ({
    email: `Email ${firstName}`,
    whatsapp: `WhatsApp ${firstName}`,
    telegram: `Message on Telegram`,
    phone: `Call ${firstName}`,
    link: `Open ${firstName}'s link`,
  })[kind];

const SOCIAL_LABELS: Record<string, string> = {
  linkedin: 'LinkedIn',
  github: 'GitHub',
  website: 'Website',
  googleScholar: 'Google Scholar',
  researchGate: 'ResearchGate',
};

/**
 * Copy only the bare value (number, @handle, email or link) to the clipboard;
 * falls back to the share sheet if the clipboard is unavailable.
 */
export async function copyContact(text: string, onCopied: (value: string) => void) {
  const value = contactValueFor(text) || text.trim();
  try {
    await Clipboard.setStringAsync(value);
    onCopied(value);
  } catch {
    if (Platform.OS !== 'web') await Share.share({ message: value });
  }
}

export const ContactSheet: React.FC<ContactSheetProps> = ({ person, onClose, onViewProfile }) => (
  <Modal visible={Boolean(person)} animationType="slide" transparent onRequestClose={onClose}>
    {person ? <SheetContent person={person} onClose={onClose} onViewProfile={onViewProfile} /> : null}
  </Modal>
);

/** Mounted only while the sheet is open (connections / profile reads start here). */
const SheetContent: React.FC<{
  person: ContactPerson;
  onClose: () => void;
  onViewProfile?: (uid: string) => void;
}> = ({ person, onClose, onViewProfile }) => {
  const { colors } = useTheme();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const { relationship, handleConnectPress, loading: connLoading } = useConnections();
  const [card, setCard] = useState<ContactCard | null>(null);
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setCard(null);
    Promise.all([
      getContactCard(person.uid).catch(() => null),
      getPublicProfile(person.uid).catch(() => null),
    ]).then(([c, p]) => {
      if (!active) return;
      setCard(c);
      setProfile(p);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [person.uid]);

  const firstName = person.displayName.split(' ')[0];
  const rel = relationship(person.uid).state;
  const connected = rel === 'connected';
  const busy = loading || connLoading;

  const open = (url: string) => Linking.openURL(url).catch(() => toast.show('Unable to open this app', 'error'));

  // "Copied" confirmation popup, shown INSIDE the sheet (a toast would sit behind the modal).
  const [copied, setCopied] = useState<{ what: string; value: string } | null>(null);
  const fade = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
  }, []);
  const showCopied = (what: string, value: string) => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setCopied({ what, value });
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 160, useNativeDriver: Platform.OS !== 'web' }).start();
    AccessibilityInfo.announceForAccessibility?.(`${what} copied: ${value}`);
    hideTimer.current = setTimeout(() => {
      Animated.timing(fade, { toValue: 0, duration: 200, useNativeDriver: Platform.OS !== 'web' }).start(() => setCopied(null));
    }, 1800);
  };
  const copy = (text: string, what: string) => copyContact(text, (value) => showCopied(what, value)).catch(() => {});

  // Contact methods: preferred first, then email.
  const preferred = contactActionFor(card?.preferredContact);
  const methods: { key: string; kind: ContactActionKind; value: string; url: string | null; verified?: boolean }[] = [];
  if (card?.preferredContact) {
    methods.push({
      key: 'preferred',
      kind: preferred?.kind ?? 'link',
      value: contactValueFor(card.preferredContact) || card.preferredContact,
      url: preferred?.url ?? null,
    });
  }
  if (card?.email) {
    methods.push({ key: 'email', kind: 'email', value: card.email, url: `mailto:${card.email}`, verified: true });
  }
  const primary = methods.find((m) => m.url) ?? null;

  const socials = Object.entries(profile?.socialLinks ?? {})
    .filter(([, v]) => Boolean(v))
    .map(([k, v]) => {
      const raw = String(v);
      return { key: k, url: /^https?:\/\//i.test(raw) ? raw : `https://${raw}`, label: SOCIAL_LABELS[k] ?? 'Link' };
    });

  const connectLabel = rel === 'outgoing' ? 'Request sent' : rel === 'incoming' ? 'Accept request' : 'Connect';

  return (
    <View style={styles.overlay}>
      <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
      <View
        style={[
          styles.sheet,
          { backgroundColor: colors.surface, borderColor: colors.borderSubtle, paddingBottom: Math.max(insets.bottom, spacing.md) + spacing.sm },
        ]}
      >
        <View style={[styles.grabber, { backgroundColor: colors.border }]} />

        {/* Header */}
        <View style={styles.header}>
          <Avatar name={person.displayName} uri={person.photoURL} size="md" />
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
              {person.displayName}
            </Text>
            <View style={styles.subRow}>
              {person.subtitle ? (
                <Text style={[styles.subtitle, { color: colors.textSecondary, flexShrink: 1 }]} numberOfLines={1}>
                  {person.subtitle}
                </Text>
              ) : null}
              {connected ? <StatusChip label="Connected" tone="success" icon={Check} /> : null}
            </View>
          </View>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={8}
            style={[styles.close, { backgroundColor: colors.surfaceSubtle }]}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <X size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          {busy ? (
            <View style={{ gap: spacing.sm }} accessibilityLabel="Loading contact details">
              <Skeleton width="100%" height={48} rounded={radius.button} />
              <Skeleton width="100%" height={60} rounded={radius.md} />
              <Skeleton width="100%" height={60} rounded={radius.md} />
            </View>
          ) : !connected && methods.length === 0 ? (
            /* Not connected: the card is private to connections */
            <View style={[styles.state, { backgroundColor: colors.surfaceSubtle }]}>
              <View style={[styles.stateIcon, { backgroundColor: colors.surface }]}>
                <Lock size={20} color={colors.textSecondary} />
              </View>
              <Text style={[styles.stateTitle, { color: colors.textPrimary }]}>Connect to see contact details</Text>
              <Text style={[styles.stateText, { color: colors.textSecondary }]}>
                {firstName}'s contact card is visible only to their connections.
              </Text>
              {rel !== 'rejected' && profile ? (
                <Button
                  label={connectLabel}
                  size="sm"
                  variant={rel === 'outgoing' ? 'secondary' : 'primary'}
                  disabled={rel === 'outgoing'}
                  icon={rel === 'outgoing' ? undefined : <UserPlus size={15} color="#FFFFFF" />}
                  onPress={() => handleConnectPress(profile)}
                  style={styles.stateBtn}
                />
              ) : null}
            </View>
          ) : methods.length === 0 ? (
            /* Connected, but no card yet */
            <View style={[styles.state, { backgroundColor: colors.surfaceSubtle }]}>
              <View style={[styles.stateIcon, { backgroundColor: colors.surface }]}>
                <IdCard size={20} color={colors.textSecondary} />
              </View>
              <Text style={[styles.stateTitle, { color: colors.textPrimary }]}>
                {firstName} hasn't shared contact details yet
              </Text>
              <Text style={[styles.stateText, { color: colors.textSecondary }]}>
                {socials.length
                  ? 'You can still reach them through the links below.'
                  : 'Their details will appear here once they add a contact card.'}
              </Text>
            </View>
          ) : (
            <>
              <Text style={[styles.overline, { color: colors.textSecondary }]}>Contact details</Text>
              {methods.map((m) => {
                const Icon = ICONS[m.kind];
                return (
                  <TouchableOpacity
                    key={m.key}
                    activeOpacity={0.9}
                    disabled={!m.url}
                    onPress={() => m.url && open(m.url)}
                    style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}
                    accessibilityRole={m.url ? 'link' : 'text'}
                    accessibilityLabel={`${LABELS[m.kind]}${m.verified ? ', verified' : ''}: ${m.value}`}
                  >
                    <View style={[styles.rowIcon, { backgroundColor: colors.primaryMuted }]}>
                      <Icon size={17} color={colors.primary} />
                    </View>
                    <View style={styles.rowText}>
                      <View style={styles.labelRow}>
                        <Text maxFontSizeMultiplier={COMPACT_FONT_SCALE} style={[styles.rowLabel, { color: colors.textSecondary }]}>
                          {LABELS[m.kind]}
                          {m.key === 'preferred' ? ' · Preferred' : ''}
                        </Text>
                        {m.verified ? (
                          <View style={styles.verified}>
                            <BadgeCheck size={12} color={colors.success} />
                            <Text maxFontSizeMultiplier={COMPACT_FONT_SCALE} style={[styles.verifiedText, { color: colors.success }]}>
                              Verified
                            </Text>
                          </View>
                        ) : null}
                      </View>
                      <Text style={[styles.rowValue, { color: colors.textPrimary }]} numberOfLines={2} selectable>
                        {m.value}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => copy(m.value, LABELS[m.kind])}
                      hitSlop={8}
                      style={[styles.copyBtn, { borderColor: colors.borderSubtle, backgroundColor: colors.surfaceSubtle }]}
                      accessibilityRole="button"
                      accessibilityLabel={`Copy ${LABELS[m.kind].toLowerCase()}`}
                    >
                      <Copy size={15} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })}

              <View style={styles.privacy}>
                <Lock size={13} color={colors.textMuted} />
                <Text style={[styles.privacyText, { color: colors.textMuted }]}>Only {firstName}'s connections can see this.</Text>
              </View>
            </>
          )}

          {/* Fallback / extra ways to reach them */}
          {!busy && socials.length > 0 ? (
            <>
              <Text style={[styles.overline, { color: colors.textSecondary }]}>Also on</Text>
              <View style={styles.socials}>
                {socials.map((s) => {
                  const Icon = linkIconFor(s.key);
                  return (
                    <TouchableOpacity
                      key={s.key}
                      onPress={() => open(s.url)}
                      style={[styles.social, { borderColor: colors.borderSubtle, backgroundColor: colors.surface }]}
                      accessibilityRole="link"
                      accessibilityLabel={`${firstName} on ${s.label}`}
                    >
                      <Icon size={14} color={colors.primary} />
                      <Text maxFontSizeMultiplier={COMPACT_FONT_SCALE} style={[styles.socialText, { color: colors.textPrimary }]}>
                        {s.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          ) : null}

          {/* Bottom action bar: View profile + the one-tap preferred method */}
          {!busy && (onViewProfile || primary) ? (
            <View style={[styles.actionBar, { borderTopColor: colors.borderSubtle }]}>
              {onViewProfile ? (
                <Button
                  label="View profile"
                  variant="secondary"
                  size="sm"
                  icon={<User size={15} color={colors.textPrimary} />}
                  onPress={() => {
                    onClose();
                    onViewProfile(person.uid);
                  }}
                  style={[styles.barBtn, primary ? null : styles.barBtnFull] as any}
                />
              ) : null}
              {primary ? (
                <Button
                  label={primaryLabel(primary.kind, firstName)}
                  size="sm"
                  icon={React.createElement(ICONS[primary.kind], { size: 16, color: '#FFFFFF' })}
                  onPress={() => primary.url && open(primary.url)}
                  style={[styles.barBtn, styles.barBtnPrimary] as any}
                />
              ) : null}
            </View>
          ) : null}
        </View>

        {copied ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.copiedWrap,
              { opacity: fade, transform: [{ scale: fade.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) }] },
            ]}
            accessibilityLiveRegion="polite"
          >
            <View style={[styles.copiedCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
              <View style={[styles.copiedIcon, { backgroundColor: colors.successLight }]}>
                <CheckCircle2 size={22} color={colors.success} />
              </View>
              <Text style={[styles.copiedTitle, { color: colors.textPrimary }]}>{copied.what} copied</Text>
              <Text style={[styles.copiedValue, { color: colors.textSecondary }]} numberOfLines={1}>
                {copied.value}
              </Text>
            </View>
          </Animated.View>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderWidth: 1,
    paddingTop: spacing.xs,
  },
  grabber: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md },
  headerText: { flex: 1, minWidth: 0, gap: 3 },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  title: { ...typography.title },
  subtitle: { ...typography.bodySmall },
  close: { width: spacing.compactButtonHeight, height: spacing.compactButtonHeight, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  body: { paddingHorizontal: spacing.md, paddingTop: spacing.md, gap: spacing.sm },
  overline: { ...typography.overline, marginTop: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: radius.md, padding: 12 },
  rowIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1, minWidth: 0, gap: 2 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  rowLabel: { ...typography.caption, fontFamily: fontFamilies.sansSemiBold },
  verified: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  verifiedText: { ...typography.micro, fontFamily: fontFamilies.sansSemiBold },
  rowValue: { ...typography.bodyCompact },
  copyBtn: { width: spacing.compactButtonHeight, height: spacing.compactButtonHeight, borderRadius: radius.full, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  privacy: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 2 },
  privacyText: { ...typography.caption },
  state: { alignItems: 'center', padding: spacing.lg, borderRadius: radius.md, gap: 6 },
  stateIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  stateTitle: { ...typography.titleSmall, textAlign: 'center' },
  stateText: { ...typography.bodySmall, textAlign: 'center' },
  stateBtn: { marginTop: spacing.sm, alignSelf: 'stretch' },
  socials: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  social: { flexDirection: 'row', alignItems: 'center', gap: 6, height: spacing.compactButtonHeight, paddingHorizontal: 12, borderWidth: 1, borderRadius: radius.full },
  socialText: { ...typography.buttonSmall },
  actionBar: { flexDirection: 'row', gap: spacing.sm, borderTopWidth: 1, paddingTop: spacing.md, marginTop: spacing.sm },
  barBtn: { flex: 1, height: spacing.buttonHeight },
  barBtnPrimary: { flex: 1.6 },
  barBtnFull: { flex: 1 },
  copiedWrap: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  copiedCard: {
    alignItems: 'center',
    gap: 4,
    minWidth: 200,
    maxWidth: '80%',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    shadowColor: '#071A3E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 8,
  },
  copiedIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  copiedTitle: { ...typography.titleSmall },
  copiedValue: { ...typography.bodySmall, fontVariant: ['tabular-nums'] },
});
