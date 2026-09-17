import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  Sparkles,
  PenLine,
  AlignLeft,
  Hash,
  Plus,
  X,
  Layers,
  Link2,
  Lightbulb,
  BookOpen,
  FlaskConical,
  PenTool,
} from 'lucide-react-native';
import { spacing, radius, fontFamilies } from '@/constants';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/common/Button';
import { SuccessModal } from '@/components/feedback/SuccessModal';

// Project progression stages with minimalist line-art vector icons
const RESEARCH_STAGES = [
  { id: 'Idea', label: 'Idea', icon: Lightbulb },
  { id: 'Literature Review', label: 'Literature Review', icon: BookOpen },
  { id: 'Experiment', label: 'Experiment', icon: FlaskConical },
  { id: 'Writing', label: 'Writing', icon: PenTool },
];

export default function ShareTab() {
  const { colors, isDark } = useTheme();

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [customTag, setCustomTag] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([
    '#MachineLearning',
    '#BanglaNLP',
  ]);
  const [selectedStage, setSelectedStage] = useState('Experiment');
  const [externalUrl, setExternalUrl] = useState('');

  // UI / Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [titleError, setTitleError] = useState('');
  const [descError, setDescError] = useState('');

  // Add Tag Logic (handles Enter, Comma, or Add Button)
  const handleAddTag = (rawText?: string) => {
    const textToAdd = rawText !== undefined ? rawText : customTag;
    if (!textToAdd.trim()) return;

    // Split by comma in case user typed "NLP, Vision"
    const tokens = textToAdd
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    let updated = [...selectedTags];
    tokens.forEach((token) => {
      // Strip existing # or leading symbols and format into clean camel/alphanumeric tag
      const cleaned = token.replace(/^[#\s]+/, '').trim();
      if (!cleaned) return;
      const formatted = `#${cleaned.replace(/\s+/g, '')}`;

      // Avoid duplicates (case-insensitive)
      if (!updated.some((t) => t.toLowerCase() === formatted.toLowerCase())) {
        updated.push(formatted);
      }
    });

    setSelectedTags(updated);
    setCustomTag('');
  };

  // Comma-listener in input
  const handleTagInputChange = (text: string) => {
    if (text.includes(',')) {
      handleAddTag(text);
    } else {
      setCustomTag(text);
    }
  };

  // Tag Deletion
  const handleRemoveTag = (tagToRemove: string) => {
    setSelectedTags((prev) => prev.filter((t) => t !== tagToRemove));
  };

  // Form Validation & Mock Submission
  const handleSubmit = () => {
    let isValid = true;

    // Auto-commit any unfinished tag currently typed in customTag input
    if (customTag.trim()) {
      handleAddTag();
    }

    if (!title.trim()) {
      setTitleError('Please enter a research or project title.');
      isValid = false;
    } else {
      setTitleError('');
    }

    if (!description.trim()) {
      setDescError('Please provide a brief abstract or research update.');
      isValid = false;
    } else if (description.trim().length < 20) {
      setDescError('Please write at least 20 characters describing your work.');
      isValid = false;
    } else {
      setDescError('');
    }

    if (!isValid) return;

    // Simulate Network / Creation Request
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setShowSuccessModal(true);
    }, 800);
  };

  const handleModalClose = () => {
    setShowSuccessModal(false);
    // Reset Form Fields
    setTitle('');
    setDescription('');
    setCustomTag('');
    setSelectedTags(['#MachineLearning']);
    setSelectedStage('Experiment');
    setExternalUrl('');
    setTitleError('');
    setDescError('');
  };

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={colors.background} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Section with Modern Line-Art Icon */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Text style={[styles.title, { color: colors.textPrimary }]}>
                Share Current Work
              </Text>
              <View
                style={[
                  styles.sparkleBadge,
                  { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderSubtle },
                ]}
              >
                <Sparkles size={15} strokeWidth={1.8} color={colors.primary} />
              </View>
            </View>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Post a live research update, thesis milestone, or ongoing experiment to your CSE
              peers and faculty.
            </Text>
          </View>

          {/* Card Container for Form */}
          <View
            style={[
              styles.formCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderSubtle,
                shadowOpacity: isDark ? 0 : 0.04,
                elevation: isDark ? 0 : 1,
              },
            ]}
          >
            {/* Field: Research Title */}
            <View style={styles.fieldBlock}>
              <View style={styles.labelRow}>
                <PenLine size={15} strokeWidth={1.8} color={colors.textSecondary} />
                <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>
                  Research Title
                </Text>
              </View>
              <TextInput
                value={title}
                onChangeText={(val) => {
                  setTitle(val);
                  if (titleError) setTitleError('');
                }}
                placeholder="e.g., Optimizing Transformers for Bengali Dialects"
                placeholderTextColor={colors.textMuted}
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? colors.surfaceSubtle : colors.background,
                    borderColor: titleError ? colors.error : colors.borderSubtle,
                    color: colors.textPrimary,
                  },
                ]}
                maxLength={120}
              />
              {titleError ? (
                <Text style={[styles.errorText, { color: colors.error }]}>{titleError}</Text>
              ) : null}
            </View>

            {/* Field: Abstract / Description */}
            <View style={styles.fieldBlock}>
              <View style={styles.labelRow}>
                <AlignLeft size={15} strokeWidth={1.8} color={colors.textSecondary} />
                <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>
                  Abstract / Update Summary
                </Text>
              </View>
              <TextInput
                value={description}
                onChangeText={(val) => {
                  setDescription(val);
                  if (descError) setDescError('');
                }}
                placeholder="Briefly describe your methodology, recent findings, benchmarks, or peer collaboration goals..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                style={[
                  styles.input,
                  styles.textArea,
                  {
                    backgroundColor: isDark ? colors.surfaceSubtle : colors.background,
                    borderColor: descError ? colors.error : colors.borderSubtle,
                    color: colors.textPrimary,
                  },
                ]}
                maxLength={600}
              />
              <View style={styles.charCountRow}>
                {descError ? (
                  <Text style={[styles.errorText, { color: colors.error }]}>{descError}</Text>
                ) : (
                  <View />
                )}
                <Text style={[styles.charCount, { color: colors.textSecondary }]}>
                  {description.length}/600
                </Text>
              </View>
            </View>

            {/* Field: Dynamic Research Areas / Custom Tags */}
            <View style={styles.fieldBlock}>
              <View style={styles.labelRow}>
                <Hash size={15} strokeWidth={1.8} color={colors.textSecondary} />
                <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>
                  Research Areas <Text style={styles.optionalText}>(Custom Tags)</Text>
                </Text>
              </View>

              {/* Tag Input Box with Add Action */}
              <View
                style={[
                  styles.tagInputContainer,
                  {
                    backgroundColor: isDark ? colors.surfaceSubtle : colors.background,
                    borderColor: colors.borderSubtle,
                  },
                ]}
              >
                <TextInput
                  value={customTag}
                  onChangeText={handleTagInputChange}
                  onSubmitEditing={() => handleAddTag()}
                  placeholder="Type a topic and press enter (e.g. NLP, Vision)"
                  placeholderTextColor={colors.textMuted}
                  returnKeyType="done"
                  autoCapitalize="words"
                  autoCorrect={false}
                  style={[styles.tagTextInput, { color: colors.textPrimary }]}
                />
                {customTag.trim().length > 0 ? (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => handleAddTag()}
                    style={[styles.tagAddBtn, { backgroundColor: colors.primary }]}
                    accessibilityRole="button"
                    accessibilityLabel="Add custom tag"
                  >
                    <Plus size={14} strokeWidth={2.4} color={colors.textInverse} />
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* Render Selected Tags with Deletion */}
              {selectedTags.length > 0 ? (
                <View style={styles.tagsContainer}>
                  {selectedTags.map((tag) => (
                    <TouchableOpacity
                      key={tag}
                      activeOpacity={0.75}
                      onPress={() => handleRemoveTag(tag)}
                      style={[
                        styles.tagPill,
                        {
                          backgroundColor: isDark ? colors.surfaceSubtle : colors.background,
                          borderColor: colors.borderSubtle,
                        },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`Remove tag ${tag}`}
                      accessibilityHint="Double tap to remove"
                    >
                      <Text style={[styles.tagPillText, { color: colors.textPrimary }]}>
                        {tag}
                      </Text>
                      <View style={styles.tagCloseIconWrapper}>
                        <X size={11} strokeWidth={2.2} color={colors.textSecondary} />
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : null}
            </View>

            {/* Field: Current Stage Selector with Clean Centered Vector Icons */}
            <View style={styles.fieldBlock}>
              <View style={styles.labelRow}>
                <Layers size={15} strokeWidth={1.8} color={colors.textSecondary} />
                <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>
                  Current Stage
                </Text>
              </View>
              <View style={styles.stagesGrid}>
                {RESEARCH_STAGES.map((stage) => {
                  const isSelected = selectedStage === stage.id;
                  const IconComponent = stage.icon;
                  return (
                    <TouchableOpacity
                      key={stage.id}
                      activeOpacity={0.75}
                      onPress={() => setSelectedStage(stage.id)}
                      style={[
                        styles.stagePill,
                        {
                          backgroundColor: isSelected
                            ? colors.primary
                            : isDark
                            ? colors.surfaceSubtle
                            : colors.background,
                          borderColor: isSelected ? colors.primary : colors.borderSubtle,
                        },
                      ]}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                      accessibilityLabel={`Stage: ${stage.label}`}
                    >
                      <View style={styles.stageIconWrapper}>
                        <IconComponent
                          size={14}
                          strokeWidth={1.9}
                          color={isSelected ? colors.textInverse : colors.textSecondary}
                        />
                      </View>
                      <Text
                        style={[
                          styles.stagePillText,
                          {
                            color: isSelected ? colors.textInverse : colors.textSecondary,
                            fontFamily: isSelected
                              ? fontFamilies.sansSemiBold
                              : fontFamilies.sansMedium,
                          },
                        ]}
                      >
                        {stage.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Field: External Link (Optional) */}
            <View style={[styles.fieldBlock, { marginBottom: spacing.md }]}>
              <View style={styles.labelRow}>
                <Link2 size={15} strokeWidth={1.8} color={colors.textSecondary} />
                <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>
                  External Link <Text style={styles.optionalText}>(Optional)</Text>
                </Text>
              </View>
              <TextInput
                value={externalUrl}
                onChangeText={setExternalUrl}
                placeholder="e.g., https://github.com/lab/repo or DOI"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? colors.surfaceSubtle : colors.background,
                    borderColor: colors.borderSubtle,
                    color: colors.textPrimary,
                  },
                ]}
              />
            </View>

            {/* Primary Action Button */}
            <Button
              label="Post Update"
              onPress={handleSubmit}
              variant="primary"
              size="lg"
              fullWidth
              loading={isSubmitting}
              disabled={isSubmitting}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modern Confirmation Modal */}
      <SuccessModal
        visible={showSuccessModal}
        onClose={handleModalClose}
        title="Research Update Shared"
        message="Your current work has been posted to the CSE departmental feed. Peers and faculty can now review and connect."
        buttonText="Back to Feed"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  // CRITICAL: 120px bottom padding so content clears the floating pill tab bar
  scrollContent: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: spacing.md,
    paddingBottom: 120,
  },
  header: {
    marginBottom: spacing.lg,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: 26,
    fontFamily: fontFamilies.serifBold,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  sparkleBadge: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: fontFamilies.sansRegular,
    lineHeight: 20,
  },
  formCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: spacing.lg,
    shadowColor: '#071A3E',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
  },
  fieldBlock: {
    marginBottom: spacing.lg,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 13.5,
    fontFamily: fontFamilies.sansSemiBold,
    letterSpacing: 0.1,
  },
  optionalText: {
    fontSize: 12,
    fontFamily: fontFamilies.sansRegular,
    fontWeight: '400',
    opacity: 0.7,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: fontFamilies.sansRegular,
  },
  textArea: {
    minHeight: 110,
    paddingTop: 12,
    lineHeight: 20,
  },
  charCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  charCount: {
    fontSize: 11.5,
    fontFamily: fontFamilies.sansRegular,
  },
  errorText: {
    fontSize: 12,
    fontFamily: fontFamilies.sansRegular,
    marginTop: 4,
  },
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 10 : 4,
  },
  tagTextInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: fontFamilies.sansRegular,
    paddingVertical: 6,
  },
  tagAddBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  tagPillText: {
    fontSize: 12.5,
    fontFamily: fontFamilies.sansMedium,
  },
  tagCloseIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  stagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  stagePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  stageIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  stagePillText: {
    fontSize: 12,
  },
});
