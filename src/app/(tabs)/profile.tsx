import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Sun, Moon, Smartphone, Sparkles, BookOpen, Users, Compass, Layers } from 'lucide-react-native';
import { spacing, radius, typography, fontFamilies, shadows } from '@/constants';
import { useTheme, ThemeMode } from '@/context/ThemeContext';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Avatar } from '@/components/common/Avatar';
import { activeUser } from '@/data/researchers';

export default function ProfileTab() {
  const { colors, themeMode, isDark, setThemeMode } = useTheme();

  const themeOptions: { mode: ThemeMode; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      mode: 'light',
      label: 'Light',
      icon: <Sun size={18} color={themeMode === 'light' ? colors.textInverse : colors.textPrimary} />,
      desc: 'Crisp Scholarly',
    },
    {
      mode: 'dark',
      label: 'Dark',
      icon: <Moon size={18} color={themeMode === 'dark' ? colors.textInverse : colors.textPrimary} />,
      desc: 'Deep Slate Navy',
    },
    {
      mode: 'system',
      label: 'System',
      icon: <Smartphone size={18} color={themeMode === 'system' ? colors.textInverse : colors.textPrimary} />,
      desc: 'Auto Sync',
    },
  ];

  return (
    <ScreenContainer scrollable statusBarStyle={isDark ? 'light' : 'dark'}>
      {/* User Header Profile Card */}
      <View
        style={[
          styles.profileCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        <Avatar name={activeUser.name} uri={activeUser.photoURL} size="xl" />
        <Text style={[styles.userName, { color: colors.textPrimary }]}>{activeUser.name}</Text>
        <Text style={[styles.userRole, { color: colors.primary }]}>{activeUser.designation}</Text>
        <Text style={[styles.userDept, { color: colors.textSecondary }]}>
          {activeUser.department} • {activeUser.batch}
        </Text>
        <Text style={[styles.userBio, { color: colors.textSecondary }]}>{activeUser.bio}</Text>

        {/* Quick Stats Grid */}
        <View style={[styles.statsRow, { borderTopColor: colors.borderSubtle }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.textPrimary }]}>{activeUser.connectionsCount}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Connections</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.textPrimary }]}>{activeUser.currentWorkCount}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Works</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.textPrimary }]}>{activeUser.publicationsCount}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Publications</Text>
          </View>
        </View>
      </View>

      {/* Appearance & Theme Section */}
      <View
        style={[
          styles.sectionCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.sectionHeaderRow}>
          <View style={[styles.sectionIconWrap, { backgroundColor: colors.primaryMuted }]}>
            {isDark ? <Moon size={18} color={colors.primary} /> : <Sun size={18} color={colors.primary} />}
          </View>
          <View style={styles.sectionHeaderInfo}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Appearance & Theme</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
              Current: {isDark ? 'Dark Mode' : 'Light Mode'} ({themeMode})
            </Text>
          </View>
        </View>

        {/* Segmented Theme Picker */}
        <View style={styles.themeOptionsGrid}>
          {themeOptions.map((opt) => {
            const isSelected = themeMode === opt.mode;
            return (
              <TouchableOpacity
                key={opt.mode}
                activeOpacity={0.8}
                onPress={() => setThemeMode(opt.mode)}
                style={[
                  styles.themeOptionBtn,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.surfaceSubtle,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
              >
                <View style={styles.themeIconBox}>{opt.icon}</View>
                <Text
                  style={[
                    styles.themeOptionTitle,
                    { color: isSelected ? colors.textInverse : colors.textPrimary },
                  ]}
                >
                  {opt.label}
                </Text>
                <Text
                  style={[
                    styles.themeOptionDesc,
                    { color: isSelected ? colors.primaryLight : colors.textMuted },
                  ]}
                >
                  {opt.desc}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Research Areas / Interests */}
      <View
        style={[
          styles.sectionCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.subSectionTitle, { color: colors.textPrimary }]}>Research Interests</Text>
        <View style={styles.interestsRow}>
          {activeUser.interests.map((item, idx) => (
            <View
              key={`${item}-${idx}`}
              style={[
                styles.interestBadge,
                {
                  backgroundColor: colors.surfaceSubtle,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={[styles.interestText, { color: colors.primary }]}>{item}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
    marginTop: spacing.sm,
    ...shadows.card,
  },
  userName: {
    ...typography.headlineSmall,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  userRole: {
    ...typography.subhead,
    fontFamily: fontFamilies.sansSemiBold,
    marginTop: 2,
  },
  userDept: {
    ...typography.caption,
    marginTop: 2,
  },
  userBio: {
    ...typography.bodySmall,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 18,
    paddingHorizontal: spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    borderTopWidth: 1,
    paddingTop: spacing.md,
    marginTop: spacing.md,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 24,
  },
  statNumber: {
    ...typography.title,
    fontWeight: '700',
  },
  statLabel: {
    ...typography.caption,
    fontSize: 11,
    marginTop: 2,
  },
  sectionCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.subtle,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  sectionHeaderInfo: {
    flex: 1,
  },
  sectionTitle: {
    ...typography.titleSmall,
  },
  sectionSubtitle: {
    ...typography.caption,
    marginTop: 1,
  },
  themeOptionsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  themeOptionBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeIconBox: {
    marginBottom: 4,
  },
  themeOptionTitle: {
    ...typography.caption,
    fontFamily: fontFamilies.sansBold,
    fontSize: 12,
  },
  themeOptionDesc: {
    fontSize: 10,
    marginTop: 2,
  },
  subSectionTitle: {
    ...typography.titleSmall,
    marginBottom: spacing.sm,
  },
  interestsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  interestBadge: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  interestText: {
    ...typography.caption,
    fontFamily: fontFamilies.sansMedium,
  },
});
