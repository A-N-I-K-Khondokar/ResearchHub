/**
 * src/components/layout/TabHeader.tsx
 *
 * The ONE header used by every bottom-tab screen, so Home, Explore, Share,
 * Notifications and Profile share the same height, safe-area spacing,
 * title style and divider.
 *
 *   <TabHeader title="Explore" />
 *   <TabHeader title="Notifications" accessory={<Badge/>} right={<MarkAll/>} />
 *   <TabHeader brand right={<SearchButton/>} />           // Home
 *   <TabHeader title="Explore"><SearchBar/></TabHeader>   // extra row below
 */

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GraduationCap } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { fontFamilies, radius, spacing, typography } from '@/constants';

export interface TabHeaderProps {
  title?: string;
  subtitle?: string;
  /** Brand variant (Home): app logo + "CSE Research Hub" + department. */
  brand?: boolean;
  /** Small element right after the title (e.g. "3 new" badge). */
  accessory?: React.ReactNode;
  /** Actions on the right (use HeaderIconButton). */
  right?: React.ReactNode;
  /** Optional row(s) under the title, e.g. a search bar or filter pills. */
  children?: React.ReactNode;
}

export const TabHeader: React.FC<TabHeaderProps> = ({ title, subtitle, brand, accessory, right, children }) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderBottomColor: colors.borderSubtle,
          paddingTop: insets.top + spacing.sm,
        },
      ]}
    >
      <View style={styles.row}>
        {brand ? (
          <View style={styles.brand}>
            <View style={[styles.logo, { backgroundColor: colors.primaryMuted, borderColor: colors.primaryLight }]}>
              <GraduationCap size={20} color={colors.primary} />
            </View>
            <View style={styles.titleCol}>
              <Text style={[styles.brandTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                {title ?? 'CSE Research Hub'}
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                {subtitle ?? 'Department of CSE'}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.titleCol}>
            <View style={styles.titleLine}>
              <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1} accessibilityRole="header">
                {title}
              </Text>
              {accessory}
            </View>
            {subtitle ? (
              <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        )}
        {right ? <View style={styles.actions}>{right}</View> : null}
      </View>
      {children ? <View style={styles.extra}>{children}</View> : null}
    </View>
  );
};

/** 40px round icon button used in headers (consistent hit area + hover). */
export const HeaderIconButton: React.FC<{
  icon: React.ReactNode;
  onPress: () => void;
  label: string;
  badge?: boolean;
}> = ({ icon, onPress, label, badge }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      hitSlop={6}
      style={[styles.iconBtn, { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderSubtle }]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {icon}
      {badge ? <View style={[styles.iconDot, { backgroundColor: colors.error, borderColor: colors.surface }]} /> : null}
    </TouchableOpacity>
  );
};

/** Pill badge to place after a title, e.g. "3 new". */
export const HeaderBadge: React.FC<{ label: string }> = ({ label }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.badge, { backgroundColor: colors.primaryMuted }]}>
      <Text style={[styles.badgeText, { color: colors.primary }]}>{label}</Text>
    </View>
  );
};

export const TAB_HEADER_ROW_HEIGHT = 48;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  row: {
    minHeight: TAB_HEADER_ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  brand: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minWidth: 0 },
  logo: { width: 40, height: 40, borderRadius: radius.button, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  brandTitle: { fontFamily: fontFamilies.sansBold, fontSize: 17, lineHeight: 22 },
  titleCol: { flex: 1, minWidth: 0 },
  titleLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { ...typography.display, fontSize: 26, lineHeight: 32, flexShrink: 1 },
  subtitle: { ...typography.caption, marginTop: 1 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  extra: { marginTop: spacing.sm },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconDot: { position: 'absolute', top: 6, right: 6, width: 10, height: 10, borderRadius: 5, borderWidth: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full },
  badgeText: { ...typography.micro, fontFamily: fontFamilies.sansSemiBold },
});
