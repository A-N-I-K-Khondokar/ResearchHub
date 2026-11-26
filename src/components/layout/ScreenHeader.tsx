import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { spacing, radius, typography } from '@/constants';
import { useTheme } from '@/context/ThemeContext';

export interface ScreenHeaderProps {
  title: string;
  /** Defaults to router.back(). */
  onBack?: () => void;
  /** Optional 44x44 action on the right (e.g. bookmark). */
  right?: React.ReactNode;
}

/**
 * Shared header for stacked detail screens (research detail, researcher
 * profile, saved items): back button, centred title, optional right action.
 */
export const ScreenHeader: React.FC<ScreenHeaderProps> = ({ title, onBack, right }) => {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <TouchableOpacity
        onPress={onBack ?? (() => router.back())}
        style={styles.iconSlot}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <ArrowLeft size={22} color={colors.textPrimary} />
      </TouchableOpacity>
      <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.iconSlot}>{right}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
  },
  iconSlot: {
    width: spacing.minTouchTarget,
    height: spacing.minTouchTarget,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.titleSmall,
    flex: 1,
    textAlign: 'center',
  },
});
