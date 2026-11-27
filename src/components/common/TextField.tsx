/**
 * src/components/common/TextField.tsx
 *
 * The app's single text-field look (forms, sheets, onboarding):
 *   - 48px single line / 112px multiline, radius 12, 1px border
 *   - 15px body text, muted placeholder, primary cursor & selection
 *   - Focus: primary border + surface background (no layout shift)
 *   - Error: an error-coloured border set by the caller always wins
 *
 * `TextField` is a drop-in replacement for <TextInput>.
 * `FieldFrame` is for a bordered row that holds an icon / prefix / button
 * next to a TextInput: it gives that row the same focus state.
 */

import React, { forwardRef, useState } from 'react';
import {
  Platform,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewProps,
  type ViewStyle,
} from 'react-native';
import { COMPACT_FONT_SCALE } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';
import { fontFamilies, radius, spacing, typography } from '@/constants';

/**
 * Web only: the browser draws its own focus outline around the inner
 * <input>, which shows as a second box inside our rounded frame. The frame's
 * border is the focus indicator, so the browser outline is switched off.
 */
export const noWebOutline: any = Platform.OS === 'web' ? { outlineStyle: 'none', outlineWidth: 0 } : null;

export const FIELD_HEIGHT = spacing.inputHeight; // 48
export const FIELD_MULTILINE_MIN = 112;

function useFieldColors(focused: boolean, style: StyleProp<ViewStyle | TextStyle>) {
  const { colors } = useTheme();
  const flat = (StyleSheet.flatten(style) ?? {}) as ViewStyle;
  const hasError = flat.borderColor === colors.error;
  return {
    colors,
    state: {
      borderColor: hasError ? colors.error : focused ? colors.primary : (flat.borderColor ?? colors.borderSubtle),
      backgroundColor: focused ? colors.surface : (flat.backgroundColor ?? colors.surfaceSubtle),
    } as { borderColor: ViewStyle['borderColor']; backgroundColor: ViewStyle['backgroundColor'] },
  };
}

export const TextField = forwardRef<TextInput, TextInputProps>(
  ({ style, multiline, onFocus, onBlur, placeholderTextColor, ...rest }, ref) => {
    const [focused, setFocused] = useState(false);
    const { colors, state } = useFieldColors(focused, style);
    return (
      <TextInput
        ref={ref}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        placeholderTextColor={placeholderTextColor ?? colors.textMuted}
        selectionColor={colors.primary}
        cursorColor={colors.primary}
        maxFontSizeMultiplier={COMPACT_FONT_SCALE}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[
          styles.field,
          { color: colors.textPrimary },
          multiline ? styles.multiline : styles.singleLine,
          style,
          state,
          noWebOutline,
        ]}
        {...rest}
      />
    );
  },
);
TextField.displayName = 'TextField';

/** Bordered row (icon / prefix + TextInput + trailing button) with focus state. */
export const FieldFrame: React.FC<ViewProps & { children: React.ReactNode }> = ({ style, children, ...rest }) => {
  const [focused, setFocused] = useState(false);
  const { state } = useFieldColors(focused, style);

  const wire = (node: React.ReactNode): React.ReactNode =>
    React.Children.map(node, (child) => {
      if (!React.isValidElement(child)) return child;
      const el = child as React.ReactElement<any>;
      if (el.type === TextInput || el.type === TextField) {
        return React.cloneElement(el, {
          style: [el.props.style, noWebOutline],
          onFocus: (e: any) => {
            setFocused(true);
            el.props.onFocus?.(e);
          },
          onBlur: (e: any) => {
            setFocused(false);
            el.props.onBlur?.(e);
          },
        });
      }
      return child;
    });

  return (
    <View style={[styles.frame, style, state]} {...rest}>
      {wire(children)}
    </View>
  );
};

const styles = StyleSheet.create({
  field: {
    ...typography.body,
    fontFamily: fontFamilies.sansRegular,
    minHeight: FIELD_HEIGHT,
    borderWidth: 1,
    borderRadius: radius.button,
    paddingHorizontal: 14,
    paddingVertical: 0,
  },
  singleLine: {
    lineHeight: undefined,
  },
  multiline: {
    minHeight: FIELD_MULTILINE_MIN,
    paddingTop: 12,
    paddingBottom: 12,
  },
  frame: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: FIELD_HEIGHT,
    borderWidth: 1,
    borderRadius: radius.button,
    paddingHorizontal: 14,
  },
});
