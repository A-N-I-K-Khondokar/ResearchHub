import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { ArrowRight, ChevronRight } from 'lucide-react-native';
import { spacing, radius, typography, fontFamilies } from '@/constants';
import { useTheme } from '@/context/ThemeContext';

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onActionPress?: () => void;
  indicatorColor?: string;
  badge?: {
    text: string;
    dotColor?: string;
  };
  style?: ViewStyle;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  actionLabel,
  onActionPress,
  indicatorColor,
  badge,
  style,
}) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, style]}>
      <View style={styles.leftRow}>
        {indicatorColor ? (
          <View style={[styles.indicator, { backgroundColor: indicatorColor }]} />
        ) : null}
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {indicatorColor ? title.toUpperCase() : title}
          </Text>
          {subtitle && (
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
          )}
        </View>
      </View>

      {badge ? (
        <View style={styles.badgeContainer}>
          <View
            style={[
              styles.badgeDot,
              { backgroundColor: badge.dotColor || colors.secondary },
            ]}
          />
          <Text style={[styles.badgeText, { color: colors.textSecondary }]}>
            {badge.text}
          </Text>
        </View>
      ) : actionLabel && onActionPress ? (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onActionPress}
          style={styles.actionButton}
        >
          <Text style={[styles.actionLabel, { color: colors.primary }]}>{actionLabel}</Text>
          <ArrowRight size={14} color={colors.primary} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm + 4,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  indicator: {
    width: 4,
    height: 18,
    borderRadius: radius.full,
    marginRight: spacing.sm,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontFamily: fontFamilies.sansBold,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  subtitle: {
    ...typography.subhead,
    marginTop: 2,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  badgeText: {
    fontSize: 12.5,
    fontFamily: fontFamilies.sansMedium,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingLeft: spacing.sm,
    gap: 4,
  },
  actionLabel: {
    fontSize: 13,
    fontFamily: fontFamilies.sansSemiBold,
    fontWeight: '600',
  },
});
