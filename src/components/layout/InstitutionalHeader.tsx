import React from 'react';
import { View, Text, StyleSheet, Pressable, StyleProp, ViewStyle } from 'react-native';
import { Sun, Moon, Search, GraduationCap } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing, radius, fontFamilies } from '@/constants';
import { useTheme } from '@/context/ThemeContext';

export interface InstitutionalHeaderProps {
  onSearchPress?: () => void;
  style?: StyleProp<ViewStyle>;
  title?: string;
  subtitle?: string;
  // Optional props preserved for backward compatibility
  userName?: string;
  userAvatar?: string | null;
  unreadNotificationsCount?: number;
  onAvatarPress?: () => void;
  onNotificationPress?: () => void;
}

export const InstitutionalHeader: React.FC<InstitutionalHeaderProps> = ({
  onSearchPress,
  style,
  title = 'CSE Research Hub',
  subtitle = 'Department of CSE',
}) => {
  const { colors, isDark, toggleTheme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.outerContainer,
        {
          backgroundColor: colors.surface,
          borderBottomColor: colors.borderSubtle,
          paddingTop: insets.top > 0 ? insets.top + 8 : 12,
        },
        style,
      ]}
    >
      <View style={styles.innerContainer}>
        {/* Left Side: Institutional App Branding */}
        <View style={styles.brandSection}>
          <View
            style={[
              styles.brandBadge,
              {
                backgroundColor: isDark ? 'rgba(37, 99, 235, 0.16)' : '#EFF6FF',
                borderColor: isDark ? 'rgba(37, 99, 235, 0.3)' : '#DBEAFE',
              },
            ]}
          >
            <GraduationCap size={20} color="#2563EB" strokeWidth={2.3} />
          </View>

          <View style={styles.brandTextContainer}>
            <Text
              style={[styles.brandTitle, { color: colors.textPrimary }]}
              numberOfLines={1}
            >
              {title}
            </Text>
            <Text
              style={[styles.brandSubtitle, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          </View>
        </View>

        {/* Right Side: Header Utility Actions (Theme toggle immediately before Search) */}
        <View style={styles.actionsSection}>
          {/* 1. Light/Dark Theme Toggle */}
          <Pressable
            onPress={toggleTheme}
            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            style={({ pressed, hovered }: any) => [
              styles.iconButton,
              {
                backgroundColor: hovered || pressed ? colors.borderSubtle : colors.surfaceSubtle,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Toggle Dark Mode"
          >
            {isDark ? (
              <Sun size={17} color={colors.accent} strokeWidth={2.1} />
            ) : (
              <Moon size={17} color={colors.textPrimary} strokeWidth={2.1} />
            )}
          </Pressable>

          {/* 2. Search Action (Rightmost action) */}
          <Pressable
            onPress={onSearchPress}
            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            style={({ pressed, hovered }: any) => [
              styles.iconButton,
              {
                backgroundColor: hovered || pressed ? colors.borderSubtle : colors.surfaceSubtle,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Search research and people"
          >
            <Search size={17} color={colors.textPrimary} strokeWidth={2.1} />
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    width: '100%',
    borderBottomWidth: 1,
  },
  innerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: 10,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  brandSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    marginRight: spacing.sm,
  },
  brandBadge: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    flexShrink: 0,
  },
  brandTextContainer: {
    flexShrink: 1,
    justifyContent: 'center',
  },
  brandTitle: {
    fontFamily: fontFamilies.sansBold,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  brandSubtitle: {
    fontFamily: fontFamilies.sansMedium,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  actionsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
});
