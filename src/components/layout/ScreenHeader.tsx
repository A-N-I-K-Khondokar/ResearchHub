import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { spacing, radius, typography, fontFamilies } from '@/constants';
import { useTheme } from '@/context/ThemeContext';

export interface ScreenHeaderProps {
  title: string;
  /** Optional second line, e.g. "12 researchers". */
  subtitle?: string;
  /** Defaults to router.back(). */
  onBack?: () => void;
  /** Optional action(s) on the right — one or two 44px icon buttons. */
  right?: React.ReactNode;
}

/**
 * Shared header for stacked (inner) screens: back button, left-aligned title
 * (+ optional subtitle) and up to two actions. Sits below the status bar —
 * screens wrap it in a top-edge SafeAreaView.
 */
export const ScreenHeader: React.FC<ScreenHeaderProps> = ({ title, subtitle, onBack, right }) => {
  const router = useRouter();
  const { colors } = useTheme();

  const goBack = () => {
    if (onBack) return onBack();
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)' as any);
  };

  return (
    <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.borderSubtle }]}>
      <TouchableOpacity
        onPress={goBack}
        style={[styles.back, { backgroundColor: colors.surfaceSubtle }]}
        hitSlop={4}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <ArrowLeft size={20} color={colors.textPrimary} />
      </TouchableOpacity>
      <View style={styles.titleCol}>
        <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1} accessibilityRole="header">
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ? <View style={styles.actions}>{right}</View> : null}
    </View>
  );
};

/** Matching 40px icon button for the right side of ScreenHeader. */
export const ScreenHeaderAction: React.FC<{ icon: React.ReactNode; onPress: () => void; label: string }> = ({
  icon,
  onPress,
  label,
}) => (
  <TouchableOpacity
    onPress={onPress}
    hitSlop={4}
    style={styles.action}
    accessibilityRole="button"
    accessibilityLabel={label}
  >
    {icon}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 56,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleCol: { flex: 1, minWidth: 0 },
  title: {
    ...typography.titleSmall,
    fontSize: 17,
    lineHeight: 22,
    fontFamily: fontFamilies.sansSemiBold,
  },
  subtitle: { ...typography.caption },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  action: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
