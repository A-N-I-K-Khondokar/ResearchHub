/**
 * src/context/ToastContext.tsx
 *
 * Lightweight in-app toasts ("Request sent", "Saved", "Published") so actions
 * give visible feedback. No external library; one toast at a time, auto-hides.
 *
 * Usage: const toast = useToast(); toast.show('Saved to your library');
 */

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { radius, spacing, typography } from '@/constants';

export type ToastType = 'success' | 'error' | 'info';

interface ToastState {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  show: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType>({ show: () => {} });

/** Height of the bottom tab bar area the toast should float above. */
const TAB_BAR_CLEARANCE = 72;
const VISIBLE_MS = 2400;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastState | null>(null);
  const anim = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const counter = useRef(0);

  const show = useCallback(
    (message: string, type: ToastType = 'success') => {
      counter.current += 1;
      setToast({ id: counter.current, message, type });
      if (hideTimer.current) clearTimeout(hideTimer.current);
      anim.setValue(0);
      Animated.timing(anim, { toValue: 1, duration: 180, useNativeDriver: Platform.OS !== 'web' }).start();
      hideTimer.current = setTimeout(() => {
        Animated.timing(anim, { toValue: 0, duration: 180, useNativeDriver: Platform.OS !== 'web' }).start(() =>
          setToast(null),
        );
      }, VISIBLE_MS);
    },
    [anim],
  );

  const value = useMemo(() => ({ show }), [show]);

  const accent =
    toast?.type === 'error' ? colors.error : toast?.type === 'info' ? colors.primary : colors.success;
  const Icon = toast?.type === 'error' ? AlertCircle : toast?.type === 'info' ? Info : CheckCircle2;

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <View pointerEvents="none" style={[styles.host, { bottom: insets.bottom + TAB_BAR_CLEARANCE }]}>
          <Animated.View
            accessibilityLiveRegion="polite"
            accessibilityRole="alert"
            style={[
              styles.toast,
              {
                backgroundColor: colors.textPrimary,
                opacity: anim,
                transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
              },
            ]}
          >
            <Icon size={18} color={accent} />
            <Text style={[styles.text, { color: colors.background }]} numberOfLines={2}>
              {toast.message}
            </Text>
          </Animated.View>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => useContext(ToastContext);

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    alignItems: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    maxWidth: 520,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderRadius: radius.button,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 6,
  },
  text: {
    ...typography.label,
    flexShrink: 1,
  },
});
