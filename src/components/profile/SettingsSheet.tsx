/**
 * src/components/profile/SettingsSheet.tsx
 *
 * Profile → ⚙️ Settings, as a bottom sheet (same pattern as every other sheet):
 *   Appearance  — Light / Dark / System segmented control + plain-language hint
 *   Account     — signed-in email, Edit profile, Contact card
 *   About       — app version + privacy note
 *   Sign out    — quiet outlined button at the very end (asks to confirm)
 */

import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Constants from 'expo-constants';
import { ChevronRight, IdCard, Info, LogOut, Mail, Moon, Pencil, ShieldCheck, Smartphone, Sun, X } from 'lucide-react-native';
import { useTheme, type ThemeMode } from '@/context/ThemeContext';
import { fontFamilies, radius, shadows, spacing, typography } from '@/constants';

interface SettingsSheetProps {
  visible: boolean;
  onClose: () => void;
  email: string | undefined;
  hasContactCard: boolean | null;
  signingOut: boolean;
  onEditProfile: () => void;
  onContactCard: () => void;
  onSignOut: () => void;
}

const THEMES: { mode: ThemeMode; label: string; icon: typeof Sun; hint: string }[] = [
  { mode: 'light', label: 'Light', icon: Sun, hint: 'Always use the light theme.' },
  { mode: 'dark', label: 'Dark', icon: Moon, hint: 'Always use the dark theme — easier on the eyes at night.' },
  { mode: 'system', label: 'System', icon: Smartphone, hint: "Follows your phone's light / dark setting." },
];

export const SettingsSheet: React.FC<SettingsSheetProps> = ({
  visible,
  onClose,
  email,
  hasContactCard,
  signingOut,
  onEditProfile,
  onContactCard,
  onSignOut,
}) => {
  const { colors, themeMode, setThemeMode } = useTheme();
  const version = Constants.expoConfig?.version ?? '';
  const current = THEMES.find((t) => t.mode === themeMode) ?? THEMES[2];

  const row = (
    key: string,
    Icon: typeof Sun,
    title: string,
    value?: string,
    onPress?: () => void,
    last = false,
  ) => {
    const content = (
      <>
        <View style={[styles.rowIcon, { backgroundColor: colors.primaryMuted }]}>
          <Icon size={16} color={colors.primary} />
        </View>
        <View style={styles.rowText}>
          <Text style={[styles.rowTitle, { color: colors.textPrimary }]} numberOfLines={1}>
            {title}
          </Text>
          {value ? (
            <Text style={[styles.rowValue, { color: colors.textSecondary }]} numberOfLines={1}>
              {value}
            </Text>
          ) : null}
        </View>
        {onPress ? <ChevronRight size={18} color={colors.textMuted} /> : null}
      </>
    );
    const style = [styles.row, !last && { borderBottomWidth: 1, borderBottomColor: colors.borderSubtle }];
    return onPress ? (
      <TouchableOpacity key={key} onPress={onPress} style={style} accessibilityRole="button" accessibilityLabel={title}>
        {content}
      </TouchableOpacity>
    ) : (
      <View key={key} style={style}>
        {content}
      </View>
    );
  };

  const go = (action: () => void) => () => {
    onClose();
    setTimeout(action, 250); // let this sheet slide away first
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close settings" />
        <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
          <View style={[styles.grabber, { backgroundColor: colors.border }]} />
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Settings</Text>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={10}
              style={[styles.close, { backgroundColor: colors.surfaceSubtle }]}
              accessibilityRole="button"
              accessibilityLabel="Close settings"
            >
              <X size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.body}>
            {/* Appearance */}
            <Text style={[styles.section, { color: colors.textSecondary }]}>APPEARANCE</Text>
            <View style={[styles.segment, { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderSubtle }]}>
              {THEMES.map(({ mode, label, icon: Icon }) => {
                const active = themeMode === mode;
                return (
                  <TouchableOpacity
                    key={mode}
                    onPress={() => setThemeMode(mode)}
                    style={[
                      styles.segmentItem,
                      active && [styles.segmentActive, shadows.card, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }],
                    ]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={`${label} theme`}
                  >
                    <Icon size={16} color={active ? colors.primary : colors.textSecondary} />
                    <Text
                      style={[
                        styles.segmentText,
                        { color: active ? colors.textPrimary : colors.textSecondary },
                        active && { fontFamily: fontFamilies.sansSemiBold },
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={[styles.hint, { color: colors.textMuted }]}>{current.hint}</Text>

            {/* Account */}
            <Text style={[styles.section, { color: colors.textSecondary }]}>ACCOUNT</Text>
            <View style={[styles.card, { borderColor: colors.borderSubtle, backgroundColor: colors.background }]}>
              {row('email', Mail, 'Signed in as', email)}
              {row('edit', Pencil, 'Edit profile', 'Name, bio, interests and links', go(onEditProfile))}
              {row(
                'contact',
                IdCard,
                'Contact card',
                hasContactCard ? 'Added · visible to your connections' : 'Not added yet',
                go(onContactCard),
                true,
              )}
            </View>

            {/* About */}
            <Text style={[styles.section, { color: colors.textSecondary }]}>ABOUT</Text>
            <View style={[styles.card, { borderColor: colors.borderSubtle, backgroundColor: colors.background }]}>
              {row('version', Info, 'CSE Research Hub', version ? `Version ${version}` : undefined)}
              {row('privacy', ShieldCheck, 'Privacy', 'Your email and student ID are never shown publicly', undefined, true)}
            </View>

            {/* Sign out */}
            <TouchableOpacity
              onPress={onSignOut}
              disabled={signingOut}
              style={[styles.signOut, { borderColor: colors.border }]}
              accessibilityRole="button"
              accessibilityLabel="Sign out"
            >
              <LogOut size={16} color={colors.error} />
              <Text style={[styles.signOutText, { color: colors.error }]}>{signingOut ? 'Signing out…' : 'Sign out'}</Text>
            </TouchableOpacity>
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
    maxHeight: '90%',
  },
  grabber: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md },
  title: { ...typography.title, fontSize: 20, flex: 1 },
  close: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  body: { padding: spacing.md, paddingBottom: spacing.xl },
  section: {
    ...typography.micro,
    fontFamily: fontFamilies.sansSemiBold,
    letterSpacing: 0.6,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  segment: { flexDirection: 'row', borderWidth: 1, borderRadius: radius.button, padding: 3, gap: 3 },
  segmentItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
    borderRadius: radius.button - 3,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  segmentActive: {},
  segmentText: { ...typography.label },
  hint: { ...typography.caption, marginTop: spacing.xs },
  card: { borderWidth: 1, borderRadius: radius.md, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, minHeight: 56, paddingVertical: 8 },
  rowIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1, minWidth: 0 },
  rowTitle: { ...typography.label, fontFamily: fontFamilies.sansSemiBold },
  rowValue: { ...typography.caption },
  signOut: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    height: 48,
    borderRadius: radius.button,
    borderWidth: 1,
    marginTop: spacing.lg,
  },
  signOutText: { ...typography.label, fontFamily: fontFamilies.sansSemiBold },
});
