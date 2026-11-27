/**
 * src/utils/dialogs.ts
 *
 * Cross-platform dialogs. React Native Web's `Alert.alert` is an empty stub
 * (`static alert() {}`), so on the web build every Alert — and every action
 * behind an Alert button — silently did nothing. These helpers use the native
 * Alert on iOS/Android and the browser's window.confirm / window.alert on web.
 *
 * When the in-app DialogProvider is mounted (src/context/DialogContext.tsx) it
 * registers a handler here, and EVERY confirm / message / action menu is shown
 * as the app's own styled popup on all platforms. The native / browser dialogs
 * remain only as a fallback.
 */

import { Alert, Platform } from 'react-native';

export interface DialogHandler {
  confirm: (options: Required<Omit<ConfirmOptions, 'icon'>> & { icon?: ConfirmOptions['icon'] }) => Promise<boolean>;
  message: (title: string, message: string) => void;
  choose: (title: string, options: ActionOption[]) => void;
}

let handler: DialogHandler | null = null;

/** Called by DialogProvider on mount (and with null on unmount). */
export function registerDialogHandler(next: DialogHandler | null): void {
  handler = next;
}

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  /** Optional icon hint for the in-app dialog. */
  icon?: 'signout' | 'delete' | 'warning' | 'info';
}

/** Resolves `true` when the user confirms, `false` when they cancel or dismiss. */
export function confirmAction({
  title,
  message,
  confirmLabel = 'OK',
  cancelLabel = 'Cancel',
  destructive = false,
  icon,
}: ConfirmOptions): Promise<boolean> {
  if (handler) {
    return handler.confirm({ title, message, confirmLabel, cancelLabel, destructive, icon });
  }
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
  if (handler) {
    handler.message(title, message);
    return;
  }
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
  if (handler) {
    handler.choose(title, options);
    return;
  }
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
