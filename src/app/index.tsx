import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Sparkles, CheckCircle2 } from 'lucide-react-native';
import {
  ScreenContainer,
  Avatar,
  Button,
  TopicChip,
  SearchBar,
  SectionHeader,
} from '@/components';
import { colors, spacing, radius, typography, shadows } from '@/constants';

export default function FoundationVerificationScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('Machine Learning');
  const [btnLoading, setBtnLoading] = useState(false);

  const handleButtonPress = () => {
    setBtnLoading(true);
    setTimeout(() => {
      setBtnLoading(false);
      Alert.alert(
        'Phase 1 Verified',
        'Foundation architecture, design tokens, and reusable components are working properly.'
      );
    }, 600);
  };

  return (
    <ScreenContainer scrollable>
      {/* Header Banner */}
      <View style={styles.header}>
        <View style={styles.badgeRow}>
          <View style={styles.statusPill}>
            <CheckCircle2 size={12} color={colors.secondaryDark} />
            <Text style={styles.statusPillText}>Phase 1 — Foundation Initialized</Text>
          </View>
        </View>
        <Text style={styles.appTitle}>CSE Research Hub</Text>
        <Text style={styles.subtitle}>
          Technical verification of base components, design tokens, and Expo Router.
        </Text>
      </View>

      {/* Component Verification Card */}
      <View style={styles.card}>
        <SectionHeader
          title="Base Components"
          subtitle="Tokens & Component Library Verification"
        />

        {/* Search Bar */}
        <View style={styles.section}>
          <Text style={styles.componentLabel}>1. Search Bar</Text>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search researchers, topics, papers..."
            onFilterPress={() => Alert.alert('Filter', 'Filter modal trigger works.')}
          />
        </View>

        {/* Topic Chips */}
        <View style={styles.section}>
          <Text style={styles.componentLabel}>2. Topic Chips (Categorical)</Text>
          <View style={styles.chipRow}>
            {['Machine Learning', 'Bangla NLP', 'Computer Vision', 'Security'].map((topic) => (
              <TopicChip
                key={topic}
                label={topic}
                selected={selectedTopic === topic}
                onPress={() => setSelectedTopic(topic)}
                variant={topic === 'Bangla NLP' ? 'teal' : 'default'}
              />
            ))}
          </View>
        </View>

        {/* Avatars */}
        <View style={styles.section}>
          <Text style={styles.componentLabel}>3. Researcher Avatars</Text>
          <View style={styles.avatarRow}>
            <Avatar name="Anik Khondokar" size="lg" badge />
            <Avatar name="Dr. Elena Rostova" size="md" />
            <Avatar name="Mou Tusi" size="sm" />
            <Avatar name="Tahmid Hasan" size="xs" />
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.section}>
          <Text style={styles.componentLabel}>4. Button Variants</Text>
          <View style={styles.buttonStack}>
            <Button
              label="Test Primary Action"
              onPress={handleButtonPress}
              variant="primary"
              loading={btnLoading}
              icon={<Sparkles size={16} color={colors.textInverse} />}
              fullWidth
            />
            <Button
              label="Secondary Outline Action"
              onPress={() => Alert.alert('Secondary', 'Secondary button clicked')}
              variant="outline"
              fullWidth
              style={styles.btnSecondary}
            />
          </View>
        </View>
      </View>

      {/* Design Tokens Reference Card */}
      <View style={[styles.card, styles.tokenCard]}>
        <SectionHeader title="Active Design Tokens" />
        <View style={styles.tokenGrid}>
          <View style={styles.tokenItem}>
            <View style={[styles.colorSwatch, { backgroundColor: colors.primary }]} />
            <Text style={styles.tokenText}>Primary</Text>
            <Text style={styles.tokenHex}>#3157C8</Text>
          </View>
          <View style={styles.tokenItem}>
            <View style={[styles.colorSwatch, { backgroundColor: colors.secondary }]} />
            <Text style={styles.tokenText}>Secondary</Text>
            <Text style={styles.tokenHex}>#159A9C</Text>
          </View>
          <View style={styles.tokenItem}>
            <View style={[styles.colorSwatch, { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }]} />
            <Text style={styles.tokenText}>Background</Text>
            <Text style={styles.tokenHex}>#F6F8FC</Text>
          </View>
          <View style={styles.tokenItem}>
            <View style={[styles.colorSwatch, { backgroundColor: colors.textPrimary }]} />
            <Text style={styles.tokenText}>Text</Text>
            <Text style={styles.tokenHex}>#172033</Text>
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingVertical: spacing.lg,
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondaryLight,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    gap: 4,
  },
  statusPillText: {
    ...typography.caption,
    color: colors.secondaryDark,
    fontWeight: '600',
  },
  appTitle: {
    ...typography.display,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.subhead,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.cardPadding,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  tokenCard: {
    marginTop: spacing.xs,
  },
  section: {
    marginTop: spacing.md,
  },
  componentLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  buttonStack: {
    gap: spacing.sm,
  },
  btnSecondary: {
    marginTop: spacing.xs,
  },
  tokenGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  tokenItem: {
    alignItems: 'center',
  },
  colorSwatch: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    marginBottom: spacing.xs,
  },
  tokenText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  tokenHex: {
    ...typography.caption,
    fontSize: 10,
    color: colors.textSecondary,
  },
});
