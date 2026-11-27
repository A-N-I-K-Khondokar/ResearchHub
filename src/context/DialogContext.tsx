/**
 * src/context/DialogContext.tsx
 *
 * The app's own popup dialogs (same look on Android, iOS and web):
 *   - confirm  → centred card with icon, title, message, Cancel + Confirm
 *   - message  → same card with a single OK
 *   - choose   → bottom action sheet (e.g. a card's ⋯ menu)
 *
 * It registers itself with src/utils/dialogs.ts, so every existing
 * confirmAction / showMessage / chooseAction call now uses these popups.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COMPACT_FONT_SCALE } from '@/constants/typography';
import { AlertTriangle, Info, LogOut, Trash2 } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { registerDialogHandler, type ActionOption, type ConfirmOptions } from '@/utils/dialogs';
import { fontFamilies, radius, shadows, spacing, typography } from '@/constants';

type ConfirmState = Required<Omit<ConfirmOptions, 'icon'>> & {
  icon?: ConfirmOptions['icon'];
  kind: 'confirm' | 'message';
  resolve: (ok: boolean) => void;
};

type ChooseState = { title: string; options: ActionOption[] };

/** Strong red that reads well on both themes (dark `error` token is a pale tint). */
const DANGER = '#DC2626';

export const DialogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { colors, isDark } = useTheme();
  const [dialog, setDialog] = useState<ConfirmState | null>(null);
  const [menu, setMenu] = useState<ChooseState | null>(null);
  const current = useRef<ConfirmState | null>(null);
  const anim = useRef(new Animated.Value(0)).current;

  const animateIn = useCallback(() => {
    anim.setValue(0);
    Animated.timing(anim, { toValue: 1, duration: 180, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [anim]);

  const close = useCallback((ok: boolean) => {
    const d = current.current;
    current.current = null;
    setDialog(null);
    d?.resolve(ok);
  }, []);

  useEffect(() => {
    registerDialogHandler({
      confirm: (opts) =>
        new Promise<boolean>((resolve) => {
          current.current?.resolve(false); // only one dialog at a time
          const next: ConfirmState = { ...opts, kind: 'confirm', resolve };
          current.current = next;
          setDialog(next);
          animateIn();
        }),
      message: (title, message) => {
        current.current?.resolve(false);
        const next: ConfirmState = {
          title,
          message,
          confirmLabel: 'OK',
          cancelLabel: '',
          destructive: false,
          icon: 'info',
          kind: 'message',
          resolve: () => {},
        };
        current.current = next;
        setDialog(next);
        animateIn();
      },
      choose: (title, options) => setMenu({ title, options }),
    });
    return () => registerDialogHandler(null);
  }, [animateIn]);

  const accent = dialog?.destructive ? DANGER : colors.primary;
  const iconBg = dialog?.destructive ? (isDark ? 'rgba(220,38,38,0.18)' : '#FEE2E2') : colors.primaryMuted;
  const Icon =
    dialog?.icon === 'signout'
      ? LogOut
      : dialog?.icon === 'delete'
        ? Trash2
        : dialog?.destructive || dialog?.icon === 'warning'
          ? AlertTriangle
          : Info;

  return (
    <>
      {children}

      {/* Confirm / message */}
      <Modal visible={Boolean(dialog)} transparent animationType="none" onRequestClose={() => close(false)}>
        <Animated.View style={[styles.backdrop, { opacity: anim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => close(false)} accessibilityLabel="Cancel" />
          <Animated.View
            accessibilityViewIsModal
            accessibilityRole="alert"
            style={[
              styles.card,
              shadows.elevated,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderSubtle,
                opacity: anim,
                transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) }],
              },
            ]}
          >
            <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
              <Icon size={24} color={accent} />
            </View>
            <Text style={[styles.title, { color: colors.textPrimary }]}>{dialog?.title}</Text>
            {dialog?.message ? (
              <Text style={[styles.message, { color: colors.textSecondary }]}>{dialog.message}</Text>
            ) : null}

            <View style={styles.buttons}>
              {dialog?.kind === 'confirm' ? (
                <TouchableOpacity
                  onPress={() => close(false)}
                  style={[styles.button, { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }]}
                  accessibilityRole="button"
                >
                  <Text maxFontSizeMultiplier={COMPACT_FONT_SCALE} style={[styles.buttonText, { color: colors.textPrimary }]}>{dialog.cancelLabel}</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                onPress={() => close(true)}
                style={[styles.button, { backgroundColor: accent }]}
                accessibilityRole="button"
              >
                <Text maxFontSizeMultiplier={COMPACT_FONT_SCALE} style={[styles.buttonText, { color: '#FFFFFF' }]}>{dialog?.confirmLabel}</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>

      {/* Action menu */}
      <Modal visible={Boolean(menu)} transparent animationType="slide" onRequestClose={() => setMenu(null)}>
        <View style={styles.sheetBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setMenu(null)} accessibilityLabel="Close menu" />
          <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
            <View style={[styles.grabber, { backgroundColor: colors.border }]} />
            {menu?.title ? (
              <Text style={[styles.sheetTitle, { color: colors.textSecondary }]} numberOfLines={2}>
                {menu.title}
              </Text>
            ) : null}
            {menu?.options.map((o, i) => (
              <TouchableOpacity
                key={`${o.label}-${i}`}
                onPress={() => {
                  setMenu(null);
                  setTimeout(o.onPress, 200); // let the sheet close (an option may open a dialog)
                }}
                style={[styles.option, { borderTopColor: colors.borderSubtle }]}
                accessibilityRole="button"
              >
                <Text style={[styles.optionText, { color: o.destructive ? DANGER : colors.textPrimary }]}>{o.label}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              onPress={() => setMenu(null)}
              style={[styles.cancel, { backgroundColor: colors.surfaceSubtle }]}
              accessibilityRole="button"
            >
              <Text style={[styles.optionText, { color: colors.textPrimary, fontFamily: fontFamilies.sansSemiBold }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    alignItems: 'center',
  },
  iconCircle: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  title: { ...typography.title, fontSize: 19, textAlign: 'center' },
  message: { ...typography.bodySmall, textAlign: 'center', marginTop: spacing.xs},
  buttons: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg, alignSelf: 'stretch' },
  button: { flex: 1, height: spacing.secondaryButtonHeight, borderRadius: radius.button, alignItems: 'center', justifyContent: 'center' },
  buttonText: { ...typography.button },
  sheetBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderWidth: 1,
    paddingTop: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },
  grabber: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: spacing.sm },
  sheetTitle: { ...typography.caption, textAlign: 'center', paddingVertical: spacing.sm },
  option: { minHeight: 52, alignItems: 'center', justifyContent: 'center', borderTopWidth: 1 },
  optionText: { ...typography.body },
  cancel: { minHeight: 50, alignItems: 'center', justifyContent: 'center', borderRadius: radius.button, marginTop: spacing.sm },
});
