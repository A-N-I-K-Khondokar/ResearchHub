import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { GraduationCap } from 'lucide-react-native';
import { radius, spacing, typography } from '@/constants';
import { useTheme } from '@/hooks/useTheme';

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
  const { colors } = useTheme();

  return (
    <View style={[styles.container, style]}>
      {showBadge && (
        <View style={styles.badgeContainer}>
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor: colors.primaryMuted,
                borderColor: colors.border,
              },
            ]}
          >
            <GraduationCap size={28} color={colors.primary} />
          </View>
        </View>
      )}

      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {subtitle}
        </Text>
      ) : null}
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
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.display,
    fontSize: 24,
    lineHeight: 32,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
  },
});
