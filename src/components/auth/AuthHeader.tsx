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
  const { colors, isDark } = useTheme();

  return (
    <View style={[styles.container, style]}>
      {showBadge && (
        <View style={styles.badgeContainer}>
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor: isDark ? '#152A54' : '#EEF3FD',
                borderColor: isDark ? '#244585' : '#D4E2FB',
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
    marginBottom: spacing.xl,
  },
  badgeContainer: {
    marginBottom: spacing.md,
  },
  iconCircle: {
    width: 58,
    height: 58,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: fontFamilies.serifBold,
    fontSize: 27,
    fontWeight: '700',
    lineHeight: 34,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 14.5,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.lg,
  },
});
