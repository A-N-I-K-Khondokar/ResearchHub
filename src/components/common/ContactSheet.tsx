/**
 * src/components/common/ContactSheet.tsx
 *
 * Bottom sheet that shows a connected researcher's contact card with one-tap
 * actions (email, WhatsApp, Telegram, call, link) and copy. The card is only
 * readable by accepted connections — the Firestore rules enforce that — so a
 * missing / unreadable card simply shows the empty state.
 */

import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Modal, Platform, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Copy, ExternalLink, Link2, Mail, MessageCircle, Phone, Send, User, X } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import { getContactCard } from '@/services/collab.service';
import { contactActionFor, type ContactActionKind } from '@/utils/contact';
import type { ContactCard } from '@/types/collab.types';
import { Avatar } from './Avatar';
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

const ICONS: Record<ContactActionKind, typeof Mail> = {
  email: Mail,
  whatsapp: MessageCircle,
  telegram: Send,
  phone: Phone,
  link: Link2,
};

/** Copy on web; on phones use the system share sheet (it includes "Copy"). */
export async function copyContact(text: string, onCopied: () => void) {
  if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
    await navigator.clipboard.writeText(text);
    onCopied();
    return;
  }
  await Share.share({ message: text });
}

export const ContactSheet: React.FC<ContactSheetProps> = ({ person, onClose, onViewProfile }) => {
  const { colors } = useTheme();
  const toast = useToast();
  const [card, setCard] = useState<ContactCard | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!person) return;
    let active = true;
    setLoading(true);
    setCard(null);
    getContactCard(person.uid)
      .then((c) => active && setCard(c))
      .catch(() => active && setCard(null))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [person?.uid]);

  const open = (url: string) => Linking.openURL(url).catch(() => toast.show('Unable to open this app', 'error'));
  const copy = (text: string) => copyContact(text, () => toast.show('Copied', 'success')).catch(() => {});

  const firstName = person?.displayName.split(' ')[0] ?? '';
  const preferredAction = contactActionFor(card?.preferredContact);
  const hasAnything = Boolean(card && (card.email || card.preferredContact));

  const row = (key: string, Icon: typeof Mail, value: string, actionLabel: string | null, url: string | null) => (
    <View key={key} style={[styles.row, { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderSubtle }]}>
      <View style={[styles.rowIcon, { backgroundColor: colors.primaryMuted }]}>
        <Icon size={16} color={colors.primary} />
      </View>
      <Text style={[styles.rowValue, { color: colors.textPrimary }]} numberOfLines={2} selectable>
        {value}
      </Text>
      <TouchableOpacity
        onPress={() => copy(value)}
        hitSlop={8}
        style={[styles.iconBtn, { borderColor: colors.borderSubtle, backgroundColor: colors.surface }]}
        accessibilityRole="button"
        accessibilityLabel={`Copy ${value}`}
      >
        <Copy size={15} color={colors.textSecondary} />
      </TouchableOpacity>
      {url && actionLabel ? (
        <TouchableOpacity
          onPress={() => open(url)}
          style={[styles.actionBtn, { backgroundColor: colors.primary }]}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
        >
          <ExternalLink size={13} color="#FFFFFF" />
          <Text style={styles.actionText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );

  return (
    <Modal visible={Boolean(person)} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
        <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
          <View style={styles.header}>
            <Avatar name={person?.displayName ?? ''} uri={person?.photoURL ?? null} size="md" />
            <View style={styles.headerText}>
              <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
                Contact {firstName}
              </Text>
              {person?.subtitle ? (
                <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                  {person.subtitle}
                </Text>
              ) : null}
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

          <View style={styles.body}>
            {loading ? (
              <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.lg }} />
            ) : hasAnything && card ? (
              <>
                {card.email ? row('email', Mail, card.email, 'Email', `mailto:${card.email}`) : null}
                {card.preferredContact
                  ? row(
                      'preferred',
                      preferredAction ? ICONS[preferredAction.kind] : MessageCircle,
                      card.preferredContact,
                      preferredAction?.label ?? null,
                      preferredAction?.url ?? null,
                    )
                  : null}
                <Text style={[styles.note, { color: colors.textMuted }]}>
                  Only your connections can see these details.
                </Text>
              </>
            ) : (
              <Text style={[styles.empty, { color: colors.textSecondary }]}>
                {firstName} hasn't added contact details yet. Once they add a contact card in their profile, it will
                appear here.
              </Text>
            )}

            {person && onViewProfile ? (
              <TouchableOpacity
                onPress={() => {
                  onClose();
                  onViewProfile(person.uid);
                }}
                style={[styles.profileBtn, { borderColor: colors.border }]}
                accessibilityRole="button"
              >
                <User size={15} color={colors.textPrimary} />
                <Text style={[styles.profileText, { color: colors.textPrimary }]}>View profile</Text>
              </TouchableOpacity>
            ) : null}
          </View>
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
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md },
  headerText: { flex: 1, minWidth: 0 },
  title: { ...typography.title },
  subtitle: { ...typography.bodySmall },
  close: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  body: { padding: spacing.md, gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  rowIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  rowValue: { ...typography.bodyCompact, flex: 1, minWidth: 0 },
  iconBtn: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    height: 34,
    borderRadius: radius.button,
  },
  actionText: { ...typography.caption, color: '#FFFFFF', fontFamily: fontFamilies.sansSemiBold },
  note: { ...typography.micro, textAlign: 'center', marginTop: spacing.xs },
  empty: { ...typography.bodyCompact, textAlign: 'center', marginVertical: spacing.md },
  profileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    height: 44,
    borderRadius: radius.button,
    borderWidth: 1,
    marginTop: spacing.xs,
  },
  profileText: { ...typography.label, fontFamily: fontFamilies.sansSemiBold },
});
