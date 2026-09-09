import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { GraduationCap } from 'lucide-react-native';
import { radius, spacing, typography, fontFamilies } from '@/constants';
import { useTheme } from '@/context/ThemeContext';

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
                // Removed border for a cleaner, modern look
              },
            ]}
          >
            <GraduationCap size={30} color={colors.primary} />
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
    marginBottom: spacing.xl, // slightly more breathing room
  },
  badgeContainer: {
    marginBottom: spacing.md + 4,
  },
  iconCircle: {
    width: 64, // refined proportion
    height: 64,
    borderRadius: radius.xl, // softer, modern squircle shape
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.display,
    fontFamily: fontFamilies.serifBold, // Reinforce scholarly typography
    fontSize: 26, // improved hierarchy
    lineHeight: 34,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitle: {
    ...typography.body,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
  },
});
