import React from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextInputProps,
} from 'react-native';
import { Search, X, SlidersHorizontal } from 'lucide-react-native';
import { radius, spacing, typography } from '@/constants';
import { useTheme } from '@/context/ThemeContext';
import { FieldFrame } from './TextField';

export interface SearchBarProps extends Omit<TextInputProps, 'style'> {
  value: string;
  onChangeText: (text: string) => void;
  onClear?: () => void;
  onFilterPress?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  style?: ViewStyle;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  onClear,
  onFilterPress,
  placeholder = 'Search researchers, topics, or papers...',
  autoFocus = false,
  style,
  ...rest
}) => {
  const { colors } = useTheme();

  const handleClear = () => {
    onChangeText('');
    if (onClear) {
      onClear();
    }
  };

  return (
    <FieldFrame
      style={[
        styles.container,
        {
          backgroundColor: colors.surfaceSubtle,
          borderColor: colors.borderSubtle,
        },
        style,
      ]}
    >
      <Search size={18} color={colors.textMuted} style={styles.searchIcon} />

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        autoFocus={autoFocus}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        selectionColor={colors.primary}
        cursorColor={colors.primary}
        accessibilityLabel={placeholder}
        style={[styles.input, { color: colors.textPrimary }]}
        {...rest}
      />

      {value.length > 0 && (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleClear}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
        >
          <X size={16} color={colors.textSecondary} />
        </TouchableOpacity>
      )}

      {onFilterPress && (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onFilterPress}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={[styles.iconButton, styles.filterButton, { borderLeftColor: colors.border }]}
          accessibilityRole="button"
          accessibilityLabel="Filters"
        >
          <SlidersHorizontal size={16} color={colors.primary} />
        </TouchableOpacity>
      )}
    </FieldFrame>
  );
};

const styles = StyleSheet.create({
  container: {
    height: spacing.inputHeight,
  },
  searchIcon: {
    marginRight: spacing.sm,
    flexShrink: 0,
  },
  input: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    height: '100%',
    ...typography.body,
    paddingVertical: 0,
  },
  iconButton: {
    padding: spacing.xs,
    marginLeft: spacing.xs,
    flexShrink: 0,
  },
  filterButton: {
    borderLeftWidth: 1,
    paddingLeft: spacing.sm,
    flexShrink: 0,
  },
});
