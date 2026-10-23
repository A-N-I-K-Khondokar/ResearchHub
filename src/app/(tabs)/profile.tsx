import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  Settings,
  Edit3,
  GraduationCap,
  Check,
  Users,
  Layers,
  BookOpen,
  FileText,
  ArrowUpRight,
  ExternalLink,
  Globe,
  Code2,
  Sun,
  Moon,
  Smartphone,
  X,
} from 'lucide-react-native';
import { spacing, radius, typography, fontFamilies } from '@/constants';
import { useTheme, ThemeMode } from '@/context/ThemeContext';
import { Avatar } from '@/components/common/Avatar';
import { ANIK_PHOTO_URI } from '@/data/avatars';

export default function ProfileTab() {
  const { colors, themeMode, isDark, setThemeMode } = useTheme();
  const insets = useSafeAreaInsets();

  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false);

  // Theme Picker Options
  const themeOptions: { mode: ThemeMode; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      mode: 'light',
      label: 'Light',
      icon: <Sun size={18} color={themeMode === 'light' ? '#FFFFFF' : colors.textPrimary} />,
      desc: 'Crisp Scholarly',
    },
    {
      mode: 'dark',
      label: 'Dark',
      icon: <Moon size={18} color={themeMode === 'dark' ? '#FFFFFF' : colors.textPrimary} />,
      desc: 'Deep Slate Navy',
    },
    {
      mode: 'system',
      label: 'System',
      icon: <Smartphone size={18} color={themeMode === 'system' ? '#FFFFFF' : colors.textPrimary} />,
      desc: 'Auto Sync',
    },
  ];

  const handleOpenLink = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Link Error', `Unable to open: ${url}`);
    });
  };

  const academicLinks = [
    {
      id: 'scholar',
      name: 'Google Scholar',
      url: 'https://scholar.google.com',
      icon: <GraduationCap size={18} color={colors.primary} strokeWidth={2} />,
    },
    {
      id: 'researchgate',
      name: 'ResearchGate',
      url: 'https://www.researchgate.net',
      icon: <Globe size={18} color={colors.primary} strokeWidth={2} />,
    },
    {
      id: 'github',
      name: 'GitHub',
      url: 'https://github.com',
      icon: <Code2 size={18} color={colors.primary} strokeWidth={2} />,
    },
    {
      id: 'orcid',
      name: 'ORCID',
      url: 'https://orcid.org',
      icon: <ExternalLink size={18} color={colors.primary} strokeWidth={2} />,
    },
  ];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top + 16, // CRITICAL: Standardized Top Clearance
        },
      ]}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={colors.background} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 }]} // CRITICAL: Tab Bar Clearance
        showsVerticalScrollIndicator={false}
      >
        {/* ======================================================== */}
        {/* TOP BAR / SCREEN HEADER                                  */}
        {/* ======================================================== */}
        <View style={styles.topBar}>
          <Text style={[styles.screenTitle, { color: colors.textPrimary }]}>
            Profile
          </Text>
        </View>

        {/* ======================================================== */}
        {/* SECTION 1: THE HERO CARD                                 */}
        {/* ======================================================== */}
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.borderSubtle,
            },
          ]}
        >
          {/* Top Row: Avatar (with Verified Badge) + Info */}
          <View style={styles.heroTopRow}>
            {/* Avatar Column with Fixed FlexShrink */}
            <View style={styles.avatarContainer}>
              <Avatar
                name="Anik Khondokar"
                uri={ANIK_PHOTO_URI}
                size="xl"
                style={styles.avatarImage}
              />
              {/* Verified Badge */}
              <View
                style={[
                  styles.verifiedBadge,
                  {
                    backgroundColor: colors.primary,
                    borderColor: colors.surface,
                  },
                ]}
              >
                <Check size={11} color="#FFFFFF" strokeWidth={3} />
              </View>
            </View>

            {/* Info Column with Text Wrap */}
            <View style={styles.heroInfoColumn}>
              <Text
                style={[styles.heroName, { color: colors.textPrimary }]}
                numberOfLines={1}
              >
                Anik Khondokar
              </Text>

              <View style={styles.credentialsRow}>
                <GraduationCap
                  size={14}
                  color={colors.textSecondary}
                  strokeWidth={2}
                  style={styles.credentialsIcon}
                />
                <Text
                  style={[styles.credentialsText, { color: colors.textSecondary }]}
                  numberOfLines={2}
                >
                  CSE • Batch 14 • Dept of CS & Engineering
                </Text>
              </View>

              <Text
                style={[styles.bioText, { color: colors.textSecondary }]}
                numberOfLines={3}
              >
                Focusing on applied machine learning and computer vision with an emphasis on low-resource Bangla NLP.
              </Text>
            </View>
          </View>

          {/* Middle Row: Self-Profile Action Buttons */}
          <View style={styles.heroActionRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() =>
                Alert.alert(
                  'Edit Profile',
                  'Profile editing form is ready. Bio, credentials, and research interests can be updated.'
                )
              }
              style={[
                styles.editProfileButton,
                {
                  borderColor: colors.borderSubtle,
                  backgroundColor: colors.surfaceSubtle,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Edit Profile"
            >
              <Edit3 size={15} color={colors.textPrimary} strokeWidth={2} />
              <Text style={[styles.editProfileText, { color: colors.textPrimary }]}>
                Edit Profile
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setIsSettingsModalVisible(true)}
              style={[
                styles.settingsButton,
                {
                  borderColor: colors.borderSubtle,
                  backgroundColor: colors.surfaceSubtle,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Open settings and theme options"
            >
              <Settings size={20} color={colors.textSecondary} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {/* Bottom Row: Stats Strip */}
          <View
            style={[
              styles.statsStrip,
              { borderTopColor: colors.borderSubtle },
            ]}
          >
            <View style={styles.statColumn}>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                148
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Connections
              </Text>
            </View>

            <View
              style={[
                styles.statDivider,
                { backgroundColor: colors.borderSubtle },
              ]}
            />

            <View style={styles.statColumn}>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                6
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Publications
              </Text>
            </View>

            <View
              style={[
                styles.statDivider,
                { backgroundColor: colors.borderSubtle },
              ]}
            />

            <View style={styles.statColumn}>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                4
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Open Projects
              </Text>
            </View>
          </View>
        </View>

        {/* ======================================================== */}
        {/* SECTION 2: INTERESTS / TOPIC PILLS                       */}
        {/* ======================================================== */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>
            Research Interests
          </Text>
          <View style={styles.topicPillsRow}>
            {['#MachineLearning', '#ComputerVision', '#BengaliNLP', '#DeepLearning', '#EdgeAI'].map(
              (topic) => (
                <View
                  key={topic}
                  style={[
                    styles.topicChip,
                    {
                      backgroundColor: colors.surfaceSubtle,
                      borderColor: colors.borderSubtle,
                    },
                  ]}
                >
                  <Text style={[styles.topicChipText, { color: colors.primary }]}>
                    {topic}
                  </Text>
                </View>
              )
            )}
          </View>
        </View>

        {/* ======================================================== */}
        {/* SECTION 3: CURRENTLY WORKING ON                          */}
        {/* ======================================================== */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>
            Currently Working On
          </Text>

          <View
            style={[
              styles.projectCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderSubtle,
              },
            ]}
          >
            {/* Card Header: Title + Active Status Pill */}
            <View style={styles.projectHeaderRow}>
              <Text
                style={[styles.projectTitle, { color: colors.textPrimary }]}
                numberOfLines={2}
              >
                Bengali Handwritten Character Recognition
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: colors.primaryMuted,
                  },
                ]}
              >
                <View
                  style={[
                    styles.statusIndicatorDot,
                    { backgroundColor: colors.primary },
                  ]}
                />
                <Text
                  style={[styles.statusBadgeText, { color: colors.primary }]}
                >
                  Active Project
                </Text>
              </View>
            </View>

            {/* Project Overview */}
            <Text
              style={[styles.projectDescription, { color: colors.textSecondary }]}
            >
              Developing a specialized vision transformer with patch-level feature extraction for degraded historical manuscript OCR and multilingual character classification.
            </Text>

            {/* Bottom Row: Collaborators & Stage Metadata */}
            <View
              style={[
                styles.projectFooterRow,
                { borderTopColor: colors.borderSubtle },
              ]}
            >
              <View style={styles.projectMetaItem}>
                <Users size={14} color={colors.textSecondary} strokeWidth={2} />
                <Text
                  style={[styles.projectMetaText, { color: colors.textSecondary }]}
                >
                  3 Collaborators
                </Text>
              </View>

              <View style={styles.projectMetaItem}>
                <Layers size={14} color={colors.textSecondary} strokeWidth={2} />
                <Text
                  style={[styles.projectMetaText, { color: colors.textSecondary }]}
                >
                  Dataset Prep
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ======================================================== */}
        {/* SECTION 4: RESEARCH & PUBLICATIONS                      */}
        {/* ======================================================== */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>
            Research & Publications
          </Text>

          <View style={styles.publicationsList}>
            {/* Publication Item 1 */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() =>
                handleOpenLink('https://ieeexplore.ieee.org/document/10234')
              }
              style={[
                styles.publicationItemCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.borderSubtle,
                },
              ]}
            >
              <View
                style={[
                  styles.pubIconBox,
                  { backgroundColor: colors.primaryMuted },
                ]}
              >
                <BookOpen size={18} color={colors.primary} strokeWidth={2.2} />
              </View>

              <View style={styles.pubInfoColumn}>
                <Text
                  style={[styles.pubTitle, { color: colors.textPrimary }]}
                  numberOfLines={2}
                >
                  Evaluating Transformer Architectures for Bengali Optical Character Recognition
                </Text>
                <Text
                  style={[styles.pubSubtitle, { color: colors.textSecondary }]}
                >
                  Conference Paper • 2025 • IEEE ICDAR
                </Text>
              </View>

              <ArrowUpRight
                size={16}
                color={colors.textMuted}
                strokeWidth={2}
                style={styles.pubLinkArrow}
              />
            </TouchableOpacity>

            {/* Publication Item 2 */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() =>
                handleOpenLink('https://dl.acm.org/doi/10.1145/3678120')
              }
              style={[
                styles.publicationItemCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.borderSubtle,
                },
              ]}
            >
              <View
                style={[
                  styles.pubIconBox,
                  { backgroundColor: colors.primaryMuted },
                ]}
              >
                <FileText size={18} color={colors.primary} strokeWidth={2.2} />
              </View>

              <View style={styles.pubInfoColumn}>
                <Text
                  style={[styles.pubTitle, { color: colors.textPrimary }]}
                  numberOfLines={2}
                >
                  Quantization Strategies for Low-Power NLP Models in Regional Dialect Processing
                </Text>
                <Text
                  style={[styles.pubSubtitle, { color: colors.textSecondary }]}
                >
                  Journal Article • 2025 • ACM TALIP
                </Text>
              </View>

              <ArrowUpRight
                size={16}
                color={colors.textMuted}
                strokeWidth={2}
                style={styles.pubLinkArrow}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* ======================================================== */}
        {/* SECTION 5: ACADEMIC LINKS (UNIFIED VERTICAL CARD)        */}
        {/* ======================================================== */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>
            Academic Links
          </Text>

          <View
            style={[
              styles.academicLinksCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderSubtle,
              },
            ]}
          >
            {academicLinks.map((link, index) => {
              const isLast = index === academicLinks.length - 1;
              return (
                <TouchableOpacity
                  key={link.id}
                  activeOpacity={0.7}
                  onPress={() => handleOpenLink(link.url)}
                  style={[
                    styles.linkRow,
                    !isLast && {
                      borderBottomWidth: 1,
                      borderBottomColor: colors.borderSubtle,
                    },
                  ]}
                  accessibilityRole="link"
                  accessibilityLabel={`Open ${link.name}`}
                >
                  <View style={styles.linkIconWrapper}>{link.icon}</View>
                  <Text
                    style={[styles.linkLabel, { color: colors.textPrimary }]}
                  >
                    {link.name}
                  </Text>
                  <ExternalLink
                    size={16}
                    color={colors.textMuted}
                    strokeWidth={2}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* ======================================================== */}
      {/* SETTINGS & THEME MODAL                                   */}
      {/* ======================================================== */}
      <Modal
        visible={isSettingsModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsSettingsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderSubtle,
              },
            ]}
          >
            {/* Modal Header */}
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                  Appearance & Settings
                </Text>
                <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                  CSE Research Hub Preferences
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsSettingsModalVisible(false)}
                style={[styles.modalCloseBtn, { backgroundColor: colors.surfaceSubtle }]}
                accessibilityRole="button"
                accessibilityLabel="Close settings modal"
              >
                <X size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Theme Picker Grid */}
            <Text style={[styles.modalSectionLabel, { color: colors.textPrimary }]}>
              Theme Mode
            </Text>
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
                        borderColor: isSelected ? colors.primary : colors.borderSubtle,
                      },
                    ]}
                  >
                    <View style={styles.themeIconBox}>{opt.icon}</View>
                    <Text
                      style={[
                        styles.themeOptionTitle,
                        { color: isSelected ? '#FFFFFF' : colors.textPrimary },
                      ]}
                    >
                      {opt.label}
                    </Text>
                    <Text
                      style={[
                        styles.themeOptionDesc,
                        { color: isSelected ? '#FFFFFF' : colors.textMuted },
                      ]}
                    >
                      {opt.desc}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Done Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setIsSettingsModalVisible(false)}
              style={[
                styles.modalDoneBtn,
                { backgroundColor: colors.primary },
              ]}
            >
              <Check size={16} color="#FFFFFF" strokeWidth={2.4} />
              <Text style={styles.modalDoneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.screenHorizontal,
  },

  // Top Bar
  topBar: {
    marginBottom: spacing.md,
  },
  screenTitle: {
    ...typography.display,
    fontSize: 28,
    lineHeight: 34,
    fontFamily: fontFamilies.serifBold,
  },

  // Section 1: Hero Card
  heroCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  avatarContainer: {
    position: 'relative',
    flexShrink: 0, // CRITICAL: mobile-first flexbox fix to preserve circular avatar
    width: 88,
    height: 88,
  },
  avatarImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroInfoColumn: {
    flex: 1,
    flexShrink: 1, // CRITICAL: text wraps cleanly without pushing the avatar
  },
  heroName: {
    fontSize: 24,
    lineHeight: 30,
    fontFamily: fontFamilies.serifBold,
  },
  credentialsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  credentialsIcon: {
    marginRight: 5,
    flexShrink: 0,
  },
  credentialsText: {
    fontSize: 14,
    fontFamily: fontFamilies.sansMedium,
    lineHeight: 20,
    flex: 1,
  },
  bioText: {
    fontSize: 14,
    fontFamily: fontFamilies.sansRegular,
    lineHeight: 20,
    marginTop: 6,
  },

  // Hero Self-Profile Actions
  heroActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
  },
  editProfileButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  editProfileText: {
    fontSize: 14,
    fontFamily: fontFamilies.sansSemiBold,
  },
  settingsButton: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Hero Stats Strip (Bottom Row)
  statsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 14,
  },
  statColumn: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 17,
    fontFamily: fontFamilies.sansBold,
    lineHeight: 22,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: fontFamilies.sansMedium,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
  },

  // Section Headers
  sectionContainer: {
    marginBottom: spacing.lg,
  },
  sectionHeading: {
    fontSize: 18,
    fontFamily: fontFamilies.serifBold,
    lineHeight: 24,
    marginBottom: 10,
  },

  // Section 2: Interests / Topic Chips
  topicPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  topicChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  topicChipText: {
    fontSize: 12.5,
    fontFamily: fontFamilies.sansMedium,
    letterSpacing: 0.1,
  },

  // Section 3: Currently Working On
  projectCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: spacing.md,
  },
  projectHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  projectTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: fontFamilies.sansSemiBold,
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    flexShrink: 0,
  },
  statusIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgeText: {
    fontSize: 11,
    fontFamily: fontFamilies.sansSemiBold,
    letterSpacing: 0.2,
  },
  projectDescription: {
    fontSize: 14,
    fontFamily: fontFamilies.sansRegular,
    lineHeight: 20,
    marginVertical: 10,
  },
  projectFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderTopWidth: 1,
    paddingTop: 10,
  },
  projectMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  projectMetaText: {
    fontSize: 12.5,
    fontFamily: fontFamilies.sansMedium,
  },

  // Section 4: Research & Publications
  publicationsList: {
    gap: 10,
  },
  publicationItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 12,
  },
  pubIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  pubInfoColumn: {
    flex: 1,
  },
  pubTitle: {
    fontSize: 14.5,
    fontFamily: fontFamilies.sansSemiBold,
    lineHeight: 20,
  },
  pubSubtitle: {
    fontSize: 12,
    fontFamily: fontFamilies.sansRegular,
    marginTop: 3,
  },
  pubLinkArrow: {
    flexShrink: 0,
  },

  // Section 5: Academic Links (Unified Vertical Card)
  academicLinksCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  linkIconWrapper: {
    marginRight: 12,
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkLabel: {
    fontSize: 14,
    fontFamily: fontFamilies.sansMedium,
    flex: 1,
  },

  // Settings Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  modalCard: {
    width: '100%',
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  modalTitle: {
    ...typography.title,
    fontSize: 18,
    fontFamily: fontFamilies.sansBold,
  },
  modalSubtitle: {
    fontSize: 12,
    fontFamily: fontFamilies.sansRegular,
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSectionLabel: {
    fontSize: 13,
    fontFamily: fontFamilies.sansSemiBold,
    marginBottom: spacing.sm,
  },
  themeOptionsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  themeOptionBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: 4,
    borderRadius: radius.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeIconBox: {
    marginBottom: 6,
  },
  themeOptionTitle: {
    fontSize: 12,
    fontFamily: fontFamilies.sansSemiBold,
  },
  themeOptionDesc: {
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
    fontFamily: fontFamilies.sansRegular,
  },
  modalDoneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: radius.full,
  },
  modalDoneBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: fontFamilies.sansSemiBold,
  },
});
