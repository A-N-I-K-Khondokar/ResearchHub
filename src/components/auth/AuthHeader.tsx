import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { GraduationCap } from 'lucide-react-native';
import { colors, radius, spacing, typography } from '@/constants';

export interface AuthHeaderProps {
  title: string;
  subtitle?: string;
  showBadge?: boolean;
  style?: ViewStyle;
}

export const AuthHeader: React.FC<AuthHeaderProps> = ({
  title,
  subtitle,
  showBadge = true,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {showBadge && (
        <View style={styles.badgeContainer}>
          <View style={styles.iconCircle}>
            <GraduationCap size={28} color={colors.primary} />
          </View>
        </View>
      )}

      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  badgeContainer: {
    marginBottom: spacing.md,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: radius.md,
    backgroundColor: colors.primaryMuted,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.display,
    fontSize: 24,
    lineHeight: 32,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
  },
});
