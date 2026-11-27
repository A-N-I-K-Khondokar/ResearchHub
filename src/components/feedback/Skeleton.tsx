/**
 * src/components/feedback/Skeleton.tsx
 *
 * Pulsing placeholder shapes shown while live Firestore data loads, so screens
 * keep their layout instead of showing a lone spinner.
 */

import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, View, type DimensionValue, type ViewStyle } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { radius, spacing } from '@/constants';

export const Skeleton: React.FC<{
  width?: DimensionValue;
  height?: number;
  rounded?: number;
  style?: ViewStyle;
}> = ({ width = '100%', height = 14, rounded = radius.sm, style }) => {
  const { colors } = useTheme();
  const pulse = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(pulse, { toValue: 0.45, duration: 700, useNativeDriver: Platform.OS !== 'web' }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[{ width, height, borderRadius: rounded, backgroundColor: colors.surfaceSubtle, opacity: pulse }, style]}
    />
  );
};

/** Placeholder shaped like a CurrentWorkCard. */
export const WorkCardSkeleton: React.FC = () => {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
      <View style={styles.row}>
        <Skeleton width={44} height={44} rounded={22} />
        <View style={styles.flex}>
          <Skeleton width="55%" height={14} />
          <Skeleton width="35%" height={12} style={styles.gapTop} />
        </View>
      </View>
      <Skeleton width="85%" height={18} style={styles.gapTopLg} />
      <Skeleton width="100%" height={12} style={styles.gapTop} />
      <Skeleton width="70%" height={12} style={styles.gapTop} />
      <View style={[styles.row, styles.gapTopLg]}>
        <Skeleton width={90} height={24} rounded={radius.full} />
        <Skeleton width={70} height={24} rounded={radius.full} />
      </View>
    </View>
  );
};

/** Placeholder shaped like a ResearcherCard / list row. */
export const RowSkeleton: React.FC = () => {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, styles.row, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
      <Skeleton width={40} height={40} rounded={20} />
      <View style={styles.flex}>
        <Skeleton width="60%" height={14} />
        <Skeleton width="40%" height={12} style={styles.gapTop} />
      </View>
    </View>
  );
};

/** Several placeholders stacked. */
export const SkeletonList: React.FC<{ count?: number; variant?: 'work' | 'row' }> = ({
  count = 3,
  variant = 'work',
}) => (
  <View>
    {Array.from({ length: count }, (_, i) => (variant === 'work' ? <WorkCardSkeleton key={i} /> : <RowSkeleton key={i} />))}
  </View>
);

const styles = StyleSheet.create({
  page: {
    padding: spacing.md,
  },
  center: {
    alignItems: 'center',
  },
  card: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  flex: {
    flex: 1,
  },
  gapTop: {
    marginTop: 6,
  },
  gapTopLg: {
    marginTop: spacing.md,
  },
});

/** Placeholder shaped like a researcher profile (hero + rows). */
export const ProfileSkeleton: React.FC = () => {
  const { colors } = useTheme();
  return (
    <View style={styles.page}>
      <View style={[styles.card, styles.center, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
        <Skeleton width={88} height={88} rounded={44} />
        <Skeleton width="50%" height={20} style={styles.gapTopLg} />
        <Skeleton width="70%" height={12} style={styles.gapTop} />
        <Skeleton width="100%" height={44} rounded={radius.button} style={styles.gapTopLg} />
      </View>
      <SkeletonList count={2} variant="row" />
    </View>
  );
};

/** Placeholder shaped like the research detail screen. */
export const DetailSkeleton: React.FC = () => {
  const { colors } = useTheme();
  return (
    <View style={styles.page}>
      {/* status line */}
      <Skeleton width={36} height={4} rounded={2} />
      <View style={[styles.row, styles.gapTop]}>
        <Skeleton width={110} height={26} rounded={radius.full} />
        <Skeleton width={64} height={26} rounded={radius.full} />
        <Skeleton width={50} height={12} />
      </View>
      {/* title */}
      <Skeleton width="92%" height={26} style={styles.gapTopLg} />
      <Skeleton width="58%" height={26} style={styles.gapTop} />
      {/* author */}
      <View style={[styles.row, styles.gapTopLg]}>
        <Skeleton width={32} height={32} rounded={16} />
        <View style={styles.flex}>
          <Skeleton width="45%" height={13} />
          <Skeleton width="65%" height={11} style={styles.gapTop} />
        </View>
        <Skeleton width={84} height={32} rounded={radius.full} />
      </View>
      {/* stage progress */}
      <View style={[styles.card, styles.gapTopLg, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
        <Skeleton width="40%" height={12} />
        <View style={[styles.row, styles.gapTop]}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={styles.flex}>
              <Skeleton width="100%" height={6} rounded={radius.full} />
            </View>
          ))}
        </View>
      </View>
      {/* about */}
      <Skeleton width="45%" height={16} style={styles.gapTopLg} />
      <Skeleton width="100%" height={12} style={styles.gapTop} />
      <Skeleton width="96%" height={12} style={styles.gapTop} />
      <Skeleton width="88%" height={12} style={styles.gapTop} />
      <Skeleton width="62%" height={12} style={styles.gapTop} />
      <View style={[styles.row, styles.gapTopLg]}>
        <Skeleton width={90} height={28} rounded={radius.full} />
        <Skeleton width={70} height={28} rounded={radius.full} />
        <Skeleton width={100} height={28} rounded={radius.full} />
      </View>
    </View>
  );
};
