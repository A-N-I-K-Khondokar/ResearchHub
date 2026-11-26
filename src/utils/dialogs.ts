/**
 * src/utils/dialogs.ts
 *
 * Cross-platform dialogs. React Native Web's `Alert.alert` is an empty stub
 * (`static alert() {}`), so on the web build every Alert — and every action
 * behind an Alert button — silently did nothing. These helpers use the native
 * Alert on iOS/Android and the browser's window.confirm / window.alert on web.
 */

import { Alert, Platform } from 'react-native';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

/** Resolves `true` when the user confirms, `false` when they cancel or dismiss. */
export function confirmAction({
  title,
  message,
  confirmLabel = 'OK',
  cancelLabel = 'Cancel',
  destructive = false,
}: ConfirmOptions): Promise<boolean> {
  if (Platform.OS === 'web') {
    const ok = typeof window !== 'undefined' && typeof window.confirm === 'function'
      ? window.confirm(`${title}\n\n${message}`)
      : false;
    return Promise.resolve(ok);
  }

  return new Promise((resolve) => {
    let settled = false;
    const finish = (value: boolean) => {
      if (!settled) {
        settled = true;
        resolve(value);
      }
    };
    Alert.alert(
      title,
      message,
      [
        { text: cancelLabel, style: 'cancel', onPress: () => finish(false) },
        { text: confirmLabel, style: destructive ? 'destructive' : 'default', onPress: () => finish(true) },
      ],
      { cancelable: true, onDismiss: () => finish(false) },
    );
  });
}

/** Informational message with a single OK button. */
export function showMessage(title: string, message: string): void {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && typeof window.alert === 'function') {
      window.alert(`${title}\n\n${message}`);
    }
    return;
  }
  Alert.alert(title, message);
}

export interface ActionOption {
  label: string;
  onPress: () => void;
  destructive?: boolean;
}

/**
 * Small action menu (e.g. a card's "⋯" button). Native: Alert with one button
 * per option + Cancel. Web: numbered window.prompt (RN-Web has no Alert).
 */
export function chooseAction(title: string, options: ActionOption[]): void {
  if (options.length === 0) return;
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined' || typeof window.prompt !== 'function') return;
    const menu = options.map((o, i) => `${i + 1}. ${o.label}`).join('\n');
    const answer = window.prompt(`${title}\n\n${menu}\n\nEnter a number:`);
    const index = answer ? parseInt(answer, 10) - 1 : -1;
    if (index >= 0 && index < options.length) options[index].onPress();
    return;
  }
  Alert.alert(title, undefined, [
    ...options.map((o) => ({ text: o.label, style: o.destructive ? ('destructive' as const) : ('default' as const), onPress: o.onPress })),
    { text: 'Cancel', style: 'cancel' as const },
  ]);
}
